import { useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import Sidebar from "./Sidebar"
import Header from "./Header"
import { cn } from "@/lib/utils"

export default function MainLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
      />

      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-300",
          collapsed ? "md:pl-[72px]" : "md:pl-[260px]"
        )}
      >
        <Header onMenuClick={() => setMenuOpen(true)} />
        <main className="flex-1 px-3 py-4 sm:px-5 sm:py-5 lg:px-6">
          <div key={location.pathname} className="app-page-enter mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}