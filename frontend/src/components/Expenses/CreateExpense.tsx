import React, { useEffect, useState } from "react"
import { actualDate } from "../../consts"
import useAuth from "../../hooks/useAuth"
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

export const CreateExpense = () => {
  const { auth } = useAuth()
  const [title, setTitle] = useState<string>("")
  const [amount, setAmount] = useState<number>(0)
  const [type, setType] = useState<string>("")
  const [, setCreatedDate] = useState<Date>()
  const [paidDate] = useState<Date>()
  const [paidMethod, setPaidMethod] = useState<string>("")
  const [paid, setPaid] = useState<boolean>(false)
  const [show, setShow] = useState(false)
  const [category, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const axiosPrivate = useAxiosPrivate()
  const handleClose = () => setShow(false)
  const handleShow = () => {
    setShow(true)
    const date = actualDate()
    setCreatedDate(date)
  }

  useEffect(() => {
    axiosPrivate
      .get(`/${auth.id}/categories`)
      .then((response) => {
        setCategories(response.data)
      })
      .catch((error) => {
        console.error("Error fetching categories:", error)
      })
    axiosPrivate
      .get(`/${auth.id}/accounts`)
      .then((response) => {
        setAccounts(response.data)
      })
      .catch((error) => {
        console.error("Error fetching accounts:", error)
      })
  }, [])

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "true"
    setPaid(value)
  }

  const handleAmountChange = (e: string) => {
    const value = e
    if (value === "") {
      setAmount(0)
    } else {
      setAmount(parseFloat(value))
    }
  }

  const addNewExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const newExpenseData = {
      title: title,
      amount: amount,
      payment_date: paidDate,
      is_paid: paid,
      user_id: auth.id,
      category_id: type,
      account_id: paidMethod,
    }
    console.log(newExpenseData)
    try {
      const response = await axiosPrivate.post(
        `/${auth.id}/expenses`,
        JSON.stringify(newExpenseData),
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      )
      console.log(JSON.stringify(response.data))
      console.log(JSON.stringify(response))
    } catch (err) {
      console.log("Error en el componente CreateExpenses", err)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={handleShow}>
        Agregar Gasto
      </Button>
      <Dialog open={show} onOpenChange={setShow}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agrega un nuevo gasto</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => addNewExpense(e)} className="space-y-4">
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
                placeholder="Ingrese el monto a pagar"
                name="amount"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={type} onValueChange={setType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Elija la categoría del gasto" />
                </SelectTrigger>
                <SelectContent>
                  {category.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
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
              <Select value={paidMethod} onValueChange={setPaidMethod} required>
                <SelectTrigger>
                  <SelectValue placeholder="Elija el método de pago" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={handleClose}>
                Cerrar
              </Button>
              <Button type="submit" onClick={handleClose}>
                Agregar Gasto
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
