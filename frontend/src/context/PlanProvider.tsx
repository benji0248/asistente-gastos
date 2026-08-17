import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import useAuth from "@/hooks/useAuth"
import {
  createBillingPortalSession,
  createCheckoutSession,
  fetchMeBilling,
  subscriptionFromMe,
} from "@/lib/billing/api"
import {
  buildEntitlements,
  type PlanEntitlements,
  type SubscriptionSnapshot,
} from "@/lib/billing/plans"

interface PlanContextValue {
  loading: boolean
  subscription: SubscriptionSnapshot
  entitlements: PlanEntitlements
  refreshPlan: () => Promise<void>
  startCheckout: (returnPath?: string) => Promise<void>
  openBillingPortal: (returnPath?: string) => Promise<void>
  checkoutLoading: boolean
}

const defaultSubscription: SubscriptionSnapshot = {
  plan: "free",
  planStatus: "active",
  statsTrialEndsAt: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  stripeCustomerId: null,
}

const PlanContext = createContext<PlanContextValue | null>(null)

function trialFallbackKey(userId: string) {
  return `gastito_stats_trial_ends_at:${userId}`
}

function ensureClientTrialFallback(userId: string): string {
  const key = trialFallbackKey(userId)
  const existing = localStorage.getItem(key)
  if (existing) return existing

  const ends = new Date()
  ends.setDate(ends.getDate() + 12)
  const iso = ends.toISOString()
  localStorage.setItem(key, iso)
  return iso
}

export function PlanProvider({ children }: { children: ReactNode }) {
  const { auth, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [subscription, setSubscription] =
    useState<SubscriptionSnapshot>(defaultSubscription)

  const refreshPlan = useCallback(async () => {
    if (!auth?.id) {
      setSubscription(defaultSubscription)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const profile = await fetchMeBilling()
      const fromApi = subscriptionFromMe(profile)

      if (!fromApi.statsTrialEndsAt && fromApi.plan !== "pro") {
        fromApi.statsTrialEndsAt = ensureClientTrialFallback(auth.id)
      }

      setSubscription(fromApi)
    } catch {
      setSubscription({
        ...defaultSubscription,
        statsTrialEndsAt: ensureClientTrialFallback(auth.id),
      })
    } finally {
      setLoading(false)
    }
  }, [auth?.id])

  useEffect(() => {
    if (authLoading) return
    void refreshPlan()
  }, [authLoading, refreshPlan])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const billing = params.get("billing")
    if (billing !== "success" && billing !== "cancel") return

    void refreshPlan()
    params.delete("billing")
    const next = `${window.location.pathname}${
      params.toString() ? `?${params}` : ""
    }${window.location.hash}`
    window.history.replaceState({}, "", next)
  }, [refreshPlan])

  const startCheckout = useCallback(
    async (returnPath = "/home") => {
      setCheckoutLoading(true)
      try {
        const url = await createCheckoutSession(returnPath)
        window.location.assign(url)
      } finally {
        setCheckoutLoading(false)
      }
    },
    []
  )

  const openBillingPortal = useCallback(async (returnPath = "/home") => {
    setCheckoutLoading(true)
    try {
      const url = await createBillingPortalSession(returnPath)
      window.location.assign(url)
    } finally {
      setCheckoutLoading(false)
    }
  }, [])

  const entitlements = useMemo(
    () => buildEntitlements(subscription),
    [subscription]
  )

  const value = useMemo(
    () => ({
      loading: authLoading || loading,
      subscription,
      entitlements,
      refreshPlan,
      startCheckout,
      openBillingPortal,
      checkoutLoading,
    }),
    [
      authLoading,
      loading,
      subscription,
      entitlements,
      refreshPlan,
      startCheckout,
      openBillingPortal,
      checkoutLoading,
    ]
  )

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>
}

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext)
  if (!ctx) {
    throw new Error("usePlan must be used within PlanProvider")
  }
  return ctx
}
