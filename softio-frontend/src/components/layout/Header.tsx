import { useState, useRef, useEffect } from "react"
import { Menu, Moon, Sun, Bell, User, Settings, LogOut, Palette } from "lucide-react"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"

const colorOptions = [
  { name: "Émeraude", value: "emerald", color: "#10b981" },
  { name: "Océan", value: "ocean", color: "#3b82f6" },
  { name: "Violet", value: "violet", color: "#a78bfa" },
  { name: "Coucher de soleil", value: "sunset", color: "#fb923c" },
  { name: "Ardoise", value: "slate", color: "#94a3b8" },
] as const

const notifications = [
  { id: 1, title: "Nouveau prospect", message: "Jean Rakoto a été ajouté", time: "Il y a 12 min", read: false },
  { id: 2, title: "RDV à venir", message: "Rendez-vous avec Nir'Info à 14h", time: "Il y a 34 min", read: false },
  { id: 3, title: "Vente validée", message: "VTE-2026-0012 a été validée", time: "Il y a 1h", read: true },
  { id: 4, title: "Ticket SAV", message: "Nouveau ticket ouvert par SoftLabs", time: "Il y a 2h", read: true },
]

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { theme, toggleTheme, colorTheme, setColorTheme } = useTheme()
  const [showPalette, setShowPalette] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const paletteRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
        setShowPalette(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowPalette(false)
        setShowNotifications(false)
        setShowUserMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <header className="h-16 border-b border-border bg-card/90 backdrop-blur sticky top-0 z-20 flex items-center justify-between px-3 sm:px-6">
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-accent"
        title="Ouvrir le menu"
        aria-label="Ouvrir le menu"
      >
        <Menu size={20} />
      </button>

      {/* Actions */}
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <div className="relative" ref={paletteRef}>
          <button
            onClick={() => {
              setShowPalette(!showPalette)
              setShowNotifications(false)
              setShowUserMenu(false)
            }}
            className="p-2 rounded-lg text-muted-foreground hover:bg-accent"
            title="Choisir une couleur"
            aria-label="Choisir une couleur"
            aria-haspopup="true"
            aria-expanded={showPalette}
          >
            <Palette size={18} />
          </button>

          {showPalette && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card p-3 shadow-xl z-50">
              <p className="px-1 pb-2 text-xs font-semibold text-muted-foreground">Couleur du thème</p>
              <div className="grid grid-cols-3 gap-2">
                {colorOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setColorTheme(option.value)
                      setShowPalette(false)
                    }}
                    title={option.name}
                    aria-label={option.name}
                    aria-pressed={colorTheme === option.value}
                    className={cn(
                      "h-9 rounded-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                      colorTheme === option.value && "ring-2 ring-primary ring-offset-2 ring-offset-card"
                    )}
                    style={{ backgroundColor: option.color }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dark / Light */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-accent text-muted-foreground"
          title={theme === "light" ? "Mode sombre" : "Mode clair"}
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications)
              setShowUserMenu(false)
              setShowPalette(false)
            }}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground relative"
            title="Notifications"
            aria-label="Notifications"
            aria-expanded={showNotifications}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-sm">Notifications</h3>
                <span className="text-xs text-muted-foreground">{unreadCount} non lue(s)</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer border-b border-border last:border-0",
                      !n.read && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                      </div>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-border text-center">
                <button className="text-xs text-primary font-medium hover:underline">
                  Voir toutes les notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu)
              setShowNotifications(false)
              setShowPalette(false)
            }}
            className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium hover:opacity-90 transition-opacity"
            aria-label="Menu utilisateur"
            aria-expanded={showUserMenu}
          >
            A
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold">Admin Softio</p>
                <p className="text-xs text-muted-foreground">admin@softio.mg</p>
              </div>
              <div className="py-1">
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors">
                  <User size={16} className="text-muted-foreground" />
                  Mon profil
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors">
                  <Settings size={16} className="text-muted-foreground" />
                  Paramètres
                </button>
              </div>
              <div className="border-t border-border py-1">
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <LogOut size={16} />
                  Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}