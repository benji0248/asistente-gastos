import dayjs from "dayjs"
import { supabase, throwIfError } from "./client"
import { monthDateRange } from "./dateRange"
import {
  calculateRentAdjustment,
  ipcMonthLabels,
  monthLabel,
  RENT_DEPOSIT_MONTHS,
  RENT_IPC_PERIOD_MONTHS,
} from "@/lib/rentAdjustment"
import { ensureRecurringExpenses } from "./household"

export async function getRentAdjustmentContext(recurringId: string) {
  const now = dayjs()
  const targetMonth = now.month() + 1
  const targetYear = now.year()

  const prevMonth = targetMonth === 1 ? 12 : targetMonth - 1
  const prevYear = targetMonth === 1 ? targetYear - 1 : targetYear
  const { start, end } = monthDateRange(prevMonth, prevYear)

  const { data: lastExpense } = await supabase
    .from("expenses")
    .select("amount")
    .eq("household_recurring_expense_id", recurringId)
    .gte("created_at", start)
    .lte("created_at", end)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: recurring } = await supabase
    .from("household_recurring_expenses")
    .select("fixed_amount")
    .eq("id", recurringId)
    .maybeSingle()

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
    throw new Error("No hay monto de alquiler del mes anterior para calcular")
  }

  const calculation = calculateRentAdjustment({
    currentRent: context.current_rent,
    ipcRates,
  })

  const { error: recurringError } = await supabase
    .from("household_recurring_expenses")
    .update({
      amount_type: "fixed",
      fixed_amount: calculation.newRent,
    })
    .eq("id", recurringId)
  throwIfError(recurringError)

  await ensureRecurringExpenses()

  const { start, end } = monthDateRange(context.adjustment_month, context.adjustment_year)
  const { data: rentExpense } = await supabase
    .from("expenses")
    .select("id")
    .eq("household_recurring_expense_id", recurringId)
    .gte("created_at", start)
    .lte("created_at", end)
    .maybeSingle()

  if (rentExpense) {
    const { error } = await supabase
      .from("expenses")
      .update({ amount: calculation.newRent })
      .eq("id", rentExpense.id)
    throwIfError(error)
  }

  if (calculation.depositDifference > 0) {
    const { data: existingDeposit } = await supabase
      .from("expenses")
      .select("id")
      .eq("title", "Depósito adicional alquiler")
      .gte("created_at", start)
      .lte("created_at", end)
      .maybeSingle()

    if (!existingDeposit) {
      const { data: session } = await supabase.auth.getSession()
      const userId = session.session?.user.id
      if (!userId) throw new Error("No autenticado")

      const { data: category } = await supabase
        .from("categories")
        .select("id")
        .ilike("name", "Alquiler")
        .limit(1)
        .maybeSingle()

      const { error } = await supabase.from("expenses").insert({
        title: "Depósito adicional alquiler",
        amount: calculation.depositDifference,
        amount_paid: 0,
        is_paid: false,
        user_id: userId,
        category_id: category?.id ?? null,
        account_id: null,
        created_at: start,
      })
      throwIfError(error)
    }
  }

  return calculation
}

export { RENT_IPC_PERIOD_MONTHS }
