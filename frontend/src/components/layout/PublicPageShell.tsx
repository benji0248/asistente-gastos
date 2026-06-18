import type { ReactNode } from "react"
import { PublicNavbar } from "./PublicNavbar"

interface PublicPageShellProps {
  children: ReactNode
  showFooter?: boolean
}

export function PublicPageShell({
  children,
  showFooter = true,
}: PublicPageShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      {showFooter && (
        <footer className="border-t border-border/60 bg-background py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Control de Gastos. Todos los derechos reservados.
              </p>
              <div className="flex gap-6 text-sm">
                <a
                  href="/login"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Iniciar sesión
                </a>
                <a
                  href="/register"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Registrarse
                </a>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
