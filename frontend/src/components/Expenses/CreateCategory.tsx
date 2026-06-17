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

function CreateCategory() {
  const { auth } = useAuth()
  const axiosPrivate = useAxiosPrivate()
  const [name, setName] = useState<string>("")
  const [show, setShow] = useState<boolean>(false)
  const handleClose = () => setShow(false)
  const handleShow = () => setShow(true)

  const addNewCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const response = await axiosPrivate.post(
        `/${auth.id}/categories`,
        JSON.stringify({ name }),
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
      console.log("Error en el componente CreateCategory", err)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={handleShow}>
        Crea una categoría
      </Button>
      <Dialog open={show} onOpenChange={setShow}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agrega una categoría de gasto</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => addNewCategory(e)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Nombre</Label>
              <Input
                id="category-name"
                type="text"
                placeholder="Categoría"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={handleClose}>
                Cerrar
              </Button>
              <Button type="submit" onClick={handleClose}>
                Agregar categoría
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
export default CreateCategory
