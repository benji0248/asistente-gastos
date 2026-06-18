import { Link } from "react-router-dom"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarNavLinkProps {
  to: string
  label: string
  icon: LucideIcon
  isActive: boolean
  onClick?: () => void
}

export function SidebarNavLink({
  to,
  label,
  icon: Icon,
  isActive,
  onClick,
}: SidebarNavLinkProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-foreground text-background shadow-soft"
          : "text-muted-foreground hover:bg-accent/80 hover:text-foreground"
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
          isActive
            ? "bg-background/15"
            : "bg-muted/60 group-hover:bg-muted"
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      {label}
    </Link>
  )
}
