import type {
  Expense,
  ExpensesMonthSummary,
  PaginatedExpensesResponse,
  newExpense,
} from '@/types'
import { apiFetch } from '@/lib/api/http'
import {
  buildExpenseUpdatePatch,
  type ExpenseUpdateInput,
} from '@/lib/expenseUpdate'

export type ExpensePaymentFilter = 'all' | 'paid' | 'unpaid'

export interface ListByMonthOptions {
  month: number
  year: number
  page?: number
  limit?: number
  payment?: ExpensePaymentFilter
}

function normalizeExpense(row: Expense): Expense {
  return {
    ...row,
    id: String(row.id),
    category_id: row.category_id != null ? String(row.category_id) : '',
    account_id: row.account_id != null ? String(row.account_id) : '',
    amount: Number(row.amount),
    amount_paid: row.amount_paid != null ? Number(row.amount_paid) : undefined,
  }
}

type RawMonthSummary = {
  pendingCount?: number
  pending_count?: number
  paidTotal?: number
  paid_total?: number
  pendingTotal?: number
  pending_total?: number
  monthTotal?: number
  month_total?: number
}

function normalizeMonthSummary(
  raw: RawMonthSummary | undefined
): ExpensesMonthSummary {
  return {
    pendingCount: Number(raw?.pending_count ?? raw?.pendingCount ?? 0),
    paidTotal: Number(raw?.paid_total ?? raw?.paidTotal ?? 0),
    pendingTotal: Number(raw?.pending_total ?? raw?.pendingTotal ?? 0),
    monthTotal: Number(raw?.month_total ?? raw?.monthTotal ?? 0),
  }
}

type RawPagination = {
  page?: number
  limit?: number
  total?: number
  totalPages?: number
  total_pages?: number
}

function normalizePagination(
  raw: RawPagination | undefined,
  fallback: { page: number; limit: number }
): PaginatedExpensesResponse['pagination'] {
  const limit = Number(raw?.limit ?? fallback.limit)
  const total = Number(raw?.total ?? 0)
  const totalPages = raw?.total_pages ?? raw?.totalPages
  return {
    page: Number(raw?.page ?? fallback.page),
    limit,
    total,
    totalPages: Number(
      totalPages ?? (total === 0 ? 0 : Math.ceil(total / limit))
    ),
  }
}

export async function listByMonthPaginated(
  options: ListByMonthOptions
): Promise<PaginatedExpensesResponse> {
  const page = options.page ?? 1
  const limit = options.limit ?? 10
  const params = new URLSearchParams({
    month: String(options.month),
    year: String(options.year),
    page: String(page),
    limit: String(limit),
    payment: options.payment ?? 'all',
  })

  const result = await apiFetch<{
    data?: Expense[]
    pagination?: RawPagination
    summary?: RawMonthSummary
  }>(`/api/v1/expenses?${params}`)

  return {
    data: (result.data ?? []).map(normalizeExpense),
    pagination: normalizePagination(result.pagination, { page, limit }),
    summary: normalizeMonthSummary(result.summary),
  }
}

export async function getMonthSummary(
  month: number,
  year: number
): Promise<ExpensesMonthSummary> {
  const params = new URLSearchParams({
    month: String(month),
    year: String(year),
  })
  const result = await apiFetch<RawMonthSummary>(
    `/api/v1/expenses/summary?${params}`
  )
  return normalizeMonthSummary(result)
}

export async function listAll(): Promise<Expense[]> {
  const result = await apiFetch<PaginatedExpensesResponse>(
    '/api/v1/expenses?page=1&limit=1000&payment=all'
  )
  return (result.data ?? []).map(normalizeExpense)
}

export interface HomeOverview {
  pendingCount: number
  paidCount: number
  recent: Expense[]
}

export async function getHomeOverview(): Promise<HomeOverview> {
  const result = await apiFetch<{
    pendingCount?: number
    pending_count?: number
    paidCount?: number
    paid_count?: number
    recent?: Expense[]
  }>('/api/v1/expenses/overview')

  return {
    pendingCount: Number(result.pending_count ?? result.pendingCount ?? 0),
    paidCount: Number(result.paid_count ?? result.paidCount ?? 0),
    recent: (result.recent ?? []).map(normalizeExpense),
  }
}

export async function getAvailableMonths(): Promise<{ month: number; year: number }[]> {
  return apiFetch<{ month: number; year: number }[]>('/api/v1/expenses/months')
}

export async function createExpense(
  userId: string,
  payload: newExpense,
  visibleUserIds: string[]
): Promise<Expense> {
  const ownerId =
    payload.user_id && visibleUserIds.includes(payload.user_id)
      ? payload.user_id
      : userId

  const created = await apiFetch<Expense>('/api/v1/expenses', {
    method: 'POST',
    body: {
      title: payload.title,
      amount: payload.amount,
      is_paid: payload.is_paid,
      user_id: ownerId,
      category_id: payload.category_id ? Number(payload.category_id) : null,
      account_id: payload.account_id ? Number(payload.account_id) : null,
    },
  })

  return normalizeExpense(created)
}

export async function updateExpense(
  expenseId: string,
  updates: ExpenseUpdateInput
): Promise<void> {
  const current = normalizeExpense(
    await apiFetch<Expense>(`/api/v1/expenses/${expenseId}`)
  )

  const patch = buildExpenseUpdatePatch(current, updates)

  await apiFetch(`/api/v1/expenses/${expenseId}`, {
    method: 'PATCH',
    body: {
      title: patch.title,
      amount: patch.amount,
      is_paid: patch.is_paid,
      category_id: patch.category_id != null ? Number(patch.category_id) : null,
      account_id: patch.account_id != null ? Number(patch.account_id) : null,
      payment_date: patch.payment_date,
      household_recurring_expense_id: updates.household_recurring_expense_id,
    },
  })
}

export async function deleteExpense(expenseId: string): Promise<void> {
  await apiFetch(`/api/v1/expenses/${expenseId}`, { method: 'DELETE' })
}

export async function payExpense(
  expenseId: string,
  amount: number,
  accountId: string
): Promise<void> {
  try {
    await apiFetch(`/api/v1/expenses/${expenseId}/pay`, {
      method: 'POST',
      body: {
        amount,
        account_id: Number(accountId),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message.includes('INVALID_PAYMENT_AMOUNT')) {
      throw new Error('El monto supera lo que falta pagar')
    }
    throw err
  }
}

export async function completeExpense(
  expenseId: string,
  accountId: string
): Promise<void> {
  await apiFetch(`/api/v1/expenses/${expenseId}/complete`, {
    method: 'POST',
    body: {
      account_id: Number(accountId),
    },
  })
}

export async function getExpense(expenseId: string | number): Promise<Expense | null> {
  try {
    return normalizeExpense(await apiFetch<Expense>(`/api/v1/expenses/${expenseId}`))
  } catch {
    return null
  }
}
