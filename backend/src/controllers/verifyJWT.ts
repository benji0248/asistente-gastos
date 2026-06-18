import dotenv from 'dotenv'
import { NextFunction, Request, Response } from 'express'
import { db } from '../database/database'
import { getSupabase } from '../lib/supabase'
import { Profile } from '../config/types'

dotenv.config()

export const verifyJWT = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization ?? req.headers.Authorization
  if (Array.isArray(authHeader) || !authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(401)
  }

  const token = authHeader.split(' ')[1]

  try {
    const { data: { user }, error } = await getSupabase().auth.getUser(token)
    if (error || !user) return res.sendStatus(403)

    const [profiles] = await db.query<Profile[]>(
      'SELECT * FROM profiles WHERE id = ?',
      [user.id]
    )
    const profile = profiles[0]
    if (!profile) return res.sendStatus(403)

    req.userId = user.id
    req.user = profile.username
    req.role = profile.role
    next()
  } catch (err) {
    console.error('No se pudo verificar el token de Supabase', err)
    res.sendStatus(403)
  }
}
