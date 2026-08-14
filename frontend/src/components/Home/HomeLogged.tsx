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
import { getHomeOverview } from "@/lib/db/expenses"
import { usePrivacyAmounts } from "@/context/PrivacyAmountsProvider"

export const HomeLogged = () => {
  const { auth } = useAuth()
  const { isLinked, household, members } = useHousehold()
  const { accounts, loading: accountsLoading, refreshAccounts } = useAppData()
  const { amountsVisible } = usePrivacyAmounts()

  const [recentExpenses, setRecentExpenses] = useState<listOfExpenses>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [paidCount, setPaidCount] = useState(0)
  const [expensesLoading, setExpensesLoading] = useState(true)

  const loadOverview = useCallback(async () => {
    if (!auth?.id) return
    setExpensesLoading(true)
    try {
      const overview = await getHomeOverview()
      setPendingCount(overview.pendingCount)
      setPaidCount(overview.paidCount)
      setRecentExpenses(overview.recent)
    } catch (err) {
      console.error(err)
    } finally {
      setExpensesLoading(false)
    }
  }, [auth?.id])

  useEffect(() => {
    void loadOverview()
  }, [loadOverview])

  const reloadExpenses = useCallback(async () => {
    await loadOverview()
  }, [loadOverview])

  const sortAndFilterExpenses = recentExpenses

  return (
    <div className="space-y-5 sm:space-y-10">
      <PageHeader
        title={`Hola, ${auth?.user ?? "usuario"}`}
        description="Resumen de tu situación financiera"
      />

      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard
          label="Balance total"
          value={formatPrivateMoney(balanceTotal(accounts), amountsVisible)}
          icon={Wallet}
          loading={accountsLoading}
          valueAction={<PrivacyToggle size="inline" />}
        />
        <StatCard
          label="Gastos pendientes"
          value={pendingCount}
          icon={Clock}
          highlight={pendingCount > 0}
          loading={expensesLoading}
        />
        <StatCard
          label="Gastos pagados"
          value={paidCount}
          icon={CheckCircle2}
          loading={expensesLoading}
        />
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
