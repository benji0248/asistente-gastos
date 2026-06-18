import { createContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from "react"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuth(buildAuthFromSession(session))
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuth(buildAuthFromSession(session))
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ auth, setAuth, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
