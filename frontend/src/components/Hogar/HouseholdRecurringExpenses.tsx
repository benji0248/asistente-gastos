import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { useAppData } from "@/context/AppDataProvider"
import useAuth from "@/hooks/useAuth"
import { getSelectableCategories } from "@/lib/categoryUtils"
import {
  createRecurringExpense,
  deleteRecurringExpense,
  listRecurringExpenses,
  updateRecurringExpense,
} from "@/lib/db/household"
import type { HouseholdRecurringExpense } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SectionLoader } from "../layout/SectionLoader"
import { formatMoneyInput, normalizeMoneyInput, parseMoneyInput } from "@/lib/formatMoney"
import { formatMoney } from "@/lib/formatMoney"
import { Pencil, Trash2, Calculator, Plus } from "lucide-react"
import { RentAdjustmentDialog, isRentRecurring } from "./RentAdjustmentDialog"

const NONE_CATEGORY = "__none__"

type AmountType = "fixed" | "estimated"

interface FormState {
  title: string
  amountType: AmountType
  amountInput: string
  categoryId: string
}

const emptyForm = (): FormState => ({
  title: "",
  amountType: "estimated",
  amountInput: "",
  categoryId: NONE_CATEGORY,
})

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) return err.message
  return fallback
}

export function HouseholdRecurringExpenses() {
  const { auth } = useAuth()
  const { categories: contextCategories } = useAppData()
  const [items, setItems] = useState<HouseholdRecurringExpense[]>([])
  const categories = useMemo(
    () => getSelectableCategories(contextCategories, auth?.id ?? ""),
    [contextCategories, auth?.id]
  )
  const categoryMap = useMemo(
    () => new Map(contextCategories.map((category) => [String(category.id), category.name])),
    [contextCategories]
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState<FormState>(emptyForm())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [rentDialogItem, setRentDialogItem] = useState<HouseholdRecurringExpense | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      setItems(await listRecurringExpenses())
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron cargar los gastos del hogar"))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const resetForm = () => {
    setForm(emptyForm())
    setEditingId(null)
    setFormOpen(false)
    setError("")
  }

  const openAddForm = () => {
    setForm(emptyForm())
    setEditingId(null)
    setError("")
    setFormOpen(true)
  }

  const startEdit = (item: HouseholdRecurringExpense) => {
    setEditingId(item.id)
    setForm({
      title: item.title,
      amountType: item.amount_type,
      amountInput: item.fixed_amount != null ? formatMoneyInput(item.fixed_amount) : "",
      categoryId: item.category_id != null ? String(item.category_id) : NONE_CATEGORY,
    })
    setError("")
    setFormOpen(true)
  }

  const buildPayload = () => {
    const amount = parseMoneyInput(form.amountInput)
    return {
      title: form.title.trim(),
      amount_type: form.amountType,
      fixed_amount: amount,
      category_id: form.categoryId === NONE_CATEGORY ? null : Number(form.categoryId),
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.title.trim()) {
      setError("Indicá un nombre para el gasto")
      return
    }
    if (parseMoneyInput(form.amountInput) <= 0) {
      setError("Indicá un monto válido")
      return
    }

    setSaving(true)
    setError("")
    try {
      const payload = buildPayload()
      if (editingId) {
        await updateRecurringExpense(editingId, payload)
      } else {
        await createRecurringExpense(payload)
      }
      resetForm()
      await loadData()
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo guardar el gasto del hogar"))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setSaving(true)
    setError("")
    try {
      await deleteRecurringExpense(id)
      if (editingId === id) resetForm()
      await loadData()
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo eliminar el gasto del hogar"))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <SectionLoader minHeight="min-h-[200px]" />
  }

  return (
    <Card className="border-border/40 shadow-soft">
      <CardContent className="space-y-5 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium">Gastos mensuales del hogar</p>
            <p className="text-sm text-muted-foreground">
              Se crean automáticamente como pendientes el 1° de cada mes. Los estimados arrancan con
              el monto que cargues y luego usan el del mes anterior.
            </p>
          </div>
          <Button type="button" className="w-full shrink-0 sm:w-auto" onClick={openAddForm}>
            <Plus className="mr-1 h-4 w-4" />
            Agregar gasto
          </Button>
        </div>

        {error && !formOpen && <p className="text-sm text-destructive">{error}</p>}

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-xl border border-dashed border-border/40 px-3 py-6 text-center">
            Todavía no hay gastos del hogar. Tocá &quot;Agregar gasto&quot; para crear uno.
          </p>
        ) : (
          <div className="divide-y divide-border/40 rounded-xl border border-border/40">
            {items.map((item) => {
              const categoryLabel = item.category_id
                ? categoryMap.get(String(item.category_id)) ?? "Categoría"
                : "Sin categoría"
              const amountLabel =
                item.fixed_amount != null ? `$${formatMoney(item.fixed_amount)}` : null
              const typeLabel = item.amount_type === "fixed" ? "Fijo" : "Estimado"
              const showRentCalc = isRentRecurring(item, categoryMap)

              return (
                <div key={item.id} className="px-2.5 py-2 sm:px-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="min-w-0 flex-1 truncate text-sm font-medium capitalize">
                      {item.title}
                    </p>
                    {amountLabel && (
                      <span className="shrink-0 text-sm font-medium tabular-nums">
                        {amountLabel}
                      </span>
                    )}
                    <div className="flex shrink-0 items-center -mr-1">
                      {showRentCalc && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          disabled={saving}
                          aria-label="Calcular alquiler"
                          title="Calcular alquiler"
                          onClick={() => setRentDialogItem(item)}
                        >
                          <Calculator className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        disabled={saving}
                        aria-label="Editar gasto"
                        onClick={() => startEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                        disabled={saving}
                        aria-label="Eliminar gasto"
                        onClick={() => void handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {typeLabel}
                    {" · "}
                    {categoryLabel}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={formOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar gasto del hogar" : "Agregar gasto del hogar"}
            </DialogTitle>
          </DialogHeader>

          <form id="recurring-expense-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recurring-title">Nombre</Label>
              <Input
                id="recurring-title"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Ej: Alquiler, Luz, Expensas"
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurring-type">Tipo de monto</Label>
              <Select
                value={form.amountType}
                onValueChange={(value: AmountType) =>
                  setForm((current) => ({ ...current, amountType: value }))
                }
              >
                <SelectTrigger id="recurring-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fijo (mismo monto siempre)</SelectItem>
                  <SelectItem value="estimated">Estimado (usa el mes anterior)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurring-amount">
                {form.amountType === "fixed" ? "Monto mensual" : "Monto actual (estimado)"}
              </Label>
              <Input
                id="recurring-amount"
                inputMode="decimal"
                value={form.amountInput}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    amountInput: normalizeMoneyInput(event.target.value),
                  }))
                }
                placeholder="Ej: 450000"
                required
              />
              {form.amountType === "estimated" && (
                <p className="text-xs text-muted-foreground">
                  Podés actualizarlo cuando llegue el monto real. Se refleja en Gastos del mes si
                  aún está pendiente.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurring-category">Categoría (opcional)</Label>
              <Select
                value={form.categoryId}
                onValueChange={(value) => setForm((current) => ({ ...current, categoryId: value }))}
              >
                <SelectTrigger id="recurring-category">
                  <SelectValue placeholder="Sin categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_CATEGORY}>Sin categoría</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" disabled={saving} onClick={resetForm}>
              Cancelar
            </Button>
            <Button type="submit" form="recurring-expense-form" disabled={saving}>
              {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {rentDialogItem && (
        <RentAdjustmentDialog
          item={rentDialogItem}
          open={Boolean(rentDialogItem)}
          onOpenChange={(open) => {
            if (!open) setRentDialogItem(null)
          }}
          onApplied={() => void loadData()}
        />
      )}
    </Card>
  )
}
