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
      <section className="relative overflow-hidden mesh-bg">
        <div className="pointer-events-none absolute inset-0 dot-grid opacity-30" aria-hidden />
        <div className="absolute -top-40 right-0 h-96 w-96 rounded-full bg-muted/50 blur-3xl" />
        <div className="absolute -bottom-20 left-0 h-72 w-72 rounded-full bg-border/60 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge
              variant="secondary"
              className="mb-8 gap-1.5 rounded-full px-4 py-1.5 text-sm shadow-soft"
            >
              <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
              Gratis y fácil de usar
            </Badge>
            <h1 className="font-display text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl text-balance">
              Toma control de tus{" "}
              <span className="text-muted-foreground">gastos mensuales</span>
            </h1>
            <p className="mt-8 text-lg text-muted-foreground leading-relaxed sm:text-xl text-balance">
              La forma más sencilla de registrar, categorizar y analizar tus finanzas
              personales. Empieza hoy y nota la diferencia en tu administración del dinero.
            </p>
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="w-full sm:w-auto gap-2 rounded-xl shadow-soft h-12 px-8">
                <Link to="/register">
                  Crear cuenta gratis
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto rounded-xl h-12 px-8">
                <Link to="/login">Ya tengo cuenta</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="font-display text-3xl font-bold sm:text-4xl text-balance">
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
                className="group border-border/40 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated"
              >
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground/[0.04] ring-1 ring-border/60 transition-all duration-300 group-hover:bg-foreground group-hover:text-background group-hover:ring-foreground/20">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="font-display text-xl">{title}</CardTitle>
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

      <section className="bg-card/50 py-24 sm:py-28 border-y border-border/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              ¿Cómo funciona?
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Cuatro pasos para empezar a controlar tus finanzas.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-background font-display text-xl font-bold shadow-soft">
                  {step.number}
                </div>
                <h3 className="font-display font-semibold text-lg">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-foreground px-8 py-20 text-center text-background shadow-elevated sm:px-16">
            <div className="pointer-events-none absolute inset-0 dot-grid opacity-[0.06]" aria-hidden />
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-background" />
              <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-background" />
            </div>
            <div className="relative">
              <CheckCircle2 className="mx-auto mb-6 h-12 w-12 opacity-50" />
              <h2 className="font-display text-3xl font-bold sm:text-4xl text-balance">
                ¿Listo para controlar tus gastos?
              </h2>
              <p className="mx-auto mt-4 max-w-xl opacity-60 text-lg">
                Únete y empieza a manejar tu dinero con claridad. Notarás la diferencia
                desde el primer mes.
              </p>
              <Button
                size="lg"
                asChild
                className="mt-10 rounded-xl bg-background text-foreground hover:bg-background/90 shadow-soft h-12 px-8"
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

      <footer className="border-t border-border/40 bg-background py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Control de Gastos. Todos los derechos reservados.
            </p>
            <div className="flex gap-6 text-sm">
              <Link
                to="/login"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                className="text-muted-foreground hover:text-foreground transition-colors"
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
