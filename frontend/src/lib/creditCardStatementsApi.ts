import type { CreditCardStatement } from "@/lib/bbvaStatementParser"
import { currentStatementMonth } from "@/lib/db/dateRange"
import {
  deleteStatement,
  insertStatement,
  listStatements,
  registerStatementPayment,
  type StatementRow,
} from "@/lib/db/statements"
import { createPendingBillExpense, deleteLinkedBillExpenseIfUnpaid } from "@/lib/statementBillExpense"
import { supabase } from "@/lib/supabase"



export interface StatementBillExpense {

  id: number

  amount: number

  amount_paid: number

  is_paid: boolean

  title: string

}



export interface StoredCreditCardStatement {

  id: string

  userId: string

  statement: CreditCardStatement

  fileName?: string

  statementMonth: string

  importedAt: string

  updatedAt: string

  expenseId?: number

  billExpense?: StatementBillExpense | null

}



async function attachBillExpense(row: StatementRow): Promise<StatementBillExpense | null> {

  if (!row.expense_id) return null

  const { data } = await supabase

    .from("expenses")

    .select("id, amount, amount_paid, is_paid, title")

    .eq("id", row.expense_id)

    .maybeSingle()

  if (!data) return null

  return {

    id: Number(data.id),

    amount: Number(data.amount),

    amount_paid: Number(data.amount_paid ?? 0),

    is_paid: Boolean(data.is_paid),

    title: data.title ?? "",

  }

}



async function rowToStored(row: StatementRow): Promise<StoredCreditCardStatement> {

  const statement = row.statement_data as CreditCardStatement

  return {

    id: row.id,

    userId: row.user_id,

    statement: {

      ...statement,

      fileName: row.file_name ?? statement.fileName,

      upcomingByMonth: statement.upcomingByMonth ?? [],

    },

    fileName: row.file_name ?? undefined,

    statementMonth: row.statement_month,

    importedAt: row.imported_at,

    updatedAt: row.updated_at,

    expenseId: row.expense_id ?? undefined,

    billExpense: await attachBillExpense(row),

  }

}



export function remainingBillAmount(bill?: StatementBillExpense | null): number {

  if (!bill) return 0

  return Math.max(0, bill.amount - bill.amount_paid)

}



function sortStatements(

  rows: StoredCreditCardStatement[],

  authId?: string

): StoredCreditCardStatement[] {

  return [...rows].sort((a, b) => {

    const aOwn = a.userId === authId ? 0 : 1

    const bOwn = b.userId === authId ? 0 : 1

    if (aOwn !== bOwn) return aOwn - bOwn

    return new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime()

  })

}



export async function fetchHouseholdStatements(

  year: number,

  month: number,

  authId?: string

): Promise<StoredCreditCardStatement[]> {

  const rows = await listStatements({ year, month })

  const stored = await Promise.all(rows.map(rowToStored))

  return sortStatements(stored, authId)

}



export async function saveStatementToDb(
  userId: string,
  statement: CreditCardStatement,
  statementMonth?: string
): Promise<StoredCreditCardStatement> {
  const expenseId = await createPendingBillExpense(userId, statement)
  try {
    const row = await insertStatement({
      user_id: userId,
      statement_data: statement,
      file_name: statement.fileName ?? null,
      statement_month: statementMonth ?? currentStatementMonth(),
      expense_id: expenseId,
    })
    return rowToStored(row)
  } catch (err) {
    await deleteLinkedBillExpenseIfUnpaid(expenseId).catch(() => undefined)
    throw err
  }
}



export async function registerStatementPaymentApi(

  statementId: string,

  amount: number,

  accountId: string

) {

  await registerStatementPayment(statementId, {

    account_id: Number(accountId),

    amount,

  })

}



export async function deleteStatementFromDb(statementId: string): Promise<void> {

  await deleteStatement(statementId)

}



const LEGACY_KEY = "credit-card-statement"



export function loadLegacyStatement(userId: string): CreditCardStatement | null {

  const raw = localStorage.getItem(`${LEGACY_KEY}:${userId}`)

  if (!raw) return null

  try {

    const parsed = JSON.parse(raw) as CreditCardStatement

    return { ...parsed, upcomingByMonth: parsed.upcomingByMonth ?? [] }

  } catch {

    return null

  }

}



export function clearLegacyStatement(userId: string): void {

  localStorage.removeItem(`${LEGACY_KEY}:${userId}`)

}

