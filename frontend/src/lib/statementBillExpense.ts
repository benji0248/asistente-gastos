import type { CreditCardStatement } from '@/lib/bbvaStatementParser'
import { listCategories } from '@/lib/db/categories'
import { apiFetch } from '@/lib/api/http'
import { deleteExpense, getExpense } from '@/lib/db/expenses'
import type { Expense } from '@/types'

export function statementBillTitle(statement: CreditCardStatement): string {
  const card = [statement.cardBrand, statement.cardTier].filter(Boolean).join(' ')
  const base = card ? `Tarjeta ${card}` : 'Tarjeta de crédito'
  return `${base} · vence ${statement.dueDate}`
}

async function findCreditCardCategoryId(): Promise<number | null> {
  const categories = await listCategories()
  const match = categories.find((category) =>
    category.name.toLowerCase().includes('tarjeta')
  )
  return match?.id ? Number(match.id) : null
}

export async function createPendingBillExpense(
  userId: string,
  statement: CreditCardStatement
): Promise<number> {
  const categoryId = await findCreditCardCategoryId()
  const created = await apiFetch<Expense>('/api/v1/expenses', {
    method: 'POST',
    body: {
      title: statementBillTitle(statement),
      amount: statement.totalBalanceArs,
      is_paid: false,
      user_id: userId,
      category_id: categoryId,
      account_id: null,
    },
  })

  if (!created?.id) {
    throw new Error('No se pudo crear el gasto del resumen')
  }

  return Number(created.id)
}

export async function deleteLinkedBillExpenseIfUnpaid(
  expenseId: number
): Promise<void> {
  const expense = await getExpense(expenseId)
  if (expense && !expense.is_paid) {
    await deleteExpense(String(expenseId))
  }
}
