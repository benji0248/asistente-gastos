import { Expense, listOfAccounts, listOfCategories } from "../../types"
import { EditExpense } from "./EditExpense"
import { DeleteModalExpense } from "./DeleteModalExpense"
import { formattedDate } from "../../consts"
import useAuth from "../../hooks/useAuth"
import useHousehold from "@/hooks/useHousehold"
import { useAxiosPrivate } from "../../hooks/useAxiosPrivate"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Props {
  expenses: Expense[]
  categoryMap: Map<string, string>
  accountMap: Map<string, string>
  categories: listOfCategories
  accounts: listOfAccounts
  showOwner?: boolean
  onExpenseMutated?: () => void
}

interface ExpenseCardProps {
  expense: Expense
  categoryName: string
  accountName: string
  categories: listOfCategories
  accounts: listOfAccounts
  showOwner?: boolean
  onExpenseMutated?: () => void
}

function ExpenseCard({
  expense,
  categoryName,
  accountName,
  categories,
  accounts,
  showOwner = false,
  onExpenseMutated,
}: ExpenseCardProps) {
  const { auth } = useAuth()
  const { getOwnerName } = useHousehold()
  const axiosPrivate = useAxiosPrivate()

  const handleComplete = async () => {
    try {
      await axiosPrivate.put(`/${auth.id}/expenses/${expense.id}/complete`)
      onExpenseMutated?.()
    } catch (err) {
      console.log("Error en el fetching handleComplete", err)
    }
  }

  return (
    <div className="rounded-2xl border border-border/40 bg-card p-4 shadow-soft space-y-3">
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="min-w-0 flex-1">
          <p className="font-medium capitalize truncate">{expense.title}</p>
          <p className="text-2xl font-semibold mt-0.5">${expense.amount}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <DeleteModalExpense
            id={expense.id}
            title={expense.title}
            onExpenseMutated={onExpenseMutated}
          />
          <EditExpense
            expense={expense}
            categories={categories}
            accounts={accounts}
            onExpenseMutated={onExpenseMutated}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Badge variant="secondary" className="capitalize rounded-lg">
          {categoryName}
        </Badge>
        <Badge variant="outline" className="capitalize rounded-lg">
          {accountName}
        </Badge>
        {showOwner && (
          <Badge variant="secondary" className="rounded-lg">
            @{getOwnerName(expense.user_id)}
          </Badge>
        )}
      </div>

      <Button
        size="default"
        variant={expense.is_paid ? "secondary" : "default"}
        disabled={expense.is_paid}
        onClick={() => handleComplete()}
        className="w-full min-h-11 rounded-xl"
      >
        {expense.is_paid ? (
          <>Pagado {formattedDate(expense.payment_date)}</>
        ) : (
          <>
            <Check className="h-4 w-4" />
            Pagar
          </>
        )}
      </Button>
    </div>
  )
}

export function ExpenseCardList({
  expenses,
  categoryMap,
  accountMap,
  categories,
  accounts,
  showOwner = false,
  onExpenseMutated,
}: Props) {
  return (
    <div className="space-y-3">
      {expenses.map((expense) => (
        <ExpenseCard
          key={expense.id}
          expense={expense}
          categoryName={categoryMap.get(expense.category_id) || "Sin Categoría"}
          accountName={accountMap.get(expense.account_id) || "Sin tipo"}
          categories={categories}
          accounts={accounts}
          showOwner={showOwner}
          onExpenseMutated={onExpenseMutated}
        />
      ))}
    </div>
  )
}
