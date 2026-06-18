import type { LucideIcon } from "lucide-react"
import { Home, Receipt, User } from "lucide-react"

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  match?: (pathname: string) => boolean
}

export function getDashboardNavItems(userId: string): NavItem[] {
  return [
    {
      to: "/home",
      label: "Inicio",
      icon: Home,
      match: (pathname) => pathname === "/" || pathname === "/home",
    },
    {
      to: `/${userId}/expenses`,
      label: "Gastos",
      icon: Receipt,
      match: (pathname) => pathname.includes("/expenses"),
    },
    {
      to: `/${userId}/profile`,
      label: "Cuenta",
      icon: User,
      match: (pathname) => pathname.includes("/profile"),
    },
  ]
}
