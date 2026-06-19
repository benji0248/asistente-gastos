import type { User } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '../lib/supabase'
import { Profile } from './types'
import { seedDefaultCategoriesIfNeeded } from './categorySeed'

export async function ensureUserProfile(user: Pick<User, 'id' | 'email' | 'user_metadata'>): Promise<Profile> {
  const admin = getSupabaseAdmin()

  const { data: existing } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (existing) return existing as Profile

  const username =
    (user.user_metadata?.username as string | undefined) ??
    user.email?.split('@')[0] ??
    'usuario'

  const { error: profileError } = await admin
    .from('profiles')
    .upsert({ id: user.id, username }, { onConflict: 'id', ignoreDuplicates: true })
  if (profileError) throw profileError

  const { data: accounts } = await admin
    .from('accounts')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)

  if (!accounts?.length) {
    const { error: accountError } = await admin
      .from('accounts')
      .insert({ user_id: user.id, type: 'cash', balance: 0, description: 'efectivo' })
    if (accountError) throw accountError
  }

  const { data: created, error: fetchError } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (fetchError || !created) {
    throw new Error('No se pudo crear el perfil del usuario')
  }
  return created as Profile
}

export async function bootstrapUser(user: Pick<User, 'id' | 'email' | 'user_metadata'>): Promise<Profile> {
  const profile = await ensureUserProfile(user)
  await seedDefaultCategoriesIfNeeded(user.id)
  return profile
}
