export { apiFetch, apiRequest } from '@/lib/api/http'

export function throwIfError(error: { message: string } | null): void {
  if (error) throw new Error(error.message)
}
