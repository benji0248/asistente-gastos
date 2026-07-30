import { useCallback, useEffect, useMemo, useState } from "react"
import dayjs from "dayjs"
import useAuth from "@/hooks/useAuth"
import useHousehold from "@/hooks/useHousehold"
import { useAppData } from "@/context/AppDataProvider"
import { getAvailableMonths, listAll } from "@/lib/db/expenses"
import { normalizeMonths, type MonthYear } from "@/lib/monthUtils"
import { balanceTotal } from "@/consts"
import { formatPrivateMoney, formatPercent } from "@/lib/formatMoney"
import { usePrivacyAmounts } from "@/context/PrivacyAmountsProvider"
import { PrivacyToggle } from "@/components/layout/PrivacyToggle"
import {
  accountBreakdown,
  categoryBreakdown,
  compareMonths,
  dailySpendSeries,
  filterExpensesByMonth,
  generateInsights,
  memberBreakdown,
  monthLabel,
  recentMonthSeries,
  sumPaid,
  sumPending,
} from "@/lib/expenseStats"
import type { Expense } from "@/types"
import { PageHeader } from "../layout/PageHeader"
import { SectionLoader } from "../layout/SectionLoader"
import { StatCard } from "../layout/StatCard"
import { MonthPicker } from "./MonthPicker"
import { HorizontalBar, MonthBars } from "./StatsCharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock,
  Lightbulb,
  PiggyBank,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { cn } from "@/lib/utils"

