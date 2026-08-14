import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import useAuth from '@/hooks/useAuth'
import { login, persistTokens } from '@/lib/auth/identity'
import { decodeJwtPayload } from '@/lib/auth/session'
import { apiFetch } from '@/lib/api/http'
import { ROLES } from '@/consts'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export const Login = () => {
  const { auth, setAuth } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const emailRef = useRef<HTMLInputElement>(null)
  const errRef = useRef<HTMLParagraphElement>(null)

  const [email, setEmail] = useState<string>('')
  const [pwd, setPwd] = useState<string>('')
  const [errMsg, setErrMsg] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  useEffect(() => {
    if (auth?.id) {
      navigate('/home', { replace: true })
    }
  }, [auth, navigate])

  useEffect(() => {
    setErrMsg('')
  }, [email, pwd])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const tokens = await login({ email, password: pwd })
      persistTokens(tokens)

      let profile: { id: string; username: string; role?: number | null } | null = null
      try {
        profile = await apiFetch('/api/v1/me')
      } catch {
        profile = null
      }

      const payload = decodeJwtPayload(tokens.access_token)
      const id = profile?.id ?? payload?.pid ?? payload?.sub
      if (!id) {
        setErrMsg('No se pudo iniciar sesión')
        return
      }

      const username =
        profile?.username ??
        (typeof payload?.name === 'string' ? payload.name : undefined) ??
        email.split('@')[0] ??
        email

      setAuth({
        id,
        email: payload?.email ?? email,
        user: username,
        role: profile?.role ?? ROLES.user,
        accessToken: tokens.access_token,
      })

      setEmail('')
      setPwd('')
      const redirectionPath = from.replace(':userId', id)
      navigate(redirectionPath, { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión'
      setErrMsg(
        message.toLowerCase().includes('invalid') || message.toLowerCase().includes('credential')
          ? 'Email o contraseña incorrectos'
          : message
      )
      errRef.current?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Inicia sesión"
      subtitle="Ingresa tu email y contraseña"
    >
      {errMsg && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription ref={errRef} aria-live="assertive">
            {errMsg}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            type="email"
            id="email"
            ref={emailRef}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            required
            placeholder="tu@email.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            type="password"
            id="password"
            autoComplete="current-password"
            onChange={(e) => setPwd(e.target.value)}
            value={pwd}
            required
            placeholder="••••••••"
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{' '}
        <Link
          to="/register"
          className="font-medium text-primary hover:underline underline-offset-4"
        >
          Regístrate
        </Link>
      </p>
    </AuthLayout>
  )
}
