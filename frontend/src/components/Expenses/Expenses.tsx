import { useCallback, useEffect, useState } from "react"
import dayjs from "dayjs"
import { ExpenseTable } from "./ExpenseTable"
import { listOfAccounts, listOfCategories, listOfExpenses } from "../../types"
import { ExpenseHeader } from "./ExpenseHeader"
import { useAxiosPrivate } from "../../hooks/useAxiosPrivate"
import useAuth from "../../hooks/useAuth"
import { useNavigate, useLocation } from "react-router-dom"
import { isAborted, isAuthError } from "@/lib/apiErrors"
import { Card, CardContent } from "@/components/ui/card"
import { SectionLoader } from "../layout/SectionLoader"

import { normalizeMonths } from "@/lib/monthUtils"
import type { MonthYear } from "@/lib/monthUtils"

function Expenses() {
  const { auth } = useAuth()
  const [expenses, setExpenses] = useState<listOfExpenses>([])
  const [filterSelected, setFilterSelected] = useState<string | undefined>("all")
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "unpaid">(
    "all"
  )
  const [categories, setCategories] = useState<listOfCategories>([])
  const [accounts, setAccounts] = useState<listOfAccounts>([])
  const [availableMonths, setAvailableMonths] = useState<MonthYear[]>([])
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [metadataLoading, setMetadataLoading] = useState(true)
  const [expensesLoading, setExpensesLoading] = useState(true)
  const axiosPrivate = useAxiosPrivate()
  const location = useLocation()
  const navigate = useNavigate()

  const fetchExpensesForMonth = useCallback(
    async (month: number, year: number) => {
      if (!auth?.id) return
      setExpensesLoading(true)
      try {
        const response = await axiosPrivate.get(
          `/${auth.id}/expenses/${month}/${year}`
        )
        setExpenses(response.data ?? [])
      } catch (err: unknown) {
        if (isAborted(err)) return
        if (isAuthError(err)) {
          navigate("/login", { state: { from: location }, replace: true })
        }
      } finally {
        setExpensesLoading(false)
      }
    },
    [auth?.id, axiosPrivate, location, navigate]
  )

  const refreshExpenseData = useCallback(
    async (options?: { preferCurrentMonth?: boolean; reloadMetadata?: boolean }) => {
      if (!auth?.id) return

      const showMetadataLoader = options?.reloadMetadata === true
      if (showMetadataLoader) setMetadataLoading(true)

      try {
        const [monthsRes, accountsRes, categoriesRes] = await Promise.all([
          axiosPrivate.get(`/${auth.id}/expenses/available-months`),
          axiosPrivate.get(`/${auth.id}/accounts`),
          axiosPrivate.get(`/${auth.id}/categories`),
        ])

        const months = normalizeMonths(monthsRes.data)
        const nowMonth = dayjs().month() + 1
        const nowYear = dayjs().year()

        setAvailableMonths(months)
        setAccounts(accountsRes.data ?? [])
        setCategories(categoriesRes.data ?? [])

        let month = selectedMonth
        let year = selectedYear

        if (options?.preferCurrentMonth || month === null || year === null) {
          month = nowMonth
          year = nowYear
        } else if (
          months.length > 0 &&
          !months.some((m) => m.month === month && m.year === year)
        ) {
          month = nowMonth
          year = nowYear
        }

        setSelectedMonth(month)
        setSelectedYear(year)
        await fetchExpensesForMonth(month, year)
      } catch (err: unknown) {
        if (isAborted(err)) return
        if (isAuthError(err)) {
          navigate("/login", { state: { from: location }, replace: true })
        }
      } finally {
        if (showMetadataLoader) setMetadataLoading(false)
      }
    },
    [
      auth?.id,
      axiosPrivate,
      selectedMonth,
      selectedYear,
      fetchExpensesForMonth,
      location,
      navigate,
    ]
  )

  const refreshCategories = useCallback(async () => {
    if (!auth?.id) return
    try {
      const response = await axiosPrivate.get(`/${auth.id}/categories`)
      setCategories(response.data ?? [])
    } catch (err) {
      console.error(err)
    }
  }, [auth?.id, axiosPrivate])

  useEffect(() => {
    if (!auth?.id) return
    refreshExpenseData({ preferCurrentMonth: true, reloadMetadata: true })
  }, [auth?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleMonthSelect = async (month: number, year: number) => {
    setSelectedMonth(month)
    setSelectedYear(year)
    await fetchExpensesForMonth(month, year)
  }

  const handleExpenseMutated = (options?: { preferCurrentMonth?: boolean }) => {
    void refreshExpenseData(options)
  }

  const unpaidCount = expenses.filter((expense) => !expense.is_paid).length
  const activeCategories = categories.filter(
    (category) => category.is_enabled !== false
  )

  const filteredExpenses = filterSelected
    ? expenses.filter(
        (expense) =>
          expense.category_id === filterSelected || filterSelected === "all"
      )
    : expenses

  const filteredAndSortedExpenses = expenses
    .filter((expense) => {
      if (paymentFilter === "all") return true
      if (paymentFilter === "paid") return expense.is_paid
      if (paymentFilter === "unpaid") return !expense.is_paid
      return true
    })
    .filter(
      (expense) =>
        filterSelected === "all" || expense.category_id === filterSelected
    )
    .sort((a, b) => {
      if (a.is_paid && !b.is_paid) return 1
      if (!a.is_paid && b.is_paid) return -1
      const dateA = a.payment_date ? new Date(a.payment_date) : new Date(0)
      const dateB = b.payment_date ? new Date(b.payment_date) : new Date(0)
      return dateB.getTime() - dateA.getTime()
    })

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          {metadataLoading ? (
            <SectionLoader />
          ) : (
            <ExpenseHeader
              completedCount={unpaidCount}
              filterSelected={filterSelected}
              onClearCompleted={() => {}}
              handleFilterChange={setFilterSelected}
              handlePaymentFilter={setPaymentFilter}
              expenses={filteredExpenses}
              categories={activeCategories}
              availableMonths={availableMonths}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthSelect={handleMonthSelect}
              onExpenseMutated={handleExpenseMutated}
              onCategoryCreated={refreshCategories}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {expensesLoading ? (
            <SectionLoader minHeight="min-h-[200px]" />
          ) : (
            <ExpenseTable
              expenses={filteredAndSortedExpenses}
              categories={categories}
              accounts={accounts}
              onExpenseMutated={() => handleExpenseMutated()}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Expenses
