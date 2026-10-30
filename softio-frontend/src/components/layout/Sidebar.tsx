import { NavLink } from "react-router-dom"
import {
  LayoutDashboard, BarChart3, UserSearch, Target, CalendarDays, Sparkles, Trophy,
  Users, ShoppingCart, FileText, LifeBuoy, Package, Boxes, UserCog, BookOpen, GraduationCap,
  LogOut, X, ChevronLeft, ChevronRight,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { getSessionUser, logout } from "@/lib/session"

type Item = { name: string; path: string; icon: LucideIcon; adminOnly?: boolean }
type Group = { title: string; items: Item[] }

const groups: Group[] = [
  {
    title: "Pilotage",
    items: [
      { name: "Tableau de bord", path: "/dashboard", icon: LayoutDashboard },
      { name: "Statistiques", path: "/statistiques", icon: BarChart3 },
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
      { name: "Commerciaux", path: "/commerciaux", icon: UserCog, adminOnly: true },
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
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col bg-card text-card-foreground shadow-md transition-all duration-300",
          collapsed ? "w-[72px]" : "w-[260px]",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center justify-between px-3 shadow-sm">
          {!collapsed ? (
            <div className="flex items-center gap-2.5 px-1">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary font-bold text-primary-foreground text-sm">
                S
              </span>
              <span className="text-lg font-semibold tracking-tight">Softio</span>
            </div>
          ) : (
            <span className="mx-auto grid h-8 w-8 place-items-center rounded-lg bg-primary font-bold text-primary-foreground text-sm">
              S
            </span>
          )}

          <button
            onClick={() => onCollapsedChange(!collapsed)}
            className="hidden md:flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title={collapsed ? "Agrandir" : "Réduire"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          <button
            onClick={onClose}
            className="md:hidden flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:bg-accent"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-5">
          {groups.map((group) => {
            const items = group.items.filter(
              (i) => !i.adminOnly || user.role === "admin"
            )
            if (!items.length) return null

            return (
              <div key={group.title}>
                {!collapsed && (
                  <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.title}
                  </p>
                )}
                <ul className="space-y-0.5">
                  {items.map(({ name, path, icon: Icon }) => (
                    <li key={path}>
                      <NavLink
                        to={path}
                        onClick={onClose}
                        title={collapsed ? name : undefined}
                        className={({ isActive }) =>
                          cn(
                            "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                            collapsed && "justify-center px-0",
                            isActive
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground"
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && !collapsed && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary" />
                            )}
                            <Icon
                              size={18}
                              className={cn(
                                "shrink-0",
                                isActive
                                  ? "text-primary"
                                  : "text-muted-foreground group-hover:text-foreground"
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

        {/* User */}
        <div className="shrink-0 p-3 shadow-[0_-1px_0_0_hsl(var(--border))]">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
              {user.initiale}
            </span>
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{user.nom}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.role === "admin" ? "Administrateur" : "Commercial"}
                  </p>
                </div>
                <button
                  onClick={logout}
                  title="Se déconnecter"
                  className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <LogOut size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}