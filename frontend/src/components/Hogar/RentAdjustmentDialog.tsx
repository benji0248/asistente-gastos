import { useEffect, useMemo, useState } from "react"
import type { HouseholdRecurringExpense } from "@/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SectionLoader } from "../layout/SectionLoader"
import { formatMoney } from "@/lib/formatMoney"
import {
  applyRentAdjustment,
  getRentAdjustmentContext,
  RENT_IPC_PERIOD_MONTHS,
} from "@/lib/db/rentAdjustment"
import {
  calculateRentAdjustment,
  RENT_DEPOSIT_MONTHS,
  type RentAdjustmentResult,
} from "@/lib/rentAdjustment"

interface RentAdjustmentContext {
  current_rent: number
  adjustment_label: string
  ipc_months: Array<{ month: number; year: number; label: string }>
  deposit_months: number
}

interface Props {
  item: HouseholdRecurringExpense
  open: boolean
  onOpenChange: (open: boolean) => void
  onApplied?: () => void
}

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) return err.message
  return fallback
}

function parseIpcInput(value: string) {
  const cleaned = value.trim().replace(",", ".")
  if (!cleaned) return NaN
  return Number.parseFloat(cleaned)
}

export function RentAdjustmentDialog({ item, open, onOpenChange, onApplied }: Props) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [context, setContext] = useState<RentAdjustmentContext | null>(null)
  const [ipcInputs, setIpcInputs] = useState<string[]>(
    Array.from({ length: RENT_IPC_PERIOD_MONTHS }, () => "")
  )
  const [preview, setPreview] = useState<RentAdjustmentResult | null>(null)

  useEffect(() => {
    if (!open) {
      setPreview(null)
      setError("")
      setIpcInputs(Array.from({ length: RENT_IPC_PERIOD_MONTHS }, () => ""))
      return
    }

    let isMounted = true
    const loadContext = async () => {
      setLoading(true)
      setError("")
      try {
        const data = await getRentAdjustmentContext(item.id)
        if (!isMounted) return
        setContext(data)
      } catch (err) {
        if (!isMounted) return
        setError(getErrorMessage(err, "No se pudo cargar el alquiler actual"))
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    void loadContext()
    return () => {
      isMounted = false
    }
  }, [item.id, open])

  const ipcRates = useMemo(
    () => ipcInputs.map((value) => parseIpcInput(value)),
    [ipcInputs]
  )

  const canCalculate =
    context != null && context.current_rent > 0 && ipcRates.every((rate) => Number.isFinite(rate))

  const handleCalculate = () => {
    if (!context) return
    setError("")
    try {
      setPreview(
        calculateRentAdjustment({
          currentRent: context.current_rent,
          ipcRates,
        })
      )
    } catch (err) {
      setPreview(null)
      setError(getErrorMessage(err, "No se pudo calcular el alquiler"))
    }
  }

  const handleApply = async () => {
    if (!preview || !context) return
    setSaving(true)
    setError("")
    try {
      await applyRentAdjustment(item.id, ipcRates)
      onApplied?.()
      onOpenChange(false)
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo aplicar el ajuste de alquiler"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Calcular nuevo alquiler</DialogTitle>
        </DialogHeader>

        {loading ? (
          <SectionLoader minHeight="min-h-[180px]" />
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-border/40 bg-muted/30 p-3 text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Plantilla:</span>{" "}
                <span className="font-medium capitalize">{item.title}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Alquiler actual (mes anterior):</span>{" "}
                <span className="font-medium">
                  {context && context.current_rent > 0
                    ? `$${formatMoney(context.current_rent)}`
                    : "Sin monto previo"}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">Ajuste para:</span>{" "}
                <span className="font-medium">{context?.adjustment_label}</span>
              </p>
              <p className="text-muted-foreground">
                Depósito: {RENT_DEPOSIT_MONTHS} meses · Período IPC: {RENT_IPC_PERIOD_MONTHS} meses
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">
                IPC de los últimos {RENT_IPC_PERIOD_MONTHS} meses (%)
              </p>
              {context?.ipc_months.map((ipcMonth, index) => (
                <div key={`${ipcMonth.label}-${index}`} className="space-y-2">
                  <Label htmlFor={`ipc-${index}`}>{ipcMonth.label}</Label>
                  <Input
                    id={`ipc-${index}`}
                    inputMode="decimal"
                    placeholder="Ej: 2,5"
                    value={ipcInputs[index] ?? ""}
                    onChange={(event) =>
                      setIpcInputs((current) => {
                        const next = [...current]
                        next[index] = event.target.value
                        return next
                      })
                    }
                  />
                </div>
              ))}
            </div>

            {preview && (
              <div className="rounded-xl border border-border/40 bg-muted/20 p-3 text-sm space-y-2">
                <p className="font-medium">Resultado</p>
                <p className="text-muted-foreground break-words">{preview.formula}</p>
                <p>
                  Alquiler nuevo:{" "}
                  <span className="font-medium">${formatMoney(preview.newRent)}</span>
                </p>
                <p>
                  Depósito actual: ${formatMoney(preview.depositCurrent)} · Depósito nuevo: $
                  {formatMoney(preview.depositNew)}
                </p>
                <p>
                  Depósito adicional:{" "}
                  <span className="font-medium">${formatMoney(preview.depositDifference)}</span>
                </p>
                <p className="font-medium">
                  Total del mes: ${formatMoney(preview.totalToPay)} (alquiler + depósito adicional)
                </p>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" variant="secondary" onClick={handleCalculate} disabled={!canCalculate || saving}>
            Calcular
          </Button>
          <Button type="button" onClick={() => void handleApply()} disabled={!preview || saving}>
            {saving ? "Aplicando..." : "Aplicar ajuste"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function isRentRecurring(item: HouseholdRecurringExpense, categoryMap: Map<string, string>) {
  if (/alquiler/i.test(item.title)) return true
  const categoryName =
    item.category_id != null ? categoryMap.get(String(item.category_id)) : undefined
  return categoryName?.toLowerCase() === "alquiler"
}

export { isRentRecurring }
