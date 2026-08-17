export const PRO_PRICE_USD = 2.5
export const FREE_MAX_CATEGORIES = 5
export const STATS_TRIAL_DAYS = 12

export type PlanId = "free" | "pro"

export type PlanStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "incomplete"
  | "trialing"

export type BillingFeature =
  | "scan_receipts"
  | "stats"
  | "household"
  | "credit_cards"
  | "recurring"
  | "unlimited_categories"

export interface SubscriptionSnapshot {
  plan: PlanId
  planStatus: PlanStatus
  statsTrialEndsAt: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  stripeCustomerId: string | null
}

export interface PlanEntitlements {
  plan: PlanId
  isPro: boolean
  isSelfHosted: boolean
  canScanReceipts: boolean
  canUseStats: boolean
  canUseHousehold: boolean
  canUseCreditCards: boolean
  canUseRecurring: boolean
  maxCategories: number | null
  statsTrialEndsAt: Date | null
  statsTrialActive: boolean
  statsTrialDaysLeft: number
}

const FEATURE_COPY: Record<
  BillingFeature,
  { title: string; description: string }
> = {
  scan_receipts: {
    title: "Escanear tickets",
    description: "Leé tickets con la cámara y creá el gasto en segundos.",
  },
  stats: {
    title: "Estadísticas",
    description: "Compará meses, categorías y tendencias de tu gasto.",
  },
  household: {
    title: "Hogar / familia",
    description: "Vinculá cuentas y compartí gastos con tu familia.",
  },
  credit_cards: {
    title: "Tarjetas de crédito",
    description: "Importá estados de cuenta y controlá el pago del mes.",
  },
  recurring: {
    title: "Gastos fijos",
    description: "Automatizá los gastos mensuales del hogar.",
  },
  unlimited_categories: {
    title: "Más categorías",
    description: `En Free podés crear hasta ${FREE_MAX_CATEGORIES}. Pro no tiene ese límite.`,
  },
}

export function getFeatureCopy(feature: BillingFeature) {
  return FEATURE_COPY[feature]
}

export function isBillingSelfHosted(): boolean {
  const mode = (import.meta.env.VITE_BILLING_MODE as string | undefined)?.toLowerCase()
  return mode === "selfhosted" || mode === "self-hosted"
}

/** Stripe Checkout only when explicitly enabled (avoid accidental Pro activation). */
export function isCheckoutEnabled(): boolean {
  return import.meta.env.VITE_BILLING_CHECKOUT_ENABLED === "true"
}

export function daysLeftUntil(iso: string | null | undefined, now = new Date()): number {
  if (!iso) return 0
  const end = new Date(iso)
  if (Number.isNaN(end.getTime())) return 0
  const ms = end.getTime() - now.getTime()
  if (ms <= 0) return 0
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

export function buildEntitlements(
  snapshot: Partial<SubscriptionSnapshot> | null | undefined,
  options?: { now?: Date; selfHosted?: boolean }
): PlanEntitlements {
  const selfHosted = options?.selfHosted ?? isBillingSelfHosted()
  const now = options?.now ?? new Date()

  if (selfHosted) {
    return {
      plan: "pro",
      isPro: true,
      isSelfHosted: true,
      canScanReceipts: true,
      canUseStats: true,
      canUseHousehold: true,
      canUseCreditCards: true,
      canUseRecurring: true,
      maxCategories: null,
      statsTrialEndsAt: null,
      statsTrialActive: false,
      statsTrialDaysLeft: 0,
    }
  }

  const plan: PlanId = snapshot?.plan === "pro" ? "pro" : "free"
  const isPro =
    plan === "pro" &&
    (snapshot?.planStatus === "active" ||
      snapshot?.planStatus === "trialing" ||
      snapshot?.planStatus === "past_due")

  const statsTrialEndsAt = snapshot?.statsTrialEndsAt
    ? new Date(snapshot.statsTrialEndsAt)
    : null
  const statsTrialDaysLeft = daysLeftUntil(snapshot?.statsTrialEndsAt ?? null, now)
  const statsTrialActive = !isPro && statsTrialDaysLeft > 0

  return {
    plan: isPro ? "pro" : "free",
    isPro,
    isSelfHosted: false,
    canScanReceipts: isPro,
    canUseStats: isPro || statsTrialActive,
    canUseHousehold: isPro,
    canUseCreditCards: isPro,
    canUseRecurring: isPro,
    maxCategories: isPro ? null : FREE_MAX_CATEGORIES,
    statsTrialEndsAt:
      statsTrialEndsAt && !Number.isNaN(statsTrialEndsAt.getTime())
        ? statsTrialEndsAt
        : null,
    statsTrialActive,
    statsTrialDaysLeft,
  }
}

export function canCreateCategory(
  currentCount: number,
  entitlements: PlanEntitlements
): boolean {
  if (entitlements.maxCategories === null) return true
  return currentCount < entitlements.maxCategories
}
