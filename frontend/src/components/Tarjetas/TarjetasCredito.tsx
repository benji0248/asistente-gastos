import { useCallback, useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"
import useAuth from "@/hooks/useAuth"
import useHousehold from "@/hooks/useHousehold"
import { PageHeader } from "@/components/layout/PageHeader"
import { SectionLoader } from "@/components/layout/SectionLoader"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { CreditCardStatement } from "@/lib/bbvaStatementParser"
import {
  currentStatementMonth,
  formatStatementMonthLabel,
  isCurrentCalendarMonth,
  shiftViewMonth,
} from "@/lib/db/dateRange"
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
import {
  countStatementsByUser,
  indexAmongUserStatements,
  statementTabLabel,
} from "./statementTabLabel"

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

function initialViewMonth() {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

function TarjetasCredito() {
  const { auth } = useAuth()
  const { isLinked, getOwnerName } = useHousehold()
  const [viewMonth, setViewMonth] = useState(initialViewMonth)
  const [statements, setStatements] = useState<StoredCreditCardStatement[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedStatementId, setSelectedStatementId] = useState<string>("")
  const [activeStatement, setActiveStatement] =
    useState<StoredCreditCardStatement | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentSaved, setPaymentSaved] = useState(false)
  const [savingImport, setSavingImport] = useState(false)

  const viewingCurrentMonth = isCurrentCalendarMonth(viewMonth.year, viewMonth.month)
  const monthLabel = formatStatementMonthLabel(viewMonth.year, viewMonth.month)
  const userCounts = useMemo(() => countStatementsByUser(statements), [statements])

  const pickDefaultStatementId = useCallback(
    (rows: StoredCreditCardStatement[]) => {
      if (rows.length === 0) return ""
      const mine = rows.find((r) => r.userId === auth?.id)
      return mine?.id ?? rows[0].id
    },
    [auth?.id]
  )

  const loadStatements = useCallback(async () => {
    if (!auth?.id) return
    setLoadError(null)
    try {
      let rows = await fetchHouseholdStatements(
        viewMonth.year,
        viewMonth.month,
        auth.id
      )

      if (viewingCurrentMonth) {
        const legacy = loadLegacyStatement(auth.id)
        const hasOwn = rows.some((r) => r.userId === auth.id)
        if (legacy && !hasOwn) {
          const saved = await saveStatementToDb(auth.id, legacy)
          clearLegacyStatement(auth.id)
          rows = [saved, ...rows]
        }
      }

      setStatements(rows)
      setSelectedStatementId((current) => {
        if (current && rows.some((r) => r.id === current)) return current
        return pickDefaultStatementId(rows)
      })
    } catch (err) {
      console.error("Error cargando resúmenes", err)
      setLoadError("No se pudieron cargar los resúmenes de tarjeta.")
    } finally {
      setLoading(false)
    }
  }, [auth?.id, pickDefaultStatementId, viewMonth.month, viewMonth.year, viewingCurrentMonth])

  useEffect(() => {
    setLoading(true)
    void loadStatements()
  }, [loadStatements])

  const handleImported = async (parsed: CreditCardStatement) => {
    if (!auth?.id) return
    setSavingImport(true)
    setLoadError(null)
    try {
      const saved = await saveStatementToDb(auth.id, parsed, currentStatementMonth())
      const now = new Date()
      const importMonth = {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      }
      if (
        importMonth.year !== viewMonth.year ||
        importMonth.month !== viewMonth.month
      ) {
        setViewMonth(importMonth)
      }
      const rows = await fetchHouseholdStatements(
        importMonth.year,
        importMonth.month,
        auth.id
      )
      setStatements(rows)
      setSelectedStatementId(saved.id)
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

  const handleClear = async (statementId: string) => {
    if (!auth?.id) return
    const target = statements.find((s) => s.id === statementId)
    if (!target || target.userId !== auth.id) return
    try {
      await deleteStatementFromDb(statementId)
      setStatements((prev) => {
        const next = prev.filter((s) => s.id !== statementId)
        setSelectedStatementId(pickDefaultStatementId(next))
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

  const shiftMonth = (delta: -1 | 1) => {
    setViewMonth((current) => shiftViewMonth(current.year, current.month, delta))
    setSelectedStatementId("")
  }

  if (loading) return <SectionLoader />

  const myStatementsInView = statements.filter((s) => s.userId === auth?.id)
  const selectedStored =
    statements.find((s) => s.id === selectedStatementId) ??
    statements[0] ??
    null

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
            monto total del resumen. Se guarda en el mes actual
            {!viewingCurrentMonth && " (aunque estés viendo otro mes)"}.
            {isLinked && " Tu pareja también lo verá aquí."}
          </p>
        </div>
        <ImportStatementPdf onImported={handleImported} disabled={savingImport} />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => shiftMonth(-1)}
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-center font-medium text-sm sm:text-base">{monthLabel}</h2>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => shiftMonth(1)}
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {statements.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-muted/10 p-6 text-center sm:p-8">
            <p className="text-muted-foreground max-w-md mx-auto">
              No hay resúmenes cargados en {monthLabel}
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
                ? () => void handleClear(selectedStored.id)
                : undefined
            }
          />
        ) : (
          <Tabs
            value={selectedStatementId}
            onValueChange={setSelectedStatementId}
            className="space-y-2"
          >
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 p-1">
              {statements.map((stored) => (
                <TabsTrigger
                  key={stored.id}
                  value={stored.id}
                  className="min-h-10 flex-1 sm:flex-none"
                >
                  {statementTabLabel(
                    stored,
                    auth?.id,
                    isLinked,
                    getOwnerName,
                    {
                      indexAmongUser: indexAmongUserStatements(stored, statements),
                      userStatementCount: userCounts.get(stored.userId) ?? 1,
                    }
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {statements.map((stored) => (
              <TabsContent key={stored.id} value={stored.id}>
                <StatementPanel
                  stored={stored}
                  isOwn={stored.userId === auth?.id}
                  onRegisterPayment={() => {
                    setActiveStatement(stored)
                    setShowPayment(true)
                  }}
                  onClear={
                    stored.userId === auth?.id
                      ? () => void handleClear(stored.id)
                      : undefined
                  }
                />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>

      {myStatementsInView.length === 0 && statements.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Todavía no cargaste resúmenes en {monthLabel}.
        </p>
      )}

      <RegisterPaymentDialog
        open={showPayment}
        statementId={activeStatement?.id}
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
