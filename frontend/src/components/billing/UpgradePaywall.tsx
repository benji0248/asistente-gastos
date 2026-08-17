import { useEffect } from "react"
import { useUpgradeModal } from "@/context/UpgradeModalProvider"
import type { BillingFeature } from "@/lib/billing/plans"

/** Opens the shared Pro modal when `open` is true (legacy trigger API). */
export function UpgradePaywall({
  open,
  onOpenChange,
  feature,
  returnPath,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  feature: BillingFeature
  returnPath?: string
}) {
  const { openUpgrade } = useUpgradeModal()

  useEffect(() => {
    if (!open) return
    openUpgrade({ feature, returnPath })
    onOpenChange(false)
  }, [open, feature, returnPath, openUpgrade, onOpenChange])

  return null
}

export { InlineUpgradeCard } from "./ProUpgradeModal"
