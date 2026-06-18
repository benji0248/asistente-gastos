import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('SUPABASE_URL y SUPABASE_ANON_KEY son requeridas')
    }
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabase
}
