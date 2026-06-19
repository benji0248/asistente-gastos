import { useState } from "react"
import { Loader2 } from "lucide-react"
import useAuth from "@/hooks/useAuth"
import useHousehold from "@/hooks/useHousehold"
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate"
import { cn } from "@/lib/utils"

interface Props {
  onChanged?: () => void
}

export function SharedCashToggle({ onChanged }: Props) {
  const { auth } = useAuth()
  const { household, members, isLinked, refreshHousehold } = useHousehold()
  const axiosPrivate = useAxiosPrivate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isLinked || members.length < 2) return null

  const isOwner = members.some(
    (member) => member.id === auth?.id && member.role === "owner"
  )
  const enabled = Boolean(household?.shared_cash)

  const handleToggle = async () => {
    if (!isOwner || saving) return
    setSaving(true)
    setError(null)
    try {
      await axiosPrivate.patch("/household/shared-cash", { enabled: !enabled })
      await refreshHousehold()
      onChanged?.()
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null
      setError(message ?? "No se pudo cambiar el efectivo compartido")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
      <label
        className={cn(
          "flex items-start justify-between gap-3",
          isOwner ? "cursor-pointer" : "cursor-default"
        )}
      >
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-medium">Efectivo compartido</p>
          <p className="text-xs text-muted-foreground">
            Un solo pool de efectivo para el hogar en lugar de una cuenta por persona.
          </p>
          {error && <p className="text-xs text-destructive">{error}</p>}
          {!isOwner && (
            <p className="text-xs text-muted-foreground">
              Solo el dueño del hogar puede cambiar esta opción.
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-0.5">
          {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border accent-foreground"
            checked={enabled}
            disabled={!isOwner || saving}
            onChange={() => void handleToggle()}
            aria-label="Activar efectivo compartido"
          />
        </div>
      </label>
    </div>
  )
}
