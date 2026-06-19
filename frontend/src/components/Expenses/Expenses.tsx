import { useCallback, useEffect, useState } from "react"

import dayjs from "dayjs"

import { ExpenseTable } from "./ExpenseTable"

import {
  listOfAccounts,
  listOfCategories,
  listOfExpenses,
  ExpensesMonthSummary,
  PaginatedExpensesResponse,
} from "../../types"

import { ExpenseHeader } from "./ExpenseHeader"

import { useAxiosPrivate } from "../../hooks/useAxiosPrivate"

import useAuth from "../../hooks/useAuth"

import { useNavigate, useLocation } from "react-router-dom"

import { isAborted, isAuthError } from "@/lib/apiErrors"

import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import { SectionLoader } from "../layout/SectionLoader"

import { buildRecentMonths } from "@/lib/monthUtils"

const EXPENSES_PAGE_SIZE = 10

const emptyMonthSummary = (): ExpensesMonthSummary => ({
  pendingCount: 0,
  paidTotal: 0,
  pendingTotal: 0,
  monthTotal: 0,
})

function Expenses() {
  const { auth } = useAuth()

  const [expenses, setExpenses] = useState<listOfExpenses>([])
  const [monthSummary, setMonthSummary] = useState<ExpensesMonthSummary>(emptyMonthSummary)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)

  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "unpaid">(
    "all"
  )

  const [categories, setCategories] = useState<listOfCategories>([])
  const [accounts, setAccounts] = useState<listOfAccounts>([])

  const availableMonths = buildRecentMonths()
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  const [metadataLoading, setMetadataLoading] = useState(true)
  const [expensesLoading, setExpensesLoading] = useState(true)

  const axiosPrivate = useAxiosPrivate()
  const location = useLocation()
  const navigate = useNavigate()

  const fetchExpensesForMonth = useCallback(
    async (
      month: number,
      year: number,
      options: {
        page: number
        payment: "all" | "paid" | "unpaid"
        signal?: AbortSignal
      }
    ) => {
      if (!auth?.id) return

      const { page, payment, signal } = options

      setExpensesLoading(true)

      try {
        const response = await axiosPrivate.get<PaginatedExpensesResponse>(
          `/${auth.id}/expenses/${month}/${year}`,
          {
            signal,
            params: {
              page,
              limit: EXPENSES_PAGE_SIZE,
              payment,
            },
          }
        )

        setExpenses(response.data.data ?? [])
        setMonthSummary(response.data.summary ?? emptyMonthSummary())
        setCurrentPage(response.data.pagination?.page ?? page)
        setTotalPages(response.data.pagination?.totalPages ?? 0)
      } catch (err: unknown) {
        if (isAborted(err)) return

        if (isAuthError(err)) {
          navigate("/login", { state: { from: location }, replace: true })
        }
      } finally {
        if (!signal?.aborted) setExpensesLoading(false)
      }
    },
    [auth?.id, axiosPrivate, location, navigate]
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

    const controller = new AbortController()

    const load = async () => {
      setMetadataLoading(true)

      const nowMonth = dayjs().month() + 1
      const nowYear = dayjs().year()

      try {
        const [accountsRes, categoriesRes] = await Promise.all([
          axiosPrivate.get(`/${auth.id}/accounts`, { signal: controller.signal }),
          axiosPrivate.get(`/${auth.id}/categories`, { signal: controller.signal }),
        ])

        setAccounts(accountsRes.data ?? [])
        setCategories(categoriesRes.data ?? [])
        setSelectedMonth(nowMonth)
        setSelectedYear(nowYear)
        setCurrentPage(1)

        await fetchExpensesForMonth(nowMonth, nowYear, {
          page: 1,
          payment: "all",
          signal: controller.signal,
        })
      } catch (err: unknown) {
        if (isAborted(err)) return

        if (isAuthError(err)) {
          navigate("/login", { state: { from: location }, replace: true })
        }
      } finally {
        if (!controller.signal.aborted) setMetadataLoading(false)
      }
    }

    void load()

    return () => controller.abort()
  }, [auth?.id, axiosPrivate, fetchExpensesForMonth, location, navigate])

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

  const activeCategories = categories.filter(
    (category) => category.is_enabled !== false
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
              categories={activeCategories}
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
