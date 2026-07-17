import dayjs from "dayjs"
import "dayjs/locale/es"
import type { Account, Category, Expense } from "@/types"
import type { MonthYear } from "@/lib/monthUtils"
import { paidContribution } from "@/lib/expenseUpdate"
import { belongsToUtcMonth } from "@/lib/db/dateRange"

dayjs.locale("es")

/**
 * Month membership must use UTC, same as Gastos (`monthDateRange`).
 * Household recurring expenses are inserted with created_at = 1st of month 00:00 UTC;
 * in AR (UTC-3) that is still the previous local evening, so local dayjs would drop them.
 */
export function expenseBelongsToMonth(expense: Expense, month: number, year: number): boolean {
  return belongsToUtcMonth(expense.created_at, month, year)
}

export function filterExpensesByMonth(expenses: Expense[], month: number, year: number): Expense[] {
  return expenses.filter((expense) => expenseBelongsToMonth(expense, month, year))
}

export function sumPaid(expenses: Expense[]): number {
  return expenses.reduce((total, expense) => total + paidContribution(expense), 0)
}

export function sumPending(expenses: Expense[]): number {
  return expenses.reduce((total, expense) => {
    if (expense.is_paid) return total
    const remaining = Number(expense.amount) - Number(expense.amount_paid ?? 0)
    return total + Math.max(0, remaining)
  }, 0)
}

export function monthLabel(month: number, year: number): string {
  return dayjs()
    .month(month - 1)
    .year(year)
    .format("MMMM YYYY")
}

export function shortMonthLabel(month: number, year: number): string {
  return dayjs()
    .month(month - 1)
    .year(year)
    .format("MMM YY")
}

export function compareMonths(
  currentTotal: number,
  previousTotal: number
): { delta: number; percent: number | null } {
  const delta = currentTotal - previousTotal
  if (previousTotal === 0) {
    return { delta, percent: currentTotal > 0 ? 100 : null }
  }
  return { delta, percent: (delta / previousTotal) * 100 }
}

export interface CategoryStat {
  categoryId: string
  name: string
  amount: number
  count: number
  percentage: number
}

