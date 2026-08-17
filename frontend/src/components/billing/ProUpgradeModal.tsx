import {
  BarChart3,
  Camera,
  Check,
  CreditCard,
  House,
  RefreshCw,
  Sparkles,
  Tags,
} from "lucide-react"
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
  FREE_MAX_CATEGORIES,
  getFeatureCopy,
  isCheckoutEnabled,
  PRO_PRICE_USD,
  type BillingFeature,
} from "@/lib/billing/plans"

const PRO_BENEFITS = [
  {
    icon: BarChart3,
    title: "Estadísticas completas",
    description: "Análisis mes a mes, categorías e insights sin límite de trial.",
  },
  {
    icon: Camera,
    title: "Escanear tickets",
    description: "Foto del ticket → gasto pre-cargado con OCR.",
  },
  {
    icon: CreditCard,
    title: "Tarjetas de crédito",
    description: "Importá resúmenes PDF y controlá el pago del mes.",
  },
  {
    icon: House,
    title: "Hogar / familia",
    description: "Compartí gastos y cuentas con tu pareja o familia.",
  },
  {
    icon: RefreshCw,
    title: "Gastos fijos automáticos",
    description: "Los gastos mensuales del hogar se generan solos.",
  },
  {
    icon: Tags,
    title: "Categorías ilimitadas",
    description: `Más de ${FREE_MAX_CATEGORIES} categorías propias (Free: máximo ${FREE_MAX_CATEGORIES}).`,
  },
] as const

interface ProUpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feature?: BillingFeature | null
  returnPath?: string
}

export function ProUpgradeModal({
  open,
  onOpenChange,
  feature,
  returnPath,
}: ProUpgradeModalProps) {
  const { startCheckout, checkoutLoading, entitlements } = usePlan()
  const checkoutReady = isCheckoutEnabled()
  const highlight = feature ? getFeatureCopy(feature) : null

  if (entitlements.isSelfHosted || entitlements.isPro) return null

  const handleContinue = () => {
    if (!checkoutReady) return
    void startCheckout(returnPath ?? window.location.pathname)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background">
              <Sparkles className="h-4 w-4" />
            </span>
            Gastito Pro
          </DialogTitle>
          <DialogDescription>
            {highlight
              ? `${highlight.title} es parte de Pro. ${highlight.description}`
              : "Desbloqueá automatización, familia y análisis avanzado de tus finanzas."}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border/60 bg-muted/25 px-4 py-3">
          <p className="text-sm font-medium">Free sigue incluyendo</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Gastos y cuentas ilimitados, uso individual, hasta {FREE_MAX_CATEGORIES}{" "}
            categorías.
          </p>
        </div>

        <ul className="space-y-3">
          {PRO_BENEFITS.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="flex gap-3 rounded-xl border border-border/50 px-3 py-2.5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 text-left">
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <Check className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            </li>
          ))}
        </ul>

        <div className="rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-3 text-center">
          <p className="font-display text-2xl font-bold tabular-nums">
            USD {PRO_PRICE_USD.toFixed(2)}
            <span className="text-base font-normal text-muted-foreground"> / mes</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Cancelás cuando quieras · acceso inmediato al confirmar el pago
          </p>
        </div>

        {!checkoutReady ? (
          <p className="text-center text-sm text-muted-foreground">
            Los medios de pago se habilitan pronto. Por ahora podés seguir usando Free
            sin límites en gastos y cuentas.
          </p>
        ) : null}

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="w-full"
            disabled={!checkoutReady || checkoutLoading}
            onClick={handleContinue}
          >
            {checkoutLoading ? "Redirigiendo…" : checkoutReady ? "Continuar al pago" : "Pago próximamente"}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Seguir con Free
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
  onUpgradeClick?: () => void
}

export function InlineUpgradeCard({
  feature,
  extra,
  onUpgradeClick,
}: InlineUpgradeCardProps) {
  const { entitlements } = usePlan()
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
        Disponible en Pro · USD {PRO_PRICE_USD.toFixed(2)} / mes
      </p>
      <Button className="mt-4" onClick={onUpgradeClick}>
        Ver plan Pro
      </Button>
    </div>
  )
}
