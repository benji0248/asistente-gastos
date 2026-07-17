import { Expense, listOfAccounts, listOfCategories } from "../../types"
import { EditExpense } from "./EditExpense"
import { DeleteModalExpense } from "./DeleteModalExpense"
import { PayExpenseDialog } from "./PayExpenseDialog"
import { formattedDate } from "../../consts"
import useHousehold from "@/hooks/useHousehold"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/formatMoney"
import { useState } from "react"

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
  const { getOwnerName } = useHousehold()
  const [payDialogOpen, setPayDialogOpen] = useState(false)

  const paidAmount = expense.is_paid
    ? Number(expense.amount)
    : Number(expense.amount_paid ?? 0)
  const remaining = expense.is_paid
    ? 0
    : Math.max(0, Number(expense.amount) - Number(expense.amount_paid ?? 0))
  const hasPartial = !expense.is_paid && paidAmount > 0
  const expenseOwnerLabel = `@${getOwnerName(expense.user_id)}`
  const accountAlreadyShowsOwner = accountName
    .toLowerCase()
    .startsWith(expenseOwnerLabel.toLowerCase())
  const ownerMeta =
    showOwner && !accountAlreadyShowsOwner ? ` · ${expenseOwnerLabel}` : ""

  return (
    <div className="rounded-2xl border border-border/40 bg-card p-3.5 shadow-soft space-y-3">
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium capitalize truncate">{expense.title}</p>
            {expense.household_recurring_expense_id && (
              <Badge variant="outline" className="rounded-lg shrink-0">
                Hogar
              </Badge>
            )}
          </div>
          <p className="font-display text-xl font-semibold tabular-nums sm:text-2xl">
            ${formatMoney(expense.amount)}
          </p>
          {hasPartial && (
            <p className="text-xs text-muted-foreground mt-1">
              Pagado ${formatMoney(paidAmount)} · Falta ${formatMoney(remaining)}
            </p>
          )}
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

      <div className="space-y-1">
        <Badge variant="secondary" className="capitalize rounded-lg mb-1">
          {categoryName}
        </Badge>
        <p className="truncate text-xs font-medium text-muted-foreground">
          {accountName}
          {ownerMeta}
        </p>
      </div>

      <Button
        size="default"
        variant={expense.is_paid ? "secondary" : "default"}
        disabled={expense.is_paid}
        onClick={() => setPayDialogOpen(true)}
        className="w-full min-h-10 rounded-xl sm:min-h-11"
      >
        {expense.is_paid ? (
          <>Pagado {formattedDate(expense.payment_date)}</>
        ) : hasPartial ? (
          <>Pagar restante (${formatMoney(remaining)})</>
        ) : (
          <>
            <Check className="h-4 w-4" />
            Pagar
          </>
        )}
      </Button>

      <PayExpenseDialog
        open={payDialogOpen}
        expense={expense}
        accounts={accounts}
        onClose={() => setPayDialogOpen(false)}
        onPaid={() => onExpenseMutated?.()}
      />
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
          categoryName={
            categoryMap.get(String(expense.category_id)) || "Sin Categoría"
          }
          accountName={accountMap.get(String(expense.account_id)) || "Sin tipo"}
          categories={categories}
          accounts={accounts}
          showOwner={showOwner}
          onExpenseMutated={onExpenseMutated}
        />
      ))}
    </div>
  )
}
