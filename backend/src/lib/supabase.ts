import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabase: SupabaseClient | null = null
let supabaseAdmin: SupabaseClient | null = null

function getSupabaseUrl(): string {
  const supabaseUrl = process.env.SUPABASE_URL
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL es requerida')
  }
  return supabaseUrl
}

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
    if (!supabaseAnonKey) {
      throw new Error('SUPABASE_ANON_KEY es requerida')
    }
    supabase = createClient(getSupabaseUrl(), supabaseAnonKey)
  }
  return supabase
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY es requerida')
    }
    supabaseAdmin = createClient(getSupabaseUrl(), serviceRoleKey)
  }
  return supabaseAdmin
}
