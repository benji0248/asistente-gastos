import type { ReactNode } from "react"
import { Outlet } from "react-router-dom"
import { AppSidebar } from "./AppSidebar"
import { MobileNav } from "./MobileNav"

interface DashboardLayoutProps {
  children?: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="relative min-h-screen mesh-bg">
      <div className="pointer-events-none fixed inset-0 dot-grid opacity-40" aria-hidden />
      <AppSidebar />
      <div className="relative lg:pl-[17rem]">
        <MobileNav />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  )
}
