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
import { Separator } from "@/components/ui/separator"

import { SectionLoader } from "../layout/SectionLoader"



import { buildRecentMonths } from "@/lib/monthUtils"



function Expenses() {

  const { auth } = useAuth()

  const [expenses, setExpenses] = useState<listOfExpenses>([])

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

    async (month: number, year: number, signal?: AbortSignal) => {

      if (!auth?.id) return

      setExpensesLoading(true)

      try {

        const response = await axiosPrivate.get(

          `/${auth.id}/expenses/${month}/${year}`,

          { signal }

        )

        setExpenses(response.data ?? [])

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

        await fetchExpensesForMonth(nowMonth, nowYear, controller.signal)

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

    await fetchExpensesForMonth(month, year)

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

    void fetchExpensesForMonth(month, year)

  }



  const pendingCount = expenses.filter((expense) => !expense.is_paid).length

  const activeCategories = categories.filter(

    (category) => category.is_enabled !== false

  )



  const filteredAndSortedExpenses = expenses

    .filter((expense) => {

      if (paymentFilter === "all") return true

      if (paymentFilter === "paid") return expense.is_paid

      if (paymentFilter === "unpaid") return !expense.is_paid

      return true

    })

    .sort((a, b) => {

      if (a.is_paid && !b.is_paid) return 1

      if (!a.is_paid && b.is_paid) return -1

      const dateA = a.payment_date ? new Date(a.payment_date) : new Date(0)

      const dateB = b.payment_date ? new Date(b.payment_date) : new Date(0)

      return dateB.getTime() - dateA.getTime()

    })



  return (

    <div>

      <Card>

        <CardContent className="space-y-4 p-4 sm:p-6">

          {metadataLoading ? (

            <SectionLoader />

          ) : (

            <ExpenseHeader

              expenses={expenses}

              pendingCount={pendingCount}

              paymentFilter={paymentFilter}

              onPaymentFilterChange={setPaymentFilter}

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


