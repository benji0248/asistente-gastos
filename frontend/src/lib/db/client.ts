export { supabase } from '@/lib/supabase'

export function throwIfError(error: { message: string } | null): void {
  if (error) throw new Error(error.message)
}
