import { createWorker, type LoggerMessage, type Worker } from "tesseract.js"

export type OcrProgress = {
  status: string
  progress: number
}

let sharedWorker: Worker | null = null
let progressCallback: ((progress: OcrProgress) => void) | undefined

function handleLoggerMessage(message: LoggerMessage) {
  if (message.status === "recognizing text" && typeof message.progress === "number") {
    progressCallback?.({
      status: "Leyendo ticket...",
      progress: Math.round(message.progress * 100),
    })
    return
  }

  if (!message.status) return

  const status =
    message.status === "loading tesseract core"
      ? "Cargando motor OCR..."
      : message.status === "initializing tesseract"
        ? "Inicializando..."
        : message.status === "loading language traineddata"
          ? "Cargando idioma español..."
          : "Procesando..."

  progressCallback?.({
    status,
    progress: typeof message.progress === "number" ? Math.round(message.progress * 100) : 0,
  })
}

async function getWorker(): Promise<Worker> {
  if (!sharedWorker) {
    sharedWorker = await createWorker("spa", 1, {
      logger: handleLoggerMessage,
    })
  }
  return sharedWorker
}

function preprocessImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      const maxSide = 1600
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const width = Math.round(img.width * scale)
      const height = Math.round(img.height * scale)

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("No se pudo procesar la imagen"))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)
      const imageData = ctx.getImageData(0, 0, width, height)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
        const contrast = 1.4
        const adjusted = Math.min(255, Math.max(0, (gray - 128) * contrast + 128))
        data[i] = adjusted
        data[i + 1] = adjusted
        data[i + 2] = adjusted
      }

      ctx.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL("image/jpeg", 0.92))
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("No se pudo cargar la imagen"))
    }

    img.src = url
  })
}

export async function scanReceiptImage(
  file: File,
  onProgress?: (progress: OcrProgress) => void
): Promise<string> {
  const imageData = await preprocessImage(file)
  const worker = await getWorker()

  progressCallback = onProgress
  try {
    const result = await worker.recognize(imageData)
    return result.data.text
  } finally {
    progressCallback = undefined
  }
}
