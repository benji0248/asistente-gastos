import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { setAdminUserPassword } from "@/lib/admin/users"
import type { AdminUser } from "@/lib/admin/types"
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

interface Props {
  user: AdminUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminUserPasswordDialog({ user, open, onOpenChange }: Props) {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!open) {
      setPassword("")
      setConfirm("")
      setError(null)
      setDone(false)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (password !== confirm) {
      setError("Las contraseñas no coinciden")
      return
    }
    setSaving(true)
    setError(null)
    try {
      await setAdminUserPassword(user.id, { password })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar la clave")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
        </DialogHeader>
        {user ? (
          <p className="text-sm text-muted-foreground">
            {user.username} · {user.email}
          </p>
        ) : null}
        {done ? (
          <p className="text-sm text-foreground">Contraseña actualizada.</p>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-new-password">Nueva contraseña</Label>
              <Input
                id="admin-new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-confirm-password">Confirmar</Label>
              <Input
                id="admin-confirm-password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={8}
                required
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {done ? "Cerrar" : "Cancelar"}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
