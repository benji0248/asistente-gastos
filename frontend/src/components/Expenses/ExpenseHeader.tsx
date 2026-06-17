import { Category, listOfExpenses } from "../../types"
import { FilterExpenses } from "./FilterExpenses"
import { sumatoria, sumatoriaPendientes } from "../../consts"
import { CreateExpense } from "./CreateExpense"
import CreateCategory from "./CreateCategory"
import { useEffect, useState } from "react"
import dayjs from "dayjs"
import { useAxiosPrivate } from "../../hooks/useAxiosPrivate"
import useAuth from "../../hooks/useAuth"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Props {
  completedCount: number
  filterSelected: string | undefined
  onClearCompleted: () => void
  handleFilterChange: (category_id: string | undefined) => void
  handlePaymentFilter: (key: "all" | "paid" | "unpaid") => void
  onMonthSelect: (month: string, year: string) => void
  expenses: listOfExpenses
  categories: Category[]
}

export const ExpenseHeader = ({
  completedCount = 0,
  filterSelected,
  handleFilterChange,
  handlePaymentFilter,
  expenses,
  categories,
  onMonthSelect,
}: Props) => {
  const [availableMonths, setAvailableMonths] = useState<
    { month: string; year: string }[]
  >([])
  const [selectedMonthKey, setSelectedMonthKey] = useState("")
  const axiosPrivate = useAxiosPrivate()
  const { auth } = useAuth()

  useEffect(() => {
    const fetchAvailableMonths = async () => {
      try {
        const response = await axiosPrivate.get(
          `/${auth.id}/expenses/available-months`
        )
        setAvailableMonths(response.data)

        const currentMonth = dayjs().format("MM")
        const currentYear = dayjs().format("YYYY")

        const currentMonthExists = response.data.find(
          (item: { month: string; year: string }) =>
            item.month === currentMonth && item.year === currentYear
        )

        if (currentMonthExists) {
          onMonthSelect(currentMonth, currentYear)
          setSelectedMonthKey(`${currentMonth}/${currentYear}`)
        } else if (response.data.length > 0) {
          onMonthSelect(response.data[0].month, response.data[0].year)
          setSelectedMonthKey(
            `${response.data[0].month}/${response.data[0].year}`
          )
        }
      } catch (error) {
        console.error("Error al obtener los meses disponibles", error)
      }
    }

    fetchAvailableMonths()
  }, [])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Gastos del mes</h2>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          defaultValue="all"
          onValueChange={(key) =>
            handlePaymentFilter(key as "all" | "paid" | "unpaid")
          }
        >
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="unpaid" className="gap-2">
              Gastos pendientes
              <Badge variant="destructive">{completedCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="paid">Gastos pagados</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap gap-2">
          {availableMonths.map(({ month, year }) => {
            const key = `${month}/${year}`
            return (
              <Button
                key={key}
                variant={selectedMonthKey === key ? "default" : "outline"}
                size="sm"
                className={cn(
                  selectedMonthKey === key && "shadow-sm"
                )}
                onClick={() => {
                  setSelectedMonthKey(key)
                  onMonthSelect(month, year)
                }}
              >
                {key}
              </Button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm">
        <p>
          Total de gastos sin pagar:{" "}
          <span className="font-semibold text-destructive">
            ${sumatoriaPendientes(expenses)}
          </span>
        </p>
        <p>
          Total de gastos del mes:{" "}
          <span className="font-semibold text-primary">
            ${sumatoria(expenses)}
          </span>
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <CreateExpense />
        <CreateCategory />
      </div>

      <FilterExpenses
        filterSelected={filterSelected}
        onFilterChange={handleFilterChange}
        categories={categories}
      />
    </div>
  )
}
