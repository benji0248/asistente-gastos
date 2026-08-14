import { getAccessToken } from '@/lib/auth/session'
import { readPdfFileBytes } from '@/lib/pdfFile'

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
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

  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Tenés que iniciar sesión para importar desde el celular')
  }

  const bytes = await readPdfFileBytes(file)
  onProgress?.(25)

  const response = await fetch('/api/v1/statements/parse-pdf', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pdfBase64: bytesToBase64(bytes),
      fileName: file.name || 'resumen.pdf',
    }),
  })

  onProgress?.(90)

  if (!response.ok) {
    let message = 'El servidor no pudo leer el PDF'
    try {
      const body = (await response.json()) as { error?: string; detail?: string }
      if (body.error) {
        message = body.detail ? `${body.error} (${body.detail})` : body.error
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message)
  }

  const payload = (await response.json()) as {
    ok?: boolean
    text?: string
    error?: string
    detail?: string
  }

  if (!payload?.ok || !payload.text?.trim()) {
    const detail = payload?.detail ? ` (${payload.detail})` : ''
    throw new Error(
      payload?.error
        ? `${payload.error}${detail}`
        : `El servidor no devolvió texto del PDF${detail}`
    )
  }

  onProgress?.(100)
  return payload.text
}
