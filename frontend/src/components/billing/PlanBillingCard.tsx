import { Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePlan } from "@/context/PlanProvider"
import { useUpgradeModal } from "@/context/UpgradeModalProvider"
import { FREE_MAX_CATEGORIES, PRO_PRICE_USD } from "@/lib/billing/plans"

const PRO_PERKS = [
  "Estadísticas sin límite de trial",
  "Escanear tickets",
  "Tarjetas de crédito",
  "Hogar / familia y gastos fijos",
  `Categorías ilimitadas (Free: ${FREE_MAX_CATEGORIES})`,
]

export function PlanBillingCard() {
  const {
    entitlements,
    subscription,
    openBillingPortal,
    checkoutLoading,
    loading,
  } = usePlan()
  const { openUpgrade } = useUpgradeModal()

  if (entitlements.isSelfHosted) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary" className="rounded-full">
            Self-hosted · todo desbloqueado
          </Badge>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base">Plan</CardTitle>
        <Badge variant={entitlements.isPro ? "secondary" : "outline"} className="rounded-full">
          {entitlements.isPro ? "Pro" : "Free"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando plan…</p>
        ) : entitlements.isPro ? (
          <>
            <p className="text-sm text-muted-foreground">
              Tenés Gastito Pro activo
              {subscription.currentPeriodEnd
                ? ` · renovación ${new Date(
                    subscription.currentPeriodEnd
                  ).toLocaleDateString("es")}`
                : ""}
              {subscription.cancelAtPeriodEnd ? " · se cancela al final del período" : ""}.
            </p>
            <Button
              variant="outline"
              disabled={checkoutLoading}
              onClick={() => void openBillingPortal(window.location.pathname)}
            >
              {checkoutLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Administrar suscripción
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Free incluye gastos y cuentas sin límite. Pro desbloquea el resto por USD{" "}
              {PRO_PRICE_USD.toFixed(2)} / mes.
            </p>
            {entitlements.statsTrialActive ? (
              <p className="text-sm text-muted-foreground">
                Trial de estadísticas: {entitlements.statsTrialDaysLeft} día
                {entitlements.statsTrialDaysLeft === 1 ? "" : "s"} restante
                {entitlements.statsTrialDaysLeft === 1 ? "" : "s"}.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                El trial de 12 días de estadísticas ya terminó.
              </p>
            )}
            <ul className="space-y-2 text-sm">
              {PRO_PERKS.map((perk) => (
                <li key={perk} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
            <Button
              disabled={checkoutLoading}
              onClick={() => openUpgrade({ returnPath: window.location.pathname })}
            >
              Ver plan Pro · ${PRO_PRICE_USD.toFixed(2)}/mes
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
