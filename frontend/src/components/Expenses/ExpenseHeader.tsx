import { Category, listOfExpenses } from "../../types"
import { FilterExpenses } from "./FilterExpenses"
import { sumatoria, sumatoriaPendientes } from "../../consts"
import { CreateExpense } from "./CreateExpense"
import { ScanReceipt } from "./ScanReceipt"
import CreateCategory from "./CreateCategory"
import { useState } from "react"
import type { ReceiptParseResult } from "@/lib/receiptParser"
import dayjs from "dayjs"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PageHeader } from "@/components/layout/PageHeader"
import { cn } from "@/lib/utils"
import { monthKey, type MonthYear } from "@/lib/monthUtils"

interface Props {
  completedCount: number
  filterSelected: string | undefined
  onClearCompleted: () => void
  handleFilterChange: (category_id: string | undefined) => void
  handlePaymentFilter: (key: "all" | "paid" | "unpaid") => void
  onMonthSelect: (month: number, year: number) => void
  onExpenseMutated?: (options?: { preferCurrentMonth?: boolean }) => void
  onCategoryCreated?: () => void
  expenses: listOfExpenses
  categories: Category[]
  availableMonths: MonthYear[]
  selectedMonth: number | null
  selectedYear: number | null
}

export const ExpenseHeader = ({
  completedCount = 0,
  filterSelected,
  handleFilterChange,
  handlePaymentFilter,
  expenses,
  categories,
  availableMonths,
  selectedMonth,
  selectedYear,
  onMonthSelect,
  onExpenseMutated,
  onCategoryCreated,
}: Props) => {
  const [scanResult, setScanResult] = useState<ReceiptParseResult | null>(null)

  const selectedMonthKey =
    selectedMonth !== null && selectedYear !== null
      ? monthKey(selectedMonth, selectedYear)
      : ""

  const monthButtons =
    availableMonths.length > 0
      ? availableMonths
      : selectedMonth !== null && selectedYear !== null
        ? [{ month: selectedMonth, year: selectedYear }]
        : []

  const monthLabel = selectedMonthKey
    ? dayjs()
        .month((selectedMonth ?? 1) - 1)
        .year(selectedYear ?? dayjs().year())
        .format("MMMM YYYY")
    : "Selecciona un mes"

  return (
    <div className="space-y-6">
      <PageHeader title="Gastos" description={monthLabel} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          defaultValue="all"
          onValueChange={(key) =>
            handlePaymentFilter(key as "all" | "paid" | "unpaid")
          }
        >
          <TabsList className="h-auto flex-wrap justify-start">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="unpaid" className="gap-2">
              Pendientes
              {completedCount > 0 && (
                <Badge variant="destructive">{completedCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="paid">Pagados</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap gap-2">
          {monthButtons.map(({ month, year }) => {
            const key = monthKey(month, year)
            return (
              <Button
                key={key}
                variant={selectedMonthKey === key ? "default" : "outline"}
                size="sm"
                className={cn(
                  "rounded-xl",
                  selectedMonthKey === key && "shadow-soft"
                )}
                onClick={() => onMonthSelect(month, year)}
              >
                {key}
              </Button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl bg-muted/40 ring-1 ring-border/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between text-sm">
        <p>
          Sin pagar:{" "}
          <span className="font-semibold text-destructive">
            ${sumatoriaPendientes(expenses)}
          </span>
        </p>
        <p>
          Total del mes:{" "}
          <span className="font-semibold text-foreground">
            ${sumatoria(expenses)}
          </span>
        </p>
      </div>

      <Separator />

      <div className="flex flex-wrap gap-2">
        <ScanReceipt
          categories={categories}
          onParsed={setScanResult}
          onExpenseCreated={() =>
            onExpenseMutated?.({ preferCurrentMonth: true })
          }
        />
        <CreateExpense
          scanResult={scanResult}
          onScanConsumed={() => setScanResult(null)}
          onExpenseCreated={() =>
            onExpenseMutated?.({ preferCurrentMonth: true })
          }
        />
        <CreateCategory onCreated={onCategoryCreated} />
      </div>

      <FilterExpenses
        filterSelected={filterSelected}
        onFilterChange={handleFilterChange}
        categories={categories}
      />
    </div>
  )
}
