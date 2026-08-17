import type { LucideIcon } from "lucide-react"
import { BarChart3, CreditCard, Home, House, Receipt, Shield, User } from "lucide-react"
import { ROLES } from "@/consts"

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  match?: (pathname: string) => boolean
}

export function getDashboardNavItems(userId: string, role?: number): NavItem[] {
  const items: NavItem[] = [
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
      to: `/${userId}/estadisticas`,
      label: "Estadísticas",
      icon: BarChart3,
      match: (pathname) => pathname.includes("/estadisticas"),
    },
    {
      to: `/${userId}/tarjetas`,
      label: "Tarjetas de crédito",
      icon: CreditCard,
      match: (pathname) => pathname.includes("/tarjetas"),
    },
    {
      to: `/${userId}/hogar`,
      label: "Hogar",
      icon: House,
      match: (pathname) => pathname.includes("/hogar"),
    },
    {
      to: `/${userId}/profile`,
      label: "Cuenta",
      icon: User,
      match: (pathname) => pathname.includes("/profile"),
    },
  ]

  if (role === ROLES.admin) {
    items.push({
      to: "/admin/users",
      label: "Administración",
      icon: Shield,
      match: (pathname) => pathname.startsWith("/admin"),
    })
  }

  return items
}
