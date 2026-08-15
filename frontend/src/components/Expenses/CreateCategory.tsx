import { useMemo, useState } from "react"
import useAuth from "../../hooks/useAuth"
import { useAppData } from "@/context/AppDataProvider"
import { usePlan } from "@/context/PlanProvider"
import { createCategory } from "@/lib/db/categories"
import { canCreateCategory, FREE_MAX_CATEGORIES } from "@/lib/billing/plans"
import { UpgradePaywall } from "@/components/billing/UpgradePaywall"
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

function CreateCategory({ onCreated }: { onCreated?: () => void }) {
  const { auth } = useAuth()
  const { categories } = useAppData()
  const { entitlements } = usePlan()
  const [name, setName] = useState<string>("")
  const [show, setShow] = useState<boolean>(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const userCategories = useMemo(
    () => categories.filter((c) => !c.is_system),
    [categories]
  )

  const handleClose = () => {
    setShow(false)
    setError(null)
  }

  const handleShow = () => {
    if (!canCreateCategory(userCategories.length, entitlements)) {
      setShowUpgrade(true)
      return
    }
    setShow(true)
  }

  const addNewCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!auth?.id) return

    if (!canCreateCategory(userCategories.length, entitlements)) {
      setShow(false)
      setShowUpgrade(true)
      return
    }

    try {
      setError(null)
      await createCategory(auth.id, name)
      setName("")
      setShow(false)
      onCreated?.()
    } catch (err) {
      console.error("Error en el componente CreateCategory", err)
      setError(
        err instanceof Error ? err.message : "No se pudo crear la categoría"
      )
    }
  }

  return (
    <>
      <Button variant="outline" onClick={handleShow}>
        Crea una categoría
        {!entitlements.isPro && entitlements.maxCategories != null
          ? ` (${userCategories.length}/${FREE_MAX_CATEGORIES})`
          : ""}
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
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <DialogFooter>
              <Button variant="outline" type="button" onClick={handleClose}>
                Cerrar
              </Button>
              <Button type="submit">Agregar categoría</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <UpgradePaywall
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        feature="unlimited_categories"
        returnPath={window.location.pathname}
      />
    </>
  )
}
export default CreateCategory
