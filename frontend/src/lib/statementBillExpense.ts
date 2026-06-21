import type { CreditCardStatement } from "@/lib/bbvaStatementParser"
import { supabase, throwIfError } from "@/lib/db/client"

export function statementBillTitle(statement: CreditCardStatement): string {
  const card = [statement.cardBrand, statement.cardTier].filter(Boolean).join(" ")
  const base = card ? `Tarjeta ${card}` : "Tarjeta de crédito"
  return `${base} · vence ${statement.dueDate}`
}

async function findCreditCardCategoryId(): Promise<number | null> {
  const { data, error } = await supabase.from("categories").select("id, name")
  throwIfError(error)
  const match = (data ?? []).find((c) =>
    String(c.name).toLowerCase().includes("tarjeta")
  )
  return match ? Number(match.id) : null
}

export async function createPendingBillExpense(
  userId: string,
  statement: CreditCardStatement
): Promise<number> {
  const categoryId = await findCreditCardCategoryId()
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      title: statementBillTitle(statement),
      amount: statement.totalBalanceArs,
      amount_paid: 0,
      is_paid: false,
      user_id: userId,
      category_id: categoryId,
      account_id: null,
    })
    .select("id")
    .single()
  throwIfError(error)
  if (!data?.id) throw new Error("No se pudo crear el gasto del resumen")
  return Number(data.id)
}

export async function deleteLinkedBillExpenseIfUnpaid(
  expenseId: number
): Promise<void> {
  const { data: expense } = await supabase
    .from("expenses")
    .select("is_paid")
    .eq("id", expenseId)
    .maybeSingle()

  if (expense && !expense.is_paid) {
    const { error } = await supabase.from("expenses").delete().eq("id", expenseId)
    throwIfError(error)
  }
}
