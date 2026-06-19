import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
  actionClassName?: string
}

export function PageHeader({
  title,
  description,
  action,
  className,
  actionClassName,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4 min-w-0",
        className
      )}
    >
      <div className="space-y-1 min-w-0 flex-1">
        <h1 className="font-display text-xl font-bold tracking-tight sm:text-3xl lg:text-4xl break-words">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground text-pretty max-w-xl capitalize sm:text-base">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className={cn("shrink-0 w-full sm:w-auto", actionClassName)}>
          {action}
        </div>
      )}
    </div>
  )
}
