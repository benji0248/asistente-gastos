import * as pdfjsLib from "pdfjs-dist"
import { version as pdfjsVersion } from "pdfjs-dist"
import PdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?worker"

type WorkerMode = "bundled-port" | "bundled-url" | "cdn" | "main-thread"

let activeMode: WorkerMode | null = null

function bundledWorkerUrl(): string {
  return new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString()
}

function cdnWorkerUrl(): string {
  return `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`
}

function configureWorker(mode: WorkerMode): void {
  activeMode = mode
  pdfjsLib.GlobalWorkerOptions.workerPort = null

  switch (mode) {
    case "bundled-port":
      if (typeof Worker !== "undefined") {
        pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker()
        pdfjsLib.GlobalWorkerOptions.workerSrc = bundledWorkerUrl()
        return
      }
      configureWorker("bundled-url")
      return
    case "bundled-url":
      pdfjsLib.GlobalWorkerOptions.workerSrc = bundledWorkerUrl()
      return
    case "cdn":
      pdfjsLib.GlobalWorkerOptions.workerSrc = cdnWorkerUrl()
      return
    case "main-thread":
      pdfjsLib.GlobalWorkerOptions.workerPort = null
      pdfjsLib.GlobalWorkerOptions.workerSrc = ""
      return
  }
}

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

function workerModesForDevice(): WorkerMode[] {
  if (isMobileDevice()) {
    return ["cdn", "bundled-url", "bundled-port", "main-thread"]
  }
  return ["bundled-port", "bundled-url", "cdn", "main-thread"]
}

async function readFileBytes(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer())
}

async function openPdfDocument(
  data: Uint8Array,
  mode: WorkerMode
): Promise<pdfjsLib.PDFDocumentProxy> {
  if (mode === "main-thread") {
    const pdfjsLegacy = await import("pdfjs-dist/legacy/build/pdf.mjs")
    const task = pdfjsLegacy.getDocument({
      data: data.slice(),
      verbosity: pdfjsLib.VerbosityLevel.ERRORS,
      isEvalSupported: false,
      useSystemFonts: true,
      disableFontFace: true,
    })
    return task.promise as Promise<pdfjsLib.PDFDocumentProxy>
  }

  configureWorker(mode)

  const task = pdfjsLib.getDocument({
    data,
    verbosity: pdfjsLib.VerbosityLevel.ERRORS,
    isEvalSupported: false,
    useSystemFonts: true,
  })

  return task.promise
}

async function openPdfWithFallbacks(file: File): Promise<pdfjsLib.PDFDocumentProxy> {
  const modes = workerModesForDevice()
  let lastError: unknown

  for (const mode of modes) {
    try {
      const data = await readFileBytes(file)
      return await openPdfDocument(data, mode)
    } catch (err) {
      lastError = err
      console.warn(`PDF modo ${mode} falló`, err)
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

  if (lower.includes("password") || lower.includes("contraseña")) {
    return "El PDF está protegido con contraseña. Exportalo sin protección e intentá de nuevo."
  }
  if (lower.includes("invalid pdf") || lower.includes("corrupt")) {
    return "El archivo PDF está dañado o no se pudo interpretar."
  }
  if (
    lower.includes("worker") ||
    lower.includes("fetch") ||
    lower.includes("network") ||
    lower.includes("loading")
  ) {
    return "No se pudo cargar el lector de PDF en este dispositivo. Probá con otra conexión o desde la computadora."
  }
  if (lower.includes("memory") || lower.includes("arraybuffer")) {
    return "El PDF es demasiado pesado para este dispositivo. Probá desde la computadora."
  }

  if (import.meta.env.DEV && message) {
    return `Ocurrió un error al leer el PDF (${message}).`
  }

  return "Ocurrió un error al leer el PDF. Intenta de nuevo."
}

export async function extractTextFromPdf(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const pdf = await openPdfWithFallbacks(file)
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

  if (import.meta.env.DEV && activeMode) {
    console.info(`PDF leído con modo: ${activeMode}`)
  }

  return pages.join("\n")
}
