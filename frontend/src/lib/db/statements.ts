import { supabase, throwIfError } from './client'
import { payExpense } from './expenses'
import { statementMonthDate } from './dateRange'
import { deleteLinkedBillExpenseIfUnpaid } from '@/lib/statementBillExpense'

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
  let query = supabase
    .from('credit_card_statements')
    .select('*')
    .order('imported_at', { ascending: false })

  if (options) {
    query = query.eq('statement_month', statementMonthDate(options.year, options.month))
  }

  const { data, error } = await query
  throwIfError(error)
  return (data ?? []) as StatementRow[]
}

export async function insertStatement(payload: {
  user_id: string
  statement_data: unknown
  file_name?: string | null
  expense_id?: number | null
  statement_month?: string
}): Promise<StatementRow> {
  const { data, error } = await supabase
    .from('credit_card_statements')
    .insert({
      user_id: payload.user_id,
      statement_data: payload.statement_data,
      file_name: payload.file_name ?? null,
      expense_id: payload.expense_id ?? null,
      statement_month: payload.statement_month,
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single()
  throwIfError(error)
  return data as StatementRow
}

export async function deleteStatement(statementId: string): Promise<void> {
  const { data: row } = await supabase
    .from('credit_card_statements')
    .select('expense_id')
    .eq('id', statementId)
    .maybeSingle()

  if (row?.expense_id) {
    await deleteLinkedBillExpenseIfUnpaid(row.expense_id)
  }

  const { error } = await supabase
    .from('credit_card_statements')
    .delete()
    .eq('id', statementId)
  throwIfError(error)
}

export async function registerStatementPayment(
  statementId: string,
  payload: { account_id: number; amount: number }
): Promise<void> {
  const { data: statement } = await supabase
    .from('credit_card_statements')
    .select('expense_id, user_id')
    .eq('id', statementId)
    .maybeSingle()

  if (!statement) throw new Error('Resumen no encontrado')

  if (statement.expense_id) {
    await payExpense(String(statement.expense_id), payload.amount, String(payload.account_id))
    return
  }

  const { data: inserted, error } = await supabase
    .from('expenses')
    .insert({
      title: 'Pago tarjeta de crédito',
      amount: payload.amount,
      amount_paid: payload.amount,
      is_paid: true,
      user_id: statement.user_id,
      account_id: payload.account_id,
      payment_date: new Date().toISOString(),
    })
    .select('id')
    .single()
  throwIfError(error)

  if (!inserted?.id) throw new Error('No se pudo crear el gasto')

  await supabase.rpc('adjust_account_balance', {
    p_account_id: payload.account_id,
    p_delta: -payload.amount,
  })

  await supabase
    .from('credit_card_statements')
    .update({ expense_id: inserted.id })
    .eq('id', statementId)
}
