import type { ReactNode } from "react"
import { Outlet } from "react-router-dom"
import { AppSidebar } from "./AppSidebar"
import { MobileNav } from "./MobileNav"

interface DashboardLayoutProps {
  children?: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="relative min-h-screen mesh-bg overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 dot-grid opacity-40" aria-hidden />
      <AppSidebar />
      <div className="relative min-w-0 lg:pl-[17rem]">
        <MobileNav />
        <main className="mx-auto w-full min-w-0 max-w-7xl px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pt-8 lg:px-10 lg:py-10 lg:pb-10">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  )
}
