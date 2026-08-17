import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { ProUpgradeModal } from "@/components/billing/ProUpgradeModal"
import type { BillingFeature } from "@/lib/billing/plans"

interface UpgradeModalState {
  open: boolean
  feature: BillingFeature | null
  returnPath: string
}

interface UpgradeModalContextValue {
  openUpgrade: (options?: {
    feature?: BillingFeature
    returnPath?: string
  }) => void
  closeUpgrade: () => void
}

const UpgradeModalContext = createContext<UpgradeModalContextValue | null>(null)

export function UpgradeModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UpgradeModalState>({
    open: false,
    feature: null,
    returnPath: "/home",
  })

  const openUpgrade = useCallback(
    (options?: { feature?: BillingFeature; returnPath?: string }) => {
      setState({
        open: true,
        feature: options?.feature ?? null,
        returnPath: options?.returnPath ?? window.location.pathname,
      })
    },
    []
  )

  const closeUpgrade = useCallback(() => {
    setState((current) => ({ ...current, open: false }))
  }, [])

  const value = useMemo(
    () => ({ openUpgrade, closeUpgrade }),
    [openUpgrade, closeUpgrade]
  )

  return (
    <UpgradeModalContext.Provider value={value}>
      {children}
      <ProUpgradeModal
        open={state.open}
        onOpenChange={(open) => {
          if (!open) closeUpgrade()
          else setState((current) => ({ ...current, open: true }))
        }}
        feature={state.feature}
        returnPath={state.returnPath}
      />
    </UpgradeModalContext.Provider>
  )
}

export function useUpgradeModal(): UpgradeModalContextValue {
  const ctx = useContext(UpgradeModalContext)
  if (!ctx) {
    throw new Error("useUpgradeModal must be used within UpgradeModalProvider")
  }
  return ctx
}
