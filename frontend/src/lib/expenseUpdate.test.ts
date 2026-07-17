import { describe, expect, it } from "vitest"
import { buildExpenseUpdatePatch, paidContribution } from "./expenseUpdate"

const base = {
  title: "Supermercado",
  amount: 100,
  is_paid: true,
  amount_paid: 100,
  payment_date: "2026-07-01T12:00:00.000Z",
  category_id: "1",
  account_id: "2",
}

describe("buildExpenseUpdatePatch", () => {
  it("syncs amount_paid when amount changes on a paid expense", () => {
    const patch = buildExpenseUpdatePatch(base, { amount: 150, is_paid: true })
    expect(patch.amount).toBe(150)
    expect(patch.amount_paid).toBe(150)
    expect(patch.is_paid).toBe(true)
    expect(patch.payment_date).toBe(base.payment_date)
  })

  it("clears payment fields when unmarked as paid", () => {
    const patch = buildExpenseUpdatePatch(base, { is_paid: false, amount: 100 })
    expect(patch.is_paid).toBe(false)
    expect(patch.amount_paid).toBe(0)
    expect(patch.payment_date).toBeNull()
  })

  it("sets amount_paid when marking unpaid expense as paid", () => {
    const patch = buildExpenseUpdatePatch(
      { ...base, is_paid: false, amount_paid: 20, payment_date: null },
      { is_paid: true, amount: 100, payment_date: "2026-07-10T00:00:00.000Z" }
    )
    expect(patch.is_paid).toBe(true)
    expect(patch.amount_paid).toBe(100)
    expect(patch.payment_date).toBe("2026-07-10T00:00:00.000Z")
  })

  it("clamps amount_paid when lowering amount on a partially paid expense", () => {
    const patch = buildExpenseUpdatePatch(
      { ...base, is_paid: false, amount_paid: 80, payment_date: null },
      { amount: 50, is_paid: false }
    )
    expect(patch.amount).toBe(50)
    expect(patch.amount_paid).toBe(50)
    expect(patch.is_paid).toBe(false)
  })

  it("updates category without disturbing payment fields", () => {
    const patch = buildExpenseUpdatePatch(base, {
      category_id: "9",
      is_paid: true,
      amount: 100,
    })
    expect(patch.category_id).toBe("9")
    expect(patch.amount_paid).toBe(100)
    expect(patch.payment_date).toBe(base.payment_date)
  })
})

describe("paidContribution", () => {
  it("uses full amount when paid", () => {
    expect(paidContribution({ amount: 120, amount_paid: 0, is_paid: true })).toBe(120)
  })

  it("uses amount_paid when unpaid", () => {
    expect(paidContribution({ amount: 120, amount_paid: 40, is_paid: false })).toBe(40)
  })
})
