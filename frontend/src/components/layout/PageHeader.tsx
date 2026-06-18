import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between min-w-0",
        className
      )}
    >
      <div className="space-y-1.5 min-w-0 flex-1">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl truncate">
          {title}
        </h1>
        {description && (
          <p className="text-base text-muted-foreground text-balance max-w-xl capitalize truncate">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
