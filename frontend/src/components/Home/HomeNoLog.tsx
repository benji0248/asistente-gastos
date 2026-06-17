import { Link } from "react-router-dom"
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Landmark,
  Receipt,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const features = [
  {
    icon: Receipt,
    title: "Maneja tus gastos",
    description:
      "Ingresa y categoriza cada gasto para tener una vista clara de tus hábitos de consumo y tomar mejores decisiones.",
  },
  {
    icon: Landmark,
    title: "Define tus cuentas",
    description:
      "Establece tus fuentes de dinero: efectivo, cuentas bancarias y billeteras virtuales. Visualiza tu balance total en un solo lugar.",
  },
  {
    icon: BarChart3,
    title: "Mira las estadísticas",
    description:
      "Compara tus gastos mes a mes y descubre en qué categorías se va tu dinero para planificar mejor tu presupuesto.",
  },
]

const steps = [
  { number: 1, title: "Regístrate gratis", description: "Crea tu cuenta en menos de un minuto" },
  { number: 2, title: "Registra gastos", description: "Anota cada transacción del mes" },
  { number: 3, title: "Categoriza", description: "Organiza por tipo de gasto" },
  { number: 4, title: "Analiza", description: "Obtén un panorama claro de tus finanzas" },
]

const HomeNoLog = () => {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-slate-50 to-teal-50" />
        <div className="absolute -top-40 right-0 h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute -bottom-20 left-0 h-60 w-60 rounded-full bg-teal-200/30 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6 gap-1.5 px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Gratis y fácil de usar
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Toma control de tus{" "}
              <span className="text-primary">gastos mensuales</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed sm:text-xl">
              La forma más sencilla de registrar, categorizar y analizar tus finanzas
              personales. Empieza hoy y nota la diferencia en tu administración del dinero.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="w-full sm:w-auto gap-2">
                <Link to="/register">
                  Crear cuenta gratis
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                <Link to="/login">Ya tengo cuenta</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Todo lo que necesitas para organizar tu dinero
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Herramientas simples pero potentes para que siempre sepas en qué gastas.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <Card
                key={title}
                className="group border-border/60 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-100"
              >
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-20 sm:py-24 border-y border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              ¿Cómo funciona?
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Cuatro pasos para empezar a controlar tus finanzas.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold shadow-md shadow-emerald-200">
                  {step.number}
                </div>
                <h3 className="font-semibold text-lg">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 px-8 py-16 text-center text-white shadow-xl sm:px-16">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white" />
              <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white" />
            </div>
            <div className="relative">
              <CheckCircle2 className="mx-auto mb-6 h-12 w-12 text-emerald-200" />
              <h2 className="text-3xl font-bold sm:text-4xl">
                ¿Listo para controlar tus gastos?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-emerald-100 text-lg">
                Únete y empieza a manejar tu dinero con claridad. Notarás la diferencia
                desde el primer mes.
              </p>
              <Button
                size="lg"
                variant="secondary"
                asChild
                className="mt-8 bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg"
              >
                <Link to="/register">
                  Regístrate ahora
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-background py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Control de Gastos. Todos los derechos reservados.
            </p>
            <div className="flex gap-6 text-sm">
              <Link
                to="/login"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}

export default HomeNoLog
