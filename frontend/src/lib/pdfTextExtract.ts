const PDFJS_VERSION = "6.0.227"

type LegacyPdfJs = typeof import("pdfjs-dist/legacy/build/pdf.mjs")
type PdfDocument = Awaited<
  ReturnType<LegacyPdfJs["getDocument"]>
>["promise"] extends Promise<infer T>
  ? T
  : never

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

function readFileViaFileReader(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(new Uint8Array(reader.result))
        return
      }
      reject(new Error("Lectura de archivo inválida"))
    }
    reader.onerror = () =>
      reject(reader.error ?? new Error("No se pudo leer el archivo"))
    reader.readAsArrayBuffer(file)
  })
}

/** iOS a veces falla con arrayBuffer() en PDFs de Archivos/iCloud. */
export async function readPdfFileBytes(file: File): Promise<Uint8Array> {
  if (typeof file.arrayBuffer === "function") {
    try {
      const buffer = await file.arrayBuffer()
      if (buffer.byteLength > 0) {
        return new Uint8Array(buffer)
      }
    } catch (err) {
      console.warn("arrayBuffer falló, usando FileReader", err)
    }
  }
  return readFileViaFileReader(file)
}

async function loadLegacyPdfJs(): Promise<LegacyPdfJs> {
  return import("pdfjs-dist/legacy/build/pdf.mjs")
}

function legacyWorkerUrl(source: "cdn" | "bundled"): string {
  if (source === "cdn") {
    return `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/legacy/build/pdf.worker.min.mjs`
  }
  return new URL(
    "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString()
}

async function openWithLegacy(
  data: Uint8Array,
  workerSource: "cdn" | "bundled"
): Promise<PdfDocument> {
  const pdfjs = await loadLegacyPdfJs()
  pdfjs.GlobalWorkerOptions.workerPort = null
  pdfjs.GlobalWorkerOptions.workerSrc = legacyWorkerUrl(workerSource)

  const task = pdfjs.getDocument({
    data: data.slice(),
    verbosity: pdfjs.VerbosityLevel?.ERRORS ?? 0,
    isEvalSupported: false,
    useSystemFonts: true,
    disableFontFace: true,
    useWorkerFetch: false,
  })

  return task.promise
}

async function openWithModern(data: Uint8Array): Promise<PdfDocument> {
  const pdfjs = await import("pdfjs-dist")
  pdfjs.GlobalWorkerOptions.workerPort = null
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString()

  try {
    const PdfWorker = (await import("pdfjs-dist/build/pdf.worker.min.mjs?worker"))
      .default
    pdfjs.GlobalWorkerOptions.workerPort = new PdfWorker()
  } catch (err) {
    console.warn("Worker embebido no disponible", err)
  }

  const task = pdfjs.getDocument({
    data: data.slice(),
    verbosity: pdfjs.VerbosityLevel?.ERRORS ?? 0,
    isEvalSupported: false,
    useSystemFonts: true,
  })

  return task.promise
}

async function openPdfDocument(file: File): Promise<PdfDocument> {
  const data = await readPdfFileBytes(file)
  const attempts: Array<() => Promise<PdfDocument>> = isMobileDevice()
    ? [
        () => openWithLegacy(data, "cdn"),
        () => openWithLegacy(data, "bundled"),
      ]
    : [
        () => openWithModern(data),
        () => openWithLegacy(data, "bundled"),
        () => openWithLegacy(data, "cdn"),
      ]

  let lastError: unknown
  for (const attempt of attempts) {
    try {
      return await attempt()
    } catch (err) {
      lastError = err
      console.warn("Intento de lectura PDF falló", err)
    }
  }

  throw lastError ?? new Error("No se pudo abrir el PDF")
}

export function pdfReadErrorMessage(err: unknown): string {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : ""

  const lower = message.toLowerCase()
  const detail = message ? ` Detalle: ${message.slice(0, 120)}` : ""

  if (lower.includes("password") || lower.includes("contraseña")) {
    return "El PDF está protegido con contraseña. Exportalo sin protección e intentá de nuevo."
  }
  if (lower.includes("invalid pdf") || lower.includes("corrupt")) {
    return "El archivo PDF está dañado o no se pudo interpretar."
  }
  if (lower.includes("lectura") || lower.includes("archivo")) {
    return `No se pudo acceder al archivo en este dispositivo.${detail}`
  }
  if (
    lower.includes("worker") ||
    lower.includes("fetch") ||
    lower.includes("network") ||
    lower.includes("loading")
  ) {
    return `No se pudo cargar el lector de PDF.${detail} Probá con Wi‑Fi o desde la computadora.`
  }
  if (lower.includes("memory") || lower.includes("arraybuffer")) {
    return "El PDF es demasiado pesado para este dispositivo. Probá desde la computadora."
  }

  return `Ocurrió un error al leer el PDF.${detail}`
}

export async function extractTextFromPdf(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const pdf = await openPdfDocument(file)
  const pages: string[] = []

  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const text = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
      pages.push(text)
      onProgress?.(Math.round((i / pdf.numPages) * 100))
    }
  } finally {
    await pdf.destroy()
  }

  return pages.join("\n")
}
