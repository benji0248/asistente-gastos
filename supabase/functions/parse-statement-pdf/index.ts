import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"
import { extractText, getDocumentProxy } from "https://esm.sh/unpdf@1.0.6"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface ParsePayload {
  pdfBase64?: string
  fileName?: string
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405)
  }

  const authHeader = req.headers.get("Authorization")
  if (!authHeader) {
    return jsonResponse({ ok: false, error: "Unauthorized" }, 401)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ ok: false, error: "Server misconfigured" }, 500)
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return jsonResponse({ ok: false, error: "Unauthorized" }, 401)
  }

  let payload: ParsePayload
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON" }, 400)
  }

  const pdfBase64 = payload.pdfBase64?.trim()
  if (!pdfBase64) {
    return jsonResponse({ ok: false, error: "Missing pdfBase64" }, 400)
  }

  try {
    const bytes = base64ToUint8Array(pdfBase64)
    if (bytes.byteLength < 5) {
      return jsonResponse({ ok: false, error: "PDF vacío o inválido" }, 400)
    }

    const pdf = await getDocumentProxy(bytes)
    const { totalPages, text } = await extractText(pdf, { mergePages: true })

    if (!text.trim()) {
      return jsonResponse({
        ok: false,
        error: "El PDF no contiene texto legible",
        detail: `${totalPages} página(s)`,
      })
    }

    return jsonResponse({
      ok: true,
      text,
      pages: totalPages,
      fileName: payload.fileName ?? null,
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("parse-statement-pdf failed", err)
    return jsonResponse({ ok: false, error: "No se pudo leer el PDF", detail }, 500)
  }
})

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}
