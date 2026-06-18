import type { LucideIcon } from "lucide-react"
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
}

export function StatCard({ label, value, icon: Icon, highlight, loading, className }: StatCardProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-border/40 bg-card/80 shadow-soft",
        "transition-all duration-300 hover:shadow-elevated hover:-translate-y-0.5",
        className
      )}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-muted/60 blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-70" />
      <CardHeader className="relative flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground font-sans">
          {label}
        </CardTitle>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground/[0.04] ring-1 ring-border/60 transition-colors group-hover:bg-foreground/[0.07]">
          <Icon className="h-4 w-4 text-foreground/70" />
        </div>
      </CardHeader>
      <CardContent className="relative">
        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          <p
            className={cn(
              "font-display text-3xl font-bold tracking-tight",
              highlight ? "text-destructive" : "text-foreground"
            )}
          >
            {value}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
