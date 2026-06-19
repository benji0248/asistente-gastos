import { createHmac, createPublicKey, timingSafeEqual, verify } from 'crypto'

export interface SupabaseJwtPayload {
  sub: string
  email?: string
  exp: number
  user_metadata?: Record<string, unknown>
}

type JwtHeader = {
  alg: string
  kid?: string
  typ?: string
}

type EcJwk = {
  kid: string
  alg: string
  kty: 'EC'
  crv: 'P-256'
  x: string
  y: string
}

let jwksKeys: EcJwk[] | null = null
let jwksUrl: string | null = null

export async function preloadJwks(supabaseUrl: string): Promise<void> {
  jwksUrl = supabaseUrl.replace(/\/$/, '')
  const response = await fetch(`${jwksUrl}/auth/v1/.well-known/jwks.json`)
  if (!response.ok) {
    throw new Error('No se pudieron cargar las claves públicas de Supabase')
  }
  const data = (await response.json()) as { keys: EcJwk[] }
  jwksKeys = data.keys
}

async function getJwks(supabaseUrl: string): Promise<EcJwk[]> {
  const normalized = supabaseUrl.replace(/\/$/, '')
  if (jwksKeys && jwksUrl === normalized) {
    return jwksKeys
  }
  await preloadJwks(normalized)
  return jwksKeys ?? []
}

function base64UrlDecode(value: string): string {
  const padded = value + '='.repeat((4 - (value.length % 4)) % 4)
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
}

function base64UrlToBuffer(value: string): Buffer {
  const padded = value + '='.repeat((4 - (value.length % 4)) % 4)
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
}

function verifyHs256(token: string, secret: string): SupabaseJwtPayload {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Token inválido')
  }

  const [header, payload, signature] = parts
  const expected = createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest()

  const actual = base64UrlToBuffer(signature)
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new Error('Token inválido')
  }

  return parseClaims(payload)
}

async function verifyEs256(token: string, supabaseUrl: string, header: JwtHeader): Promise<SupabaseJwtPayload> {
  const parts = token.split('.')
  const [encodedHeader, encodedPayload, encodedSignature] = parts
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new Error('Token inválido')
  }

  const keys = await getJwks(supabaseUrl)
  const jwk = keys.find((key) => key.kid === header.kid)
  if (!jwk) {
    throw new Error('Token inválido')
  }

  const key = createPublicKey({ key: jwk, format: 'jwk' })
  const valid = verify(
    'sha256',
    Buffer.from(`${encodedHeader}.${encodedPayload}`),
    { key, dsaEncoding: 'ieee-p1363' },
    base64UrlToBuffer(encodedSignature)
  )

  if (!valid) {
    throw new Error('Token inválido')
  }

  return parseClaims(encodedPayload)
}

function parseClaims(encodedPayload: string): SupabaseJwtPayload {
  const claims = JSON.parse(base64UrlDecode(encodedPayload)) as SupabaseJwtPayload
  if (!claims.sub) {
    throw new Error('Token inválido')
  }
  if (claims.exp * 1000 < Date.now()) {
    throw new Error('Token expirado')
  }
  return claims
}

export async function verifySupabaseJwt(
  token: string,
  supabaseUrl: string,
  jwtSecret?: string
): Promise<SupabaseJwtPayload> {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Token inválido')
  }

  const header = JSON.parse(base64UrlDecode(parts[0])) as JwtHeader

  if (header.alg === 'ES256') {
    return verifyEs256(token, supabaseUrl, header)
  }

  if (header.alg === 'HS256' && jwtSecret) {
    return verifyHs256(token, jwtSecret)
  }

  throw new Error('Token inválido')
}
