import { describe, expect, it } from "vitest"
import {
  buildEntitlements,
  canCreateCategory,
  daysLeftUntil,
  FREE_MAX_CATEGORIES,
  isCheckoutEnabled,
} from "./plans"

describe("buildEntitlements", () => {
  it("unlocks everything for self-hosted", () => {
    const e = buildEntitlements(
      { plan: "free", planStatus: "active", statsTrialEndsAt: null },
      { selfHosted: true }
    )
    expect(e.isPro).toBe(true)
    expect(e.canScanReceipts).toBe(true)
    expect(e.maxCategories).toBeNull()
  })

  it("keeps free limits without trial", () => {
    const e = buildEntitlements(
      {
        plan: "free",
        planStatus: "active",
        statsTrialEndsAt: "2020-01-01T00:00:00.000Z",
      },
      { now: new Date("2026-01-01T00:00:00.000Z"), selfHosted: false }
    )
    expect(e.isPro).toBe(false)
    expect(e.canUseStats).toBe(false)
    expect(e.canScanReceipts).toBe(false)
    expect(e.canUseHousehold).toBe(false)
    expect(e.maxCategories).toBe(FREE_MAX_CATEGORIES)
  })

  it("allows stats during 12-day trial", () => {
    const now = new Date("2026-01-01T00:00:00.000Z")
    const e = buildEntitlements(
      {
        plan: "free",
        planStatus: "active",
        statsTrialEndsAt: "2026-01-10T00:00:00.000Z",
      },
      { now, selfHosted: false }
    )
    expect(e.canUseStats).toBe(true)
    expect(e.statsTrialActive).toBe(true)
    expect(e.statsTrialDaysLeft).toBe(9)
    expect(e.canScanReceipts).toBe(false)
  })

  it("unlocks pro features when plan is active", () => {
    const e = buildEntitlements(
      {
        plan: "pro",
        planStatus: "active",
        statsTrialEndsAt: null,
      },
      { selfHosted: false }
    )
    expect(e.isPro).toBe(true)
    expect(e.canUseCreditCards).toBe(true)
    expect(e.canUseRecurring).toBe(true)
    expect(e.maxCategories).toBeNull()
  })
})

describe("canCreateCategory", () => {
  it("blocks free users at the limit", () => {
    const free = buildEntitlements(
      { plan: "free", planStatus: "active", statsTrialEndsAt: null },
      { selfHosted: false }
    )
    expect(canCreateCategory(4, free)).toBe(true)
    expect(canCreateCategory(5, free)).toBe(false)
  })
})

describe("isCheckoutEnabled", () => {
  it("is false unless VITE_BILLING_CHECKOUT_ENABLED=true", () => {
    expect(isCheckoutEnabled()).toBe(false)
  })
})

describe("daysLeftUntil", () => {
  it("returns 0 for past dates", () => {
    expect(daysLeftUntil("2020-01-01T00:00:00.000Z", new Date("2026-01-01"))).toBe(0)
  })
})
