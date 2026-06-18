import useAuth from "../../hooks/useAuth"
import { useAxiosPrivate } from "../../hooks/useAxiosPrivate"
import { Category } from "../../types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Trash2 } from "lucide-react"

interface Props {
  categories: Category[]
  onChange: (categories: Category[]) => void
}

export function CategoryPreferences({ categories, onChange }: Props) {
  const { auth } = useAuth()
  const axiosPrivate = useAxiosPrivate()

  const toggleVisibility = async (category: Category) => {
    const nextEnabled = !category.is_enabled
    try {
      await axiosPrivate.put(
        `/${auth.id}/categories/${category.id}`,
        JSON.stringify({ is_enabled: nextEnabled }),
        { headers: { "Content-Type": "application/json" } }
      )
      onChange(
        categories.map((c) =>
          c.id === category.id ? { ...c, is_enabled: nextEnabled } : c
        )
      )
    } catch (err) {
      console.error("Error al cambiar visibilidad de categoría", err)
    }
  }

  const deleteCategory = async (category: Category) => {
    if (category.is_system) return
    try {
      await axiosPrivate.delete(`/${auth.id}/categories/${category.id}`)
      onChange(categories.filter((c) => c.id !== category.id))
    } catch (err) {
      console.error("Error al eliminar categoría", err)
    }
  }

  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay categorías. Se crearán las categorías base al iniciar sesión.
      </p>
    )
  }

  const systemCategories = categories.filter((c) => c.is_system)
  const customCategories = categories.filter((c) => !c.is_system)

  const renderRow = (category: Category) => (
    <div
      key={category.id}
      className="flex items-center justify-between gap-3 rounded-xl border border-border/50 px-4 py-3"
    >
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={`truncate text-sm ${category.is_enabled ? "text-foreground" : "text-muted-foreground line-through"}`}
        >
          {category.name}
        </span>
        {category.is_system && (
          <Badge variant="secondary" className="shrink-0 text-xs">
            Base
          </Badge>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 rounded-lg px-2"
          onClick={() => toggleVisibility(category)}
          title={category.is_enabled ? "Ocultar en gastos e inicio" : "Mostrar en gastos e inicio"}
        >
          {category.is_enabled ? (
            <>
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Visible</span>
            </>
          ) : (
            <>
              <EyeOff className="h-4 w-4" />
              <span className="hidden sm:inline">Oculta</span>
            </>
          )}
        </Button>
        {!category.is_system && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
            onClick={() => deleteCategory(category)}
            title="Eliminar categoría"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Activá o desactivá categorías para mostrarlas en gastos e inicio. Las categorías base vienen con tu cuenta; las personalizadas son solo tuyas.
      </p>
      {systemCategories.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Categorías base
          </h3>
          <div className="space-y-2">{systemCategories.map(renderRow)}</div>
        </div>
      )}
      {customCategories.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tus categorías
          </h3>
          <div className="space-y-2">{customCategories.map(renderRow)}</div>
        </div>
      )}
    </div>
  )
}
