import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { BarChart3, Landmark, Receipt, Wallet } from "lucide-react"

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex mesh-bg">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-foreground text-background m-3 ml-3 rounded-3xl shadow-elevated">
        <div className="pointer-events-none absolute inset-0 dot-grid opacity-[0.07]" aria-hidden />
        <div className="absolute inset-0 opacity-[0.06]">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-background" />
          <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-background" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/home" className="flex items-center gap-3 font-display font-bold text-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background/10 backdrop-blur ring-1 ring-background/20">
              <Wallet className="h-5 w-5" />
            </div>
            Control de Gastos
          </Link>

          <div className="space-y-8">
            <div>
              <h2 className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-balance">
                Toma el control de tus finanzas personales
              </h2>
              <p className="mt-5 opacity-60 text-lg leading-relaxed">
                Registra gastos, organiza tus cuentas y visualiza en qué se va tu dinero cada mes.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { icon: Receipt, text: "Categoriza cada gasto fácilmente" },
                { icon: Landmark, text: "Administra múltiples cuentas y billeteras" },
                { icon: BarChart3, text: "Analiza tus hábitos de consumo" },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-3 rounded-xl bg-background/5 px-4 py-3 ring-1 ring-background/10"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background/10">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="opacity-80">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm opacity-40">
            © {new Date().getFullYear()} Control de Gastos
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-12">
        <div className="lg:hidden mb-8 flex items-center gap-2 font-display font-bold text-lg">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background">
            <Wallet className="h-5 w-5" />
          </div>
          <span>Control de Gastos</span>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <h1 className="font-display text-3xl font-bold tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="rounded-2xl border border-border/40 bg-card/80 p-6 shadow-soft backdrop-blur-sm sm:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
