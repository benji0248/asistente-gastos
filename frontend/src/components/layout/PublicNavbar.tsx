import { useState } from "react"
import { Link } from "react-router-dom"
import { Menu, Wallet, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/home" className="flex items-center gap-2.5 font-display font-bold text-lg">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background shadow-soft">
            <Wallet className="h-5 w-5" />
          </div>
          <span>Control de Gastos</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/home"
            className="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Inicio
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Button variant="outline" asChild className="rounded-xl">
            <Link to="/login">Iniciar sesión</Link>
          </Button>
          <Button asChild className="rounded-xl shadow-soft">
            <Link to="/register">Registrarse</Link>
          </Button>
        </div>

        <button
          type="button"
          className="md:hidden rounded-xl p-2 text-muted-foreground hover:bg-accent"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "md:hidden border-t border-border/40 bg-card/90 backdrop-blur-xl",
          mobileOpen ? "block" : "hidden"
        )}
      >
        <div className="flex flex-col gap-1 px-4 py-3">
          <Link
            to="/home"
            className="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
            onClick={() => setMobileOpen(false)}
          >
            Inicio
          </Link>
          <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
            <Button variant="outline" asChild className="rounded-xl">
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                Iniciar sesión
              </Link>
            </Button>
            <Button asChild className="rounded-xl">
              <Link to="/register" onClick={() => setMobileOpen(false)}>
                Registrarse
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
