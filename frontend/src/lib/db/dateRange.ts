export function monthDateRange(month: number, year: number) {
  const start = new Date(Date.UTC(year, month - 1, 1)).toISOString()
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)).toISOString()
  return { start, end }
}

/** UTC calendar month for a timestamp — matches monthDateRange / Gastos filters. */
export function utcMonthYear(value: string | Date): { month: number; year: number } {
  const date = value instanceof Date ? value : new Date(value)
  return {
    month: date.getUTCMonth() + 1,
    year: date.getUTCFullYear(),
  }
}

export function belongsToUtcMonth(
  value: string | Date | null | undefined,
  month: number,
  year: number
): boolean {
  if (value == null || value === "") return false
  const parts = utcMonthYear(value)
  return parts.month === month && parts.year === year
}

/** First day of month as YYYY-MM-DD (for statement_month column). */
export function statementMonthDate(year: number, month: number): string {
  const y = String(year)
  const m = String(month).padStart(2, "0")
  return `${y}-${m}-01`
}

export function currentStatementMonth(): string {
  const now = new Date()
  return statementMonthDate(now.getFullYear(), now.getMonth() + 1)
}

export function formatStatementMonthLabel(year: number, month: number): string {
  const label = new Date(year, month - 1, 1).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function shiftViewMonth(
  year: number,
  month: number,
  delta: -1 | 1
): { year: number; month: number } {
  const d = new Date(year, month - 1 + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

export function isCurrentCalendarMonth(year: number, month: number): boolean {
  const now = new Date()
  return now.getFullYear() === year && now.getMonth() + 1 === month
}
