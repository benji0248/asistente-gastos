import { useCallback, useEffect, useMemo, useState } from "react"
import dayjs from "dayjs"
import { ExpenseTable } from "./ExpenseTable"
import { listOfExpenses, ExpensesMonthSummary } from "../../types"
import { ExpenseHeader } from "./ExpenseHeader"
import useAuth from "../../hooks/useAuth"
import { useAppData } from "@/context/AppDataProvider"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SectionLoader } from "../layout/SectionLoader"
import { buildRecentMonths } from "@/lib/monthUtils"
import { listByMonthPaginated } from "@/lib/db/expenses"
import { getSelectableCategories } from "@/lib/categoryUtils"

const EXPENSES_PAGE_SIZE = 10

const emptyMonthSummary = (): ExpensesMonthSummary => ({
  pendingCount: 0,
  paidTotal: 0,
  pendingTotal: 0,
  monthTotal: 0,
})

function Expenses() {
  const { auth } = useAuth()
  const { accounts, categories, loading: metadataLoading, refreshCategories } = useAppData()

  const [expenses, setExpenses] = useState<listOfExpenses>([])
  const [monthSummary, setMonthSummary] = useState<ExpensesMonthSummary>(emptyMonthSummary)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "unpaid">("all")

  const availableMonths = buildRecentMonths()
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [expensesLoading, setExpensesLoading] = useState(true)

  const fetchExpensesForMonth = useCallback(
    async (
      month: number,
      year: number,
      options: { page: number; payment: "all" | "paid" | "unpaid" }
    ) => {
      if (!auth?.id) return

      const { page, payment } = options
      setExpensesLoading(true)

      try {
        const result = await listByMonthPaginated({
          month,
          year,
          page,
          limit: EXPENSES_PAGE_SIZE,
          payment,
        })

        setExpenses(result.data ?? [])
        setMonthSummary(result.summary ?? emptyMonthSummary())
        setCurrentPage(result.pagination?.page ?? page)
        setTotalPages(result.pagination?.totalPages ?? 0)
      } catch (err) {
        console.error(err)
      } finally {
        setExpensesLoading(false)
      }
    },
    [auth?.id]
  )

  useEffect(() => {
    if (!auth?.id || metadataLoading) return

    const nowMonth = dayjs().month() + 1
    const nowYear = dayjs().year()
    setSelectedMonth(nowMonth)
    setSelectedYear(nowYear)
    setCurrentPage(1)

    void fetchExpensesForMonth(nowMonth, nowYear, { page: 1, payment: "all" })
  }, [auth?.id, metadataLoading, fetchExpensesForMonth])

  const handleMonthSelect = async (month: number, year: number) => {
    setSelectedMonth(month)
    setSelectedYear(year)
    setCurrentPage(1)
    await fetchExpensesForMonth(month, year, { page: 1, payment: paymentFilter })
  }

  const handlePaymentFilterChange = (filter: "all" | "paid" | "unpaid") => {
    setPaymentFilter(filter)
    setCurrentPage(1)
    const month = selectedMonth ?? dayjs().month() + 1
    const year = selectedYear ?? dayjs().year()
    void fetchExpensesForMonth(month, year, { page: 1, payment: filter })
  }

  const handlePageChange = (page: number) => {
    const month = selectedMonth ?? dayjs().month() + 1
    const year = selectedYear ?? dayjs().year()
    setCurrentPage(page)
    void fetchExpensesForMonth(month, year, { page, payment: paymentFilter })
  }

  const handleExpenseMutated = (options?: { preferCurrentMonth?: boolean }) => {
    const nowMonth = dayjs().month() + 1
    const nowYear = dayjs().year()

    let month = selectedMonth ?? nowMonth
    let year = selectedYear ?? nowYear

    if (options?.preferCurrentMonth) {
      month = nowMonth
      year = nowYear
      setSelectedMonth(month)
      setSelectedYear(year)
    }

    void fetchExpensesForMonth(month, year, {
      page: currentPage,
      payment: paymentFilter,
    })
  }

  const selectableCategories = useMemo(
    () => getSelectableCategories(categories, auth?.id ?? ""),
    [categories, auth?.id]
  )

  return (
    <div>
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          {metadataLoading ? (
            <SectionLoader />
          ) : (
            <ExpenseHeader
              monthSummary={monthSummary}
              paymentFilter={paymentFilter}
              onPaymentFilterChange={handlePaymentFilterChange}
              categories={selectableCategories}
              accounts={accounts}
              availableMonths={availableMonths}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthSelect={handleMonthSelect}
              onExpenseMutated={handleExpenseMutated}
              onCategoryCreated={refreshCategories}
            />
          )}

          <Separator className="opacity-60" />

          {expensesLoading ? (
            <SectionLoader minHeight="min-h-[200px]" />
          ) : (
            <ExpenseTable
              expenses={expenses}
              categories={categories}
              accounts={accounts}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onExpenseMutated={() => handleExpenseMutated()}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Expenses
