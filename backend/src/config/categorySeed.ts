import { getSupabaseAdmin } from '../lib/supabase'

export const DEFAULT_CATEGORIES = [
  'Alimentación',
  'Transporte',
  'Vivienda',
  'Salud',
  'Entretenimiento',
  'Educación',
  'Servicios',
  'Ropa',
  'Conveniencia',
  'Otros',
] as const

export async function seedDefaultCategoriesIfNeeded(userId: string): Promise<void> {
  const admin = getSupabaseAdmin()

  const { data: existing, error: checkError } = await admin
    .from('categories')
    .select('id, is_system')
    .eq('user_id', userId)

  if (checkError) throw checkError

  const hasSystemCategories = existing?.some((c) => c.is_system === true)
  if (hasSystemCategories) return

  const { error } = await admin.from('categories').insert(
    DEFAULT_CATEGORIES.map((name) => ({
      user_id: userId,
      name,
      is_system: true,
      is_enabled: true,
    }))
  )
  if (error) throw error
}
