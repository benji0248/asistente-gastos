import { supabase, throwIfError } from './client'

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

function generateImportToken(): string {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function getBankImportFunctionUrl(): string {
  const base = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
  if (!base) return ''
  return `${base}/functions/v1/bank-email-import`
}

export async function getEmailImportSettings(
  userId: string
): Promise<EmailImportSettings | null> {
  const { data, error } = await supabase
    .from('email_import_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  throwIfError(error)
  return (data as EmailImportSettings | null) ?? null
}

export async function upsertEmailImportSettings(
  userId: string,
  updates: Partial<
    Pick<
      EmailImportSettings,
      'default_account_id' | 'allowed_senders' | 'enabled' | 'gmail_label'
    >
  >
): Promise<EmailImportSettings> {
  const existing = await getEmailImportSettings(userId)

  if (existing) {
    const { data, error } = await supabase
      .from('email_import_settings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select('*')
      .single()

    throwIfError(error)
    return data as EmailImportSettings
  }

  const { data, error } = await supabase
    .from('email_import_settings')
    .insert({
      user_id: userId,
      import_token: generateImportToken(),
      default_account_id: updates.default_account_id ?? null,
      allowed_senders: updates.allowed_senders ?? [],
      enabled: updates.enabled ?? false,
      gmail_label: updates.gmail_label ?? 'AsistenteGastos',
    })
    .select('*')
    .single()

  throwIfError(error)
  return data as EmailImportSettings
}

export async function regenerateImportToken(userId: string): Promise<EmailImportSettings> {
  const token = generateImportToken()
  const existing = await getEmailImportSettings(userId)

  if (existing) {
    const { data, error } = await supabase
      .from('email_import_settings')
      .update({ import_token: token, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select('*')
      .single()

    throwIfError(error)
    return data as EmailImportSettings
  }

  const { data, error } = await supabase
    .from('email_import_settings')
    .insert({
      user_id: userId,
      import_token: token,
      allowed_senders: [],
      enabled: false,
      gmail_label: 'AsistenteGastos',
    })
    .select('*')
    .single()

  throwIfError(error)
  return data as EmailImportSettings
}

export async function listRecentImportLogs(
  userId: string,
  limit = 5
): Promise<EmailImportLogEntry[]> {
  const { data, error } = await supabase
    .from('email_import_log')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  throwIfError(error)
  return (data ?? []) as EmailImportLogEntry[]
}
