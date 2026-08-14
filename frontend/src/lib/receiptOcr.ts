import { createWorker, PSM, type LoggerMessage, type Worker } from "tesseract.js"

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
    await sharedWorker.setParameters({
      preserve_interword_spaces: "1",
      user_defined_dpi: "300",
    })
  }
  return sharedWorker
}

function otsuThreshold(histogram: Uint32Array, totalPixels: number): number {
  let sum = 0
  for (let i = 0; i < 256; i++) sum += i * histogram[i]

  let sumB = 0
  let weightB = 0
  let maxVariance = 0
  let threshold = 128

  for (let t = 0; t < 256; t++) {
    weightB += histogram[t]
    if (weightB === 0) continue

    const weightF = totalPixels - weightB
    if (weightF === 0) break

    sumB += t * histogram[t]
    const meanB = sumB / weightB
    const meanF = (sum - sumB) / weightF
    const variance = weightB * weightF * (meanB - meanF) ** 2

    if (variance > maxVariance) {
      maxVariance = variance
      threshold = t
    }
  }

  return threshold
}

function applySharpen(data: Uint8ClampedArray, width: number, height: number) {
  const copy = new Uint8ClampedArray(data)
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0]

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0
      let ki = 0
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4
          sum += copy[idx] * kernel[ki]
          ki++
        }
      }
      const out = ((y * width + x) * 4)
      const value = Math.min(255, Math.max(0, sum))
      data[out] = value
      data[out + 1] = value
      data[out + 2] = value
    }
  }
}

function preprocessCanvas(source: CanvasImageSource, width: number, height: number): HTMLCanvasElement {
  const minSide = Math.min(width, height)
  const maxSide = Math.max(width, height)
  const targetMin = 1400
  const targetMax = 2400

  let scale = 1
  if (minSide < targetMin) {
    scale = targetMin / minSide
  } else if (maxSide > targetMax) {
    scale = targetMax / maxSide
  }

  const outWidth = Math.round(width * scale)
  const outHeight = Math.round(height * scale)

  const canvas = document.createElement("canvas")
  canvas.width = outWidth
  canvas.height = outHeight
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("No se pudo procesar la imagen")

  ctx.drawImage(source, 0, 0, outWidth, outHeight)
  const imageData = ctx.getImageData(0, 0, outWidth, outHeight)
  const { data } = imageData
  const histogram = new Uint32Array(256)
  const gray = new Uint8Array(outWidth * outHeight)

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const value = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
    data[i] = value
    data[i + 1] = value
    data[i + 2] = value
    gray[p] = value
  }

  applySharpen(data, outWidth, outHeight)

  histogram.fill(0)
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const value = data[i]
    gray[p] = value
    histogram[value]++
  }

  const threshold = otsuThreshold(histogram, gray.length)

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const binary = gray[p] >= threshold ? 255 : 0
    data[i] = binary
    data[i + 1] = binary
    data[i + 2] = binary
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

async function loadImageSource(file: File): Promise<{ source: CanvasImageSource; width: number; height: number }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
      return { source: bitmap, width: bitmap.width, height: bitmap.height }
    } catch {
      // Fallback below for browsers without imageOrientation support.
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ source: img, width: img.width, height: img.height })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("No se pudo cargar la imagen"))
    }

    img.src = url
  })
}

async function preprocessImage(file: File): Promise<{ full: string; bottom: string }> {
  const { source, width, height } = await loadImageSource(file)
  const canvas = preprocessCanvas(source, width, height)

  if ("close" in source && typeof source.close === "function") {
    source.close()
  }

  const full = canvas.toDataURL("image/png")

  const bottomHeight = Math.round(canvas.height * 0.42)
  const bottomCanvas = document.createElement("canvas")
  bottomCanvas.width = canvas.width
  bottomCanvas.height = bottomHeight
  const bottomCtx = bottomCanvas.getContext("2d")
  if (!bottomCtx) throw new Error("No se pudo recortar la imagen")

  bottomCtx.drawImage(
    canvas,
    0,
    canvas.height - bottomHeight,
    canvas.width,
    bottomHeight,
    0,
    0,
    canvas.width,
    bottomHeight
  )

  return { full, bottom: bottomCanvas.toDataURL("image/png") }
}

async function recognizeRegion(
  worker: Worker,
  image: string,
  psm: PSM
): Promise<{ text: string; confidence: number }> {
  await worker.setParameters({ tessedit_pageseg_mode: psm })
  const result = await worker.recognize(image)

  return {
    text: result.data.text.trim(),
    confidence: result.data.confidence,
  }
}

export async function scanReceiptImage(
  file: File,
  onProgress?: (progress: OcrProgress) => void
): Promise<string> {
  progressCallback = onProgress
  onProgress?.({ status: "Preparando imagen...", progress: 5 })

  const { full, bottom } = await preprocessImage(file)
  const worker = await getWorker()

  try {
    onProgress?.({ status: "Leyendo ticket completo...", progress: 15 })
    const fullResult = await recognizeRegion(worker, full, PSM.SINGLE_BLOCK)

    onProgress?.({ status: "Leyendo totales...", progress: 55 })
    const bottomResult = await recognizeRegion(worker, bottom, PSM.SINGLE_COLUMN)

    const sections = [fullResult.text]
    if (bottomResult.text && bottomResult.text !== fullResult.text) {
      sections.push(bottomResult.text)
    }

    if (fullResult.confidence < 55 && bottomResult.confidence > fullResult.confidence + 8) {
      return `${bottomResult.text}\n\n${fullResult.text}`
    }

    return sections.filter(Boolean).join("\n\n")
  } finally {
    progressCallback = undefined
  }
}
