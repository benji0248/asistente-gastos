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
    <div className="min-h-[calc(100vh-4rem)] flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white" />
          <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-white" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/home" className="flex items-center gap-2 font-bold text-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
              <Wallet className="h-5 w-5" />
            </div>
            Control de Gastos
          </Link>

          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold leading-tight">
                Toma el control de tus finanzas personales
              </h2>
              <p className="mt-4 text-emerald-100 text-lg leading-relaxed">
                Registra gastos, organiza tus cuentas y visualiza en qué se va tu dinero cada mes.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: Receipt, text: "Categoriza cada gasto fácilmente" },
                { icon: Landmark, text: "Administra múltiples cuentas y billeteras" },
                { icon: BarChart3, text: "Analiza tus hábitos de consumo" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-emerald-50">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-emerald-200">
            © {new Date().getFullYear()} Control de Gastos
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50">
        <div className="lg:hidden mb-8 flex items-center gap-2 font-bold text-lg">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wallet className="h-5 w-5" />
          </div>
          <span>
            Control de <span className="text-primary">Gastos</span>
          </span>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
