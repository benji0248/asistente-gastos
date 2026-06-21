import { useEffect, useState } from "react"

import { Calendar, Loader2, Wallet } from "lucide-react"

import useAuth from "@/hooks/useAuth"

import useHousehold from "@/hooks/useHousehold"

import { Account } from "@/types"
import { useAppData } from "@/context/AppDataProvider"
import { registerStatementPaymentApi, remainingBillAmount } from "@/lib/creditCardStatementsApi"

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

import { formatCurrencyArs } from "@/lib/formatCurrency"
import { formatMoneyInput, normalizeMoneyInput, parseMoneyInput } from "@/lib/formatMoney"

import type { CreditCardStatement } from "@/lib/bbvaStatementParser"
import type { StatementBillExpense } from "@/lib/creditCardStatementsApi"



type PaymentOption = "minimum" | "remaining" | "custom"



interface RegisterPaymentDialogProps {

  open: boolean

  statementId?: string

  statement: CreditCardStatement | null

  billExpense?: StatementBillExpense | null

  ownerUserId?: string

  onClose: () => void

  onSaved: () => void

}



function defaultPayAccountId(accounts: Account[]): string {

  const bank = accounts.find(

    (a) =>

      a.type === "bank_account" ||

      a.description?.toLowerCase().includes("banco") ||

      a.description?.toLowerCase().includes("cuenta")

  )

  const efectivo = accounts.find((a) => a.type?.toLowerCase().includes("cash"))

  return (bank ?? efectivo ?? accounts[0])?.id ?? ""

}



export function RegisterPaymentDialog({

  open,

  statementId,

  statement,

  billExpense,

  ownerUserId,

  onClose,

  onSaved,

}: RegisterPaymentDialogProps) {

  const { auth } = useAuth()

  const { isLinked, getOwnerName } = useHousehold()
  const { accounts } = useAppData()

  const [paymentOption, setPaymentOption] = useState<PaymentOption>("minimum")

  const [customAmount, setCustomAmount] = useState("")

  const [accountId, setAccountId] = useState("")

  const [saving, setSaving] = useState(false)



  const remaining = remainingBillAmount(billExpense)



  useEffect(() => {
    if (!open || accounts.length === 0) return
    setAccountId(defaultPayAccountId(accounts))
  }, [open, accounts])



  useEffect(() => {

    if (!statement || !open) return

    setPaymentOption("minimum")

    setCustomAmount(formatMoneyInput(statement.minimumPayment))

  }, [statement, open])



  if (!statement) return null



  const resolvedAmount =

    paymentOption === "minimum"

      ? Math.min(statement.minimumPayment, remaining)

      : paymentOption === "remaining"

        ? remaining

        : Math.min(parseMoneyInput(customAmount), remaining)



  const expenseOwnerId = ownerUserId ?? auth?.id

  const canSave = resolvedAmount > 0 && accountId && expenseOwnerId && remaining > 0 && statementId



  const handleSave = async () => {

    if (!canSave || !auth?.id || !expenseOwnerId || !statementId) return

    setSaving(true)

    try {

      await registerStatementPaymentApi(statementId, resolvedAmount, accountId)

      onSaved()

      onClose()

    } catch (err) {

      console.error("Error registrando pago de tarjeta", err)

    } finally {

      setSaving(false)

    }

  }



  return (

    <Dialog open={open} onOpenChange={(o) => !o && !saving && onClose()}>

      <DialogContent className="sm:max-w-md">

        <DialogHeader>

          <DialogTitle>Registrar pago parcial</DialogTitle>

          <DialogDescription>

            El pago se descuenta del gasto pendiente del resumen. Podés pagar de a

            poco hasta cubrir el total.

          </DialogDescription>

        </DialogHeader>



        <div className="space-y-4">

          <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-sm space-y-1">

            <p className="flex items-center gap-2">

              <Calendar className="h-4 w-4 text-muted-foreground" />

              Vence el {statement.dueDate}

            </p>

            <p className="text-muted-foreground">

              Total del resumen: {formatCurrencyArs(statement.totalBalanceArs)}

            </p>

            {billExpense && (

              <>

                <p className="text-muted-foreground">

                  Ya pagado: {formatCurrencyArs(billExpense.amount_paid)}

                </p>

                <p className="font-medium">

                  Falta pagar: {formatCurrencyArs(remaining)}

                </p>

              </>

            )}

          </div>



          {remaining <= 0 ? (

            <p className="text-sm text-muted-foreground">

              Este resumen ya está pagado en su totalidad.

            </p>

          ) : (

            <>

              <div className="space-y-2">

                <Label>Monto de este pago</Label>

                <div className="grid gap-2">

                  <label className="flex min-h-11 items-center gap-2 rounded-xl border border-border/50 bg-muted/20 px-3 text-sm">

                    <input

                      type="radio"

                      name="paymentOption"

                      checked={paymentOption === "minimum"}

                      onChange={() => setPaymentOption("minimum")}

                    />

                    Pago mínimo ({formatCurrencyArs(Math.min(statement.minimumPayment, remaining))})

                  </label>

                  <label className="flex min-h-11 items-center gap-2 rounded-xl border border-border/50 bg-muted/20 px-3 text-sm">

                    <input

                      type="radio"

                      name="paymentOption"

                      checked={paymentOption === "remaining"}

                      onChange={() => setPaymentOption("remaining")}

                    />

                    Saldo restante ({formatCurrencyArs(remaining)})

                  </label>

                  <label className="flex min-h-11 items-center gap-2 rounded-xl border border-border/50 bg-muted/20 px-3 text-sm">

                    <input

                      type="radio"

                      name="paymentOption"

                      checked={paymentOption === "custom"}

                      onChange={() => setPaymentOption("custom")}

                    />

                    Otro monto

                  </label>

                </div>

                {paymentOption === "custom" && (

                  <Input
                    type="text"
                    inputMode="decimal"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(normalizeMoneyInput(e.target.value))}
                    onBlur={() => setCustomAmount(formatMoneyInput(parseMoneyInput(customAmount)))}
                    placeholder="Monto en pesos"
                  />

                )}

              </div>



              <div className="space-y-2">

                <Label className="flex items-center gap-2">

                  <Wallet className="h-4 w-4" />

                  Pagado desde

                </Label>

                <Select value={accountId} onValueChange={setAccountId}>

                  <SelectTrigger>

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

            </>

          )}

        </div>



        <DialogFooter className="gap-2 sm:gap-0">

          <Button variant="outline" type="button" onClick={onClose} disabled={saving}>

            Cancelar

          </Button>

          <Button type="button" onClick={handleSave} disabled={!canSave || saving}>

            {saving ? (

              <>

                <Loader2 className="mr-2 h-4 w-4 animate-spin" />

                Guardando...

              </>

            ) : (

              `Registrar pago de ${formatCurrencyArs(resolvedAmount)}`

            )}

          </Button>

        </DialogFooter>

      </DialogContent>

    </Dialog>

  )

}

