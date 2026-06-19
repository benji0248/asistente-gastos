import { getSupabaseAdmin } from '../lib/supabase'
import expenseServices from './expenseServices'
import {
  calculateRentAdjustment,
  ipcMonthLabels,
  monthLabel,
  RENT_DEPOSIT_MONTHS,
  RENT_IPC_PERIOD_MONTHS,
} from '../lib/rentAdjustment'

export type RecurringAmountType = 'fixed' | 'estimated'

export interface HouseholdRecurringExpense {
  id: string
  household_id: string
  title: string
  amount_type: RecurringAmountType
  fixed_amount: number | null
  category_id: number | null
  created_by: string
  created_at: string
}

export interface NewHouseholdRecurringExpense {
  title: string
  amount_type: RecurringAmountType
  fixed_amount?: number | null
  category_id?: number | null
}

function monthDateRange(month: number, year: number) {
  const start = new Date(year, month - 1, 1).toISOString()
  const end = new Date(year, month, 0, 23, 59, 59, 999).toISOString()
  return { start, end }
}

function monthStartIso(month: number, year: number) {
  return new Date(year, month - 1, 1).toISOString()
}

function resolveAmount(payload: NewHouseholdRecurringExpense) {
  const amount = Number(payload.fixed_amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Indicá un monto válido')
  }
  return amount
}

class householdRecurringExpenseServices {
  static list = async (householdId: string): Promise<HouseholdRecurringExpense[]> => {
    const { data, error } = await getSupabaseAdmin()
      .from('household_recurring_expenses')
      .select('*')
      .eq('household_id', householdId)
      .order('title')

    if (error) throw error
    return (data ?? []) as HouseholdRecurringExpense[]
  }

  static create = async (
    userId: string,
    householdId: string,
    visibleUserIds: string[],
    payload: NewHouseholdRecurringExpense
  ): Promise<HouseholdRecurringExpense> => {
    const title = payload.title.trim()
    if (!title) throw new Error('Indicá un nombre para el gasto')
    const amount = resolveAmount(payload)

    if (payload.category_id != null) {
      const { data: category, error: categoryError } = await getSupabaseAdmin()
        .from('categories')
        .select('id')
        .eq('id', payload.category_id)
        .in('user_id', visibleUserIds)
        .maybeSingle()

      if (categoryError) throw categoryError
      if (!category) throw new Error('La categoría no pertenece al hogar')
    }

    const { data, error } = await getSupabaseAdmin()
      .from('household_recurring_expenses')
      .insert({
        household_id: householdId,
        title,
        amount_type: payload.amount_type,
        fixed_amount: amount,
        category_id: payload.category_id ?? null,
        created_by: userId,
      })
      .select('*')
      .single()

    if (error) throw error

    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()
    await this.ensureInstanceForMonth(
      data as HouseholdRecurringExpense,
      month,
      year,
      visibleUserIds
    )

    return data as HouseholdRecurringExpense
  }

  static update = async (
    householdId: string,
    recurringId: string,
    visibleUserIds: string[],
    payload: NewHouseholdRecurringExpense
  ): Promise<HouseholdRecurringExpense> => {
    const existing = await this.getOne(householdId, recurringId)
    if (!existing) throw new Error('Gasto del hogar no encontrado')

    const title = payload.title.trim()
    if (!title) throw new Error('Indicá un nombre para el gasto')
    const amount = resolveAmount(payload)

    if (payload.category_id != null) {
      const { data: category, error: categoryError } = await getSupabaseAdmin()
        .from('categories')
        .select('id')
        .eq('id', payload.category_id)
        .in('user_id', visibleUserIds)
        .maybeSingle()

      if (categoryError) throw categoryError
      if (!category) throw new Error('La categoría no pertenece al hogar')
    }

    const { data, error } = await getSupabaseAdmin()
      .from('household_recurring_expenses')
      .update({
        title,
        amount_type: payload.amount_type,
        fixed_amount: amount,
        category_id: payload.category_id ?? null,
      })
      .eq('id', recurringId)
      .eq('household_id', householdId)
      .select('*')
      .single()

    if (error) throw error

    const now = new Date()
    await this.syncCurrentMonthInstance(
      data as HouseholdRecurringExpense,
      visibleUserIds,
      { amount, title, category_id: payload.category_id ?? null },
      now.getMonth() + 1,
      now.getFullYear()
    )

    return data as HouseholdRecurringExpense
  }

