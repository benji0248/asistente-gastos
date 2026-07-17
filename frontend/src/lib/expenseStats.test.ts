import { describe, expect, it } from "vitest"
import {
  categoryBreakdown,
  expenseBelongsToMonth,
  sumPaid,
} from "./expenseStats"
import type { Category, Expense } from "@/types"

function expense(partial: Partial<Expense> & Pick<Expense, "id" | "amount" | "is_paid">): Expense {
  return {
    user_id: "u1",
    title: "gasto",
    category_id: "1",
    account_id: "10",
    created_at: new Date("2026-07-15T15:00:00.000Z"),
    payment_date: undefined,
    amount_paid: 0,
    ...partial,
  }
}

const categories: Category[] = [
  { id: "1", name: "Comida", user_id: "u1", is_enabled: true, is_system: false },
  { id: "2", name: "Transporte", user_id: "u1", is_enabled: true, is_system: false },
]

describe("categoryBreakdown", () => {
  it("recalculates after an amount edit on a paid expense", () => {
    const expenses = [
      expense({ id: "a", amount: 150, amount_paid: 150, is_paid: true, category_id: "1" }),
      expense({ id: "b", amount: 50, amount_paid: 50, is_paid: true, category_id: "2" }),
    ]

    const stats = categoryBreakdown(expenses, categories, 7, 2026)
    expect(sumPaid(expenses)).toBe(200)
    expect(stats.find((item) => item.categoryId === "1")?.amount).toBe(150)
    expect(stats.reduce((sum, item) => sum + item.amount, 0)).toBe(200)
  })

  it("includes partial payments so category totals match Gasto pagado", () => {
    const expenses = [
      expense({ id: "a", amount: 100, amount_paid: 100, is_paid: true, category_id: "1" }),
      expense({
        id: "b",
        amount: 80,
        amount_paid: 30,
        is_paid: false,
        category_id: "1",
      }),
    ]

    const stats = categoryBreakdown(expenses, categories, 7, 2026)
    expect(sumPaid(expenses)).toBe(130)
    expect(stats).toHaveLength(1)
    expect(stats[0].amount).toBe(130)
  })

  it("groups numeric and string category ids together", () => {
    const expenses = [
      expense({
        id: "a",
        amount: 20,
        amount_paid: 20,
        is_paid: true,
        category_id: 1 as unknown as string,
      }),
      expense({
        id: "b",
        amount: 30,
        amount_paid: 30,
        is_paid: true,
        category_id: "1",
      }),
    ]

    const stats = categoryBreakdown(expenses, categories, 7, 2026)
    expect(stats).toHaveLength(1)
    expect(stats[0].name).toBe("Comida")
    expect(stats[0].amount).toBe(50)
  })

  it("includes household recurring expenses created at month start UTC", () => {
    // ensure_recurring_expenses inserts created_at = 1st 00:00 UTC.
    // In AR (UTC-3) that is still the previous local evening.
    const edesur = expense({
      id: "edesur",
      title: "EDESUR",
      amount: 155452.97,
      amount_paid: 155452.97,
      is_paid: true,
      category_id: "3",
      created_at: new Date("2026-07-01T00:00:00.000Z"),
      household_recurring_expense_id: "rec-1",
    })
    const other = expense({
      id: "agua",
      amount: 65000,
      amount_paid: 65000,
      is_paid: true,
      category_id: "3",
      created_at: new Date("2026-07-10T12:00:00.000Z"),
    })

    expect(expenseBelongsToMonth(edesur, 7, 2026)).toBe(true)
    expect(expenseBelongsToMonth(edesur, 6, 2026)).toBe(false)

    const stats = categoryBreakdown(
      [edesur, other],
      [
        ...categories,
        {
          id: "3",
          name: "Servicios",
          user_id: "u1",
          is_enabled: true,
          is_system: false,
        },
      ],
      7,
      2026
    )

    expect(stats.find((item) => item.categoryId === "3")?.amount).toBeCloseTo(
      220452.97,
      2
    )
    expect(stats.find((item) => item.categoryId === "3")?.count).toBe(2)
  })
})
