import dotenv from 'dotenv'
import { NextFunction, Request, Response } from 'express'
import type { User } from '@supabase/supabase-js'
import { getSupabase, getSupabaseAdmin } from '../lib/supabase'
import { Profile } from '../config/types'
import { seedDefaultCategoriesIfNeeded } from '../config/categorySeed'
import householdServices from '../config/householdServices'

dotenv.config()

const seededCategoryUsers = new Set<string>()
let warnedHouseholdContextError = false

async function ensureUserProfile(user: User): Promise<Profile> {
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

export const verifyJWT = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization ?? req.headers.Authorization
  if (Array.isArray(authHeader) || !authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(401)
  }

  const token = authHeader.split(' ')[1]

  try {
    const { data: { user }, error } = await getSupabase().auth.getUser(token)
    if (error || !user) return res.sendStatus(403)

    const profile = await ensureUserProfile(user)

    if (!seededCategoryUsers.has(user.id)) {
      try {
        await seedDefaultCategoriesIfNeeded(user.id)
        seededCategoryUsers.add(user.id)
      } catch (seedErr) {
        console.warn(
          'No se pudieron crear categorías base. Ejecutá supabase/category-seed.sql en Supabase.',
          seedErr
        )
      }
    }

    req.userId = user.id
    req.user = profile.username
    req.email = user.email
    req.role = profile.role
    req.supabaseUser = user

    try {
      const householdContext = await householdServices.getHouseholdContext(user.id)
      req.householdId = householdContext.householdId
      req.visibleUserIds = householdContext.visibleUserIds
      req.householdMembers = householdContext.members
    } catch (householdErr) {
      req.visibleUserIds = [user.id]
      req.householdMembers = []

      if (!warnedHouseholdContextError) {
        warnedHouseholdContextError = true
        console.warn(
          'No se pudo cargar el hogar. La sesión continúa en modo individual. Ejecutá supabase/schema.sql si todavía no creaste las tablas de hogar.',
          householdErr
        )
      }
    }
    next()
  } catch (err) {
    console.error('No se pudo verificar el token de Supabase', err)
    res.status(500).json({ message: 'Error de autenticación en el servidor' })
  }
}
