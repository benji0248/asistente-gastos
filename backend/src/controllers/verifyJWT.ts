import dotenv from 'dotenv'
import { NextFunction, Request, Response } from 'express'
import { ROLES_LIST } from '../config/role_list'
import { verifySupabaseJwt } from '../lib/jwt'

dotenv.config()

function getSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL
  if (!url) {
    throw new Error('SUPABASE_URL es requerida')
  }
  return url
}

export const verifyJWT = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization ?? req.headers.Authorization
  if (Array.isArray(authHeader) || !authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(401)
  }

  const token = authHeader.split(' ')[1]

  try {
    const claims = await verifySupabaseJwt(
      token,
      getSupabaseUrl(),
      process.env.SUPABASE_JWT_SECRET
    )
    req.userId = claims.sub
    req.email = claims.email
    req.userMetadata = claims.user_metadata
    req.role = ROLES_LIST.user
    next()
  } catch (err) {
    console.error('Token inválido', err)
    return res.sendStatus(403)
  }
}
