import { FormEvent, useCallback, useEffect, useState } from "react"
import axios from "axios"
import useAuth from "@/hooks/useAuth"
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate"
import type { Category, HouseholdRecurringExpense } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
  if (axios.isAxiosError(err)) {
    const message = err.response?.data?.message
    if (typeof message === "string" && message.trim()) return message
  }
  if (err instanceof Error && err.message) return err.message
  return fallback
}

export function HouseholdRecurringExpenses() {
  const { auth } = useAuth()
  const axiosPrivate = useAxiosPrivate()
  const [items, setItems] = useState<HouseholdRecurringExpense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState<FormState>(emptyForm())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [rentDialogItem, setRentDialogItem] = useState<HouseholdRecurringExpense | null>(null)

  const categoryMap = new Map(categories.map((category) => [String(category.id), category.name]))

  const loadData = useCallback(async () => {
    if (!auth?.id) return
    setLoading(true)
    setError("")
    try {
      const [recurringRes, categoriesRes] = await Promise.all([
        axiosPrivate.get("/household/recurring-expenses"),
        axiosPrivate.get(`/${auth.id}/categories?active=true`),
      ])
      setItems(recurringRes.data ?? [])
      setCategories(categoriesRes.data ?? [])
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron cargar los gastos del hogar"))
    } finally {
      setLoading(false)
    }
  }, [auth?.id, axiosPrivate])

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
        await axiosPrivate.put(`/household/recurring-expenses/${editingId}`, payload)
      } else {
        await axiosPrivate.post("/household/recurring-expenses", payload)
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
      await axiosPrivate.delete(`/household/recurring-expenses/${id}`)
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
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-xl border border-border/40 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <p className="font-medium capitalize">{item.title}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {item.amount_type === "fixed" ? "Fijo" : "Estimado"}
                    </Badge>
                    {item.fixed_amount != null && (
                      <span className="text-sm text-muted-foreground">
                        ${formatMoney(item.fixed_amount)}
                      </span>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {item.category_id
                        ? categoryMap.get(String(item.category_id)) ?? "Categoría"
                        : "Sin categoría"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {isRentRecurring(item, categoryMap) && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="min-h-10"
                      disabled={saving}
                      onClick={() => setRentDialogItem(item)}
                    >
                      <Calculator className="mr-1 h-4 w-4" />
                      Calcular alquiler
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-10"
                    disabled={saving}
                    onClick={() => startEdit(item)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-10 text-destructive hover:text-destructive"
                    disabled={saving}
                    onClick={() => void handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
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
