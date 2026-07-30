import { listOfExpenses } from "../../types"
import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import useAuth from "../../hooks/useAuth"
import useHousehold from "@/hooks/useHousehold"
import { useAppData } from "@/context/AppDataProvider"
import { balanceTotal } from "../../consts"
import { AccordionAccounts } from "../Profile/accordionAccounts"
import { RecentExpenseCard, RecentExpenses } from "./RecentExpenses"
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
import { PrivacyToggle } from "../layout/PrivacyToggle"
import { StatCard } from "../layout/StatCard"
import { SectionLoader } from "../layout/SectionLoader"
import { formatPrivateMoney } from "@/lib/formatMoney"
import { listAll } from "@/lib/db/expenses"
import { usePrivacyAmounts } from "@/context/PrivacyAmountsProvider"

export const HomeLogged = () => {
  const { auth } = useAuth()
  const { isLinked, household, members } = useHousehold()
  const { accounts, loading: accountsLoading, refreshAccounts } = useAppData()
  const { amountsVisible } = usePrivacyAmounts()

  const [expenses, setExpenses] = useState<listOfExpenses>([])
  const [expensesLoading, setExpensesLoading] = useState(true)

  useEffect(() => {
    if (!auth?.id) return
    let cancelled = false

    const loadExpenses = async () => {
      setExpensesLoading(true)
      try {
        const data = await listAll()
        if (!cancelled) setExpenses(data)
      } catch (err) {
        console.error(err)
      } finally {
        if (!cancelled) setExpensesLoading(false)
      }
    }

    void loadExpenses()
    return () => {
      cancelled = true
    }
  }, [auth?.id])

  useEffect(() => {
    if (!auth?.id) return
    void refreshAccounts()
  }, [auth?.id, refreshAccounts])

  const reloadExpenses = useCallback(async () => {
    if (!auth?.id) return
    try {
      setExpenses(await listAll())
    } catch (err) {
      console.error(err)
    }
  }, [auth?.id])

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
      value: formatPrivateMoney(balanceTotal(accounts), amountsVisible),
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
        title={`Hola, ${auth?.user ?? "usuario"}`}
        description="Resumen de tu situación financiera"
        action={<PrivacyToggle />}
        actionClassName="w-auto self-end"
      />

      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {isLinked && household && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <House className="h-4 w-4" />
              Hogar compartido
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/${auth?.id}/hogar`}>
                Ver hogar
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {household.name} · {members.length} miembros
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base">Gastos recientes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/${auth?.id}/expenses`}>
                Ver todos
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {expensesLoading ? (
              <SectionLoader minHeight="min-h-[200px]" />
            ) : sortAndFilterExpenses.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No hay gastos registrados
              </p>
            ) : (
              <div className="divide-y divide-border/60">
                {sortAndFilterExpenses.slice(0, 5).map((expense) => (
                  <RecentExpenseCard
                    key={expense.id}
                    expense={expense}
                    showOwner={isLinked}
                    onDeleted={reloadExpenses}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Cuentas</CardTitle>
          </CardHeader>
          <CardContent>
            {accountsLoading ? (
              <SectionLoader minHeight="min-h-[200px]" />
            ) : (
              <AccordionAccounts
                accounts={accounts}
                onAccountsChange={refreshAccounts}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {!expensesLoading && sortAndFilterExpenses.length > 0 && (
        <Card className="overflow-hidden lg:hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Lista rápida</CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden p-0">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[55%] pl-4 pr-2">Gasto</TableHead>
                  <TableHead className="w-[45%] pl-2 pr-3 text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortAndFilterExpenses.slice(0, 5).map((expense) => (
                  <RecentExpenses
                    key={expense.id}
                    expense={expense}
                    showOwner={isLinked}
                    onDeleted={reloadExpenses}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
