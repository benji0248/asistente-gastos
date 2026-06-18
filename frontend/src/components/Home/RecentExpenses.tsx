import { Expense } from "../../types"
import { formattedDate } from "../../consts"
import { DeleteModalExpense } from "../Expenses/DeleteModalExpense"
import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import useHousehold from "@/hooks/useHousehold"

interface Props {
  expense: Expense
  showOwner?: boolean
}

export const RecentExpenseCard = ({ expense, showOwner = false }: Props) => {
  const { getOwnerName } = useHousehold()
  const dateLabel = formattedDate(expense.payment_date)
    ? formattedDate(expense.payment_date)
    : "Sin pagar"

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-muted/30 px-4 py-3.5 min-w-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{dateLabel}</p>
        <div className="flex items-center gap-2 min-w-0 mt-0.5">
          <span className="font-medium capitalize truncate">{expense.title}</span>
          <DeleteModalExpense id={expense.id} title={expense.title} />
        </div>
        {showOwner && (
          <Badge variant="secondary" className="mt-2">
            @{getOwnerName(expense.user_id)}
          </Badge>
        )}
      </div>
      <span className="shrink-0 font-semibold">${expense.amount}</span>
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
      <TableCell className="font-medium">${expense.amount}</TableCell>
    </TableRow>
  )
}
