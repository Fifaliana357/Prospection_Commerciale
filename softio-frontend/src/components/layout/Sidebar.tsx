import { NavLink } from "react-router-dom"
import {
  LayoutDashboard, UserSearch, Target, CalendarDays, Sparkles, Trophy,
  Users, ShoppingCart, FileText, LifeBuoy, Package, Boxes, UserCog, BookOpen, GraduationCap,
  X, ChevronLeft, ChevronRight,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { getSessionUser } from "@/lib/session"
import softioLogo from "@/assets/softio-fixed.png"
import softioMark from "@/assets/softio-logo.png"

type Item = { name: string; path: string; icon: LucideIcon; adminOnly?: boolean }
type Group = { title: string; items: Item[] }

const groups: Group[] = [
  {
    title: "Pilotage",
    items: [
      { name: "Tableau de bord", path: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Prospection",
    items: [
      { name: "Prospects", path: "/prospects", icon: UserSearch },
      { name: "Prospections", path: "/prospections", icon: Target },
      { name: "Rendez-vous", path: "/rendez-vous", icon: CalendarDays },
      { name: "Intérêts", path: "/interets", icon: Sparkles },
      { name: "Closing", path: "/closing", icon: Trophy },
    ],
  },
  {
    title: "Ventes",
    items: [
      { name: "Clients", path: "/clients", icon: Users },
      { name: "Ventes", path: "/ventes", icon: ShoppingCart },
      { name: "Facturation", path: "/facturation", icon: FileText },
      { name: "SAV", path: "/sav", icon: LifeBuoy },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { name: "Produits", path: "/catalogue", icon: Package },
      { name: "Stock", path: "/stock", icon: Boxes },
    ],
  },
  {
    title: "Équipe & Savoir",
    items: [
      { name: "Commerciaux", path: "/commerciaux", icon: UserCog },
      { name: "Bibliothèque", path: "/bibliotheque", icon: BookOpen },
      { name: "Tutoriels", path: "/tutoriels", icon: GraduationCap },
    ],
  },
]

export default function Sidebar({
  open,
  onClose,
  collapsed,
  onCollapsedChange,
}: {
  open: boolean
  onClose: () => void
  collapsed: boolean
  onCollapsedChange: (value: boolean) => void
}) {
  const user = getSessionUser()

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        style={{ backgroundColor: "color-mix(in srgb, hsl(var(--primary)) 30%, #101827)" }}
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col text-white shadow-xl shadow-black/15 transition-all duration-300 md:shadow-none",
          collapsed ? "w-[72px]" : "w-[260px]",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-white/10 px-4">
          {!collapsed ? (
            <div className="flex min-w-0 items-center px-1">
              <img src={softioLogo} alt="Softio — Prospection commerciale" className="h-auto w-[124px] max-w-full object-contain" />
            </div>
          ) : (
            <img src={softioMark} alt="Softio" className="mx-auto h-8 w-8 object-contain" />
          )}

          <button
            onClick={() => onCollapsedChange(!collapsed)}
            className="hidden md:flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            title={collapsed ? "Agrandir" : "Réduire"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          <button
            onClick={onClose}
            className="md:hidden flex items-center justify-center h-8 w-8 rounded-lg text-slate-300 hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-navigation flex-1 overflow-y-auto px-3 py-5 space-y-6">
          {groups.map((group) => {
            const items = group.items.filter(
              (i) => !i.adminOnly || user.role === "admin"
            )
            if (!items.length) return null

            return (
              <div key={group.title}>
                {!collapsed && (
                  <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {group.title}
                  </p>
                )}
                <ul className="space-y-1">
                  {items.map(({ name, path, icon: Icon }) => (
                    <li key={path}>
                      <NavLink
                        to={path}
                        onClick={onClose}
                        title={collapsed ? name : undefined}
                        className={({ isActive }) =>
                          cn(
                            "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-all duration-200",
                            collapsed && "justify-center px-0",
                            isActive
                              ? "bg-white/[0.11] text-white font-semibold shadow-inner shadow-white/[0.03]"
                              : "text-slate-300 hover:bg-white/[0.07] hover:text-white"
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && !collapsed && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-white/80" />
                            )}
                            <Icon
                              size={18}
                              className={cn(
                                "shrink-0",
                                isActive
                                  ? "text-white"
                                  : "text-slate-400 group-hover:text-white"
                              )}
                            />
                            {!collapsed && <span>{name}</span>}
                          </>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </nav>

        <NavLink
          to="/profil"
          onClick={onClose}
          title={collapsed ? user.nom : undefined}
          className={cn("mx-3 mb-3 flex shrink-0 flex-col items-center gap-2 rounded-xl border-t border-white/10 px-2 pt-4 text-center transition-colors hover:bg-white/[0.06]")}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-semibold text-white">
            {user.initiale}
          </span>
          {!collapsed && (
            <span className="min-w-0 py-1">
              <span className="block truncate text-xs font-semibold text-white">{user.nom}</span>
              <span className="block text-[10px] text-slate-400">
                {user.role === "admin" ? "Administrateur" : "Commercial"}
              </span>
            </span>
          )}
        </NavLink>
      </aside>
    </>
  )
}