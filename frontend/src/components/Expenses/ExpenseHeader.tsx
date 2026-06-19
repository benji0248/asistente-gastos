import { Category, Account, ExpensesMonthSummary } from "../../types"
import { CreateExpense } from "./CreateExpense"
import { ScanReceipt } from "./ScanReceipt"
import CreateCategory from "./CreateCategory"
import { useState } from "react"
import type { ReceiptParseResult } from "@/lib/receiptParser"
import dayjs from "dayjs"
import "dayjs/locale/es"
import { Link } from "react-router-dom"
import useAuth from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/layout/PageHeader"
import { MonthPicker } from "../Stats/MonthPicker"
import type { MonthYear } from "@/lib/monthUtils"
import { BarChart3 } from "lucide-react"
import { formatMoney } from "@/lib/formatMoney"

dayjs.locale("es")

interface Props {
  monthSummary: ExpensesMonthSummary
  paymentFilter: "all" | "paid" | "unpaid"
  onPaymentFilterChange: (key: "all" | "paid" | "unpaid") => void
  onMonthSelect: (month: number, year: number) => void
  onExpenseMutated?: (options?: { preferCurrentMonth?: boolean }) => void
  onCategoryCreated?: () => void
  categories: Category[]
  accounts: Account[]
  availableMonths: MonthYear[]
  selectedMonth: number | null
  selectedYear: number | null
}

export const ExpenseHeader = ({
  monthSummary,
  paymentFilter,
  onPaymentFilterChange,
  categories,
  accounts,
  availableMonths,
  selectedMonth,
  selectedYear,
  onMonthSelect,
  onExpenseMutated,
  onCategoryCreated,
}: Props) => {
  const { auth } = useAuth()
  const [scanResult, setScanResult] = useState<ReceiptParseResult | null>(null)

  const monthLabel =
    selectedMonth !== null && selectedYear !== null
      ? dayjs()
          .month(selectedMonth - 1)
          .year(selectedYear)
          .format("MMMM YYYY")
      : "Seleccioná un mes"

  const paidTotal = monthSummary.paidTotal
  const pendingTotal = monthSummary.pendingTotal
  const monthTotal = monthSummary.monthTotal
  const pendingCount = monthSummary.pendingCount
  const paymentOptions: Array<{
    key: "all" | "paid" | "unpaid"
    label: string
    count?: number
  }> = [
    { key: "all", label: "Todos" },
    { key: "unpaid", label: "Pendientes", count: pendingCount },
    { key: "paid", label: "Pagados" },
  ]

  return (
    <div className="space-y-4">
      <PageHeader title="Gastos" description={monthLabel} />

      <div className="rounded-2xl border border-border/50 bg-muted/20 p-2.5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <MonthPicker
            months={availableMonths}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onSelect={onMonthSelect}
          />

          <div className="grid grid-cols-3 gap-1 rounded-xl bg-background/70 p-1 ring-1 ring-border/50 sm:flex">
            {paymentOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => onPaymentFilterChange(option.key)}
                className={[
                  "min-h-10 rounded-lg px-2 text-xs font-medium transition-all sm:px-3 sm:text-sm",
                  paymentFilter === option.key
                    ? "bg-foreground text-background shadow-soft"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                ].join(" ")}
              >
                {option.label}
                {option.count ? ` ${option.count}` : ""}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <div className="inline-flex min-w-0 items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2 text-sm ring-1 ring-border/40">
          <span className="text-muted-foreground">Pagado</span>
          <Badge variant="secondary" className="rounded-lg font-semibold tabular-nums">
            ${formatMoney(paidTotal)}
          </Badge>
        </div>
        <div className="inline-flex min-w-0 items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2 text-sm ring-1 ring-border/40">
          <span className="text-muted-foreground">Sin pagar</span>
          <Badge
            variant={pendingTotal > 0 ? "destructive" : "secondary"}
            className="rounded-lg font-semibold tabular-nums"
          >
            ${formatMoney(pendingTotal)}
          </Badge>
        </div>
        <div className="col-span-2 inline-flex min-w-0 items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2 text-sm ring-1 ring-border/40 sm:col-span-1">
          <span className="text-muted-foreground">Total del mes</span>
          <Badge variant="outline" className="rounded-lg font-semibold tabular-nums">
            ${formatMoney(monthTotal)}
          </Badge>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="destructive" className="rounded-full">
            {pendingCount}
          </Badge>
          <span className="text-muted-foreground">
            gasto{pendingCount === 1 ? "" : "s"} pendiente{pendingCount === 1 ? "" : "s"} este mes
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap [&>button]:min-h-11 [&>button]:w-full sm:[&>button]:w-auto">
        <ScanReceipt
          categories={categories}
          accounts={accounts}
          onParsed={setScanResult}
          onExpenseCreated={() =>
            onExpenseMutated?.({ preferCurrentMonth: true })
          }
        />
        <CreateExpense
          categories={categories}
          accounts={accounts}
          scanResult={scanResult}
          onScanConsumed={() => setScanResult(null)}
          onExpenseCreated={() =>
            onExpenseMutated?.({ preferCurrentMonth: true })
          }
        />
        <CreateCategory onCreated={onCategoryCreated} />
        {auth?.id && (
          <Button variant="ghost" size="sm" className="min-h-11 rounded-xl" asChild>
            <Link to={`/${auth.id}/estadisticas`}>
              <BarChart3 className="h-4 w-4" />
              Ver estadísticas
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
