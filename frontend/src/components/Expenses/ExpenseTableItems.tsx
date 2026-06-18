import { Expense, listOfAccounts, listOfCategories } from "../../types"
import { EditExpense } from "./EditExpense"
import { DeleteModalExpense } from "./DeleteModalExpense"
import { formattedDate } from "../../consts"
import useAuth from "../../hooks/useAuth"
import useHousehold from "@/hooks/useHousehold"
import { useAxiosPrivate } from "../../hooks/useAxiosPrivate"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TableCell, TableRow } from "@/components/ui/table"
import { Check } from "lucide-react"

interface Props {
  expense: Expense
  categoryMap: Map<string, string>
  accountMap: Map<string, string>
  categories: listOfCategories
  accounts: listOfAccounts
  showOwner?: boolean
  onExpenseMutated?: () => void
}

export const ExpenseTableItems = ({
  expense,
  categoryMap,
  accountMap,
  categories,
  accounts,
  showOwner = false,
  onExpenseMutated,
}: Props) => {
  const { auth } = useAuth()
  const { getOwnerName } = useHousehold()
  const axiosPrivate = useAxiosPrivate()
  const categoryName = categoryMap.get(expense.category_id) || "Sin Categoría"
  const accountName = accountMap.get(expense.account_id) || "Sin tipo"

  const handleComplete = async () => {
    try {
      await axiosPrivate.put(`/${auth.id}/expenses/${expense.id}/complete`)
      onExpenseMutated?.()
    } catch (err) {
      console.log("Error en el fetching handleComplete", err)
    }
  }

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-1">
          <span className="capitalize">{expense.title}</span>
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
      </TableCell>
      <TableCell>${expense.amount}</TableCell>
      {showOwner && (
        <TableCell>
          <Badge variant="secondary">@{getOwnerName(expense.user_id)}</Badge>
        </TableCell>
      )}
      <TableCell className="capitalize">{categoryName}</TableCell>
      <TableCell>
        <div className="flex flex-wrap items-center gap-2 capitalize">
          <span>{accountName}</span>
          <Button
            size="sm"
            variant={expense.is_paid ? "secondary" : "default"}
            disabled={expense.is_paid}
            onClick={() => handleComplete()}
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
      </TableCell>
    </TableRow>
  )
}
