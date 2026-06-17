import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Menu, X, Wallet } from "lucide-react"
import useAuth from "@/hooks/useAuth"
import { useLogout } from "@/hooks/useLogout"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function PublicNavbar() {
  const { auth } = useAuth()
  const navigate = useNavigate()
  const logout = useLogout()
  const [mobileOpen, setMobileOpen] = useState(false)

  const signOut = async () => {
    await logout()
    navigate("/login")
  }

  const navLinks = auth?.id
    ? [
        { to: "/home", label: "Inicio" },
        { to: `/${auth.id}/expenses`, label: "Gastos" },
        { to: `/${auth.id}/profile`, label: "Cuenta" },
      ]
    : [{ to: "/home", label: "Inicio" }]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/home" className="flex items-center gap-2 font-bold text-lg">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wallet className="h-5 w-5" />
          </div>
          <span>
            Control de{" "}
            <span className="text-primary">Gastos</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {auth ? (
            <Button variant="outline" onClick={signOut}>
              Cerrar sesión
            </Button>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link to="/login">Iniciar sesión</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Registrarse</Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="md:hidden rounded-md p-2 text-muted-foreground hover:bg-accent"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "md:hidden border-t border-border/60 bg-background",
          mobileOpen ? "block" : "hidden"
        )}
      >
        <div className="flex flex-col gap-1 px-4 py-3">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
            {auth ? (
              <Button variant="outline" onClick={signOut}>
                Cerrar sesión
              </Button>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link to="/login" onClick={() => setMobileOpen(false)}>
                    Iniciar sesión
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/register" onClick={() => setMobileOpen(false)}>
                    Registrarse
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
