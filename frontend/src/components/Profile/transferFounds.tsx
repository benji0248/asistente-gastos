import { useState } from "react"
import useHousehold from "@/hooks/useHousehold"
import { transferFunds } from "@/lib/db/accounts"
import { Account, listOfAccounts } from "../../types"
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
import { cn } from "@/lib/utils"
import { formatMoneyInput, normalizeMoneyInput, parseMoneyInput } from "@/lib/formatMoney"

interface Props {
  account: Account
  listOfAccounts: listOfAccounts
  onAccountsChange?: () => void
  compact?: boolean
}

export const TransferFounds = ({
  account,
  listOfAccounts,
  onAccountsChange,
  compact,
}: Props) => {
  const { isLinked, getOwnerName } = useHousehold()
  const account_id = account.id
  const actualBalance = account.balance
  const [show, setShow] = useState(false)
  const [amount, setAmount] = useState<number>(account.balance)
  const [amountInput, setAmountInput] = useState(formatMoneyInput(account.balance))
  const [accountToTransfer, setAccountToTransfer] = useState<string>("")

  const handleClose = () => setShow(false)
  const handleShow = () => setShow(true)

  const handleAmountChange = (e: string) => {
    const nextValue = normalizeMoneyInput(e)
    setAmountInput(nextValue)
    setAmount(parseMoneyInput(nextValue))
  }

  const addFounds = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log(amount)
    try {
      await transferFunds(account_id, accountToTransfer, amount)
      setShow(false)
      setAmount(0)
      setAmountInput("")
      onAccountsChange?.()
    } catch (err) {
      console.log("Error en el componente EditFounds", err)
    }
  }

  const exceedsBalance = amount > actualBalance

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleShow}>
        {compact ? "Transferir" : "Transferir Fondos"}
      </Button>
      <Dialog open={show} onOpenChange={setShow}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transferir Fondos</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => addFounds(e)} className="space-y-4">
            <div className="space-y-2">
              <Label>{account.description}</Label>
              <Input
                type="text"
                value={formatMoneyInput(account.balance)}
                name="balance1"
                title={account.description}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-amount">
                Ingrese el monto a transferir
              </Label>
              <Input
                id="transfer-amount"
                type="text"
                inputMode="decimal"
                placeholder="0"
                name="amount"
                value={amountInput}
                onChange={(e) => handleAmountChange(e.target.value)}
                onBlur={() => setAmountInput(formatMoneyInput(amount))}
                required
              />
              {exceedsBalance && (
                <p className="text-sm text-destructive">
                  No puedes transferir esa cantidad porque no tienes ese dinero
                  en la cuenta
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Cuenta destino</Label>
              <Select
                value={accountToTransfer || undefined}
                onValueChange={setAccountToTransfer}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Elija una cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {listOfAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={String(acc.id)}>
                      {isLinked
                        ? `@${getOwnerName(acc.user_id)} - ${acc.description}`
                        : acc.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={handleClose}>
                Cerrar
              </Button>
              <Button
                type="submit"
                disabled={exceedsBalance}
                className={cn(exceedsBalance && "pointer-events-none opacity-50")}
              >
                Transferir
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
