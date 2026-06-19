import React, { useEffect, useState } from "react"
import { actualDate } from "../../consts"
import useAuth from "../../hooks/useAuth"
import useHousehold from "@/hooks/useHousehold"
import { useAxiosPrivate } from "../../hooks/useAxiosPrivate"
import { Account, Category } from "../../types"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sparkles } from "lucide-react"
import type { ReceiptParseResult } from "@/lib/receiptParser"
import { formatMoneyInput, normalizeMoneyInput, parseMoneyInput } from "@/lib/formatMoney"

interface CreateExpenseProps {
  categories: Category[]
  accounts: Account[]
  scanResult?: ReceiptParseResult | null
  onScanConsumed?: () => void
  onExpenseCreated?: () => void
}

const confidenceLabel = {
  high: "Lectura confiable — revisa y confirma.",
  medium: "Lectura parcial — verifica monto y nombre.",
  low: "Lectura débil — completa los campos manualmente.",
}

export const CreateExpense = ({
  categories,
  accounts,
  scanResult,
  onScanConsumed,
  onExpenseCreated,
}: CreateExpenseProps) => {
  const { auth } = useAuth()
  const [title, setTitle] = useState<string>("")
  const [amount, setAmount] = useState<number>(0)
  const [amountInput, setAmountInput] = useState("")
  const [type, setType] = useState<string>("")
  const [, setCreatedDate] = useState<Date>()
  const [paidDate] = useState<Date>()
  const [paidMethod, setPaidMethod] = useState<string>("")
  const [paid, setPaid] = useState<boolean>(false)
  const [show, setShow] = useState(false)
  const [fromScan, setFromScan] = useState(false)
  const [scanConfidence, setScanConfidence] =
    useState<ReceiptParseResult["confidence"] | null>(null)
  const [saving, setSaving] = useState(false)
  const [pendingScan, setPendingScan] = useState<ReceiptParseResult | null>(null)
  const axiosPrivate = useAxiosPrivate()
  const { isLinked, getOwnerName } = useHousehold()

  const handleClose = () => {
    setShow(false)
    setFromScan(false)
    setScanConfidence(null)
  }

  const handleShow = () => {
    setShow(true)
    setCreatedDate(actualDate())
  }

  const applyScanResult = (result: ReceiptParseResult, accountList: Account[]) => {
    setTitle(result.title)
    setAmount(result.amount)
    setAmountInput(formatMoneyInput(result.amount))
    if (result.categoryId) setType(result.categoryId)
    setPaid(true)
    setFromScan(true)
    setScanConfidence(result.confidence)

    const efectivo = accountList.find((a) =>
      a.type?.toLowerCase().includes("efectivo")
    )
    const defaultAccount = efectivo ?? accountList[0]
    if (defaultAccount) setPaidMethod(defaultAccount.id)

    setShow(true)
    setCreatedDate(actualDate())
  }

  useEffect(() => {
    if (!scanResult) return
    setPendingScan(scanResult)
    onScanConsumed?.()
  }, [scanResult, onScanConsumed])

  useEffect(() => {
    if (!pendingScan || accounts.length === 0) return
    applyScanResult(pendingScan, accounts)
    setPendingScan(null)
  }, [pendingScan, accounts])

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaid(e.target.value === "true")
  }

  const handleAmountChange = (value: string) => {
    const nextValue = normalizeMoneyInput(value)
    setAmountInput(nextValue)
    setAmount(parseMoneyInput(nextValue))
  }

  const addNewExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const newExpenseData = {
      title,
      amount,
      payment_date: paidDate,
      is_paid: paid,
      user_id: auth.id,
      category_id: type,
      account_id: paidMethod,
    }

    setSaving(true)
    try {
      await axiosPrivate.post(`/${auth.id}/expenses`, JSON.stringify(newExpenseData), {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      })
      setTitle("")
      setAmount(0)
      setAmountInput("")
      setType("")
      setPaidMethod("")
      setPaid(false)
      setFromScan(false)
      setScanConfidence(null)
      setShow(false)
      onExpenseCreated?.()
    } catch (err) {
      console.log("Error en el componente CreateExpenses", err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={handleShow}>
        Agregar Gasto
      </Button>
      <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {fromScan ? "Confirmar gasto escaneado" : "Agrega un nuevo gasto"}
            </DialogTitle>
          </DialogHeader>

          {fromScan && scanConfidence && (
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>{confidenceLabel[scanConfidence]}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={addNewExpense} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Gasto</Label>
              <Input
                id="title"
                type="text"
                placeholder="Ingrese el titulo o nombre del gasto"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                placeholder="Ej: 2500 o 2500,50"
                name="amount"
                value={amountInput}
                onChange={(e) => handleAmountChange(e.target.value)}
                onBlur={() => setAmountInput(formatMoneyInput(amount))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={type || undefined} onValueChange={setType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Elija la categoría del gasto" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Pagado</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="paid"
                    value="true"
                    checked={paid === true}
                    onChange={handleRadioChange}
                    required
                  />
                  Sí
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="paid"
                    value="false"
                    checked={paid === false}
                    onChange={handleRadioChange}
                    required
                  />
                  No
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Método de Pago</Label>
              <Select value={paidMethod || undefined} onValueChange={setPaidMethod} required>
                <SelectTrigger>
                  <SelectValue placeholder="Elija el método de pago" />
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
            <DialogFooter>
              <Button variant="outline" type="button" onClick={handleClose}>
                Cerrar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Agregar Gasto"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
