import { refresh as refreshSession } from '@/lib/auth/identity'
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '@/lib/auth/session'
import { keysToSnakeCase } from './case'

export interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  skipAuth?: boolean
  skipSnakeCase?: boolean
}

let refreshPromise: Promise<boolean> | null = null

async function tryRefreshTokens(): Promise<boolean> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      clearSession()
      return false
    }

    try {
      const tokens = await refreshSession(refreshToken)
      setTokens(tokens.access_token, tokens.refresh_token)
      return true
    } catch {
      clearSession()
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

async function parseApiError(response: Response): Promise<string> {
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

async function request(path: string, options: ApiFetchOptions = {}): Promise<Response> {
  const headers = new Headers(options.headers)

  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (!options.skipAuth) {
    const accessToken = getAccessToken()
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`)
    }
  }

  const init: RequestInit = {
    ...options,
    headers,
    body:
      options.body === undefined
        ? undefined
        : typeof options.body === 'string'
          ? options.body
          : JSON.stringify(options.body),
  }

  let response = await fetch(path, init)

  if (response.status === 401 && !options.skipAuth) {
    const refreshed = await tryRefreshTokens()
    if (refreshed) {
      const retryHeaders = new Headers(init.headers)
      const accessToken = getAccessToken()
      if (accessToken) {
        retryHeaders.set('Authorization', `Bearer ${accessToken}`)
      }
      response = await fetch(path, { ...init, headers: retryHeaders })
    }
  }

  return response
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const response = await request(path, options)

  if (response.status === 204) {
    return undefined as T
  }

  if (!response.ok) {
    throw new Error(await parseApiError(response))
  }

  const data = (await response.json()) as unknown
  return options.skipSnakeCase ? (data as T) : keysToSnakeCase<T>(data)
}

export { request as apiRequest }
