import { useEffect, useRef, useState, type FormEvent, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, Check, X } from 'lucide-react'
import { register, persistTokens } from '@/lib/auth/identity'
import { decodeJwtPayload } from '@/lib/auth/session'
import { apiFetch } from '@/lib/api/http'
import { ROLES } from '@/consts'
import { AuthContext } from '@/context/AuthProvider'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

const USER_REGEX = /^[a-zA-Z][a-zA-Z0-9-_]{3,23}$/
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{12,}$/
const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/

function FieldStatus({
  valid,
  showInvalid,
}: {
  valid: boolean
  showInvalid: boolean
}) {
  if (valid) {
    return <Check className="h-4 w-4 text-foreground" />
  }
  if (showInvalid) {
    return <X className="h-4 w-4 text-destructive" />
  }
  return null
}

export const Register = () => {
  const authContext = useContext(AuthContext)
  const navigate = useNavigate()

  const userRef = useRef<HTMLInputElement>(null)
  const errRef = useRef<HTMLParagraphElement>(null)

  const [user, setUser] = useState<string>('')
  const [validName, setValidName] = useState<boolean>(false)

  const [email, setEmail] = useState<string>('')
  const [validEmail, setValidEmail] = useState<boolean>(false)

  const [pwd, setPwd] = useState<string>('')
  const [validPwd, setValidPwd] = useState<boolean>(false)

  const [matchPwd, setMatchPwd] = useState<string>('')
  const [validMatch, setValidMatch] = useState<boolean>(false)

  const [errMsg, setErrMsg] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    userRef.current?.focus()
  }, [])

  useEffect(() => {
    setValidName(USER_REGEX.test(user))
  }, [user])

  useEffect(() => {
    setValidEmail(EMAIL_REGEX.test(email))
  }, [email])

  useEffect(() => {
    setValidPwd(PWD_REGEX.test(pwd))
    setValidMatch(pwd === matchPwd)
  }, [pwd, matchPwd])

  useEffect(() => {
    setErrMsg('')
  }, [user, pwd, matchPwd, email])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const v1 = USER_REGEX.test(user)
    const v2 = PWD_REGEX.test(pwd)
    const v3 = EMAIL_REGEX.test(email)
    if (!v1 || !v2 || !v3) {
      setErrMsg('Uno de los campos es inválido')
      return
    }
    setIsLoading(true)

    try {
      const tokens = await register({
        email,
        password: pwd,
        displayName: user,
      })
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
        setErrMsg('Registro completado pero no se pudo iniciar sesión')
        return
      }

      authContext?.setAuth({
        id,
        email: payload?.email ?? email,
        user: profile?.username ?? user,
        role: profile?.role ?? ROLES.user,
        accessToken: tokens.access_token,
      })

      navigate('/home', { replace: true })
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Error al registrarse. Por favor, intente de nuevo.')
      errRef.current?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Crear cuenta"
      subtitle="Completa el formulario para registrarte gratis"
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
          <div className="flex items-center justify-between">
            <Label htmlFor="username">Usuario</Label>
            <FieldStatus valid={validName} showInvalid={!!user && !validName} />
          </div>
          <Input
            type="text"
            id="username"
            ref={userRef}
            autoComplete="off"
            onChange={(e) => setUser(e.target.value)}
            value={user}
            required
            aria-invalid={validName ? 'false' : 'true'}
            placeholder="ejemplo_usuario"
          />
          {user && !validName && (
            <p className="text-xs text-muted-foreground">
              4–24 caracteres, empieza con letra. Solo letras, números, _ y -.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="email">Email</Label>
            <FieldStatus
              valid={validEmail}
              showInvalid={!!email && !validEmail}
            />
          </div>
          <Input
            type="email"
            id="email"
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            required
            aria-invalid={validEmail ? 'false' : 'true'}
            placeholder="tu@email.com"
          />
          {email && !validEmail && (
            <p className="text-xs text-muted-foreground">
              Ingresa un email válido.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <FieldStatus valid={validPwd} showInvalid={!!pwd && !validPwd} />
          </div>
          <Input
            type="password"
            id="password"
            autoComplete="new-password"
            onChange={(e) => setPwd(e.target.value)}
            value={pwd}
            required
            aria-invalid={validPwd ? 'false' : 'true'}
            placeholder="••••••••"
          />
          {pwd && !validPwd && (
            <p className="text-xs text-muted-foreground">
              Mínimo 12 caracteres, al menos una mayúscula y un número.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="confirm_pwd">Confirmar contraseña</Label>
            <FieldStatus
              valid={validMatch && !!matchPwd}
              showInvalid={!!matchPwd && !validMatch}
            />
          </div>
          <Input
            type="password"
            id="confirm_pwd"
            autoComplete="new-password"
            onChange={(e) => setMatchPwd(e.target.value)}
            value={matchPwd}
            required
            aria-invalid={validMatch ? 'false' : 'true'}
            placeholder="••••••••"
          />
          {matchPwd && !validMatch && (
            <p className="text-xs text-destructive">Las contraseñas no coinciden.</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={
            !validName || !validPwd || !validMatch || !validEmail || isLoading
          }
        >
          {isLoading ? 'Registrando...' : 'Registrarse'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{' '}
        <Link
          to="/login"
          className={cn(
            'font-medium text-primary hover:underline underline-offset-4'
          )}
        >
          Inicia sesión
        </Link>
      </p>
    </AuthLayout>
  )
}
