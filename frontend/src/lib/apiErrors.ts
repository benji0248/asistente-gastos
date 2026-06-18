import { AxiosError } from 'axios'

export function isAborted(err: unknown): boolean {
  return (err as { code?: string })?.code === 'ERR_CANCELED'
}

export function isAuthError(err: unknown): boolean {
  if (!(err instanceof AxiosError)) return false
  const status = err.response?.status
  return status === 401 || status === 403
}
