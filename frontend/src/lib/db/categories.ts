import type { Category, newCategory } from '@/types'
import { supabase, throwIfError } from './client'

export async function listCategories(activeOnly = false): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*')
  throwIfError(error)

  let list = (data ?? []) as Category[]
  if (activeOnly) {
    list = list.filter((c) => c.is_enabled !== false)
  }

  return list.sort((a, b) => a.name.localeCompare(b.name))
}

export async function createCategory(userId: string, name: string): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert({ user_id: userId, name, is_system: false, is_enabled: true })
    .select('*')
    .single()
  throwIfError(error)
  return data as Category
}

export async function updateCategory(
  categoryId: string,
  updates: { is_enabled?: boolean; name?: string }
): Promise<void> {
  const { error } = await supabase.from('categories').update(updates).eq('id', categoryId)
  throwIfError(error)
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', categoryId)
  throwIfError(error)
}

export type { newCategory }
