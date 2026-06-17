import { listOfAccounts, listOfExpenses } from "../../types"
import { useEffect, useState } from "react"
import { useAxiosPrivate } from "../../hooks/useAxiosPrivate"
import { Link, useLocation, useNavigate } from "react-router-dom"
import useAuth from "../../hooks/useAuth"
import { balanceTotal } from "../../consts"
import { AccordionAccounts } from "../Profile/accordionAccounts"
import { RecentExpenses } from "./RecentExpenses"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export const HomeLogged = () => {
  const { auth } = useAuth()
  const [expenses, setExpenses] = useState<listOfExpenses>([])
  const [accounts, setAccounts] = useState<listOfAccounts>([])
  const axiosPrivate = useAxiosPrivate()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()
    const getAccounts = async () => {
      try {
        const response = await axiosPrivate.get(`/${auth.id}/accounts`, {
          signal: controller.signal,
        })
        isMounted && setAccounts(response.data)
      } catch (err: unknown) {
        if ((err as { code?: string }).code === "ERR_CANCELED") {
          // aborted
        }
      }
    }
    getAccounts()
    return () => {
      isMounted = false
      controller.abort()
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    const getExpenses = async () => {
      try {
        const response = await axiosPrivate.get(`/${auth.id}/expenses`, {
          signal: controller.signal,
        })
        isMounted && setExpenses(response.data)
      } catch (err: unknown) {
        if ((err as { code?: string }).code === "ERR_CANCELED") {
          // aborted
        } else {
          navigate("/login", { state: { from: location }, replace: true })
        }
      }
    }
    getExpenses()
    return () => {
      isMounted = false
      controller.abort()
    }
  }, [])

  const sortAndFilterExpenses = expenses.sort((a, b) => {
    if (a.is_paid && !b.is_paid) {
      return 1
    } else if (!a.is_paid && b.is_paid) {
      return -1
    }
    const dateA = a.payment_date ? new Date(a.payment_date) : new Date(0)
    const dateB = b.payment_date ? new Date(b.payment_date) : new Date(0)

    return dateB.getTime() - dateA.getTime()
  })

  return (
    <div className="space-y-6">
      <Accordion type="single" collapsible defaultValue="balance" className="rounded-xl border bg-card shadow">
        <AccordionItem value="balance" className="border-none">
          <div className="px-6 pt-6">
            <h1 className="text-2xl font-bold tracking-tight">
              Bienvenido, {auth.user}
            </h1>
            <p className="mt-1 text-muted-foreground">Balance Total</p>
          </div>
          <AccordionTrigger className="px-6 text-3xl font-bold text-primary hover:no-underline">
            ${balanceTotal(accounts)}
          </AccordionTrigger>
          <AccordionContent className="space-y-2 px-6 pb-6">
            {accounts.map((account) => (
              <AccordionAccounts key={account.id} account={account} />
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Últimos recientes</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/${auth.id}/expenses`}>
              Ver gastos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Gasto</TableHead>
                <TableHead>Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortAndFilterExpenses.slice(0, 5).map((expense) => (
                <RecentExpenses key={expense.id} expense={expense} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
