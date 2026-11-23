import { useCallback, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import Sidebar from "./Sidebar"
import Header from "./Header"
import { cn } from "@/lib/utils"
import UpcomingAppointmentReminder from "@/components/ui/UpcomingAppointmentReminder"
import GuidedTour from "./GuidedTour"
import { getSessionUser } from "@/lib/session"

export default function MainLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const handleTourTargetChange = useCallback((target: string | null) => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches
    setMenuOpen(isMobile && (target === "brand" || target?.startsWith("navigation-") === true))
    if (target) setCollapsed(false)
  }, [])

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
        <Header
          onMenuClick={() => setMenuOpen(true)}
          onStartGuidedTour={() => window.dispatchEvent(new Event("softio:start-guided-tour"))}
        />
        <main className="min-w-0 flex-1 px-3 py-3 sm:px-4 sm:py-4 lg:px-5">
          <div key={location.pathname} className="app-page-enter w-full min-w-0">
            <Outlet />
          </div>
        </main>
      </div>
      <UpcomingAppointmentReminder />
      <GuidedTour
        key={getSessionUser().email}
        onTargetChange={handleTourTargetChange}
      />
    </div>
  )
}