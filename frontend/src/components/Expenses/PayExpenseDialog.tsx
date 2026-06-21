import { useEffect, useState } from "react"
import { Loader2, Wallet } from "lucide-react"
import useAuth from "@/hooks/useAuth"
import useHousehold from "@/hooks/useHousehold"
import { completeExpense } from "@/lib/db/expenses"
import { Account, Expense } from "@/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatMoney } from "@/lib/formatMoney"

interface PayExpenseDialogProps {
  open: boolean
  expense: Expense | null
  accounts: Account[]
  onClose: () => void
  onPaid: () => void
}

function defaultPayAccountId(accounts: Account[], expenseAccountId?: string | number): string {
  const expenseAccountKey =
    expenseAccountId != null && expenseAccountId !== ""
      ? String(expenseAccountId)
      : ""
  if (expenseAccountKey && accounts.some((a) => String(a.id) === expenseAccountKey)) {
    return expenseAccountKey
  }
  const bank = accounts.find(
    (a) =>
      a.type === "bank_account" ||
      a.description?.toLowerCase().includes("banco") ||
      a.description?.toLowerCase().includes("cuenta")
  )
  const efectivo = accounts.find((a) => a.type?.toLowerCase().includes("cash"))
  const fallback = bank ?? efectivo ?? accounts[0]
  return fallback ? String(fallback.id) : ""
}

export function PayExpenseDialog({
  open,
  expense,
  accounts,
  onClose,
  onPaid,
}: PayExpenseDialogProps) {
  const { auth } = useAuth()
  const { isLinked, getOwnerName } = useHousehold()
  const [accountId, setAccountId] = useState("")
  const [saving, setSaving] = useState(false)

  const total = expense ? Number(expense.amount) : 0
  const alreadyPaid = expense ? Number(expense.amount_paid ?? 0) : 0
  const remaining = expense ? Math.max(0, total - alreadyPaid) : 0
  const canSave = Boolean(expense && accountId && remaining > 0)

  useEffect(() => {
    if (!open || !expense || accounts.length === 0) return
    setAccountId(defaultPayAccountId(accounts, expense.account_id))
  }, [open, expense, accounts])

  const handlePay = async () => {
    if (!canSave || !auth?.id || !expense) return
    setSaving(true)
    try {
      await completeExpense(String(expense.id), String(accountId))
      onPaid()
      onClose()
    } catch (err) {
      console.error("Error al pagar gasto", err)
    } finally {
      setSaving(false)
    }
  }

  if (!expense) return null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pagar gasto</DialogTitle>
          <DialogDescription>
            Elegí desde qué cuenta se realiza el pago. Se descontará el saldo de la
            cuenta seleccionada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-sm space-y-1">
            <p className="font-medium capitalize">{expense.title}</p>
            <p className="text-muted-foreground">
              Total: ${formatMoney(total)}
            </p>
            {alreadyPaid > 0 && (
              <p className="text-muted-foreground">
                Ya pagado: ${formatMoney(alreadyPaid)}
              </p>
            )}
            <p className="font-medium">A pagar: ${formatMoney(remaining)}</p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Método de pago
            </Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Elegí el método de pago" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={String(account.id)}>
                    {isLinked
                      ? `@${getOwnerName(account.user_id)} - ${account.description}`
                      : account.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" type="button" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" onClick={handlePay} disabled={!canSave || saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Pagando...
              </>
            ) : (
              `Pagar $${formatMoney(remaining)}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
