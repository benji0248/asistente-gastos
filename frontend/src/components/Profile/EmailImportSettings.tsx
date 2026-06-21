import { useCallback, useEffect, useMemo, useState } from "react"
import { Copy, Loader2, Mail, RefreshCw } from "lucide-react"
import useAuth from "@/hooks/useAuth"
import { useAppData } from "@/context/AppDataProvider"
import { Account } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  EmailImportSettings as EmailImportSettingsRow,
  EmailImportLogEntry,
  getBankImportFunctionUrl,
  getEmailImportSettings,
  listRecentImportLogs,
  regenerateImportToken,
  upsertEmailImportSettings,
} from "@/lib/db/emailImport"

function ownAccounts(accounts: Account[], userId: string): Account[] {
  return accounts.filter((a) => a.user_id === userId && !a.household_id)
}

function accountLabel(account: Account): string {
  return account.description?.trim() || account.type || `Cuenta ${account.id}`
}

export function EmailImportSettings() {
  const { auth } = useAuth()
  const { accounts } = useAppData()
  const [settings, setSettings] = useState<EmailImportSettingsRow | null>(null)
  const [logs, setLogs] = useState<EmailImportLogEntry[]>([])
  const [sendersInput, setSendersInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const userAccounts = useMemo(
    () => ownAccounts(accounts, auth?.id ?? ""),
    [accounts, auth?.id]
  )

  const functionUrl = getBankImportFunctionUrl()

  const load = useCallback(async () => {
    if (!auth?.id) return
    setLoading(true)
    setError(null)
    try {
      const [row, recentLogs] = await Promise.all([
        getEmailImportSettings(auth.id),
        listRecentImportLogs(auth.id),
      ])
      setSettings(row)
      setSendersInput((row?.allowed_senders ?? []).join("\n"))
      setLogs(recentLogs)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la configuración")
    } finally {
      setLoading(false)
    }
  }, [auth?.id])

  useEffect(() => {
    void load()
  }, [load])

  const persist = async (
    updates: Parameters<typeof upsertEmailImportSettings>[1]
  ) => {
    if (!auth?.id) return
    setSaving(true)
    setError(null)
    try {
      const row = await upsertEmailImportSettings(auth.id, updates)
      setSettings(row)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar")
    } finally {
      setSaving(false)
    }
  }

  const handleEnabledChange = async (enabled: boolean) => {
    if (enabled && userAccounts.length === 0) {
      setError("Agregá al menos una cuenta antes de activar la importación")
      return
    }
    if (enabled) {
      const senders = sendersInput
        .split(/[\n,;]+/)
        .map((s) => s.trim())
        .filter(Boolean)
      const accountId = settings?.default_account_id
      if (!accountId) {
        setError("Elegí la cuenta destino antes de activar")
        return
      }
      if (senders.length === 0) {
        setError("Agregá al menos un remitente del banco antes de activar")
        return
      }
    }
    await persist({ enabled })
  }

  const handleAccountChange = async (accountId: string) => {
    await persist({ default_account_id: Number(accountId) })
  }

  const handleSendersBlur = async () => {
    const allowedSenders = sendersInput
      .split(/[\n,;]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
    await persist({ allowed_senders: allowedSenders })
  }

  const handleRegenerateToken = async () => {
    if (!auth?.id) return
    setSaving(true)
    setError(null)
    try {
      const row = await regenerateImportToken(auth.id)
      setSettings(row)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar el token")
    } finally {
      setSaving(false)
    }
  }

  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch {
      setError("No se pudo copiar al portapapeles")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex min-h-[120px] items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const token = settings?.import_token ?? "(activá la importación para generar token)"
  const gmailLabel = settings?.gmail_label ?? "AsistenteGastos"

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4" />
          Importación automática desde Gmail
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Conectá alertas de tu banco en Gmail para crear gastos pagados automáticamente
          (Apps Script gratuito, revisión cada ~1 minuto).
        </p>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <label className="flex items-start justify-between gap-3 cursor-pointer">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Activar importación</p>
            <p className="text-xs text-muted-foreground">
              Requiere cuenta destino y remitentes del banco configurados.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 pt-0.5">
            {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border accent-foreground"
              checked={Boolean(settings?.enabled)}
              disabled={saving}
              onChange={(e) => void handleEnabledChange(e.target.checked)}
              aria-label="Activar importación por email"
            />
          </div>
        </label>

        <div className="space-y-2">
          <Label htmlFor="email-import-account">Cuenta destino</Label>
          <Select
            value={settings?.default_account_id ? String(settings.default_account_id) : ""}
            onValueChange={(value) => void handleAccountChange(value)}
            disabled={saving || userAccounts.length === 0}
          >
            <SelectTrigger id="email-import-account">
              <SelectValue placeholder="Elegí la cuenta a descontar" />
            </SelectTrigger>
            <SelectContent>
              {userAccounts.map((account) => (
                <SelectItem key={account.id} value={String(account.id)}>
                  {accountLabel(account)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email-import-senders">Remitentes permitidos</Label>
          <textarea
            id="email-import-senders"
            className={cn(
              "flex min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
              "ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
            placeholder={"alertas@bbva.com\n@santander.com.mx"}
            value={sendersInput}
            onChange={(e) => setSendersInput(e.target.value)}
            onBlur={() => void handleSendersBlur()}
            disabled={saving}
          />
          <p className="text-xs text-muted-foreground">
            Uno por línea. Podés usar email completo o dominio (@banco.com).
          </p>
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-3">
          <p className="text-sm font-medium">Datos para Apps Script</p>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">URL de la función</Label>
            <div className="flex gap-2">
              <Input readOnly value={functionUrl} className="text-xs font-mono" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => void copyText("url", functionUrl)}
                aria-label="Copiar URL"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {copiedKey === "url" && (
              <span className="text-xs text-muted-foreground">Copiado</span>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Token de usuario</Label>
            <div className="flex gap-2">
              <Input readOnly value={token} className="text-xs font-mono" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => void copyText("token", settings?.import_token ?? "")}
                disabled={!settings?.import_token}
                aria-label="Copiar token"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => void handleRegenerateToken()}
                disabled={saving}
                aria-label="Regenerar token"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            {copiedKey === "token" && (
              <span className="text-xs text-muted-foreground">Copiado</span>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            También necesitás el secreto{" "}
            <code className="rounded bg-muted px-1">BANK_IMPORT_WEBHOOK_SECRET</code> que
            configuraste al desplegar la Edge Function en Supabase.
          </p>
        </div>

        <div className="space-y-2 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Pasos en Gmail (una sola vez)</p>
          <ol className="list-decimal space-y-1 pl-4">
            <li>Creá la etiqueta <strong>{gmailLabel}</strong> en Gmail.</li>
            <li>
              Filtro: remitentes de tu banco → aplicar etiqueta{" "}
              <strong>{gmailLabel}</strong>.
            </li>
            <li>
              Copiá <code className="rounded bg-muted px-1">scripts/gmail-bank-import/Code.gs</code>{" "}
              del repo a script.google.com.
            </li>
            <li>Pegá URL, token y webhook secret en el script.</li>
            <li>Creá un trigger de tiempo: ejecutar <strong>syncBankEmails</strong> cada 1 minuto.</li>
          </ol>
        </div>

        {logs.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Actividad reciente</p>
            <ul className="space-y-1">
              {logs.map((log) => (
                <li
                  key={log.id}
                  className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
                >
                  <Badge variant={log.status === "created" ? "secondary" : "outline"}>
                    {log.status}
                  </Badge>
                  <span>{new Date(log.created_at).toLocaleString()}</span>
                  {log.reason && <span>— {log.reason}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