  static delete = async (householdId: string, recurringId: string) => {
    const { error } = await getSupabaseAdmin()
      .from('household_recurring_expenses')
      .delete()
      .eq('id', recurringId)
      .eq('household_id', householdId)

    if (error) throw error
  }

  static getOne = async (householdId: string, recurringId: string) => {
    const { data, error } = await getSupabaseAdmin()
      .from('household_recurring_expenses')
      .select('*')
      .eq('id', recurringId)
      .eq('household_id', householdId)
      .maybeSingle()

    if (error) throw error
    return (data as HouseholdRecurringExpense | null) ?? null
  }

  static getLastMonthAmount = async (recurringId: string, month: number, year: number) => {
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    const { start, end } = monthDateRange(prevMonth, prevYear)

    const { data, error } = await getSupabaseAdmin()
      .from('expenses')
      .select('amount')
      .eq('household_recurring_expense_id', recurringId)
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data?.amount != null ? Number(data.amount) : 0
  }

  static hasInstanceForMonth = async (recurringId: string, month: number, year: number) => {
    const { start, end } = monthDateRange(month, year)
    const { data, error } = await getSupabaseAdmin()
      .from('expenses')
      .select('id')
      .eq('household_recurring_expense_id', recurringId)
      .gte('created_at', start)
      .lte('created_at', end)
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return Boolean(data)
  }

  static getInstanceForMonth = async (recurringId: string, month: number, year: number) => {
    const { start, end } = monthDateRange(month, year)
    const { data, error } = await getSupabaseAdmin()
      .from('expenses')
      .select('*')
      .eq('household_recurring_expense_id', recurringId)
      .gte('created_at', start)
      .lte('created_at', end)
      .maybeSingle()

    if (error) throw error
    return data
  }

  static syncCurrentMonthInstance = async (
    recurring: HouseholdRecurringExpense,
    visibleUserIds: string[],
    updates: { amount?: number; title?: string; category_id?: number | null },
    month: number,
    year: number
  ) => {
    const expense = await this.getInstanceForMonth(recurring.id, month, year)
    if (!expense || expense.is_paid) return

    const payload: Record<string, unknown> = {}
    if (updates.amount != null && updates.amount > 0) payload.amount = updates.amount
    if (updates.title) payload.title = updates.title
    if (updates.category_id !== undefined) payload.category_id = updates.category_id

    if (!Object.keys(payload).length) return

    const { error } = await getSupabaseAdmin()
      .from('expenses')
      .update(payload)
      .eq('id', expense.id)
      .in('user_id', visibleUserIds)

    if (error) throw error
  }

  static resolveInstanceAmount = async (recurring: HouseholdRecurringExpense, month: number, year: number) => {
    if (recurring.amount_type === 'fixed') {
      return Number(recurring.fixed_amount)
    }

    const lastMonthAmount = await this.getLastMonthAmount(recurring.id, month, year)
    if (lastMonthAmount > 0) return lastMonthAmount

    return Number(recurring.fixed_amount) || 0
  }

  static ensureInstanceForMonth = async (
    recurring: HouseholdRecurringExpense,
    month: number,
    year: number,
    visibleUserIds: string[]
  ) => {
    const exists = await this.hasInstanceForMonth(recurring.id, month, year)
    if (exists) return

    const amount = await this.resolveInstanceAmount(recurring, month, year)

    const { error } = await getSupabaseAdmin()
      .from('expenses')
      .insert({
        title: recurring.title,
        amount,
        amount_paid: 0,
        is_paid: false,
        user_id: recurring.created_by,
        category_id: recurring.category_id,
        account_id: null,
        household_recurring_expense_id: recurring.id,
        created_at: monthStartIso(month, year),
      })

    if (error) throw error
    void visibleUserIds
  }

  static ensureCurrentMonthExpenses = async (householdId: string, visibleUserIds: string[]) => {
    const recurringList = await this.list(householdId)
    if (!recurringList.length) return

    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    for (const recurring of recurringList) {
      await this.ensureInstanceForMonth(recurring, month, year, visibleUserIds)
    }
  }

  private static resolveRentCategoryId = async (
    recurring: HouseholdRecurringExpense,
    visibleUserIds: string[]
  ) => {
    if (recurring.category_id != null) return recurring.category_id

    const { data, error } = await getSupabaseAdmin()
      .from('categories')
      .select('id')
      .in('user_id', visibleUserIds)
      .ilike('name', 'Alquiler')
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data?.id != null ? Number(data.id) : null
  }

