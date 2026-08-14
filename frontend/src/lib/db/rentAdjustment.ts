import dayjs from 'dayjs'
import { monthDateRange } from './dateRange'
import {
  calculateRentAdjustment,
  ipcMonthLabels,
  monthLabel,
  RENT_DEPOSIT_MONTHS,
  RENT_IPC_PERIOD_MONTHS,
} from '@/lib/rentAdjustment'
import { ensureRecurringExpenses, listRecurringExpenses } from './household'
import { createExpense, listByMonthPaginated, updateExpense } from './expenses'
import { listCategories } from './categories'

export async function getRentAdjustmentContext(recurringId: string) {
  const now = dayjs()
  const targetMonth = now.month() + 1
  const targetYear = now.year()

  const prevMonth = targetMonth === 1 ? 12 : targetMonth - 1
  const prevYear = targetMonth === 1 ? targetYear - 1 : targetYear

  const prevMonthExpenses = await listByMonthPaginated({
    month: prevMonth,
    year: prevYear,
    page: 1,
    limit: 100,
    payment: 'all',
  })

  const lastExpense = (prevMonthExpenses.data ?? []).find(
    (expense) => expense.household_recurring_expense_id === recurringId
  )

  const recurringRows = await listRecurringExpenses()
  const recurring = recurringRows.find((row) => row.id === recurringId)

  let currentRent = lastExpense?.amount != null ? Number(lastExpense.amount) : 0
  if (currentRent <= 0 && recurring?.fixed_amount != null) {
    currentRent = Number(recurring.fixed_amount)
  }

  return {
    current_rent: currentRent,
    adjustment_label: monthLabel(targetMonth, targetYear),
    ipc_months: ipcMonthLabels(targetMonth, targetYear),
    deposit_months: RENT_DEPOSIT_MONTHS,
    adjustment_month: targetMonth,
    adjustment_year: targetYear,
  }
}

export async function applyRentAdjustment(recurringId: string, ipcRates: number[]) {
  const context = await getRentAdjustmentContext(recurringId)
  if (context.current_rent <= 0) {
    throw new Error('No hay monto de alquiler del mes anterior para calcular')
  }

  const calculation = calculateRentAdjustment({
    currentRent: context.current_rent,
    ipcRates,
  })

  const recurringRows = await listRecurringExpenses()
  const recurring = recurringRows.find((row) => row.id === recurringId)
  if (!recurring) {
    throw new Error('Gasto recurrente no encontrado')
  }

  const { updateRecurringExpense } = await import('./household')
  await updateRecurringExpense(recurringId, {
    title: recurring.title,
    amount_type: 'fixed',
    fixed_amount: calculation.newRent,
    category_id: recurring.category_id,
  })

  await ensureRecurringExpenses()

  const { start, end } = monthDateRange(context.adjustment_month, context.adjustment_year)
  const monthExpenses = await listByMonthPaginated({
    month: context.adjustment_month,
    year: context.adjustment_year,
    page: 1,
    limit: 100,
    payment: 'all',
  })

  const rentExpense = (monthExpenses.data ?? []).find(
    (expense) => expense.household_recurring_expense_id === recurringId
  )

  if (rentExpense) {
    await updateExpense(rentExpense.id, { amount: calculation.newRent })
  }

  if (calculation.depositDifference > 0) {
    const existingDeposit = (monthExpenses.data ?? []).find(
      (expense) =>
        expense.title === 'Depósito adicional alquiler' &&
        expense.created_at &&
        String(expense.created_at) >= start &&
        String(expense.created_at) <= end
    )

    if (!existingDeposit) {
      const categories = await listCategories()
      const rentCategory = categories.find((category) =>
        category.name.toLowerCase().includes('alquiler')
      )

      await createExpense(
        '',
        {
          user_id: '',
          title: 'Depósito adicional alquiler',
          amount: calculation.depositDifference,
          payment_date: undefined,
          category_id: rentCategory?.id ?? '',
          is_paid: false,
          account_id: '',
        },
        []
      )
    }
  }

  return calculation
}

export { RENT_IPC_PERIOD_MONTHS }
