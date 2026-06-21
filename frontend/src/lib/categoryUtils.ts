import type { Category } from "@/types"

function normalizeCategoryName(name: string): string {
  return name.trim().toLowerCase()
}

/** Prefer system + enabled when collapsing same-name rows. */
export function dedupeCategoriesByName(categories: Category[]): Category[] {
  const byName = new Map<string, Category>()
  for (const category of categories) {
    const key = normalizeCategoryName(category.name)
    const existing = byName.get(key)
    if (!existing) {
      byName.set(key, category)
      continue
    }
    const preferred =
      category.is_system && !existing.is_system
        ? category
        : !category.is_system && existing.is_system
          ? existing
          : category.is_enabled && !existing.is_enabled
            ? category
            : existing
    byName.set(key, preferred)
  }
  return Array.from(byName.values())
}

export function getOwnCategories(
  categories: Category[],
  userId: string
): Category[] {
  return categories.filter((c) => c.user_id === userId)
}

export function getSelectableCategories(
  categories: Category[],
  userId: string
): Category[] {
  return dedupeCategoriesByName(
    categories.filter((c) => c.user_id === userId && c.is_enabled !== false)
  ).sort(compareCategoriesForDisplay)
}

export function getCategoriesForPicker(
  categories: Category[],
  userId: string,
  includeCategoryId?: string | null
): Category[] {
  const selectable = getSelectableCategories(categories, userId)
  if (
    includeCategoryId &&
    !selectable.some((c) => c.id === includeCategoryId)
  ) {
    const extra = categories.find((c) => c.id === includeCategoryId)
    if (extra) {
      return [...selectable, extra].sort(compareCategoriesForDisplay)
    }
  }
  return selectable
}

export function sortCategoriesForProfile(categories: Category[]): Category[] {
  return [...categories].sort(compareCategoriesForDisplay)
}

function compareCategoriesForDisplay(a: Category, b: Category): number {
  if (a.is_system !== b.is_system) return a.is_system ? -1 : 1
  const byName = a.name.localeCompare(b.name, "es")
  if (byName !== 0) return byName
  return Number(a.id) - Number(b.id)
}

export function countCategoryNameOccurrences(
  categories: Category[]
): Map<string, number> {
  const counts = new Map<string, number>()
  for (const category of categories) {
    const key = normalizeCategoryName(category.name)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

export function isDuplicateCategoryName(
  category: Category,
  counts: Map<string, number>
): boolean {
  return (counts.get(normalizeCategoryName(category.name)) ?? 0) > 1
}
