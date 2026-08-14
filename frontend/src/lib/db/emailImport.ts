import { apiFetch } from '@/lib/api/http'

export interface EmailImportSettings {
  user_id: string
  import_token: string
  default_account_id: number | null
  allowed_senders: string[]
  enabled: boolean
  gmail_label: string
  updated_at: string
}

export interface EmailImportLogEntry {
  id: string
  message_id: string
  user_id: string
  expense_id: number | null
  status: 'created' | 'skipped' | 'duplicate'
  reason: string | null
  created_at: string
}

export function getBankImportFunctionUrl(): string {
  const configured = import.meta.env.VITE_BANK_IMPORT_URL?.replace(/\/$/, '')
  if (configured) return configured
  if (typeof window !== 'undefined' && window.location.origin) {
    return `${window.location.origin}/api/v1/email-import/bank-import`
  }
  return ''
}

export async function getEmailImportSettings(
  _userId: string
): Promise<EmailImportSettings | null> {
  const data = await apiFetch<EmailImportSettings | null>('/api/v1/email-import/settings')
  return data ?? null
}

export async function upsertEmailImportSettings(
  _userId: string,
  updates: Partial<
    Pick<
      EmailImportSettings,
      'default_account_id' | 'allowed_senders' | 'enabled' | 'gmail_label'
    >
  >
): Promise<EmailImportSettings> {
  return apiFetch<EmailImportSettings>('/api/v1/email-import/settings', {
    method: 'PUT',
    body: updates,
  })
}

export async function regenerateImportToken(_userId: string): Promise<EmailImportSettings> {
  return apiFetch<EmailImportSettings>('/api/v1/email-import/settings/regenerate-token', {
    method: 'POST',
  })
}

export async function listRecentImportLogs(
  _userId: string,
  limit = 5
): Promise<EmailImportLogEntry[]> {
  return apiFetch<EmailImportLogEntry[]>(`/api/v1/email-import/logs?limit=${limit}`)
}
