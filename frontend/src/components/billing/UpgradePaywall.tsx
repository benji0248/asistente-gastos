import { Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { usePlan } from "@/context/PlanProvider"
import {
  getFeatureCopy,
  PRO_PRICE_USD,
  type BillingFeature,
} from "@/lib/billing/plans"

interface UpgradePaywallProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feature: BillingFeature
  returnPath?: string
}

export function UpgradePaywall({
  open,
  onOpenChange,
  feature,
  returnPath,
}: UpgradePaywallProps) {
  const { startCheckout, checkoutLoading, entitlements } = usePlan()
  const copy = getFeatureCopy(feature)

  if (entitlements.isSelfHosted || entitlements.isPro) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {copy.title} es Pro
          </DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm">
          <p className="font-medium text-foreground">Gastito Pro</p>
          <p className="mt-1 text-muted-foreground">
            USD {PRO_PRICE_USD.toFixed(2)} / mes · cancelás cuando quieras
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Ahora no
          </Button>
          <Button
            disabled={checkoutLoading}
            onClick={() => void startCheckout(returnPath)}
          >
            {checkoutLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Pasarme a Pro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface InlineUpgradeCardProps {
  feature: BillingFeature
  returnPath?: string
  extra?: string
}

export function InlineUpgradeCard({
  feature,
  returnPath,
  extra,
}: InlineUpgradeCardProps) {
  const { startCheckout, checkoutLoading, entitlements } = usePlan()
  const copy = getFeatureCopy(feature)

  if (entitlements.isSelfHosted || entitlements.isPro) return null

  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-6 text-center shadow-sm">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background">
        <Sparkles className="h-4 w-4" />
      </div>
      <h2 className="font-display text-xl font-semibold">{copy.title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {copy.description}
      </p>
      {extra ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{extra}</p>
      ) : null}
      <p className="mt-4 text-sm font-medium">
        Pro por USD {PRO_PRICE_USD.toFixed(2)} / mes
      </p>
      <Button
        className="mt-4"
        disabled={checkoutLoading}
        onClick={() => void startCheckout(returnPath)}
      >
        {checkoutLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        Activar Pro
      </Button>
    </div>
  )
}
