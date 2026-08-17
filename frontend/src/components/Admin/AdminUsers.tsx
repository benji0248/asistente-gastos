import { useCallback, useEffect, useState } from "react"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import "dayjs/locale/es"
import {
  KeyRound,
  Pencil,
  RefreshCw,
  Search,
  Shield,
  UserPlus,
} from "lucide-react"
import { listAdminUsers } from "@/lib/admin/users"
import type { AdminUser } from "@/lib/admin/types"
import { roleLabel } from "@/hooks/useIsAdmin"
import { PageHeader } from "@/components/layout/PageHeader"
import { SectionLoader } from "@/components/layout/SectionLoader"
import { AdminUserCreateDialog } from "./AdminUserCreateDialog"
import { AdminUserEditDialog } from "./AdminUserEditDialog"
import { AdminUserPasswordDialog } from "./AdminUserPasswordDialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

dayjs.extend(relativeTime)
dayjs.locale("es")

function formatLastLogin(iso: string | null): string {
  if (!iso) return "Nunca"
  const d = dayjs(iso)
  if (!d.isValid()) return "—"
  return `${d.format("DD/MM/YYYY HH:mm")} (${d.fromNow()})`
}

function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [passwordUser, setPasswordUser] = useState<AdminUser | null>(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await listAdminUsers(query)
      setUsers(result.users)
      setTotal(result.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los usuarios")
      setUsers([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setQuery(searchInput.trim())
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Administración"
        description="Usuarios, planes y acceso"
        action={
          <Badge variant="secondary" className="gap-1 rounded-full px-3 py-1">
            <Shield className="h-3.5 w-3.5" />
            Admin
          </Badge>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por email o usuario…"
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
        </form>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void loadUsers()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Crear usuario
          </Button>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="rounded-2xl border border-border/60 bg-background/80 shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-3 text-sm text-muted-foreground">
          <span>{total} cuenta{total === 1 ? "" : "s"}</span>
        </div>

        {loading ? (
          <SectionLoader minHeight="min-h-[280px]" />
        ) : users.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">
            No hay usuarios para mostrar.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Última conexión</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell className="max-w-[12rem] truncate">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.plan === "pro" ? "secondary" : "outline"}>
                      {user.plan === "pro" ? "Pro" : "Free"}
                    </Badge>
                  </TableCell>
                  <TableCell>{roleLabel(user.role)}</TableCell>
                  <TableCell>
                    {user.isBlocked ? (
                      <Badge variant="destructive">Bloqueado</Badge>
                    ) : (
                      <Badge variant="outline">Activo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatLastLogin(user.lastLoginAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Editar plan y bloqueo"
                        onClick={() => setEditUser(user)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Cambiar contraseña"
                        onClick={() => setPasswordUser(user)}
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <AdminUserCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => void loadUsers()}
      />
      <AdminUserEditDialog
        user={editUser}
        open={!!editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
        onSaved={() => void loadUsers()}
      />
      <AdminUserPasswordDialog
        user={passwordUser}
        open={!!passwordUser}
        onOpenChange={(open) => !open && setPasswordUser(null)}
      />
    </div>
  )
}

export default AdminUsers
