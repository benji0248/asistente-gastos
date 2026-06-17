import { useEffect, useRef, useState, type FormEvent } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { AlertCircle } from "lucide-react"
import useAuth from "@/hooks/useAuth"
import axios from "@/api/axios"
import { AxiosError } from "axios"
import { AuthLayout } from "@/components/layout/AuthLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

const LOGIN_URL = "/login"

export const Login = () => {
  const { setAuth } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || "/"

  const userRef = useRef<HTMLInputElement>(null)
  const errRef = useRef<HTMLParagraphElement>(null)

  const [user, setUser] = useState<string>("")
  const [pwd, setPwd] = useState<string>("")
  const [errMsg, setErrMsg] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    userRef.current?.focus()
  }, [])

  useEffect(() => {
    setErrMsg("")
  }, [user, pwd])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await axios.post(
        LOGIN_URL,
        JSON.stringify({ user, pwd }),
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      )
      const accessToken = response?.data?.accessToken
      const role = response?.data?.role
      const id = response?.data?.id
      setAuth({ user, pwd, role, accessToken, id })
      setUser("")
      setPwd("")
      const redirectionPath = from.replace(":userId", id)
      navigate(redirectionPath, { replace: true })
    } catch (err) {
      let errorMessage =
        "Error al iniciar sesión. Por favor, intente de nuevo."

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

  return (
    <AuthLayout
      title="Inicia sesión"
      subtitle="Ingresa tus credenciales para acceder a tu cuenta"
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
          <Label htmlFor="username">Usuario</Label>
          <Input
            type="text"
            id="username"
            ref={userRef}
            autoComplete="username"
            onChange={(e) => setUser(e.target.value)}
            value={user}
            required
            placeholder="Tu nombre de usuario"
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
          {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
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
