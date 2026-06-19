import { useState } from "react"
import useAuth from "../../hooks/useAuth"
import { useAxiosPrivate } from "../../hooks/useAxiosPrivate"
import { Account } from "../../types"
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
import { formatMoneyInput, normalizeMoneyInput, parseMoneyInput } from "@/lib/formatMoney"

interface Props {
  account: Account
  onAccountsChange?: () => void
  compact?: boolean
}

export const EditFounds = ({ account, onAccountsChange, compact }: Props) => {
  const { auth } = useAuth()
  const account_id = account.id
  const axiosPrivate = useAxiosPrivate()
  const [show, setShow] = useState(false)
  const [amount, setAmount] = useState<number>(account.balance)
  const [amountInput, setAmountInput] = useState(formatMoneyInput(account.balance))

  const handleClose = () => setShow(false)
  const handleShow = () => setShow(true)

  const handleAmountChange = (e: string) => {
    const nextValue = normalizeMoneyInput(e)
    setAmountInput(nextValue)
    setAmount(parseMoneyInput(nextValue))
  }

  const addFounds = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      await axiosPrivate.put(
        `/${auth.id}/accounts/${account_id}/edit`,
        JSON.stringify({ amount }),
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      )
      setShow(false)
      onAccountsChange?.()
    } catch (err) {
      console.log("Error en el componente EditFounds", err)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleShow}>
        {compact ? "Ajustar" : "Cambiar los fondos"}
      </Button>
      <Dialog open={show} onOpenChange={setShow}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar fondos de la cuenta</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => addFounds(e)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-amount">
                Ingrese el nuevo saldo de la cuenta
              </Label>
              <Input
                id="edit-amount"
                type="text"
                inputMode="decimal"
                placeholder="0"
                name="amount"
                value={amountInput}
                onChange={(e) => handleAmountChange(e.target.value)}
                onBlur={() => setAmountInput(formatMoneyInput(amount))}
                required
              />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={handleClose}>
                Cerrar
              </Button>
              <Button type="submit">
                Cambiar Fondos
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
