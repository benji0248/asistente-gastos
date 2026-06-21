import { useEffect } from "react"
import { Link } from "react-router-dom"
import useAuth from "@/hooks/useAuth"
import useHousehold from "@/hooks/useHousehold"
import { ensureRecurringExpenses } from "@/lib/db/household"
import { PageHeader } from "../layout/PageHeader"
import { HouseholdSettings } from "./HouseholdSettings"
import { HouseholdRecurringExpenses } from "./HouseholdRecurringExpenses"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { SectionLoader } from "../layout/SectionLoader"

function Hogar() {
  const { auth } = useAuth()
  const { household, members, loading, fetchError, refreshHousehold } = useHousehold()

  useEffect(() => {
    void ensureRecurringExpenses().catch(console.warn)
  }, [])

  return (
    <div className="space-y-6 sm:space-y-10">
      <PageHeader
        title="Hogar"
        description={
          household
            ? `Gestioná ${household.name} y sus miembros`
            : "Compartí gastos, cuentas y balance con tu familia"
        }
      />

      {fetchError && (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{fetchError}</span>
            <Button variant="outline" size="sm" onClick={() => void refreshHousehold()}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {loading && !household ? (
        <SectionLoader />
      ) : (
        <HouseholdSettings />
      )}

      {household && <HouseholdRecurringExpenses />}

      {household && members.length > 1 && (
        <p className="text-sm text-muted-foreground">
          Tu hogar está activo con {members.length} personas. Los gastos y cuentas compartidos
          también se ven en{" "}
          <Link to="/home" className="font-medium text-foreground underline-offset-4 hover:underline">
            Inicio
          </Link>{" "}
          y en{" "}
          <Link
            to={`/${auth?.id}/expenses`}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Gastos
          </Link>
          .
        </p>
      )}
    </div>
  )
}

export default Hogar
