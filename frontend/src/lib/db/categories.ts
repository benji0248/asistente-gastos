import type { Category, newCategory } from '@/types'
import { apiFetch } from '@/lib/api/http'

function normalizeCategory(row: Category): Category {
  return {
    ...row,
    id: String(row.id),
  }
}

export async function listCategories(activeOnly = false): Promise<Category[]> {
  const query = activeOnly ? '?active=true' : ''
  const rows = await apiFetch<Category[]>(`/api/v1/categories${query}`)
  return (rows ?? [])
    .map(normalizeCategory)
    .filter((row) => !row.is_system)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function createCategory(_userId: string, name: string): Promise<Category> {
  const created = await apiFetch<Category>('/api/v1/categories', {
    method: 'POST',
    body: { name },
  })
  return normalizeCategory(created)
}

export async function updateCategory(
  categoryId: string,
  updates: { is_enabled?: boolean; name?: string }
): Promise<void> {
  await apiFetch(`/api/v1/categories/${categoryId}`, {
    method: 'PATCH',
    body: updates,
  })
}

export async function deleteCategory(categoryId: string): Promise<void> {
  await apiFetch(`/api/v1/categories/${categoryId}`, { method: 'DELETE' })
}

export type { newCategory }
