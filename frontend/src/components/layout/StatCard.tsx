import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  highlight?: boolean
  loading?: boolean
  className?: string
  /** Acción inline pegada al valor (p. ej. ojito de privacidad). */
  valueAction?: ReactNode
}

export function StatCard({
  label,
  value,
  icon: Icon,
  highlight,
  loading,
  className,
  valueAction,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-border/40 bg-card/80 shadow-soft",
        "transition-all duration-300 motion-safe:hover:shadow-elevated motion-safe:hover:-translate-y-0.5",
        className
      )}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-muted/60 blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-70" />
      <CardHeader className="relative flex flex-row items-start justify-between gap-2 px-4 pt-4 pb-2 sm:items-center sm:px-6 sm:pt-6">
        <CardTitle className="min-w-0 text-[11px] font-medium leading-snug text-muted-foreground font-sans sm:text-sm">
          {label}
        </CardTitle>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.04] ring-1 ring-border/60 transition-colors group-hover:bg-foreground/[0.07] sm:h-9 sm:w-9 sm:rounded-xl">
          <Icon className="h-3.5 w-3.5 text-foreground/70 sm:h-4 sm:w-4" />
        </div>
      </CardHeader>
      <CardContent className="relative px-4 pb-4 pt-0 sm:px-6 sm:pb-6">
        {loading ? (
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground sm:h-8 sm:w-8" />
        ) : (
          <div className="flex min-w-0 items-center gap-1">
            <p
              className={cn(
                "min-w-0 font-display text-lg font-bold tracking-tight tabular-nums break-all sm:text-2xl lg:text-3xl",
                highlight ? "text-destructive" : "text-foreground"
              )}
            >
              {value}
            </p>
            {valueAction}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
