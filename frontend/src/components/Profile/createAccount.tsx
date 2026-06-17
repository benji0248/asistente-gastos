import { useState } from "react"
import useAuth from "../../hooks/useAuth"
import { useAxiosPrivate } from "../../hooks/useAxiosPrivate"
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

function CreateAccount() {
  const { auth } = useAuth()
  const [show, setShow] = useState<boolean>(false)
  const [type, setType] = useState<string>("")
  const [balance, setBalance] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const axiosPrivate = useAxiosPrivate()
  const handleClose = () => setShow(false)
  const handleShow = () => setShow(true)

  const addNewAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const newAccountData = {
      type: type,
      balance: balance,
      description: description,
    }
    try {
      const response = await axiosPrivate.post(
        `/${auth.id}/accounts`,
        JSON.stringify(newAccountData),
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      )
      console.log(JSON.stringify(response.data))
      console.log(JSON.stringify(response))
    } catch (err) {
      console.log("Error en el componente CreateAccount", err)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={handleShow}>
        + Agrega una fuente de fondos
      </Button>
      <Dialog open={show} onOpenChange={setShow}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar fuente de fondos</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => addNewAccount(e)} className="space-y-4">
            <div className="space-y-2">
              <Label>Fuente de fondos</Label>
              <Select value={type} onValueChange={setType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Elija una fuente de fondos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_account">Cuenta Bancaria</SelectItem>
                  <SelectItem value="virtual_wallet">
                    Billetera Virtual
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-description">Cuenta</Label>
              <Input
                id="account-description"
                type="text"
                placeholder="Nombre de la cuenta"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-balance">Dinero en cuenta</Label>
              <Input
                id="account-balance"
                type="text"
                placeholder="0"
                name="balance"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={handleClose}>
                Cerrar
              </Button>
              <Button type="submit" onClick={handleClose}>
                Agregar fuente de fondos
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default CreateAccount
