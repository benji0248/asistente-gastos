import { listOfAccounts, listOfExpenses } from "../../types"

import { useCallback, useEffect, useState } from "react"

import { useAxiosPrivate } from "../../hooks/useAxiosPrivate"

import { Link, useLocation, useNavigate } from "react-router-dom"

import useAuth from "../../hooks/useAuth"
import useHousehold from "@/hooks/useHousehold"

import { balanceTotal } from "../../consts"

import { AccordionAccounts } from "../Profile/accordionAccounts"

import { RecentExpenseCard, RecentExpenses } from "./RecentExpenses"

import { isAborted, isAuthError } from "@/lib/apiErrors"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import {

  Table,

  TableBody,

  TableHead,

  TableHeader,

  TableRow,

} from "@/components/ui/table"

import { Button } from "@/components/ui/button"

import { ArrowRight, CheckCircle2, Clock, House, Wallet } from "lucide-react"

import { PageHeader } from "../layout/PageHeader"

import { StatCard } from "../layout/StatCard"

import { SectionLoader } from "../layout/SectionLoader"
import { formatMoney } from "@/lib/formatMoney"
import { cn } from "@/lib/utils"



export const HomeLogged = () => {

  const { auth } = useAuth()
  const { isLinked, household, members } = useHousehold()

  const [expenses, setExpenses] = useState<listOfExpenses>([])

  const [accounts, setAccounts] = useState<listOfAccounts>([])

  const [accountsLoading, setAccountsLoading] = useState(true)

  const [expensesLoading, setExpensesLoading] = useState(true)

  const axiosPrivate = useAxiosPrivate()

  const location = useLocation()

  const navigate = useNavigate()



  useEffect(() => {

    if (!auth?.id) return



    let isMounted = true

    const controller = new AbortController()



    const loadAccounts = async () => {

      setAccountsLoading(true)

      try {

        const accountsRes = await axiosPrivate.get(`/${auth.id}/accounts`, {

          signal: controller.signal,

        })

        if (!isMounted) return

        setAccounts(accountsRes.data ?? [])

      } catch (err: unknown) {

        if (isAborted(err)) return

        console.error(err)

        if (isAuthError(err)) {

          navigate("/login", { state: { from: location }, replace: true })

        }

      } finally {

        if (isMounted) setAccountsLoading(false)

      }

    }



    const loadExpenses = async () => {

      setExpensesLoading(true)

      try {

        const expensesRes = await axiosPrivate.get(`/${auth.id}/expenses`, {

          signal: controller.signal,

        })

        if (!isMounted) return

        setExpenses(expensesRes.data ?? [])

      } catch (err: unknown) {

        if (isAborted(err)) return

        console.error(err)

        if (isAuthError(err)) {

          navigate("/login", { state: { from: location }, replace: true })

        }

      } finally {

        if (isMounted) setExpensesLoading(false)

      }

    }



    void Promise.all([loadAccounts(), loadExpenses()])



    return () => {

      isMounted = false

      controller.abort()

    }

  }, [auth?.id, axiosPrivate, location.pathname, location, navigate])

  const reloadExpenses = useCallback(async () => {
    if (!auth?.id) return
    try {
      const expensesRes = await axiosPrivate.get(`/${auth.id}/expenses`)
      setExpenses(expensesRes.data ?? [])
    } catch (err) {
      console.error(err)
    }
  }, [auth?.id, axiosPrivate])



  const pendingCount = expenses.filter((e) => !e.is_paid).length

  const paidCount = expenses.filter((e) => e.is_paid).length



  const sortAndFilterExpenses = [...expenses].sort((a, b) => {

    if (a.is_paid && !b.is_paid) return 1

    if (!a.is_paid && b.is_paid) return -1

    const dateA = a.payment_date ? new Date(a.payment_date) : new Date(0)

    const dateB = b.payment_date ? new Date(b.payment_date) : new Date(0)

    return dateB.getTime() - dateA.getTime()

  })



  const stats = [

    {

      label: "Balance total",

      value: `$${formatMoney(balanceTotal(accounts))}`,

      icon: Wallet,

      loading: accountsLoading,

    },

    {

      label: "Gastos pendientes",

      value: pendingCount,

      icon: Clock,

      highlight: pendingCount > 0,

      loading: expensesLoading,

    },

    {

      label: "Gastos pagados",

      value: paidCount,

      icon: CheckCircle2,

      loading: expensesLoading,

    },

  ]



  return (

    <div className="space-y-5 sm:space-y-10">

      <PageHeader

        title={`Hola, ${auth?.user}`}

        description={isLinked ? "Resumen de las finanzas de tu hogar" : "Resumen de tus finanzas personales"}

        action={

          <Button asChild className="w-full rounded-xl shadow-soft sm:w-auto">

            <Link to={`/${auth?.id}/expenses`}>

              Ver gastos <ArrowRight className="ml-1 h-4 w-4" />

            </Link>

          </Button>

        }

      />



      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">

        {stats.map((stat, index) => (

          <StatCard
            key={stat.label}
            {...stat}
            className={cn(
              "min-w-0",
              index === 2 && "col-span-2 lg:col-span-1"
            )}
          />

        ))}

      </div>



      {isLinked && household && (
        <Card className="border-border/40 shadow-soft">
          <CardHeader className="flex flex-col items-stretch gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex min-w-0 items-center gap-2">
              <House className="h-5 w-5 shrink-0 text-muted-foreground" />
              <CardTitle className="font-display text-lg truncate">{household.name}</CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="min-h-10 w-full shrink-0 rounded-xl sm:w-auto" asChild>
              <Link to={`/${auth?.id}/hogar`}>
                Gestionar <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <p className="text-sm text-muted-foreground">
              Compartís finanzas con{" "}
              {members
                .filter((member) => member.id !== auth?.id)
                .map((member) => `@${member.username}`)
                .join(", ")}
              .
            </p>
          </CardContent>
        </Card>
      )}



      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">

        <Card className="order-2 border-border/40 shadow-soft min-w-0 lg:order-1">

          <CardHeader className="flex flex-row items-center justify-between gap-3 p-4 sm:p-6">

            <CardTitle className="font-display text-lg truncate min-w-0">Cuentas</CardTitle>

            <Button variant="ghost" size="sm" className="min-h-10 shrink-0 rounded-xl px-2 sm:px-3" asChild>

              <Link to={`/${auth?.id}/profile`}>Gestionar</Link>

            </Button>

          </CardHeader>

          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">

            {accountsLoading ? (

              <SectionLoader />

            ) : (

              <AccordionAccounts accounts={accounts} />

            )}

          </CardContent>

        </Card>



        <Card className="order-1 border-border/40 shadow-soft min-w-0 lg:order-2">

          <CardHeader className="flex flex-row items-center justify-between gap-3 p-4 sm:p-6">

            <CardTitle className="font-display text-lg truncate min-w-0">Gastos recientes</CardTitle>

            <Button variant="ghost" size="sm" className="min-h-10 shrink-0 rounded-xl px-2 sm:px-3" asChild>

              <Link to={`/${auth?.id}/expenses`}>Ver todos</Link>

            </Button>

          </CardHeader>

          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">

            {expensesLoading ? (

              <SectionLoader minHeight="min-h-[200px]" />

            ) : sortAndFilterExpenses.length === 0 ? (

              <p className="text-sm text-muted-foreground">No hay gastos registrados.</p>

            ) : (

              <>

                <div className="md:hidden divide-y divide-border/40">

                  {sortAndFilterExpenses.slice(0, 5).map((expense) => (

                    <RecentExpenseCard
                      key={expense.id}
                      expense={expense}
                      showOwner={isLinked}
                      onDeleted={reloadExpenses}
                    />

                  ))}

                </div>

                <div className="hidden md:block">

                  <Table>

                    <TableHeader>

                      <TableRow>

                        <TableHead>Fecha</TableHead>

                        <TableHead>Título</TableHead>

                        {isLinked && <TableHead>Persona</TableHead>}

                        <TableHead className="text-right">Monto</TableHead>

                      </TableRow>

                    </TableHeader>

                    <TableBody>

                      {sortAndFilterExpenses.slice(0, 5).map((expense) => (

                        <RecentExpenses key={expense.id} expense={expense} showOwner={isLinked} />

                      ))}

                    </TableBody>

                  </Table>

                </div>

              </>

            )}

          </CardContent>

        </Card>

      </div>

    </div>

  )

}


