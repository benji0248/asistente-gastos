const PDFJS_VERSION = "6.0.227"
const PDFJS_CDN = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}`

import {
  buildPdfDiagnostics,
  PdfExtractError,
} from "@/lib/pdfErrorDetails"
import { extractTextFromPdfViaServer } from "@/lib/pdfTextExtractServer"

type LegacyPdfJs = typeof import("pdfjs-dist/legacy/build/pdf.mjs")
type PdfDocument = Awaited<
  ReturnType<LegacyPdfJs["getDocument"]>
>["promise"] extends Promise<infer T>
  ? T
  : never

interface PdfOpenResult {
  pdf: PdfDocument
  cleanup: () => Promise<void>
}

type OpenAttempt = {
  name: string
  run: () => Promise<PdfOpenResult>
}

async function safeDestroyTask(task: unknown): Promise<void> {
  const destroy = (task as { destroy?: () => Promise<void> | void }).destroy
  if (typeof destroy !== "function") return
  await destroy.call(task)
}

async function safeCleanupPage(page: unknown): Promise<void> {
  const cleanup = (page as { cleanup?: (resetStats?: boolean) => boolean }).cleanup
  if (typeof cleanup !== "function") return
  cleanup.call(page)
}

function textFromPageContent(content: { items?: unknown[] }): string {
  const items = Array.isArray(content.items) ? content.items : []
  return items
    .map((item) => {
      if (item && typeof item === "object" && "str" in item) {
        const str = (item as { str?: unknown }).str
        return typeof str === "string" ? str : ""
      }
      return ""
    })
    .join(" ")
}

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

function deviceSummary(): string {
  if (typeof navigator === "undefined") return "desconocido"
  return navigator.userAgent.slice(0, 160)
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

async function loadLegacyPdfJs(): Promise<LegacyPdfJs> {
  return import("pdfjs-dist/legacy/build/pdf.mjs")
}

function legacyWorkerUrl(source: "cdn" | "bundled"): string {
  if (source === "cdn") {
    return `${PDFJS_CDN}/legacy/build/pdf.worker.min.mjs`
  }
  return new URL(
    "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString()
}

function copyPdfBytes(data: Uint8Array): Uint8Array {
  return new Uint8Array(data)
}

function mobileDocumentOptions(data: Uint8Array): Record<string, unknown> {
  return {
    data: copyPdfBytes(data),
    verbosity: 0,
    isEvalSupported: false,
    useSystemFonts: true,
    disableFontFace: true,
    useWorkerFetch: false,
    useWasm: false,
    isOffscreenCanvasSupported: false,
    isImageDecoderSupported: false,
    cMapUrl: `${PDFJS_CDN}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${PDFJS_CDN}/standard_fonts/`,
    wasmUrl: `${PDFJS_CDN}/wasm/`,
  }
}

async function openWithLegacy(
  data: Uint8Array,
  workerSource: "cdn" | "bundled"
): Promise<PdfOpenResult> {
  const pdfjs = await loadLegacyPdfJs()
  pdfjs.GlobalWorkerOptions.workerPort = null
  pdfjs.GlobalWorkerOptions.workerSrc = legacyWorkerUrl(workerSource)

  const options = mobileDocumentOptions(data)

  const task = pdfjs.getDocument(
    options as Parameters<LegacyPdfJs["getDocument"]>[0]
  )

  const pdf = await task.promise
  return {
    pdf,
    cleanup: () => safeDestroyTask(task),
  }
}

async function openWithModern(data: Uint8Array): Promise<PdfOpenResult> {
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
    data: copyPdfBytes(data),
    verbosity: pdfjs.VerbosityLevel?.ERRORS ?? 0,
    useSystemFonts: true,
  } as Parameters<typeof pdfjs.getDocument>[0])

  const pdf = await task.promise
  return {
    pdf,
    cleanup: () => safeDestroyTask(task),
  }
}

async function openPdfDocument(
  file: File,
  log: (line: string) => void
): Promise<PdfOpenResult> {
  const data = await readPdfFileBytes(file)
  log(`Bytes leídos: ${data.byteLength}`)

  const attempts: OpenAttempt[] = isMobileDevice()
    ? [
        { name: "legacy+cdn (sin wasm)", run: () => openWithLegacy(data, "cdn") },
        { name: "legacy+bundled (sin wasm)", run: () => openWithLegacy(data, "bundled") },
      ]
    : [
        { name: "modern+bundled worker", run: () => openWithModern(data) },
        { name: "legacy+bundled", run: () => openWithLegacy(data, "bundled") },
        { name: "legacy+cdn", run: () => openWithLegacy(data, "cdn") },
      ]

  const failures: string[] = []
  for (const attempt of attempts) {
    log(`Abriendo PDF → ${attempt.name}`)
    try {
      return await attempt.run()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      failures.push(`${attempt.name}: ${message}`)
      log(`Falló ${attempt.name}: ${message}`)
      console.warn("Intento de lectura PDF falló", err)
    }
  }

  throw new PdfExtractError(
    failures[failures.length - 1] ?? "No se pudo abrir el PDF",
    failures
  )
}

async function extractTextClientSide(
  file: File,
  log: (line: string) => void,
  onProgress?: (progress: number) => void
): Promise<string> {
  const { pdf, cleanup } = await openPdfDocument(file, log)
  const pages: string[] = []

  try {
    log(`Páginas detectadas: ${pdf.numPages}`)
    for (let i = 1; i <= pdf.numPages; i++) {
      log(`Extrayendo página ${i}/${pdf.numPages}`)
      const page = await pdf.getPage(i)
      try {
        const content = await page.getTextContent()
        pages.push(textFromPageContent(content))
        onProgress?.(Math.round((i / pdf.numPages) * 100))
      } finally {
        await safeCleanupPage(page)
      }
    }
  } finally {
    try {
      await cleanup()
    } catch (err) {
      log(`Cleanup: ${err instanceof Error ? err.message : String(err)}`)
      console.warn("No se pudo liberar recursos del PDF", err)
    }
  }

  const text = pages.join("\n")
  if (!text.trim()) {
    throw new Error("El PDF no contiene texto legible")
  }

  return text
}

export function pdfReadErrorMessage(err: unknown): string {
  const message =
    err instanceof PdfExtractError
      ? err.message
      : err instanceof Error
        ? err.message
        : typeof err === "string"
          ? err
          : ""

  const lower = message.toLowerCase()
  const detail = message ? ` Detalle: ${message.slice(0, 200)}` : ""

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
    lower.includes("loading") ||
    lower.includes("functions.invoke") ||
    lower.includes("edge function")
  ) {
    return `No se pudo cargar el lector de PDF.${detail} Probá con Wi‑Fi o desde la computadora.`
  }
  if (lower.includes("memory") || lower.includes("arraybuffer")) {
    return "El PDF es demasiado pesado para este dispositivo. Probá desde la computadora."
  }
  if (lower.includes("iniciar sesión")) {
    return message
  }

  return `Ocurrió un error al leer el PDF.${detail}`
}

export function pdfReadErrorDiagnostics(err: unknown): string | null {
  if (err instanceof PdfExtractError) {
    return buildPdfDiagnostics(err.diagnostics, err)
  }
  return null
}

export async function extractTextFromPdf(
  file: File,
  onProgress?: (progress: number) => void,
  onDiagnostics?: (text: string) => void
): Promise<string> {
  const diagnostics: string[] = []
  const log = (line: string) => {
    diagnostics.push(line)
    onDiagnostics?.(diagnostics.join("\n"))
  }

  log(`Archivo: ${file.name || "(sin nombre)"}`)
  log(`Tamaño: ${file.size} bytes, tipo: ${file.type || "(vacío)"}`)
  log(`Dispositivo: ${deviceSummary()}`)

  if (isMobileDevice()) {
    log("Modo móvil: probando lectura en servidor primero")
    try {
      onProgress?.(0)
      const text = await extractTextFromPdfViaServer(file, onProgress)
      log("Servidor: OK")
      onDiagnostics?.(diagnostics.join("\n"))
      return text
    } catch (serverErr) {
      const message =
        serverErr instanceof Error ? serverErr.message : String(serverErr)
      log(`Servidor falló: ${message}`)
      log("Reintentando en el dispositivo…")
    }
  }

  try {
    log("Modo cliente: extracción local")
    return await extractTextClientSide(file, log, onProgress)
  } catch (err) {
    throw new PdfExtractError(
      err instanceof Error ? err.message : String(err),
      diagnostics
    )
  }
}
