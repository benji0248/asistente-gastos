import { useMemo, useState } from "react"
import { Check, Eye, EyeOff, Pencil, X } from "lucide-react"
import useAuth from "../../hooks/useAuth"
import {
  deleteCategory as removeCategory,
  updateCategory,
} from "@/lib/db/categories"
import {
  countCategoryNameOccurrences,
  isDuplicateCategoryName,
  sortCategoriesForProfile,
} from "@/lib/categoryUtils"
import { Category } from "../../types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface Props {
  categories: Category[]
  onChange: (categories: Category[]) => void
}

export function CategoryPreferences({ categories, onChange }: Props) {
  const { auth } = useAuth()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  const ownCategories = useMemo(
    () =>
      sortCategoriesForProfile(
        categories.filter((c) => c.user_id === auth?.id)
      ),
    [categories, auth?.id]
  )

  const nameCounts = useMemo(
    () => countCategoryNameOccurrences(ownCategories),
    [ownCategories]
  )

  const toggleVisibility = async (category: Category) => {
    const nextEnabled = !category.is_enabled
    try {
      await updateCategory(category.id, { is_enabled: nextEnabled })
      onChange(
        categories.map((c) =>
          c.id === category.id ? { ...c, is_enabled: nextEnabled } : c
        )
      )
    } catch (err) {
      console.error("Error al cambiar visibilidad de categoría", err)
    }
  }

  const startEdit = (category: Category) => {
    setEditingId(category.id)
    setEditName(category.name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName("")
  }

  const saveEdit = async (category: Category) => {
    const trimmed = editName.trim()
    if (!trimmed || trimmed === category.name) {
      cancelEdit()
      return
    }
    try {
      await updateCategory(category.id, { name: trimmed })
      onChange(
        categories.map((c) =>
          c.id === category.id ? { ...c, name: trimmed } : c
        )
      )
      cancelEdit()
    } catch (err) {
      console.error("Error al renombrar categoría", err)
    }
  }

  const handleDeleteCategory = async (category: Category) => {
    const label = category.is_system ? "base" : "personalizada"
    const confirmed = window.confirm(
      `¿Eliminar la categoría ${label} «${category.name}»? Los gastos que la usen quedarán sin categoría.`
    )
    if (!confirmed) return

    try {
      await removeCategory(category.id)
      onChange(categories.filter((c) => c.id !== category.id))
      if (editingId === category.id) cancelEdit()
    } catch (err) {
      console.error("Error al eliminar categoría", err)
    }
  }

  if (ownCategories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay categorías. Se crearán las categorías base al iniciar sesión.
      </p>
    )
  }

  const systemCategories = ownCategories.filter((c) => c.is_system)
  const customCategories = ownCategories.filter((c) => !c.is_system)

  const renderCategoryRow = (category: Category) => {
    const isEditing = editingId === category.id
    const isDuplicate = isDuplicateCategoryName(category, nameCounts)

    return (
      <div
        key={category.id}
        className={cn(
          "flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2",
          category.is_enabled
            ? "border-border/60 bg-background"
            : "border-border/40 bg-muted/30 opacity-80"
        )}
      >
        {isEditing ? (
          <>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-9 min-w-[10rem] flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") void saveEdit(category)
                if (e.key === "Escape") cancelEdit()
              }}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-9 w-9 shrink-0"
              onClick={() => void saveEdit(category)}
              title="Guardar nombre"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-9 w-9 shrink-0"
              onClick={cancelEdit}
              title="Cancelar"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <span
              className={cn(
                "min-w-0 flex-1 text-sm font-medium",
                !category.is_enabled && "line-through text-muted-foreground"
              )}
            >
              {category.name}
            </span>
            {category.is_system && (
              <Badge variant="secondary" className="rounded-full text-[10px]">
                Base
              </Badge>
            )}
            {isDuplicate && (
              <Badge variant="outline" className="rounded-full text-[10px]">
                Duplicada
              </Badge>
            )}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-9 w-9 shrink-0"
              onClick={() => toggleVisibility(category)}
              title={
                category.is_enabled
                  ? "Ocultar en gastos e inicio"
                  : "Mostrar en gastos e inicio"
              }
            >
              {category.is_enabled ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-9 w-9 shrink-0"
              onClick={() => startEdit(category)}
              title="Renombrar"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => void handleDeleteCategory(category)}
              title="Eliminar categoría"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Acá ves todas tus categorías, incluidas las del seed y las que creaste.
        Podés renombrarlas, ocultarlas o eliminar duplicados. En los formularios
        de gastos solo aparece una por nombre.
      </p>
      {systemCategories.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Categorías base
          </h3>
          <div className="space-y-2">{systemCategories.map(renderCategoryRow)}</div>
        </div>
      )}
      {customCategories.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tus categorías
          </h3>
          <div className="space-y-2">{customCategories.map(renderCategoryRow)}</div>
        </div>
      )}
    </div>
  )
}