  static getRentAdjustmentContext = async (
    householdId: string,
    recurringId: string,
    month?: number,
    year?: number
  ) => {
    const recurring = await this.getOne(householdId, recurringId)
    if (!recurring) throw new Error('Gasto del hogar no encontrado')

    const now = new Date()
    const targetMonth = month ?? now.getMonth() + 1
    const targetYear = year ?? now.getFullYear()

    let currentRent = await this.getLastMonthAmount(recurringId, targetMonth, targetYear)
    if (currentRent <= 0 && recurring.fixed_amount != null) {
      currentRent = Number(recurring.fixed_amount)
    }

    return {
      recurring,
      current_rent: currentRent,
      adjustment_month: targetMonth,
      adjustment_year: targetYear,
      adjustment_label: monthLabel(targetMonth, targetYear),
      ipc_months: ipcMonthLabels(targetMonth, targetYear),
      deposit_months: RENT_DEPOSIT_MONTHS,
      ipc_period_months: RENT_IPC_PERIOD_MONTHS,
    }
  }

  static applyRentAdjustment = async (
    userId: string,
    householdId: string,
    recurringId: string,
    visibleUserIds: string[],
    ipcRates: number[],
    month?: number,
    year?: number
  ) => {
    const context = await this.getRentAdjustmentContext(householdId, recurringId, month, year)
    if (context.current_rent <= 0) {
      throw new Error('No hay monto de alquiler del mes anterior para calcular')
    }

    const calculation = calculateRentAdjustment({
      currentRent: context.current_rent,
      ipcRates,
    })

    const { data: updatedRecurring, error: recurringError } = await getSupabaseAdmin()
      .from('household_recurring_expenses')
      .update({
        amount_type: 'fixed',
        fixed_amount: calculation.newRent,
      })
      .eq('id', recurringId)
      .eq('household_id', householdId)
      .select('*')
      .single()

    if (recurringError) throw recurringError

    await this.ensureInstanceForMonth(
      updatedRecurring as HouseholdRecurringExpense,
      context.adjustment_month,
      context.adjustment_year,
      visibleUserIds
    )

    const rentExpense = await this.getInstanceForMonth(
      recurringId,
      context.adjustment_month,
      context.adjustment_year
    )

    let updatedExpenseId: number | null = null
    if (rentExpense) {
      const { error: expenseError } = await getSupabaseAdmin()
        .from('expenses')
        .update({ amount: calculation.newRent })
        .eq('id', rentExpense.id)
        .in('user_id', visibleUserIds)

      if (expenseError) throw expenseError
      updatedExpenseId = Number(rentExpense.id)
    }

    let depositExpenseId: number | null = null
    if (calculation.depositDifference > 0) {
      const { start, end } = monthDateRange(context.adjustment_month, context.adjustment_year)
      const { data: existingDeposit } = await getSupabaseAdmin()
        .from('expenses')
        .select('id')
        .eq('title', 'Depósito adicional alquiler')
        .in('user_id', visibleUserIds)
        .gte('created_at', start)
        .lte('created_at', end)
        .maybeSingle()

      if (!existingDeposit) {
        const categoryId = await this.resolveRentCategoryId(
          updatedRecurring as HouseholdRecurringExpense,
          visibleUserIds
        )
        depositExpenseId = await expenseServices.createBillExpense(userId, {
          title: 'Depósito adicional alquiler',
          amount: calculation.depositDifference,
          category_id: categoryId != null ? String(categoryId) : null,
        })
      } else {
        depositExpenseId = Number(existingDeposit.id)
      }
    }

    return {
      ...calculation,
      ipc_rates: ipcRates,
      ipc_months: context.ipc_months.map((item, index) => ({
        ...item,
        rate: ipcRates[index],
      })),
      adjustment_month: context.adjustment_month,
      adjustment_year: context.adjustment_year,
      adjustment_label: context.adjustment_label,
      deposit_months: RENT_DEPOSIT_MONTHS,
      updated_recurring: updatedRecurring,
      updated_expense_id: updatedExpenseId,
      deposit_expense_id: depositExpenseId,
    }
  }
}

export default householdRecurringExpenseServices
