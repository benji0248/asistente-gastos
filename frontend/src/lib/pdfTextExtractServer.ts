import { supabase } from "@/lib/supabase"
import { readPdfFileBytes } from "@/lib/pdfFile"

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ""
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

export async function extractTextFromPdfViaServer(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  onProgress?.(5)

  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token
  if (!accessToken) {
    throw new Error("Tenés que iniciar sesión para importar desde el celular")
  }

  const bytes = await readPdfFileBytes(file)
  onProgress?.(25)

  const { data, error } = await supabase.functions.invoke("parse-statement-pdf", {
    body: {
      pdfBase64: bytesToBase64(bytes),
      fileName: file.name || "resumen.pdf",
    },
  })

  onProgress?.(90)

  if (error) {
    throw new Error(error.message || "El servidor no pudo leer el PDF")
  }

  const payload = data as { ok?: boolean; text?: string; error?: string; detail?: string }
  if (!payload?.ok || !payload.text?.trim()) {
    const detail = payload?.detail ? ` (${payload.detail})` : ""
    throw new Error(
      payload?.error
        ? `${payload.error}${detail}`
        : `El servidor no devolvió texto del PDF${detail}`
    )
  }

  onProgress?.(100)
  return payload.text
}
