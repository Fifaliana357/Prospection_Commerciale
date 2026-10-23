import { NavLink } from "react-router-dom"
import {
  Users, MessageSquare, Calendar, Handshake, ShoppingCart,
  Package, Warehouse, FileText, UserCog, BarChart3,
  FolderOpen, BookOpen, Headphones
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { useTheme } from "@/contexts/ThemeContext"

// Importe tes logos
import logoLight from "@/assets/softio-fixed.png"        // version claire / blanche
import logoDark from "@/assets/softio-fixed-black.png"   // version noire
import logoIcon from "@/assets/softio-logo.png"          // cube
import logoIconBlack from "@/assets/softio-logo-black.png"

const menuItems = [
  {
    title: "Prospection",
    items: [
      { name: "Prospects", path: "/prospects", icon: Users },
      { name: "Prospection", path: "/prospection", icon: MessageSquare },
      { name: "Intérêts", path: "/interets", icon: BookOpen },
      { name: "Rendez-vous", path: "/rendez-vous", icon: Calendar },
      { name: "Closing", path: "/closing", icon: Handshake },
    ],
  },
  {
    title: "Offres",
    items: [
      { name: "Ventes", path: "/ventes", icon: ShoppingCart },
      { name: "Produits & Services", path: "/catalogue", icon: Package },
      { name: "Gestion de stock", path: "/stock", icon: Warehouse },
      { name: "Facturation", path: "/facturation", icon: FileText },
      { name: "SAV", path: "/sav", icon: Headphones }, // ← Ajouté
    ],
  },
  {
    title: "Autres",
    items: [
      { name: "Commerciaux", path: "/commerciaux", icon: UserCog },
      { name: "Statistiques", path: "/statistiques", icon: BarChart3 },
      { name: "Bibliothèque", path: "/bibliotheque", icon: FolderOpen },
      { name: "Tutoriels", path: "/tutoriels", icon: BookOpen },
    ],
  },
]

export default function Sidebar({
  mobileOpen,
  onMobileClose,
}: {
  mobileOpen: boolean
  onMobileClose: () => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const { theme } = useTheme()

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 h-dvh border-r border-border bg-sidebar flex flex-col transition-all duration-300 md:sticky md:top-0 md:z-auto md:h-screen md:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        collapsed ? "w-[72px] md:w-[72px]" : "w-64 md:w-56"
      )}
    >
      {/* Logo */}
      {/* Logo */}
<div className="h-16 flex items-center px-3 border-b border-border">
  {!collapsed ? (
    // Sidebar ouverte → logo cliquable pour fermer
    <button
    onClick={() => {
      setCollapsed(true)
      onMobileClose()
    }}
      className="flex items-center gap-2 w-full hover:opacity-80 transition-opacity"
      title="Fermer le menu"
    >
      <img
        src={theme === "dark" ? logoLight : logoDark}
        alt="Softio"
        className="h-10 max-w-full object-contain"
      />
    </button>
  ) : (
    // Sidebar fermée → logo cliquable pour ouvrir
    <button
    onClick={() => {
      setCollapsed(false)
      onMobileClose()
    }}
      className="mx-auto p-1.5 rounded-md hover:bg-accent transition-colors"
      title="Ouvrir le menu"
    >
      <img
        src={theme === "light" ? logoIconBlack : logoIcon}
        alt="Softio"
        className="h-8 w-8 object-contain"
      />
    </button>
  )}
</div>

      {/* Navigation */}
      <nav className="sidebar-navigation flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {menuItems.map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group.title}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onMobileClose}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )
                  }
                >
                  <item.icon size={18} className="shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}