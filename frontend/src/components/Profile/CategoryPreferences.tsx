import useAuth from "../../hooks/useAuth"
import { useAxiosPrivate } from "../../hooks/useAxiosPrivate"
import { Category } from "../../types"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface Props {
  categories: Category[]
  onChange: (categories: Category[]) => void
}

function dedupeByName(categories: Category[]): Category[] {
  const byName = new Map<string, Category>()
  for (const category of categories) {
    const key = category.name.trim().toLowerCase()
    const existing = byName.get(key)
    if (!existing) {
      byName.set(key, category)
      continue
    }
    const preferred =
      category.is_system && !existing.is_system
        ? category
        : !category.is_system && existing.is_system
          ? existing
          : category.is_enabled && !existing.is_enabled
            ? category
            : existing
    byName.set(key, preferred)
  }
  return Array.from(byName.values())
}

export function CategoryPreferences({ categories, onChange }: Props) {
  const { auth } = useAuth()
  const axiosPrivate = useAxiosPrivate()

  const ownCategories = dedupeByName(
    categories.filter((c) => c.user_id === auth.id)
  )

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

  if (ownCategories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay categorías. Se crearán las categorías base al iniciar sesión.
      </p>
    )
  }

  const systemCategories = ownCategories.filter((c) => c.is_system)
  const customCategories = ownCategories.filter((c) => !c.is_system)

  const renderToggleBadge = (category: Category) => (
    <button
      key={category.id}
      type="button"
      onClick={() => toggleVisibility(category)}
      title={
        category.is_enabled
          ? "Ocultar en gastos e inicio"
          : "Mostrar en gastos e inicio"
      }
      className={cn(
        "inline-flex min-h-9 items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        category.is_enabled
          ? "border-primary/25 bg-primary/10 text-primary hover:bg-primary/15"
          : "border-border bg-muted/40 text-muted-foreground line-through opacity-60 hover:opacity-80"
      )}
    >
      {category.name}
    </button>
  )

  const renderCustomBadge = (category: Category) => (
    <span
      key={category.id}
      className={cn(
        "inline-flex min-h-9 items-stretch overflow-hidden rounded-full border text-xs font-medium",
        category.is_enabled
          ? "border-primary/25"
          : "border-border opacity-60"
      )}
    >
      <button
        type="button"
        onClick={() => toggleVisibility(category)}
        title={
          category.is_enabled
            ? "Ocultar en gastos e inicio"
            : "Mostrar en gastos e inicio"
        }
        className={cn(
          "px-3 py-1.5 transition-colors focus-visible:outline-none",
          category.is_enabled
            ? "bg-primary/10 text-primary hover:bg-primary/15"
            : "bg-muted/40 text-muted-foreground line-through hover:opacity-80"
        )}
      >
        {category.name}
      </button>
      <button
        type="button"
        onClick={() => deleteCategory(category)}
        title="Eliminar categoría"
        className="min-w-9 border-l border-inherit px-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  )

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Tocá una categoría para activarla u ocultarla en gastos e inicio. Las
        base vienen con tu cuenta; las personalizadas son solo tuyas.
      </p>
      {systemCategories.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Categorías base
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {systemCategories.map(renderToggleBadge)}
          </div>
        </div>
      )}
      {customCategories.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tus categorías
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {customCategories.map(renderCustomBadge)}
          </div>
        </div>
      )}
    </div>
  )
}
