import { useEffect, useState } from "react"
import { Loader2, Trash2 } from "lucide-react"
import useAuth from "@/hooks/useAuth"
import useHousehold from "@/hooks/useHousehold"
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate"
import { Account, Category } from "@/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import type { ReceiptParseResult } from "@/lib/receiptParser"

export interface ScannedReceiptDraft {
  id: string
  previewUrl: string
  title: string
  amount: number
  categoryId: string
  accountId: string
  included: boolean
  confidence: ReceiptParseResult["confidence"]
  failed?: boolean
}

interface BatchReceiptReviewProps {
  open: boolean
  drafts: ScannedReceiptDraft[]
  categories: Category[]
  onClose: () => void
  onDraftsChange: (drafts: ScannedReceiptDraft[]) => void
  onSaved: () => void
}

const confidenceBadge = {
  high: { label: "OK", variant: "secondary" as const },
  medium: { label: "Revisar", variant: "outline" as const },
  low: { label: "Débil", variant: "destructive" as const },
}

function defaultAccountId(accounts: Account[]): string {
  const efectivo = accounts.find((a) => a.type?.toLowerCase().includes("efectivo"))
  return (efectivo ?? accounts[0])?.id ?? ""
}

export function BatchReceiptReview({
  open,
  drafts,
  categories,
  onClose,
  onDraftsChange,
  onSaved,
}: BatchReceiptReviewProps) {
  const { auth } = useAuth()
  const { isLinked, getOwnerName } = useHousehold()
  const axiosPrivate = useAxiosPrivate()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [globalAccountId, setGlobalAccountId] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!auth?.id) return
    axiosPrivate
      .get(`/${auth.id}/accounts`)
      .then((res) => {
        const list: Account[] = res.data ?? []
        setAccounts(list)
        setGlobalAccountId(defaultAccountId(list))
      })
      .catch((err) => console.error("Error fetching accounts:", err))
  }, [auth?.id, axiosPrivate])

  const included = drafts.filter((d) => d.included && !d.failed)
  const canSave =
    included.length > 0 &&
    globalAccountId &&
    included.every(
      (d) => d.title.trim() && d.amount > 0 && d.categoryId
    )

  const updateDraft = (id: string, patch: Partial<ScannedReceiptDraft>) => {
    onDraftsChange(drafts.map((d) => (d.id === id ? { ...d, ...patch } : d)))
  }

  const removeDraft = (id: string) => {
    const next = drafts.filter((d) => d.id !== id)
    if (next.length === 0) onClose()
    else onDraftsChange(next)
  }

  const applyAccountToAll = (accountId: string) => {
    setGlobalAccountId(accountId)
    onDraftsChange(drafts.map((d) => ({ ...d, accountId })))
  }

  const resolveAccountId = (draft: ScannedReceiptDraft) =>
    draft.accountId || globalAccountId

  const handleSaveAll = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      await Promise.all(
        included.map((d) =>
          axiosPrivate.post(
            `/${auth.id}/expenses`,
            JSON.stringify({
              title: d.title.trim(),
              amount: d.amount,
              payment_date: undefined,
              is_paid: true,
              user_id: auth.id,
              category_id: d.categoryId,
              account_id: resolveAccountId(d),
            }),
            {
              headers: { "Content-Type": "application/json" },
              withCredentials: true,
            }
          )
        )
      )
      drafts.forEach((d) => URL.revokeObjectURL(d.previewUrl))
      onSaved()
      onClose()
    } catch (err) {
      console.error("Error guardando gastos en lote", err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Revisar tickets escaneados</DialogTitle>
          <DialogDescription>
            {drafts.length} ticket{drafts.length !== 1 ? "s" : ""} detectado
            {drafts.length !== 1 ? "s" : ""}. Edita lo necesario y guarda todos
            juntos.
          </DialogDescription>
        </DialogHeader>

        {accounts.length > 0 && (
          <div className="space-y-2 rounded-xl border border-border/60 bg-muted/30 p-3">
            <Label className="text-xs text-muted-foreground">
              Método de pago para todos
            </Label>
            <Select value={globalAccountId} onValueChange={applyAccountToAll}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Cuenta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {isLinked
                      ? `@${getOwnerName(account.user_id)} - ${account.description}`
                      : account.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {drafts.map((draft, index) => (
            <div
              key={draft.id}
              className="flex gap-3 rounded-xl border border-border/60 p-3"
            >
              <div className="flex shrink-0 flex-col items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft.included}
                  disabled={draft.failed}
                  onChange={(e) =>
                    updateDraft(draft.id, { included: e.target.checked })
                  }
                  className="mt-1"
                  aria-label={`Incluir ticket ${index + 1}`}
                />
                <img
                  src={draft.previewUrl}
                  alt={`Ticket ${index + 1}`}
                  className="h-16 w-14 rounded-lg object-cover bg-muted"
                />
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Ticket {index + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    {!draft.failed && (
                      <Badge variant={confidenceBadge[draft.confidence].variant}>
                        {confidenceBadge[draft.confidence].label}
                      </Badge>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground"
                      onClick={() => removeDraft(draft.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {draft.failed ? (
                  <p className="text-sm text-destructive">
                    No se pudo leer este ticket. Puedes quitarlo de la lista.
                  </p>
                ) : (
                  <>
                    <Input
                      value={draft.title}
                      onChange={(e) =>
                        updateDraft(draft.id, { title: e.target.value })
                      }
                      placeholder="Nombre del gasto"
                      className="h-8 text-sm"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={draft.amount || ""}
                        onChange={(e) =>
                          updateDraft(draft.id, {
                            amount: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="Monto"
                        className="h-8 text-sm"
                      />
                      <Select
                        value={draft.categoryId}
                        onValueChange={(v) =>
                          updateDraft(draft.id, { categoryId: v })
                        }
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" type="button" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSaveAll} disabled={!canSave || saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              `Guardar ${included.length} gasto${included.length !== 1 ? "s" : ""}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
