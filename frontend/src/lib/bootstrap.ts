const API_BASE = import.meta.env.VITE_API_URL || '/api'

export async function bootstrapSession(accessToken: string): Promise<void> {
  const response = await fetch(`${API_BASE}/bootstrap`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('No se pudo preparar la cuenta')
  }
}
