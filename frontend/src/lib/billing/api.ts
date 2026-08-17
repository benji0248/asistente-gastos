import { apiFetch } from "@/lib/api/http"
import type { PlanId, PlanStatus, SubscriptionSnapshot } from "./plans"

export interface MeBillingProfile {
  id: string
  username: string
  role?: number | null
  plan?: PlanId | null
  plan_status?: PlanStatus | null
  planStatus?: PlanStatus | null
  stats_trial_ends_at?: string | null
  statsTrialEndsAt?: string | null
  current_period_end?: string | null
  currentPeriodEnd?: string | null
  cancel_at_period_end?: boolean | null
  cancelAtPeriodEnd?: boolean | null
  stripe_customer_id?: string | null
  stripeCustomerId?: string | null
}

export function subscriptionFromMe(profile: MeBillingProfile | null): SubscriptionSnapshot {
  return {
    plan: profile?.plan === "pro" ? "pro" : "free",
    planStatus:
      profile?.plan_status ??
      profile?.planStatus ??
      "active",
    statsTrialEndsAt:
      profile?.stats_trial_ends_at ?? profile?.statsTrialEndsAt ?? null,
    currentPeriodEnd:
      profile?.current_period_end ?? profile?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: Boolean(
      profile?.cancel_at_period_end ?? profile?.cancelAtPeriodEnd
    ),
    stripeCustomerId:
      profile?.stripe_customer_id ?? profile?.stripeCustomerId ?? null,
  }
}

export async function fetchMeBilling(): Promise<MeBillingProfile> {
  return apiFetch<MeBillingProfile>("/api/v1/me")
}

export async function createCheckoutSession(returnPath = "/home"): Promise<string> {
  const origin = window.location.origin
  const payload = await apiFetch<{ url?: string; checkoutUrl?: string }>(
    "/api/v1/billing/checkout",
    {
      method: "POST",
      body: {
        successUrl: `${origin}${returnPath}?billing=success`,
        cancelUrl: `${origin}${returnPath}?billing=cancel`,
      },
    }
  )

  const url = payload.url ?? payload.checkoutUrl
  if (!url) throw new Error("No se pudo iniciar el pago")
  return url
}

export async function createBillingPortalSession(
  returnPath = "/home"
): Promise<string> {
  const origin = window.location.origin
  const payload = await apiFetch<{ url?: string; portalUrl?: string }>(
    "/api/v1/billing/portal",
    {
      method: "POST",
      body: {
        returnUrl: `${origin}${returnPath}`,
      },
    }
  )

  const url = payload.url ?? payload.portalUrl
  if (!url) throw new Error("No se pudo abrir el portal de facturación")
  return url
}
