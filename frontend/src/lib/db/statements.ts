import { apiFetch } from '@/lib/api/http'
import { statementMonthDate } from './dateRange'

export interface StatementRow {
  id: string
  user_id: string
  statement_data: unknown
  file_name: string | null
  expense_id: number | null
  statement_month: string
  imported_at: string
  updated_at: string
}

export async function listStatements(options?: {
  year: number
  month: number
}): Promise<StatementRow[]> {
  const query =
    options != null
      ? `?year=${options.year}&month=${options.month}`
      : ''
  return apiFetch<StatementRow[]>(`/api/v1/statements${query}`)
}

export async function insertStatement(payload: {
  user_id: string
  statement_data: unknown
  file_name?: string | null
  expense_id?: number | null
  statement_month?: string
}): Promise<StatementRow> {
  return apiFetch<StatementRow>('/api/v1/statements', {
    method: 'POST',
    body: {
      statement_data: payload.statement_data,
      file_name: payload.file_name ?? null,
      expense_id: payload.expense_id ?? null,
      statement_month: payload.statement_month,
    },
  })
}

export async function deleteStatement(statementId: string): Promise<void> {
  await apiFetch(`/api/v1/statements/${statementId}`, { method: 'DELETE' })
}

export async function registerStatementPayment(
  statementId: string,
  payload: { account_id: number; amount: number }
): Promise<void> {
  await apiFetch(`/api/v1/statements/${statementId}/pay`, {
    method: 'POST',
    body: payload,
  })
}

export { statementMonthDate }
