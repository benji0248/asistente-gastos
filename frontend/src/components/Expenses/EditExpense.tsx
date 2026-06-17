import React, { useState } from "react"
import { actualDate } from "../../consts"
import {
  Account,
  Category,
  Expense,
  listOfAccounts,
  listOfCategories,
} from "../../types"
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
import { Pencil } from "lucide-react"

interface Props {
  expense: Expense
  categories: listOfCategories
  accounts: listOfAccounts
}

export const EditExpense = ({ expense, categories, accounts }: Props) => {
  const { auth } = useAuth()
  const axiosPrivate = useAxiosPrivate()
  const id = expense.id
  const [title, setTitle] = useState<string>(expense.title)
  const [amount, setAmount] = useState<number>(expense.amount)
  const [type, setType] = useState<string>(expense.category_id)
  const [, setCreatedDate] = useState<Date>()
  const [paidDate, setPaidDate] = useState<Date>()
  const [paidMethod, setPaidMethod] = useState<string>(expense.account_id)
  const [paid, setPaid] = useState<boolean>(expense.is_paid)

  const [show, setShow] = useState(false)
  const handleClose = () => setShow(false)
  const handleShow = () => {
    setShow(true)
    const date = actualDate()
    setPaidDate(date)
    setCreatedDate(expense.created_at)
  }

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "true"
    setPaid(value)
  }

  const editCurrentExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const editedExpense = {
      id: id,
      title: title,
      amount: amount,
      payment_date: paidDate,
      is_paid: paid,
      user_id: auth.id,
      category_id: type,
      account_id: paidMethod,
    }
    console.log(editedExpense)
    try {
      const response = await axiosPrivate.put(
        `/${auth.id}/expenses/${id}`,
        JSON.stringify(editedExpense),
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      )
      console.log(JSON.stringify(response.data))
      console.log(JSON.stringify(response))
    } catch (err) {
      console.log("Error en el componente EditExpenses", err)
    }
  }

  return (
    <>
      <Button variant="ghost" size="icon" onClick={handleShow}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Dialog open={show} onOpenChange={setShow}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Gasto</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => editCurrentExpense(e)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Gasto</Label>
              <Input
                id="edit-title"
                type="text"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Monto</Label>
              <Input
                id="edit-amount"
                type="text"
                name="amount"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value))}
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
                  {categories.map((category: Category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
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
                  {accounts.map((account: Account) => (
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
                Editar Gasto
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
