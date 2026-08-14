import { createContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react'
import { apiFetch } from '@/lib/api/http'
import { decodeJwtPayload, getAccessToken, getRefreshToken } from '@/lib/auth/session'
import { ROLES } from '@/consts'

export type AuthState = {
  user: string
  email: string
  role: number
  accessToken: string
  id: string
} | null

export interface AuthContextType {
  auth: AuthState
  setAuth: Dispatch<SetStateAction<AuthState>>
  loading: boolean
}

export const AuthContext = createContext<AuthContextType | null>(null)

interface MeProfile {
  id: string
  username: string
  role?: number | null
}

function buildAuthFromTokens(accessToken: string, profile?: MeProfile | null): AuthState {
  const payload = decodeJwtPayload(accessToken)
  const id = profile?.id ?? payload?.pid ?? payload?.sub
  if (!id) return null

  const email = payload?.email ?? ''
  const username =
    profile?.username ??
    (typeof payload?.name === 'string' ? payload.name : undefined) ??
    email.split('@')[0] ??
    'usuario'

  return {
    id,
    user: username,
    email,
    role: profile?.role ?? ROLES.user,
    accessToken,
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadSession = async () => {
      const accessToken = getAccessToken()
      const refreshToken = getRefreshToken()

      if (!accessToken && !refreshToken) {
        if (!cancelled) {
          setAuth(null)
          setLoading(false)
        }
        return
      }

      try {
        let token = accessToken
        if (!token && refreshToken) {
          const { refresh, persistTokens } = await import('@/lib/auth/identity')
          const tokens = await refresh(refreshToken)
          persistTokens(tokens)
          token = tokens.access_token
        }

        if (!token) {
          if (!cancelled) setAuth(null)
          return
        }

        let profile: MeProfile | null = null
        try {
          profile = await apiFetch<MeProfile>('/api/v1/me')
        } catch {
          profile = null
        }

        if (!cancelled) {
          setAuth(buildAuthFromTokens(token, profile))
        }
      } catch {
        if (!cancelled) setAuth(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadSession()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AuthContext.Provider value={{ auth, setAuth, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
