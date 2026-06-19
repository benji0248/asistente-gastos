import { useState } from "react"
import useAuth from "../../hooks/useAuth"
import { useAxiosPrivate } from "../../hooks/useAxiosPrivate"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  id: string
  title: string
  onExpenseMutated?: () => void
  className?: string
}

export const DeleteModalExpense = ({ id, title, onExpenseMutated, className }: Props) => {
  const { auth } = useAuth()
  const axiosPrivate = useAxiosPrivate()
  const [show, setShow] = useState(false)
  const handleClose = () => setShow(false)
  const handleShow = () => {
    console.log(auth.id)
    console.log(id)
    setShow(true)
  }
  const handleDelete = async () => {
    try {
      await axiosPrivate.delete(`/${auth.id}/expenses/${id}`, {
        withCredentials: true,
      })
      onExpenseMutated?.()
    } catch (err) {
      console.log("Error en el componente DeleteExpenses", err)
    }
    handleClose()
  }

  return (
    <>
      <Button variant="ghost" size="icon" onClick={handleShow} className={cn("shrink-0", className)}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
      <Dialog open={show} onOpenChange={setShow}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Gasto</DialogTitle>
            <DialogDescription>
              ¿Estás seguro que quieres eliminar el gasto {title}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cerrar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Borrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
