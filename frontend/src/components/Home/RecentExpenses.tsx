import { Expense } from "../../types"
import { formattedDate } from "../../consts"
import { DeleteModalExpense } from "../Expenses/DeleteModalExpense"
import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import useHousehold from "@/hooks/useHousehold"
import { formatMoney } from "@/lib/formatMoney"
import { CheckCircle2, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  expense: Expense
  showOwner?: boolean
  onDeleted?: () => void
}

export const RecentExpenseCard = ({ expense, showOwner = false, onDeleted }: Props) => {
  const { getOwnerName } = useHousehold()
  const isPaid = expense.is_paid
  const dateLabel = formattedDate(expense.payment_date)
    ? formattedDate(expense.payment_date)
    : "Sin pagar"

  return (
    <div className="flex items-start gap-3 py-3 min-w-0">
      <div
        className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          isPaid ? "bg-muted text-muted-foreground" : "bg-destructive/10 text-destructive"
        )}
      >
        {isPaid ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 flex-1 font-medium capitalize leading-snug line-clamp-2">
            {expense.title}
          </p>
          <p className="shrink-0 text-right text-sm font-semibold tabular-nums leading-snug">
            ${formatMoney(expense.amount)}
          </p>
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-xs">
            <span
              className={cn(
                "font-medium",
                isPaid ? "text-muted-foreground" : "text-destructive"
              )}
            >
              {dateLabel}
            </span>
            {showOwner && (
              <span className="text-muted-foreground">
                {" "}
                · @{getOwnerName(expense.user_id)}
              </span>
            )}
          </p>
          <DeleteModalExpense
            id={expense.id}
            title={expense.title}
            onExpenseMutated={onDeleted}
            className="h-8 w-8 -mr-1.5"
          />
        </div>
      </div>
    </div>
  )
}

export const RecentExpenses = ({ expense, showOwner = false }: Props) => {
  const { getOwnerName } = useHousehold()
  return (
    <TableRow key={expense.id}>
      <TableCell className="text-muted-foreground">
        {formattedDate(expense.payment_date)
          ? formattedDate(expense.payment_date)
          : "Sin pagar"}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 min-w-0">
          <span className="capitalize truncate">{expense.title}</span>
          <DeleteModalExpense id={expense.id} title={expense.title} />
        </div>
      </TableCell>
      {showOwner && (
        <TableCell>
          <Badge variant="secondary">@{getOwnerName(expense.user_id)}</Badge>
        </TableCell>
      )}
      <TableCell className="font-medium">${formatMoney(expense.amount)}</TableCell>
    </TableRow>
  )
}
