const isProduction = process.env.NODE_ENV === 'production'

export const cookieOptions = {
  httpOnly: true,
  maxAge: 24 * 60 * 60 * 1000,
  sameSite: 'lax' as const,
  secure: isProduction,
}

export const clearCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: isProduction,
}