export function categoryBreakdown(
  expenses: Expense[],
  categories: Category[],
  month: number,
  year: number
): CategoryStat[] {
  const categoryMap = new Map(
    categories.map((category) => [String(category.id), category.name])
  )
  const monthExpenses = filterExpensesByMonth(expenses, month, year)
  const total = sumPaid(monthExpenses)

  const totals = new Map<string, { amount: number; count: number }>()
  for (const expense of monthExpenses) {
    const amount = paidContribution(expense)
    if (amount <= 0) continue
    const key =
      expense.category_id != null && expense.category_id !== ""
        ? String(expense.category_id)
        : "sin-categoria"
    const current = totals.get(key) ?? { amount: 0, count: 0 }
    totals.set(key, {
      amount: current.amount + amount,
      count: current.count + 1,
    })
  }

  return Array.from(totals.entries())
    .map(([categoryId, data]) => ({
      categoryId,
      name: categoryMap.get(categoryId) ?? "Sin categoría",
      amount: data.amount,
      count: data.count,
      percentage: total > 0 ? (data.amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
}

export interface MonthTotal {
  month: number
  year: number
  label: string
  paid: number
  pending: number
  total: number
  count: number
}

export function buildMonthTotals(
  expenses: Expense[],
  months: MonthYear[]
): MonthTotal[] {
  return months.map(({ month, year }) => {
    const monthExpenses = filterExpensesByMonth(expenses, month, year)
    const paid = sumPaid(monthExpenses)
    const pending = sumPending(monthExpenses)
    return {
      month,
      year,
      label: shortMonthLabel(month, year),
      paid,
      pending,
      total: paid + pending,
      count: monthExpenses.length,
    }
  })
}

export function recentMonthSeries(
  expenses: Expense[],
  anchor: MonthYear,
  count = 6
): MonthTotal[] {
  const months: MonthYear[] = []
  let cursor = dayjs()
    .month(anchor.month - 1)
    .year(anchor.year)
    .startOf("month")

  for (let i = 0; i < count; i++) {
    months.unshift({
      month: cursor.month() + 1,
      year: cursor.year(),
    })
    cursor = cursor.subtract(1, "month")
  }

  return buildMonthTotals(expenses, months)
}

export function averageMonthlyPaid(monthTotals: MonthTotal[]): number {
  if (monthTotals.length === 0) return 0
  return monthTotals.reduce((sum, item) => sum + item.paid, 0) / monthTotals.length
}

export interface AccountStat {
  accountId: string
  label: string
  amount: number
  percentage: number
  count: number
}

export function accountBreakdown(
  expenses: Expense[],
  accounts: Account[],
  month: number,
  year: number,
  getOwnerLabel?: (userId: string) => string
): AccountStat[] {
  const accountMap = new Map(
    accounts.map((account) => [
      String(account.id),
      getOwnerLabel
        ? `${account.description} (${getOwnerLabel(account.user_id)})`
        : account.description,
    ])
  )
  const monthExpenses = filterExpensesByMonth(expenses, month, year)
  const total = sumPaid(monthExpenses)

  const totals = new Map<string, { amount: number; count: number }>()
  for (const expense of monthExpenses) {
    const amount = paidContribution(expense)
    if (amount <= 0) continue
    const key =
      expense.account_id != null && expense.account_id !== ""
        ? String(expense.account_id)
        : "sin-cuenta"
    const current = totals.get(key) ?? { amount: 0, count: 0 }
    totals.set(key, {
      amount: current.amount + amount,
      count: current.count + 1,
    })
  }

  return Array.from(totals.entries())
    .map(([accountId, data]) => ({
      accountId,
      label: accountMap.get(accountId) ?? "Sin cuenta",
      amount: data.amount,
      percentage: total > 0 ? (data.amount / total) * 100 : 0,
      count: data.count,
    }))
    .sort((a, b) => b.amount - a.amount)
}

export interface MemberStat {
  userId: string
  name: string
  amount: number
  percentage: number
  count: number
}

export function memberBreakdown(
  expenses: Expense[],
  month: number,
  year: number,
  getOwnerLabel: (userId: string) => string
): MemberStat[] {
  const monthExpenses = filterExpensesByMonth(expenses, month, year)
  const total = sumPaid(monthExpenses)

  const totals = new Map<string, { amount: number; count: number }>()
  for (const expense of monthExpenses) {
    const amount = paidContribution(expense)
    if (amount <= 0) continue
    const current = totals.get(expense.user_id) ?? { amount: 0, count: 0 }
    totals.set(expense.user_id, {
      amount: current.amount + amount,
      count: current.count + 1,
    })
  }

  return Array.from(totals.entries())
    .map(([userId, data]) => ({
      userId,
      name: getOwnerLabel(userId),
      amount: data.amount,
      percentage: total > 0 ? (data.amount / total) * 100 : 0,
      count: data.count,
    }))
    .sort((a, b) => b.amount - a.amount)
}

export interface DailySpend {
  day: number
  amount: number
}

export function dailySpendSeries(expenses: Expense[], month: number, year: number): DailySpend[] {
  const daysInMonth = dayjs()
    .month(month - 1)
    .year(year)
    .daysInMonth()
  const series = Array.from({ length: daysInMonth }, (_, index) => ({
    day: index + 1,
    amount: 0,
  }))

  for (const expense of filterExpensesByMonth(expenses, month, year)) {
    if (!expense.created_at) continue
    const amount = paidContribution(expense)
    if (amount <= 0) continue
    const day = dayjs(expense.created_at).date()
    if (day >= 1 && day <= daysInMonth) {
      series[day - 1].amount += amount
    }
  }

  return series
}

export type InsightTone = "warning" | "info" | "success"

export interface StatsInsight {
  tone: InsightTone
  title: string
  message: string
}

export function generateInsights(options: {
  monthExpenses: Expense[]
  paidTotal: number
  pendingTotal: number
  vsPrevious: { delta: number; percent: number | null }
  topCategory?: CategoryStat
  monthTotals: MonthTotal[]
  balanceTotal: number
}): StatsInsight[] {
  const insights: StatsInsight[] = []
  const { monthExpenses, paidTotal, pendingTotal, vsPrevious, topCategory, monthTotals, balanceTotal } =
    options

  if (monthExpenses.length === 0) {
    insights.push({
      tone: "info",
      title: "Sin movimientos",
      message: "No hay gastos registrados en este mes. Cuando cargues movimientos, verás el análisis aquí.",
    })
    return insights
  }

  const pendingRatio = paidTotal + pendingTotal > 0 ? pendingTotal / (paidTotal + pendingTotal) : 0
  if (pendingRatio >= 0.25) {
    insights.push({
      tone: "warning",
      title: "Compromisos pendientes elevados",
      message: `El ${(pendingRatio * 100).toFixed(0)}% del gasto del mes aún no está pagado. Conviene liquidar pendientes para no distorsionar el flujo de caja.`,
    })
  }

  if (vsPrevious.percent !== null) {
    if (vsPrevious.percent > 15) {
      insights.push({
        tone: "warning",
        title: "Gasto en alza",
        message: `Gastaste un ${vsPrevious.percent.toFixed(0)}% más que el mes anterior. Revisá las categorías con mayor incremento.`,
      })
    } else if (vsPrevious.percent < -10) {
      insights.push({
        tone: "success",
        title: "Gasto en baja",
        message: `Redujiste el gasto un ${Math.abs(vsPrevious.percent).toFixed(0)}% respecto al mes anterior. Buen control del período.`,
      })
    }
  }

  if (topCategory && topCategory.percentage >= 35) {
    insights.push({
      tone: "warning",
      title: "Alta concentración",
      message: `${topCategory.name} concentra el ${topCategory.percentage.toFixed(0)}% del gasto. Evaluá si hay margen de optimización.`,
    })
  }

  const avg3 = averageMonthlyPaid(monthTotals.slice(-3))
  if (avg3 > 0 && paidTotal > avg3 * 1.2) {
    insights.push({
      tone: "info",
      title: "Sobre tu promedio reciente",
      message: `Este mes supera en más del 20% tu promedio de los últimos 3 meses ($${avg3.toFixed(0)}).`,
    })
  }

  if (balanceTotal > 0 && paidTotal > balanceTotal * 0.5) {
    insights.push({
      tone: "warning",
      title: "Presión sobre el balance",
      message: "El gasto pagado del mes representa más de la mitad de tu balance actual. Considerá revisar liquidez.",
    })
  }

  if (insights.length === 0) {
    insights.push({
      tone: "success",
      title: "Período estable",
      message: "Tus gastos se mantienen en un rango razonable respecto a meses anteriores.",
    })
  }

  return insights
}
