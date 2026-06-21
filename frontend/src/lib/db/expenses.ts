import type {
  Expense,
  ExpensesMonthSummary,
  PaginatedExpensesResponse,
  newExpense,
} from '@/types'
import { supabase, throwIfError } from './client'
import { monthDateRange } from './dateRange'

export type ExpensePaymentFilter = 'all' | 'paid' | 'unpaid'

export interface ListByMonthOptions {
  month: number
  year: number
  page?: number
  limit?: number
  payment?: ExpensePaymentFilter
}

export async function listByMonthPaginated(
  options: ListByMonthOptions
): Promise<PaginatedExpensesResponse> {
  const page = Math.max(1, options.page ?? 1)
  const limit = Math.min(100, Math.max(1, options.limit ?? 10))
  const payment = options.payment ?? 'all'
  const from = (page - 1) * limit
  const to = from + limit - 1
  const { start, end } = monthDateRange(options.month, options.year)

  const [summaryResult, pageResult] = await Promise.all([
    getMonthSummary(options.month, options.year),
    (async () => {
      let query = supabase
        .from('expenses')
        .select('*', { count: 'exact' })
        .gte('created_at', start)
        .lte('created_at', end)

      if (payment === 'paid') query = query.eq('is_paid', true)
      if (payment === 'unpaid') query = query.eq('is_paid', false)

      return query
        .order('is_paid', { ascending: true })
        .order('payment_date', { ascending: false, nullsFirst: false })
        .range(from, to)
    })(),
  ])

  throwIfError(pageResult.error)

  const total = pageResult.count ?? 0
  return {
    data: (pageResult.data ?? []) as Expense[],
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
    summary: summaryResult,
  }
}

function computeMonthSummary(
  rows: { amount: number | null; amount_paid: number | null; is_paid: boolean | null }[]
): ExpensesMonthSummary {
  let pendingCount = 0
  let paidTotal = 0
  let pendingTotal = 0

  for (const row of rows) {
    const amount = Number(row.amount ?? 0)
    const amountPaid = Number(row.amount_paid ?? 0)
    if (row.is_paid) {
      paidTotal += amount
    } else {
      pendingCount++
      paidTotal += amountPaid
      pendingTotal += Math.max(0, amount - amountPaid)
    }
  }

  return {
    pendingCount,
    paidTotal,
    pendingTotal,
    monthTotal: paidTotal + pendingTotal,
  }
}

export async function getMonthSummary(
  month: number,
  year: number
): Promise<ExpensesMonthSummary> {
  const { data, error } = await supabase.rpc('get_expenses_month_summary', {
    p_month: month,
    p_year: year,
  })

  if (!error && data) {
    return data as ExpensesMonthSummary
  }

  const { start, end } = monthDateRange(month, year)
  const { data: rows, error: queryError } = await supabase
    .from('expenses')
    .select('amount, amount_paid, is_paid')
    .gte('created_at', start)
    .lte('created_at', end)

  throwIfError(queryError)
  return computeMonthSummary(rows ?? [])
}

export async function listAll(): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('created_at', { ascending: false })
  throwIfError(error)
  return (data ?? []) as Expense[]
}

export async function getAvailableMonths(): Promise<{ month: number; year: number }[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('created_at')
    .not('created_at', 'is', null)
  throwIfError(error)

  const seen = new Set<string>()
  const months: { month: number; year: number }[] = []

  for (const row of data ?? []) {
    const date = new Date(row.created_at)
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    const key = `${year}-${month}`
    if (!seen.has(key)) {
      seen.add(key)
      months.push({ month, year })
    }
  }

  months.sort((a, b) => b.year - a.year || b.month - a.month)
  return months
}

export async function createExpense(
  userId: string,
  payload: newExpense,
  visibleUserIds: string[]
): Promise<void> {
  const ownerId =
    payload.user_id && visibleUserIds.includes(payload.user_id)
      ? payload.user_id
      : userId

  if (payload.is_paid && payload.account_id) {
    const { error } = await supabase.from('expenses').insert({
      title: payload.title,
      amount: payload.amount,
      amount_paid: payload.amount,
      payment_date: new Date().toISOString(),
      is_paid: true,
      user_id: ownerId,
      category_id: payload.category_id || null,
      account_id: payload.account_id,
    })
    throwIfError(error)
    await payExpenseViaBalance(payload.account_id, payload.amount)
    return
  }

  const { error } = await supabase.from('expenses').insert({
    title: payload.title,
    amount: payload.amount,
    amount_paid: 0,
    is_paid: false,
    user_id: ownerId,
    category_id: payload.category_id || null,
    account_id: payload.account_id || null,
  })
  throwIfError(error)
}

async function payExpenseViaBalance(accountId: string, amount: number) {
  const { error } = await supabase.rpc('adjust_account_balance', {
    p_account_id: Number(accountId),
    p_delta: -amount,
  })
  throwIfError(error)
}

export async function updateExpense(
  expenseId: string,
  updates: Partial<Expense>
): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .update({
      title: updates.title,
      amount: updates.amount,
      is_paid: updates.is_paid,
      category_id: updates.category_id || null,
      account_id: updates.account_id || null,
    })
    .eq('id', expenseId)
  throwIfError(error)

  if (updates.household_recurring_expense_id && updates.amount) {
    await supabase
      .from('household_recurring_expenses')
      .update({ fixed_amount: updates.amount })
      .eq('id', updates.household_recurring_expense_id)
  }
}

export async function deleteExpense(expenseId: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', expenseId)
  throwIfError(error)
}

export async function payExpense(
  expenseId: string,
  amount: number,
  accountId: string
): Promise<void> {
  const { error } = await supabase.rpc('pay_expense', {
    p_expense_id: Number(expenseId),
    p_payment_amount: amount,
    p_account_id: Number(accountId),
  })
  if (error?.message?.includes('INVALID_PAYMENT_AMOUNT')) {
    throw new Error('El monto supera lo que falta pagar')
  }
  throwIfError(error)
}

export async function completeExpense(
  expenseId: string,
  accountId: string
): Promise<void> {
  const { error } = await supabase.rpc('complete_expense', {
    p_expense_id: Number(expenseId),
    p_account_id: Number(accountId),
  })
  throwIfError(error)
}
