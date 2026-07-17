import type { Expense } from "@/types"

export type ExpenseUpdateInput = Partial<
  Pick<
    Expense,
    | "title"
    | "amount"
    | "is_paid"
    | "category_id"
    | "account_id"
    | "payment_date"
    | "household_recurring_expense_id"
  >
>

export type ExpenseRowPatch = {
  title: string
  amount: number
  is_paid: boolean
  amount_paid: number
  payment_date: string | null
  category_id: string | null
  account_id: string | null
}

/**
 * Builds the DB patch for an expense edit, keeping amount_paid / payment_date
 * consistent with is_paid and amount. Stats recompute from these fields — if
 * amount_paid is left stale after an edit, category and paid totals diverge.
 */
type ExpenseUpdateCurrent = {
  title: string
  amount: number
  is_paid: boolean
  amount_paid?: number | null
  payment_date?: string | null
  category_id?: string | number | null
  account_id?: string | number | null
}

export function buildExpenseUpdatePatch(
  current: ExpenseUpdateCurrent,
  updates: ExpenseUpdateInput
): ExpenseRowPatch {
  const nextAmount =
    updates.amount !== undefined ? Number(updates.amount) : Number(current.amount)
  const nextIsPaid =
    updates.is_paid !== undefined ? Boolean(updates.is_paid) : Boolean(current.is_paid)

  let nextAmountPaid = Number(current.amount_paid ?? 0)
  let nextPaymentDate: string | null =
    current.payment_date != null ? String(current.payment_date) : null

  if (nextIsPaid) {
    nextAmountPaid = nextAmount
    if (!current.is_paid) {
      // Newly marked as paid: use provided date or now.
      nextPaymentDate = updates.payment_date ?? new Date().toISOString()
    } else if (!nextPaymentDate) {
      nextPaymentDate = updates.payment_date ?? new Date().toISOString()
    }
    // If already paid, keep the existing payment_date (edit form always sends "now").
  } else if (current.is_paid && updates.is_paid === false) {
    // Explicitly unmarked as paid in the edit form.
    nextAmountPaid = 0
    nextPaymentDate = null
  } else if (updates.amount !== undefined && nextAmountPaid > nextAmount) {
    // Amount lowered below what was already paid on a still-unpaid expense.
    nextAmountPaid = Math.max(0, nextAmount)
  }

  const nextCategoryId =
    updates.category_id !== undefined
      ? updates.category_id
        ? String(updates.category_id)
        : null
      : current.category_id
        ? String(current.category_id)
        : null

  const nextAccountId =
    updates.account_id !== undefined
      ? updates.account_id
        ? String(updates.account_id)
        : null
      : current.account_id
        ? String(current.account_id)
        : null

  return {
    title: updates.title !== undefined ? updates.title : current.title,
    amount: nextAmount,
    is_paid: nextIsPaid,
    amount_paid: nextAmountPaid,
    payment_date: nextPaymentDate,
    category_id: nextCategoryId,
    account_id: nextAccountId,
  }
}

/** Paid contribution used by stats (full amount if paid, partial otherwise). */
export function paidContribution(expense: Pick<Expense, "amount" | "amount_paid" | "is_paid">): number {
  if (expense.is_paid) return Number(expense.amount)
  return Number(expense.amount_paid ?? 0)
}
