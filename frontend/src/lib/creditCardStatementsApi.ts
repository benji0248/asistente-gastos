import type { CreditCardStatement } from "@/lib/bbvaStatementParser"
import type { AxiosInstance } from "axios"

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
  importedAt: string
  updatedAt: string
  expenseId?: number
  billExpense?: StatementBillExpense | null
}

interface StatementRow {
  id: string
  user_id: string
  statement_data: CreditCardStatement
  file_name: string | null
  expense_id: number | null
  imported_at: string
  updated_at: string
  bill_expense?: StatementBillExpense | null
}

function rowToStored(row: StatementRow): StoredCreditCardStatement {
  const statement = row.statement_data
  return {
    id: row.id,
    userId: row.user_id,
    statement: {
      ...statement,
      fileName: row.file_name ?? statement.fileName,
      upcomingByMonth: statement.upcomingByMonth ?? [],
    },
    fileName: row.file_name ?? undefined,
    importedAt: row.imported_at,
    updatedAt: row.updated_at,
    expenseId: row.expense_id ?? undefined,
    billExpense: row.bill_expense ?? null,
  }
}

export function remainingBillAmount(bill?: StatementBillExpense | null): number {
  if (!bill) return 0
  return Math.max(0, bill.amount - bill.amount_paid)
}

export async function fetchHouseholdStatements(
  axiosPrivate: AxiosInstance,
  userId: string
): Promise<StoredCreditCardStatement[]> {
  const res = await axiosPrivate.get<StatementRow[]>(`/${userId}/statements`)
  return (res.data ?? []).map(rowToStored)
}

export async function saveStatementToDb(
  axiosPrivate: AxiosInstance,
  userId: string,
  statement: CreditCardStatement
): Promise<StoredCreditCardStatement> {
  const res = await axiosPrivate.put<StatementRow>(
    `/${userId}/statements`,
    {
      statement_data: statement,
      file_name: statement.fileName ?? null,
    },
    {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    }
  )
  return rowToStored(res.data)
}

export async function registerStatementPayment(
  axiosPrivate: AxiosInstance,
  userId: string,
  ownerUserId: string,
  amount: number,
  accountId: string
) {
  const res = await axiosPrivate.post(
    `/${userId}/statements/${ownerUserId}/payments`,
    { amount, account_id: accountId },
    {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    }
  )
  return res.data
}

export async function deleteStatementFromDb(
  axiosPrivate: AxiosInstance,
  userId: string,
  ownerUserId: string
): Promise<void> {
  await axiosPrivate.delete(`/${userId}/statements/${ownerUserId}`, {
    withCredentials: true,
  })
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
