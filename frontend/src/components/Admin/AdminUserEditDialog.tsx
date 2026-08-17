import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { updateAdminUser } from "@/lib/admin/users"
import type { AdminUser } from "@/lib/admin/types"
import type { PlanId } from "@/lib/billing/plans"
import { ROLES } from "@/consts"
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

interface Props {
  user: AdminUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export function AdminUserEditDialog({ user, open, onOpenChange, onSaved }: Props) {
  const [username, setUsername] = useState("")
  const [plan, setPlan] = useState<PlanId>("free")
  const [role, setRole] = useState(String(ROLES.user))
  const [isBlocked, setIsBlocked] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !open) return
    setUsername(user.username)
    setPlan(user.plan)
    setRole(String(user.role))
    setIsBlocked(user.isBlocked)
    setError(null)
  }, [user, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setError(null)
    try {
      await updateAdminUser(user.id, {
        username: username.trim(),
        plan,
        planStatus: plan === "pro" ? "active" : "active",
        role: Number(role),
        isBlocked,
      })
      onOpenChange(false)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
        </DialogHeader>
        {user ? (
          <p className="text-sm text-muted-foreground">{user.email}</p>
        ) : null}
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-edit-username">Usuario</Label>
            <Input
              id="admin-edit-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={plan} onValueChange={(v) => setPlan(v as PlanId)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free (quitar Pro)</SelectItem>
                  <SelectItem value="pro">Pro (regalo admin)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(ROLES.user)}>Usuario</SelectItem>
                  <SelectItem value={String(ROLES.admin)}>Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border px-3 py-2">
            <div>
              <p className="text-sm font-medium">Cuenta bloqueada</p>
              <p className="text-xs text-muted-foreground">
                El usuario no podrá iniciar sesión
              </p>
            </div>
            <Button
              type="button"
              variant={isBlocked ? "destructive" : "outline"}
              size="sm"
              onClick={() => setIsBlocked((v) => !v)}
            >
              {isBlocked ? "Bloqueada" : "Activa"}
            </Button>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !user}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
