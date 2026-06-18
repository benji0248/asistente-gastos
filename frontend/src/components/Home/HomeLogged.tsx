import { listOfAccounts, listOfExpenses } from "../../types"

import { useEffect, useState } from "react"

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

import { ArrowRight, CheckCircle2, Clock, Wallet } from "lucide-react"

import { PageHeader } from "../layout/PageHeader"

import { StatCard } from "../layout/StatCard"

import { SectionLoader } from "../layout/SectionLoader"



export const HomeLogged = () => {

  const { auth } = useAuth()
  const { isLinked } = useHousehold()

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

      value: `$${balanceTotal(accounts)}`,

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

    <div className="space-y-10">

      <PageHeader

        title={`Hola, ${auth?.user}`}

        description={isLinked ? "Resumen de las finanzas de tu hogar" : "Resumen de tus finanzas personales"}

        className="[&_h1]:truncate"

        action={

          <Button asChild className="rounded-xl shadow-soft">

            <Link to={`/${auth?.id}/expenses`}>

              Ver gastos <ArrowRight className="ml-1 h-4 w-4" />

            </Link>

          </Button>

        }

      />



      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">

        {stats.map((stat) => (

          <StatCard key={stat.label} {...stat} />

        ))}

      </div>



      <div className="grid gap-6 lg:grid-cols-2">

        <Card className="border-border/40 shadow-soft">

          <CardHeader className="flex flex-row items-center justify-between gap-2 min-w-0">

            <CardTitle className="font-display text-lg truncate">Cuentas</CardTitle>

            <Button variant="ghost" size="sm" className="rounded-xl" asChild>

              <Link to={`/${auth?.id}/profile`}>Gestionar</Link>

            </Button>

          </CardHeader>

          <CardContent>

            {accountsLoading ? (

              <SectionLoader />

            ) : (

              <AccordionAccounts accounts={accounts} />

            )}

          </CardContent>

        </Card>



        <Card className="border-border/40 shadow-soft">

          <CardHeader className="flex flex-row items-center justify-between gap-2 min-w-0">

            <CardTitle className="font-display text-lg truncate">Gastos recientes</CardTitle>

            <Button variant="ghost" size="sm" className="rounded-xl" asChild>

              <Link to={`/${auth?.id}/expenses`}>Ver todos</Link>

            </Button>

          </CardHeader>

          <CardContent>

            {expensesLoading ? (

              <SectionLoader minHeight="min-h-[200px]" />

            ) : sortAndFilterExpenses.length === 0 ? (

              <p className="text-sm text-muted-foreground">No hay gastos registrados.</p>

            ) : (

              <>

                <div className="md:hidden space-y-2">

                  {sortAndFilterExpenses.slice(0, 5).map((expense) => (

                    <RecentExpenseCard key={expense.id} expense={expense} showOwner={isLinked} />

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


