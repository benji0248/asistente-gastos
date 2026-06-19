import { FormEvent, useState } from "react"
import useAuth from "@/hooks/useAuth"
import useHousehold from "@/hooks/useHousehold"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export function HouseholdSettings() {
  const { auth } = useAuth()
  const {
    household,
    members,
    invites,
    loading,
    createHousehold,
    inviteMember,
    acceptInvite,
    rejectInvite,
    leaveHousehold,
    removeMember,
  } = useHousehold()
  const [householdName, setHouseholdName] = useState("Mi familia")
  const [identifier, setIdentifier] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError("")
    try {
      await createHousehold(householdName)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el hogar")
    } finally {
      setSaving(false)
    }
  }

  const handleInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!identifier.trim()) return
    setSaving(true)
    setError("")
    try {
      await inviteMember(identifier)
      setIdentifier("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar la invitación")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-border/40 shadow-soft">
      <CardContent className="space-y-5 p-4 sm:p-6">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {!household ? (
          <form onSubmit={handleCreate} className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Creá un hogar para ver gastos, cuentas y balance junto a otras personas.
            </p>
            <div className="space-y-2">
              <Label htmlFor="household-name">Nombre del hogar</Label>
              <Input
                id="household-name"
                value={householdName}
                onChange={(event) => setHouseholdName(event.target.value)}
                placeholder="Mi familia"
              />
            </div>
            <Button type="submit" className="w-full sm:w-auto" disabled={saving || loading}>
              Crear hogar
            </Button>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hogar activo</p>
                <p className="font-medium">{household.name}</p>
              </div>
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => void leaveHousehold()}>
                Salir del hogar
              </Button>
            </div>

            <Separator />

            <form onSubmit={handleInvite} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="household-invite">Invitar por email o usuario</Label>
                <Input
                  id="household-invite"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="persona@email.com o usuario"
                />
              </div>
              <Button type="submit" className="w-full sm:w-auto" disabled={saving || loading}>
                Enviar invitación
              </Button>
            </form>

            <div className="space-y-3">
              <p className="text-sm font-medium">Miembros</p>
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col items-stretch gap-3 rounded-xl border border-border/40 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span>@{member.username}</span>
                    {member.id === auth?.id && <Badge variant="secondary">Vos</Badge>}
                    <Badge variant="outline">{member.role === "owner" ? "Admin" : "Miembro"}</Badge>
                  </div>
                  {member.id !== auth?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="min-h-10 w-full sm:w-auto"
                      onClick={() => void removeMember(member.id)}
                    >
                      Desvincular
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {invites.length > 0 && (
          <div className="space-y-3">
            <Separator />
            <p className="text-sm font-medium">Invitaciones pendientes</p>
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-col items-stretch gap-3 rounded-xl border border-border/40 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-2"
              >
                <span className="text-sm">
                  {invite.households?.name ?? "Hogar familiar"}
                </span>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <Button size="sm" className="min-h-10" onClick={() => void acceptInvite(invite.id)}>
                    Aceptar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-10"
                    onClick={() => void rejectInvite(invite.id)}
                  >
                    Rechazar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
