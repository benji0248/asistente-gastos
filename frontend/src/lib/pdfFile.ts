const PDF_MIME_TYPES = new Set([
  "application/pdf",
  "application/x-pdf",
  "application/acrobat",
  "applications/vnd.pdf",
  "text/pdf",
  "text/x-pdf",
])

/** Sync check: extension or known PDF MIME (mobile often omits extension). */
export function isPdfFile(file: File): boolean {
  const name = file.name.trim().toLowerCase()
  if (name.endsWith(".pdf")) return true

  const type = file.type.trim().toLowerCase()
  if (type && PDF_MIME_TYPES.has(type)) return true

  return false
}

/** Reads PDF magic bytes (%PDF-) when name/type are missing (common on iOS/Android). */
export async function isPdfFileAsync(file: File): Promise<boolean> {
  if (isPdfFile(file)) return true

  if (file.size < 5) return false

  const header = new Uint8Array(await file.slice(0, 5).arrayBuffer())
  const signature = String.fromCharCode(...header)
  return signature.startsWith("%PDF-")
}

export const PDF_FILE_ACCEPT =
  "application/pdf,.pdf,application/octet-stream"

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

export function pdfValidationErrorMessage(file: File): string {
  const typeHint = file.type ? ` (${file.type})` : ""
  const nameHint = file.name ? ` «${file.name}»` : ""
  return `El archivo${nameHint}${typeHint} no es un PDF válido.`
}
