import dayjs from "dayjs"

export type MonthYear = { month: number; year: number }

/** Últimos N meses (incluye el actual), sin pedir al servidor. */
export function buildRecentMonths(count = 36): MonthYear[] {
  const months: MonthYear[] = []
  let cursor = dayjs().startOf("month")
  for (let i = 0; i < count; i++) {
    months.push({ month: cursor.month() + 1, year: cursor.year() })
    cursor = cursor.subtract(1, "month")
  }
  return months
}

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
