import { useEffect, useRef, useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { AlertCircle, Check, CheckCircle2, X } from "lucide-react"
import axios from "@/api/axios"
import { AxiosError } from "axios"
import { AuthLayout } from "@/components/layout/AuthLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

const USER_REGEX = /^[a-zA-Z][a-zA-Z0-9-_]{3,23}$/
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,24}$/
const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
const REGISTER_URL = "/register"

function FieldStatus({
  valid,
  showInvalid,
}: {
  valid: boolean
  showInvalid: boolean
}) {
  if (valid) {
    return <Check className="h-4 w-4 text-emerald-500" />
  }
  if (showInvalid) {
    return <X className="h-4 w-4 text-destructive" />
  }
  return null
}

export const Register = () => {
  const userRef = useRef<HTMLInputElement>(null)
  const errRef = useRef<HTMLParagraphElement>(null)

  const [user, setUser] = useState<string>("")
  const [validName, setValidName] = useState<boolean>(false)

  const [email, setEmail] = useState<string>("")
  const [validEmail, setValidEmail] = useState<boolean>(false)

  const [pwd, setPwd] = useState<string>("")
  const [validPwd, setValidPwd] = useState<boolean>(false)

  const [matchPwd, setMatchPwd] = useState<string>("")
  const [validMatch, setValidMatch] = useState<boolean>(false)

  const [errMsg, setErrMsg] = useState<string>("")
  const [success, setSuccess] = useState<boolean>(false)
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
    setErrMsg("")
  }, [user, pwd, matchPwd, email])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const v1 = USER_REGEX.test(user)
    const v2 = PWD_REGEX.test(pwd)
    const v3 = EMAIL_REGEX.test(email)
    if (!v1 || !v2 || !v3) {
      setErrMsg("Uno de los campos es inválido")
      return
    }
    setIsLoading(true)

    try {
      await axios.post(
        REGISTER_URL,
        JSON.stringify({ username: user, pwd, email }),
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      )
      setSuccess(true)
    } catch (err) {
      let errorMessage =
        "Error al registrarse. Por favor, intente de nuevo."

      if (err instanceof AxiosError) {
        if (err.response) {
          errorMessage = err.response.data.message || "Error en la solicitud"
        } else if (err.request) {
          errorMessage = "No se recibió respuesta del servidor"
        } else {
          errorMessage = err.message
        }
      }
      setErrMsg(errorMessage)
      errRef.current?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-md text-center shadow-lg">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">¡Registro exitoso!</CardTitle>
            <CardDescription className="text-base">
              Tu cuenta ha sido creada. Ya puedes iniciar sesión.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/login">Iniciar sesión</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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
            aria-invalid={validName ? "false" : "true"}
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
            aria-invalid={validEmail ? "false" : "true"}
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
            aria-invalid={validPwd ? "false" : "true"}
            placeholder="••••••••"
          />
          {pwd && !validPwd && (
            <p className="text-xs text-muted-foreground">
              8–24 caracteres, al menos una mayúscula y un número.
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
            aria-invalid={validMatch ? "false" : "true"}
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
          {isLoading ? "Registrando..." : "Registrarse"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link
          to="/login"
          className={cn(
            "font-medium text-primary hover:underline underline-offset-4"
          )}
        >
          Inicia sesión
        </Link>
      </p>
    </AuthLayout>
  )
}
