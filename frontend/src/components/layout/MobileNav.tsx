import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { LogOut, Menu, MoreHorizontal, Wallet, X } from "lucide-react"
import useAuth from "@/hooks/useAuth"
import { useLogout } from "@/hooks/useLogout"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getDashboardNavItems } from "./dashboardNav"
import { SidebarNavLink } from "./SidebarNavLink"

export function MobileNav() {
  const { auth } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const logout = useLogout()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  if (!auth?.id) return null

  const navItems = getDashboardNavItems(auth.id)
  const primaryItems = navItems.slice(0, 4)
  const secondaryItems = navItems.slice(4)

  const signOut = async () => {
    setOpen(false)
    await logout()
    navigate("/login")
  }

  const shortLabels: Record<string, string> = {
    Inicio: "Inicio",
    Gastos: "Gastos",
    Estadísticas: "Stats",
    "Tarjetas de crédito": "Tarjetas",
    Hogar: "Hogar",
    Cuenta: "Cuenta",
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex min-h-14 items-center gap-3 border-b glass-panel px-4 pt-[env(safe-area-inset-top)] lg:hidden">
        <button
          type="button"
          className="shrink-0 rounded-xl p-2.5 min-h-11 min-w-11 flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link
          to="/home"
          className="flex min-w-0 flex-1 items-center gap-2 font-display font-semibold text-sm"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
            <Wallet className="h-3.5 w-3.5" />
          </div>
          <span className="truncate">Control de Gastos</span>
        </Link>
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex border-t glass-panel shadow-elevated lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Navegación principal"
      >
        {primaryItems.map(({ to, label, icon: Icon, match }) => {
          const isActive = match ? match(location.pathname) : location.pathname === to
          const shortLabel = shortLabels[label] ?? label

          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-1.5 text-[10px] font-medium leading-none transition-colors",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl transition-colors",
                  isActive && "bg-foreground text-background shadow-soft"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="max-w-full truncate px-0.5">{shortLabel}</span>
            </Link>
          )
        })}
        <button
          type="button"
          className={cn(
            "flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-1.5 text-[10px] font-medium leading-none transition-colors",
            secondaryItems.some(({ match, to }) =>
              match ? match(location.pathname) : location.pathname === to
            )
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setOpen(true)}
          aria-label="Abrir más secciones"
        >
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-xl transition-colors",
              secondaryItems.some(({ match, to }) =>
                match ? match(location.pathname) : location.pathname === to
              ) && "bg-foreground text-background shadow-soft"
            )}
          >
            <MoreHorizontal className="h-4 w-4" />
          </span>
          <span>Más</span>
        </button>
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            className="absolute inset-y-0 left-0 w-72 glass-panel border-r shadow-elevated flex flex-col animate-in slide-in-from-left duration-200 m-2 ml-0 rounded-r-2xl pt-[env(safe-area-inset-top)]"
          >
            <div className="flex h-14 items-center justify-between px-4">
              <span className="font-display font-semibold">Menú</span>
              <button
                type="button"
                className="rounded-xl p-2.5 min-h-11 min-w-11 flex items-center justify-center text-muted-foreground hover:bg-accent"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
              {navItems.map(({ to, label, icon, match }) => {
                const isActive = match
                  ? match(location.pathname)
                  : location.pathname === to
                return (
                  <SidebarNavLink
                    key={to}
                    to={to}
                    label={label}
                    icon={icon}
                    isActive={isActive}
                    onClick={() => setOpen(false)}
                  />
                )
              })}
            </nav>

            <div className="border-t border-border/50 p-4 space-y-3 pb-[env(safe-area-inset-bottom)]">
              <div className="px-2">
                <p className="text-sm font-medium truncate">{auth.user}</p>
                <p className="text-xs text-muted-foreground truncate">{auth.email}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 rounded-xl min-h-11"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
