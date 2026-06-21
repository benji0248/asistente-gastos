export function isAborted(err: unknown): boolean {
  return (err as { code?: string })?.code === 'ERR_CANCELED'
}

export function isAuthError(err: unknown): boolean {
  const status = (err as { status?: number; response?: { status?: number } })?.response?.status
    ?? (err as { status?: number })?.status
  return status === 401 || status === 403
}
