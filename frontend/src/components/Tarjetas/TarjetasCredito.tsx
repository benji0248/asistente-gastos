import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import useAuth from "@/hooks/useAuth"
import useHousehold from "@/hooks/useHousehold"
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate"
import { PageHeader } from "@/components/layout/PageHeader"
import { SectionLoader } from "@/components/layout/SectionLoader"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { CreditCardStatement } from "@/lib/bbvaStatementParser"
import {
  clearLegacyStatement,
  deleteStatementFromDb,
  fetchHouseholdStatements,
  loadLegacyStatement,
  saveStatementToDb,
  type StoredCreditCardStatement,
} from "@/lib/creditCardStatementsApi"
import { ImportStatementPdf } from "./ImportStatementPdf"
import { StatementSummaryCard } from "./StatementSummaryCard"
import { StatementBreakdown } from "./StatementBreakdown"
import { RegisterPaymentDialog } from "./RegisterPaymentDialog"
import { statementTabLabel } from "./statementTabLabel"

function StatementPanel({
  stored,
  isOwn,
  onRegisterPayment,
  onClear,
}: {
  stored: StoredCreditCardStatement
  isOwn: boolean
  onRegisterPayment: () => void
  onClear?: () => void
}) {
  return (
    <div className="space-y-4 pt-2">
      <StatementSummaryCard
        statement={stored.statement}
        billExpense={stored.billExpense}
        onRegisterPayment={onRegisterPayment}
        onClear={isOwn ? onClear : undefined}
      />
      <StatementBreakdown statement={stored.statement} />
    </div>
  )
}

function TarjetasCredito() {
  const { auth } = useAuth()
  const { isLinked, getOwnerName } = useHousehold()
  const axiosPrivate = useAxiosPrivate()
  const [statements, setStatements] = useState<StoredCreditCardStatement[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState<string>("")
  const [activeStatement, setActiveStatement] =
    useState<StoredCreditCardStatement | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentSaved, setPaymentSaved] = useState(false)
  const [savingImport, setSavingImport] = useState(false)

  const pickDefaultTab = useCallback(
    (rows: StoredCreditCardStatement[]) => {
      if (rows.length === 0) return ""
      const mine = rows.find((r) => r.userId === auth?.id)
      return mine?.userId ?? rows[0].userId
    },
    [auth?.id]
  )

  const loadStatements = useCallback(async () => {
    if (!auth?.id) return
    setLoadError(null)
    try {
      let rows = await fetchHouseholdStatements(axiosPrivate, auth.id)

      const legacy = loadLegacyStatement(auth.id)
      if (legacy && !rows.some((r) => r.userId === auth.id)) {
        const saved = await saveStatementToDb(axiosPrivate, auth.id, legacy)
        clearLegacyStatement(auth.id)
        rows = [saved, ...rows.filter((r) => r.userId !== auth.id)]
      }

      setStatements(rows)
      setSelectedTab((current) => {
        if (current && rows.some((r) => r.userId === current)) return current
        return pickDefaultTab(rows)
      })
    } catch (err) {
      console.error("Error cargando resúmenes", err)
      setLoadError("No se pudieron cargar los resúmenes de tarjeta.")
    } finally {
      setLoading(false)
    }
  }, [auth?.id, axiosPrivate, pickDefaultTab])

  useEffect(() => {
    void loadStatements()
  }, [loadStatements])

  const handleImported = async (parsed: CreditCardStatement) => {
    if (!auth?.id) return
    setSavingImport(true)
    setLoadError(null)
    try {
      const saved = await saveStatementToDb(axiosPrivate, auth.id, parsed)
      setStatements((prev) => [
        saved,
        ...prev.filter((s) => s.userId !== auth.id),
      ])
      setSelectedTab(auth.id)
      setPaymentSaved(false)
    } catch (err) {
      console.error("Error guardando resumen", err)
      setLoadError(
        "No se pudo guardar el resumen. Verificá la migración SQL en Supabase."
      )
    } finally {
      setSavingImport(false)
    }
  }

  const handleClear = async (ownerUserId: string) => {
    if (!auth?.id || auth.id !== ownerUserId) return
    try {
      await deleteStatementFromDb(axiosPrivate, auth.id, ownerUserId)
      setStatements((prev) => {
        const next = prev.filter((s) => s.userId !== ownerUserId)
        setSelectedTab(pickDefaultTab(next))
        return next
      })
    } catch (err) {
      console.error("Error eliminando resumen", err)
    }
  }

  const handlePaymentSaved = () => {
    setPaymentSaved(true)
    void loadStatements()
  }

  if (loading) return <SectionLoader />

  const myStatement = statements.find((s) => s.userId === auth?.id)
  const selectedStored =
    statements.find((s) => s.userId === selectedTab) ?? statements[0] ?? null

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Tarjetas de crédito"
        description={
          isLinked
            ? "Resúmenes compartidos con tu hogar"
            : "Subí tu resumen: se crea un gasto pendiente por el total"
        }
      />

      {loadError && (
        <Alert variant="destructive">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {paymentSaved && (
        <Alert>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>El pago se registró correctamente.</span>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/${auth?.id}/expenses`}>Ver gastos</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-4 sm:p-6">
        <div>
          <h2 className="font-medium">Subir mi resumen</h2>
          <p className="text-sm text-muted-foreground">
            Al importar el PDF se crea automáticamente un gasto pendiente por el
            monto total del resumen.
            {isLinked && " Tu pareja también lo verá aquí."}
          </p>
        </div>
        <ImportStatementPdf onImported={handleImported} disabled={savingImport} />
      </div>

      {statements.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/10 p-6 text-center sm:p-8">
          <p className="text-muted-foreground max-w-md mx-auto">
            Todavía no hay resúmenes cargados
            {isLinked ? " en tu hogar" : ""}.
          </p>
        </div>
      ) : statements.length === 1 && selectedStored ? (
        <StatementPanel
          stored={selectedStored}
          isOwn={selectedStored.userId === auth?.id}
          onRegisterPayment={() => {
            setActiveStatement(selectedStored)
            setShowPayment(true)
          }}
          onClear={
            selectedStored.userId === auth?.id
              ? () => void handleClear(selectedStored.userId)
              : undefined
          }
        />
      ) : (
        <Tabs
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="space-y-2"
        >
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 p-1">
            {statements.map((stored) => (
              <TabsTrigger
                key={stored.userId}
                value={stored.userId}
                className="min-h-10 flex-1 sm:flex-none"
              >
                {statementTabLabel(
                  stored,
                  auth?.id,
                  isLinked,
                  getOwnerName
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {statements.map((stored) => (
            <TabsContent key={stored.userId} value={stored.userId}>
              <StatementPanel
                stored={stored}
                isOwn={stored.userId === auth?.id}
                onRegisterPayment={() => {
                  setActiveStatement(stored)
                  setShowPayment(true)
                }}
                onClear={
                  stored.userId === auth?.id
                    ? () => void handleClear(stored.userId)
                    : undefined
                }
              />
            </TabsContent>
          ))}
        </Tabs>
      )}

      {!myStatement && statements.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Todavía no cargaste tu resumen.
        </p>
      )}

      <RegisterPaymentDialog
        open={showPayment}
        statement={activeStatement?.statement ?? null}
        billExpense={activeStatement?.billExpense}
        ownerUserId={activeStatement?.userId}
        onClose={() => setShowPayment(false)}
        onSaved={handlePaymentSaved}
      />
    </div>
  )
}

export default TarjetasCredito
