import { clearSession, setTokens } from './session'

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface RegisterInput {
  email: string
  password: string
  displayName?: string
}

export interface LoginInput {
  email: string
  password: string
}

async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers)
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(path, { ...init, headers })
}

async function parseAuthError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      detail?: string
      title?: string
      message?: string
      error?: string
    }
    return body.detail ?? body.message ?? body.error ?? body.title ?? response.statusText
  } catch {
    return response.statusText || 'Request failed'
  }
}

export async function login(input: LoginInput): Promise<TokenResponse> {
  const response = await authFetch('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(await parseAuthError(response))
  }

  return (await response.json()) as TokenResponse
}

export async function register(input: RegisterInput): Promise<TokenResponse> {
  const response = await authFetch('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(await parseAuthError(response))
  }

  return (await response.json()) as TokenResponse
}

export async function refresh(refreshToken: string): Promise<TokenResponse> {
  const response = await authFetch('/api/v1/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  })

  if (!response.ok) {
    throw new Error(await parseAuthError(response))
  }

  return (await response.json()) as TokenResponse
}

export async function logout(refreshToken?: string | null): Promise<void> {
  const token = refreshToken ?? null
  if (token) {
    try {
      await authFetch('/api/v1/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: token }),
      })
    } catch {
      // Best-effort server logout; local session is cleared either way.
    }
  }
  clearSession()
}

export function persistTokens(tokens: TokenResponse): void {
  setTokens(tokens.access_token, tokens.refresh_token)
}
