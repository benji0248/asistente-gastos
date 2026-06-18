import { Link } from "react-router-dom"
import { LogOut, Wallet } from "lucide-react"
import useAuth from "@/hooks/useAuth"
import { useLogout } from "@/hooks/useLogout"
import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { getDashboardNavItems } from "./dashboardNav"
import { SidebarNavLink } from "./SidebarNavLink"

export function AppSidebar() {
  const { auth } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const logout = useLogout()

  if (!auth?.id) return null

  const navItems = getDashboardNavItems(auth.id)

  const signOut = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <aside className="hidden lg:flex lg:w-[17rem] lg:flex-col lg:fixed lg:inset-y-0 lg:z-30">
      <div className="flex h-full flex-col glass-panel border-r m-3 mr-0 rounded-2xl shadow-glow">
        <div className="flex h-16 items-center gap-3 px-5">
          <Link to="/home" className="flex items-center gap-3 font-display font-bold text-base">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background shadow-soft">
              <Wallet className="h-4 w-4" />
            </div>
            <span className="truncate leading-tight">
              Control
              <span className="block text-xs font-normal text-muted-foreground font-sans">
                de Gastos
              </span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            Menú
          </p>
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
              />
            )
          })}
        </nav>

        <div className="border-t border-border/50 p-4 space-y-3">
          <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground/10 font-display text-sm font-bold uppercase">
              {auth.user?.charAt(0) ?? "U"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{auth.user}</p>
              <p className="text-xs text-muted-foreground truncate">{auth.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 rounded-xl"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </aside>
  )
}
