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

interface Props {
  account: Account
  onAccountsChange?: () => void
}

export const AddFounds = ({ account, onAccountsChange }: Props) => {
  const { auth } = useAuth()
  const account_id = account.id
  const axiosPrivate = useAxiosPrivate()
  const [show, setShow] = useState(false)
  const [amount, setAmount] = useState<number>(0)

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
    try {
      await axiosPrivate.put(
        `/${auth.id}/accounts/${account_id}/add`,
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
      console.log("Error en el componente AddFounds", err)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleShow}>
        Agregar Fondos
      </Button>
      <Dialog open={show} onOpenChange={setShow}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar fondos a la cuenta</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => addFounds(e)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-amount">
                Ingrese el dinero que desea agregar
              </Label>
              <Input
                id="add-amount"
                type="text"
                placeholder="0"
                name="amount"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={handleClose}>
                Cerrar
              </Button>
              <Button type="submit">
                Agregar Fondos
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
