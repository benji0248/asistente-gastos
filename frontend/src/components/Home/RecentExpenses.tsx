import { Expense } from "../../types"
import { formattedDate } from "../../consts"
import { DeleteModalExpense } from "../Expenses/DeleteModalExpense"
import { TableCell, TableRow } from "@/components/ui/table"

interface Props {
  expense: Expense
}

export const RecentExpenses = ({ expense }: Props) => {
  return (
    <TableRow key={expense.id}>
      <TableCell className="text-muted-foreground">
        {formattedDate(expense.payment_date)
          ? formattedDate(expense.payment_date)
          : "Sin pagar"}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="capitalize">{expense.title}</span>
          <DeleteModalExpense id={expense.id} title={expense.title} />
        </div>
      </TableCell>
      <TableCell className="font-medium">${expense.amount}</TableCell>
    </TableRow>
  )
}
