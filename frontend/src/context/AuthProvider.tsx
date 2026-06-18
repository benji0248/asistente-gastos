import { createContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from "react"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

export type AuthState = {
  user: string
  email: string
  role: number
  accessToken: string
  id: string
} | null

interface AuthContextType {
  auth: AuthState
  setAuth: Dispatch<SetStateAction<AuthState>>
  loading: boolean
}

export const AuthContext = createContext<AuthContextType | null>(null)

async function buildAuthFromSession(session: Session | null): Promise<AuthState> {
  if (!session) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, role')
    .eq('id', session.user.id)
    .single()

  return {
    id: session.user.id,
    user: profile?.username ?? session.user.email ?? '',
    email: session.user.email ?? '',
    role: profile?.role ?? 1712,
    accessToken: session.access_token,
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setAuth(await buildAuthFromSession(session))
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setAuth(await buildAuthFromSession(session))
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
