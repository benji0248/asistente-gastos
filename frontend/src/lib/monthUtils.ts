export type MonthYear = { month: number; year: number }

export function normalizeMonths(data: unknown): MonthYear[] {
  if (!Array.isArray(data)) return []
  return data.map((item: { month: number | string; year: number | string }) => ({
    month: Number(item.month),
    year: Number(item.year),
  }))
}

export function monthKey(month: number, year: number) {
  return `${month}/${year}`
}
