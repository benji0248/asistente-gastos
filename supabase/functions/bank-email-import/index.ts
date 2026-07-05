import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"
import {
  extractEmailAddress,
  isSenderAllowed,
  parseBankEmail,
  type CategoryRow,
} from "../_shared/bankEmailParser.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
}

interface ImportPayload {
  userToken?: string
  messageId?: string
  from?: string
  subject?: string
  body?: string
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405)
  }

  const webhookSecret = Deno.env.get("BANK_IMPORT_WEBHOOK_SECRET")
  if (!webhookSecret) {
    return jsonResponse({ ok: false, error: "Server misconfigured" }, 500)
  }

  const incomingSecret = req.headers.get("x-webhook-secret")
  if (incomingSecret !== webhookSecret) {
    return jsonResponse({ ok: false, error: "Unauthorized" }, 401)
  }

  let payload: ImportPayload
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON" }, 400)
  }

  const userToken = payload.userToken?.trim()
  const messageId = payload.messageId?.trim()
  const from = payload.from?.trim() ?? ""
  const subject = payload.subject?.trim() ?? ""
  const body = payload.body?.trim() ?? ""

  if (!userToken || !messageId) {
    return jsonResponse({ ok: false, error: "Missing userToken or messageId" }, 400)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ ok: false, error: "Server misconfigured" }, 500)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const { data: settings, error: settingsError } = await supabase
    .from("email_import_settings")
    .select("user_id, default_account_id, allowed_senders, enabled")
    .eq("import_token", userToken)
    .maybeSingle()

  if (settingsError) {
    console.error(settingsError)
    return jsonResponse({ ok: false, error: "Settings lookup failed" }, 500)
  }

  if (!settings) {
    return jsonResponse({ ok: false, error: "Invalid token" }, 404)
  }

  if (!settings.enabled) {
    return jsonResponse({ ok: true, status: "skipped", reason: "Import disabled" })
  }

  if (!settings.default_account_id) {
    await logSkip(supabase, messageId, settings.user_id, "Sin cuenta destino configurada")
    return jsonResponse({ ok: true, status: "skipped", reason: "No default account" })
  }

  const allowedSenders: string[] = settings.allowed_senders ?? []
  if (!isSenderAllowed(from, allowedSenders)) {
    await logSkip(
      supabase,
      messageId,
      settings.user_id,
      `Remitente no permitido: ${extractEmailAddress(from)}`
    )
    return jsonResponse({ ok: true, status: "skipped", reason: "Sender not allowed" })
  }

  const { data: existingLog } = await supabase
    .from("email_import_log")
    .select("id, status")
    .eq("message_id", messageId)
    .maybeSingle()

  if (existingLog) {
    return jsonResponse({ ok: true, status: "duplicate" })
  }

  const visibleUserIds = await getVisibleUserIds(supabase, settings.user_id)

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name, user_id, is_enabled, is_system")
    .in("user_id", visibleUserIds)
    .eq("is_enabled", true)

  if (categoriesError) {
    console.error(categoriesError)
    return jsonResponse({ ok: false, error: "Categories lookup failed" }, 500)
  }

  const parsed = parseBankEmail(subject, body, (categories ?? []) as CategoryRow[])

  if (parsed.skipReason || parsed.amount === null) {
    await logSkip(supabase, messageId, settings.user_id, parsed.skipReason ?? "Sin monto")
    return jsonResponse({ ok: true, status: "skipped", reason: parsed.skipReason })
  }

  const { data: expenseId, error: rpcError } = await supabase.rpc(
    "create_paid_expense_from_import",
    {
      p_user_id: settings.user_id,
      p_account_id: settings.default_account_id,
      p_title: parsed.title,
      p_amount: parsed.amount,
      p_category_id: parsed.categoryId,
      p_message_id: messageId,
    }
  )

  if (rpcError) {
    if (rpcError.message.includes("INVALID_ACCOUNT")) {
      await logSkip(supabase, messageId, settings.user_id, "Cuenta destino inválida")
      return jsonResponse({ ok: true, status: "skipped", reason: "Invalid account" })
    }
    console.error(rpcError)
    return jsonResponse({ ok: false, error: "Failed to create expense" }, 500)
  }

  if (expenseId === null) {
    return jsonResponse({ ok: true, status: "duplicate" })
  }

  return jsonResponse({ ok: true, status: "created", expenseId })
})

async function logSkip(
  supabase: ReturnType<typeof createClient>,
  messageId: string,
  userId: string,
  reason: string
) {
  const { data: existing } = await supabase
    .from("email_import_log")
    .select("id")
    .eq("message_id", messageId)
    .maybeSingle()

  if (existing) return

  await supabase.from("email_import_log").insert({
    message_id: messageId,
    user_id: userId,
    expense_id: null,
    status: "skipped",
    reason,
  })
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

async function getVisibleUserIds(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<string[]> {
  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", userId)
    .eq("status", "accepted")
    .maybeSingle()

  if (!membership?.household_id) {
    return [userId]
  }

  const { data: members } = await supabase
    .from("household_members")
    .select("user_id")
    .eq("household_id", membership.household_id)
    .eq("status", "accepted")

  const ids = (members ?? []).map((m) => m.user_id as string)
  return ids.length > 0 ? ids : [userId]
}
