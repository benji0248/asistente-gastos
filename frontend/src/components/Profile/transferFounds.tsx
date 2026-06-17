import { useState } from "react"
import useAuth from "../../hooks/useAuth"
import { useAxiosPrivate } from "../../hooks/useAxiosPrivate"
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

interface Props {
  account: Account
  listOfAccounts: listOfAccounts
}

export const TransferFounds = ({ account, listOfAccounts }: Props) => {
  const { auth } = useAuth()
  const account_id = account.id
  const actualBalance = account.balance
  const axiosPrivate = useAxiosPrivate()
  const [show, setShow] = useState(false)
  const [amount, setAmount] = useState<number>(account.balance)
  const [accountToTransfer, setAccountToTransfer] = useState<string>("")

  const handleClose = () => setShow(false)
  const handleShow = () => setShow(true)

  const handleAmountChange = (e: string) => {
    const value = e
    if (value === "") {
      setAmount(0)
    } else {
      setAmount(parseFloat(value))
    }
  }

  const addFounds = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log(amount)
    try {
      const response = await axiosPrivate.put(
        `/${auth.id}/accounts/${account_id}/transfer`,
        JSON.stringify({ accountToTransfer, amount }),
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      )
      console.log(JSON.stringify(response.data))
      console.log(JSON.stringify(response))
    } catch (err) {
      console.log("Error en el componente EditFounds", err)
    }
  }

  const exceedsBalance = amount > actualBalance

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleShow}>
        Transferir Fondos
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
                value={String(account.balance)}
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
                placeholder="0"
                name="amount"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
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
                value={accountToTransfer}
                onValueChange={setAccountToTransfer}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Elija una cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {listOfAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.description}
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
                onClick={handleClose}
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
