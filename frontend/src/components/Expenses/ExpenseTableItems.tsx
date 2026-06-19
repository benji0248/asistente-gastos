import { Expense, listOfAccounts, listOfCategories } from "../../types"
import { EditExpense } from "./EditExpense"
import { DeleteModalExpense } from "./DeleteModalExpense"
import { PayExpenseDialog } from "./PayExpenseDialog"
import { formattedDate } from "../../consts"
import useHousehold from "@/hooks/useHousehold"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TableCell, TableRow } from "@/components/ui/table"
import { Check } from "lucide-react"
import { formatMoney } from "@/lib/formatMoney"
import { useState } from "react"

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
  const { getOwnerName } = useHousehold()
  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const categoryName = categoryMap.get(expense.category_id) || "Sin Categoría"
  const accountName = accountMap.get(expense.account_id) || "Sin tipo"

  return (
    <>
      <TableRow>
        <TableCell>
          <div className="flex items-center gap-1">
            <span className="capitalize">{expense.title}</span>
            {expense.household_recurring_expense_id && (
              <Badge variant="outline" className="rounded-lg">
                Hogar
              </Badge>
            )}
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
        <TableCell>${formatMoney(expense.amount)}</TableCell>
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
              onClick={() => setPayDialogOpen(true)}
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
      <PayExpenseDialog
        open={payDialogOpen}
        expense={expense}
        accounts={accounts}
        onClose={() => setPayDialogOpen(false)}
        onPaid={() => onExpenseMutated?.()}
      />
    </>
  )
}
