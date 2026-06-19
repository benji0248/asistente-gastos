import { createContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from "react"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { bootstrapSession } from "@/lib/bootstrap"
import { ROLES } from "@/consts"

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

function buildAuthFromSession(session: Session | null): AuthState {
  if (!session) return null

  const username =
    (session.user.user_metadata?.username as string | undefined) ??
    session.user.email?.split("@")[0] ??
    ""

  return {
    id: session.user.id,
    user: username,
    email: session.user.email ?? "",
    role: ROLES.user,
    accessToken: session.access_token,
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>(null)
  const [loading, setLoading] = useState(true)

  const handleSession = async (event: AuthChangeEvent, session: Session | null) => {
    if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session?.access_token) {
      try {
        await bootstrapSession(session.access_token)
      } catch (err) {
        console.warn('No se pudo preparar la cuenta en el servidor', err)
      }
    }

    setAuth(buildAuthFromSession(session))
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      void handleSession('INITIAL_SESSION', session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      void handleSession(event, session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ auth, setAuth, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