function Estadisticas() {
  const { auth } = useAuth()
  const { isLinked, getOwnerName } = useHousehold()
  const { accounts, categories: contextCategories, loading: contextLoading } = useAppData()
  const { amountsVisible } = usePrivacyAmounts()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [availableMonths, setAvailableMonths] = useState<MonthYear[]>([])
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const categories = useMemo(
    () => contextCategories.filter((c) => c.is_enabled !== false),
    [contextCategories]
  )

  const loadData = useCallback(async () => {
    if (!auth?.id) return
    setLoading(true)
    try {
      const [expensesData, monthsData] = await Promise.all([
        listAll(),
        getAvailableMonths(),
      ])

      const months = normalizeMonths(monthsData)
      const nowMonth = dayjs().month() + 1
      const nowYear = dayjs().year()

      setExpenses(expensesData ?? [])
      setAvailableMonths(months)
      setSelectedMonth((current) => current ?? nowMonth)
      setSelectedYear((current) => current ?? nowYear)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [auth?.id])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const month = selectedMonth ?? dayjs().month() + 1
  const year = selectedYear ?? dayjs().year()

  const monthExpenses = useMemo(
    () => filterExpensesByMonth(expenses, month, year),
    [expenses, month, year]
  )

  const paidTotal = useMemo(() => sumPaid(monthExpenses), [monthExpenses])
  const pendingTotal = useMemo(() => sumPending(monthExpenses), [monthExpenses])
  const committedTotal = paidTotal + pendingTotal

  const previousMonth = dayjs()
    .month(month - 1)
    .year(year)
    .subtract(1, "month")

  const previousMonthExpenses = useMemo(
    () =>
      filterExpensesByMonth(
        expenses,
        previousMonth.month() + 1,
        previousMonth.year()
      ),
    [expenses, previousMonth]
  )

  const previousPaid = sumPaid(previousMonthExpenses)
  const vsPrevious = compareMonths(paidTotal, previousPaid)

  const monthSeries = useMemo(
    () => recentMonthSeries(expenses, { month, year }, 6),
    [expenses, month, year]
  )

  const categoriesStats = useMemo(
    () => categoryBreakdown(expenses, categories, month, year),
    [expenses, categories, month, year]
  )

  const accountsStats = useMemo(
    () =>
      accountBreakdown(
        expenses,
        accounts,
        month,
        year,
        isLinked ? (userId) => getOwnerName(userId) : undefined
      ),
    [expenses, accounts, month, year, isLinked, getOwnerName]
  )

  const membersStats = useMemo(
    () =>
      isLinked
        ? memberBreakdown(expenses, month, year, (userId) => getOwnerName(userId))
        : [],
    [expenses, month, year, isLinked, getOwnerName]
  )

  const dailySeries = useMemo(
    () => dailySpendSeries(expenses, month, year),
    [expenses, month, year]
  )

  const totalBalance = balanceTotal(accounts)
  const transactionCount = monthExpenses.length
  const paidCount = monthExpenses.filter((expense) => expense.is_paid).length
  const pendingCount = monthExpenses.filter((expense) => !expense.is_paid).length
  const daysInMonth = dayjs()
    .month(month - 1)
    .year(year)
    .daysInMonth()
  const isCurrentMonth =
    month === dayjs().month() + 1 && year === dayjs().year()
  const elapsedDays = isCurrentMonth ? dayjs().date() : daysInMonth
  const avgDaily = elapsedDays > 0 ? paidTotal / elapsedDays : 0
  const avgTicket = paidCount > 0 ? paidTotal / paidCount : 0
  const maxMonthPaid = Math.max(...monthSeries.map((item) => item.paid), 1)
  const topCategory = categoriesStats[0]
  const busiestDay = dailySeries.reduce(
    (best, current) => (current.amount > best.amount ? current : best),
    { day: 0, amount: 0 }
  )

  const insights = generateInsights({
    monthExpenses,
    paidTotal,
    pendingTotal,
    vsPrevious,
    topCategory,
    monthTotals: monthSeries,
    balanceTotal: totalBalance,
  })

  const trendTone =
    vsPrevious.percent === null
      ? "neutral"
      : vsPrevious.percent > 0
        ? "up"
        : vsPrevious.percent < 0
          ? "down"
          : "neutral"

  if (loading || contextLoading) {
    return <SectionLoader minHeight="min-h-[60vh]" />
  }

  return (
    <div className="space-y-5 sm:space-y-8">
      <PageHeader
        title="Estadísticas"
        description={
          isLinked
            ? `Análisis de tu hogar · ${monthLabel(month, year)}`
            : `Análisis personal · ${monthLabel(month, year)}`
        }
        action={
          <MonthPicker
            months={availableMonths}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onSelect={(nextMonth, nextYear) => {
              setSelectedMonth(nextMonth)
              setSelectedYear(nextYear)
            }}
            className="w-full rounded-xl"
          />
        }
      />

      <div className="grid grid-cols-2 gap-3 min-w-0 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Gasto pagado"
          value={formatPrivateMoney(paidTotal, amountsVisible)}
          icon={Wallet}
          valueAction={<PrivacyToggle size="inline" />}
        />
        <StatCard
          label="Pendiente de pago"
          value={formatPrivateMoney(pendingTotal, amountsVisible)}
          icon={Clock}
          highlight={pendingTotal > 0}
        />
        <StatCard
          label="Comprometido del mes"
          value={formatPrivateMoney(committedTotal, amountsVisible)}
          icon={Receipt}
        />
        <StatCard
          label="Balance en cuentas"
          value={formatPrivateMoney(totalBalance, amountsVisible)}
          icon={PiggyBank}
        />
      </div>

      <details className="group rounded-2xl border border-border/50 bg-card/70 p-3 shadow-soft sm:hidden">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-xl px-1 text-sm font-medium">
          Métricas avanzadas
          <Badge variant="secondary" className="rounded-full">
            4
          </Badge>
        </summary>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <StatCard
            label="Vs mes anterior"
            value={
              vsPrevious.percent === null
                ? "—"
                : formatPercent(vsPrevious.percent)
            }
            icon={trendTone === "down" ? ArrowDownRight : ArrowUpRight}
            highlight={vsPrevious.percent !== null && vsPrevious.percent > 15}
          />
          <StatCard
            label="Promedio diario"
            value={formatPrivateMoney(avgDaily, amountsVisible)}
            icon={CalendarDays}
          />
          <StatCard
            label="Ticket promedio"
            value={formatPrivateMoney(avgTicket, amountsVisible)}
            icon={BarChart3}
          />
          <StatCard
            label="Transacciones"
            value={`${transactionCount} (${paidCount} pagadas)`}
            icon={CheckCircle2}
          />
        </div>
      </details>

      <div className="hidden gap-4 sm:grid sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Vs mes anterior"
          value={
            vsPrevious.percent === null
              ? "—"
              : formatPercent(vsPrevious.percent)
          }
          icon={trendTone === "down" ? ArrowDownRight : ArrowUpRight}
          highlight={vsPrevious.percent !== null && vsPrevious.percent > 15}
        />
        <StatCard
          label="Promedio diario"
          value={formatPrivateMoney(avgDaily, amountsVisible)}
          icon={CalendarDays}
        />
        <StatCard
          label="Ticket promedio"
          value={formatPrivateMoney(avgTicket, amountsVisible)}
          icon={BarChart3}
        />
        <StatCard
          label="Transacciones"
          value={`${transactionCount} (${paidCount} pagadas)`}
          icon={CheckCircle2}
        />
      </div>

      <div className="grid gap-6 min-w-0 lg:grid-cols-2">
        <Card className="border-border/40 shadow-soft min-w-0">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="font-display text-lg">Evolución mensual</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <MonthBars
              maxValue={maxMonthPaid}
              items={monthSeries.map((item) => ({
                label: item.label,
                paid: item.paid,
                isSelected: item.month === month && item.year === year,
              }))}
            />
            <p className="mt-4 text-xs text-muted-foreground">
              Barras = gasto pagado por mes. Últimos 6 meses.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-soft min-w-0">
          <CardHeader className="flex flex-row items-start justify-between gap-2 p-4 sm:items-center sm:p-6">
            <CardTitle className="font-display text-lg min-w-0">Comparativa rápida</CardTitle>
            {vsPrevious.percent !== null && (
              <Badge
                variant={vsPrevious.percent > 0 ? "destructive" : "secondary"}
                className="rounded-full"
              >
                {formatPercent(vsPrevious.percent)}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="rounded-xl bg-muted/50 p-3 sm:p-4 min-w-0">
                <p className="text-[11px] text-muted-foreground sm:text-xs">Mes actual (pagado)</p>
                <p className="font-display text-lg font-bold break-all tabular-nums sm:text-2xl">
                  {formatPrivateMoney(paidTotal, amountsVisible)}
                </p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3 sm:p-4 min-w-0">
                <p className="text-[11px] text-muted-foreground sm:text-xs">Mes anterior (pagado)</p>
                <p className="font-display text-lg font-bold break-all tabular-nums sm:text-2xl">
                  {formatPrivateMoney(previousPaid, amountsVisible)}
                </p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground shrink-0">Variación absoluta</span>
                <span
                  className={cn(
                    "font-semibold text-right break-all tabular-nums",
                    vsPrevious.delta > 0 ? "text-destructive" : "text-foreground"
                  )}
                >
                  {amountsVisible
                    ? `${vsPrevious.delta >= 0 ? "+" : "-"}${formatPrivateMoney(
                        Math.abs(vsPrevious.delta),
                        true
                      )}`
                    : formatPrivateMoney(0, false)}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground shrink-0">Pendientes del mes</span>
                <span className="font-semibold">{pendingCount}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground shrink-0">Día de mayor gasto</span>
                <span className="font-semibold text-right">
                  {busiestDay.amount > 0
                    ? `Día ${busiestDay.day} (${formatPrivateMoney(busiestDay.amount, amountsVisible)})`
                    : "—"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/40 shadow-soft min-w-0">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="font-display text-lg">Gasto por categoría</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 px-4 pb-4 sm:px-6 sm:pb-6">
          {categoriesStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay montos pagados en este mes para analizar categorías.
            </p>
          ) : (
            categoriesStats.map((category, index) => (
              <HorizontalBar
                key={category.categoryId}
                label={category.name}
                amount={category.amount}
                percentage={category.percentage}
                meta={`${category.count} movimiento${category.count === 1 ? "" : "s"}`}
                highlight={index === 0}
              />
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 min-w-0 lg:grid-cols-2">
        <Card className="border-border/40 shadow-soft min-w-0">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="font-display text-lg">Por método de pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 px-4 pb-4 sm:px-6 sm:pb-6">
            {accountsStats.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos de cuentas en el período.</p>
            ) : (
              accountsStats.map((account) => (
                <HorizontalBar
                  key={account.accountId}
                  label={account.label}
                  amount={account.amount}
                  percentage={account.percentage}
                  meta={`${account.count} pago${account.count === 1 ? "" : "s"}`}
                />
              ))
            )}
          </CardContent>
        </Card>

        {isLinked && (
          <Card className="border-border/40 shadow-soft min-w-0">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="font-display text-lg">Por integrante del hogar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 px-4 pb-4 sm:px-6 sm:pb-6">
              {membersStats.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin gastos del hogar en el período.</p>
              ) : (
                membersStats.map((member) => (
                  <HorizontalBar
                    key={member.userId}
                    label={member.name}
                    amount={member.amount}
                    percentage={member.percentage}
                    meta={`${member.count} gasto${member.count === 1 ? "" : "s"}`}
                  />
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="border-border/40 shadow-soft min-w-0">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 shrink-0" />
            Análisis del período
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4 sm:px-6 sm:pb-6">
          {insights.map((insight) => (
            <div
              key={insight.title}
              className={cn(
                "rounded-xl border px-4 py-3",
                insight.tone === "warning" && "border-destructive/30 bg-destructive/5",
                insight.tone === "success" && "border-emerald-500/30 bg-emerald-500/5",
                insight.tone === "info" && "border-border/60 bg-muted/30"
              )}
            >
              <div className="flex items-start gap-2">
                {insight.tone === "warning" ? (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
                ) : insight.tone === "success" ? (
                  <TrendingUp className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                ) : (
                  <Lightbulb className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                )}
                <div>
                  <p className="font-medium text-sm">{insight.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{insight.message}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default Estadisticas
