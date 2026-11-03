import { useState, useRef, useEffect, useCallback } from "react"
import {
  Menu, Moon, Sun, Bell, LogOut, Palette, CheckCheck, UserRound, Building2, Wallet,
} from "lucide-react"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"
import { getSessionUser, logout } from "@/lib/session"
import { useLocation, useNavigate } from "react-router-dom"
import {
  getNotifications,
  getUnreadCount,
  markRead,
  type Notif,
} from "@/services/notifications"

const titles: Record<string, string> = {
  dashboard: "Tableau de bord",
  statistiques: "Statistiques",
  prospects: "Prospects",
  prospections: "Prospections",
  "rendez-vous": "Rendez-vous",
  interets: "Intérêts",
  closing: "Closing",
  clients: "Clients",
  ventes: "Ventes",
  facturation: "Facturation",
  sav: "SAV",
  catalogue: "Produits",
  stock: "Stock",
  commerciaux: "Commerciaux",
  bibliotheque: "Bibliothèque",
  tutoriels: "Tutoriels",
  notifications: "Notifications",
  profil: "Profil",
  entreprise: "Mon entreprise",
  comptabilite: "Comptabilité",
}

const colorOptions = [
  { name: "Navy", value: "navy", color: "#1e3a5f" },
  { name: "Teal", value: "teal", color: "#0f5c56" },
  { name: "Rose", value: "rose", color: "#9d4a6a" },
  { name: "Violet", value: "violet", color: "#6b4f8a" },
] as const

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { theme, toggleTheme, colorTheme, setColorTheme } = useTheme()
  const [user, setUser] = useState(getSessionUser)
  const navigate = useNavigate()
  const page = titles[useLocation().pathname.split("/")[1]] ?? ""
  const [showPalette, setShowPalette] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [notifications, setNotifications] = useState<Notif[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationError, setNotificationError] = useState(false)

  const paletteRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateUser = () => setUser(getSessionUser())
    window.addEventListener("softio:profile-updated", updateUser)
    return () => window.removeEventListener("softio:profile-updated", updateUser)
  }, [])

  const refreshNotifications = useCallback(async () => {
    try {
      const [result, count] = await Promise.all([
        getNotifications({ page: 1 }),
        getUnreadCount(),
      ])
      setNotifications((result.data || []).slice(0, 5))
      setUnreadCount(count)
      setNotificationError(false)
    } catch {
      setNotificationError(true)
    }
  }, [])

  useEffect(() => {
    const initialRefresh = window.setTimeout(refreshNotifications, 0)
    const interval = window.setInterval(refreshNotifications, 30000)
    return () => {
      window.clearTimeout(initialRefresh)
      window.clearInterval(interval)
    }
  }, [refreshNotifications])

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

  const openNotification = (notification: Notif) => {
    setShowNotifications(false)
    if (!notification.lu) {
      setNotifications((current) => current.map((item) =>
        item.id_notification === notification.id_notification ? { ...item, lu: true } : item
      ))
      setUnreadCount((count) => Math.max(0, count - 1))
      markRead(notification.id_notification).catch(() => refreshNotifications())
    }

    if (notification.type === "message" && notification.id_prospection) {
      const params = new URLSearchParams()
      if (notification.sous_titre) params.set("messageSubject", notification.sous_titre)
      if (notification.contenu) params.set("messageBody", notification.contenu.slice(0, 200))
      navigate(`/prospections/${notification.id_prospection}${params.size ? `?${params}` : ""}`)
    } else if (notification.type === "rdv" && notification.id_rdv) {
      navigate(`/rendez-vous?rdv=${notification.id_rdv}`)
    }
  }

  return (
    <header className="h-14 sticky top-0 z-20 flex items-center justify-between px-3 sm:px-5 bg-background/90 backdrop-blur-md shadow-sm">
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-accent"
        title="Ouvrir le menu"
      >
        <Menu size={20} />
      </button>

      <h2 className="ml-2 font-semibold text-base md:ml-0">{page}</h2>

      <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
        {/* Palette */}
        <div className="relative" ref={paletteRef}>
          <button
            onClick={() => {
              setShowPalette(!showPalette)
              setShowNotifications(false)
              setShowUserMenu(false)
            }}
            className="p-2 rounded-lg text-muted-foreground hover:bg-accent"
            title="Couleur du thème"
          >
            <Palette size={18} />
          </button>

        {showPalette && (
          <div className="absolute right-0 mt-2 w-44 rounded-xl bg-card py-2 shadow-xl z-50 ring-1 ring-black/5 dark:ring-white/10">
            <p className="px-3 pb-1.5 text-[11px] font-medium text-muted-foreground">
              Couleur
            </p>
            {colorOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setColorTheme(option.value)
                  setShowPalette(false)
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                  colorTheme === option.value
                    ? "bg-accent font-medium text-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: option.color }}
                />
                {option.name}
                {colorTheme === option.value && (
                  <span className="ml-auto text-xs opacity-50">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
        </div>

        {/* Dark / Light */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-muted-foreground hover:bg-accent"
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
              refreshNotifications()
            }}
            className="p-2 rounded-lg text-muted-foreground hover:bg-accent relative"
            title="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 min-w-6 h-6 px-1 rounded-full border-2 border-background bg-red-600 text-white text-xs font-bold shadow-sm flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-card rounded-xl shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 flex items-center justify-between">
                <h3 className="font-semibold text-sm">Notifications</h3>
                <span className="text-xs text-muted-foreground">
                  {unreadCount} non lue(s)
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notificationError && (
                  <p className="px-4 py-4 text-center text-sm text-destructive">
                    Impossible de charger les notifications.
                  </p>
                )}
                {!notificationError && notifications.length === 0 && (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Rien de nouveau pour le moment.
                  </p>
                )}
                {notifications.map((n) => (
                  <div
                    key={n.id_notification}
                    className={cn(
                      "px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer",
                      !n.lu && "bg-primary/5"
                    )}
                    onClick={() => openNotification(n)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{n.titre}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {n.sous_titre || n.contenu || (n.type === "rdv" ? "Rendez-vous" : "Message")}
                        </p>
                      </div>
                      {n.lu && <CheckCheck size={16} className="text-emerald-600 shrink-0" />}
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowNotifications(false)
                  navigate("/notifications")
                }}
                className="w-full border-t border-border px-4 py-3 text-left text-sm font-medium text-primary hover:bg-accent"
              >
                Voir toutes les notifications
              </button>
            </div>
          )}
        </div>

        {/* User */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu)
              setShowNotifications(false)
              setShowPalette(false)
            }}
            className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium hover:opacity-90"
          >
            {user.initiale}
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-card rounded-xl shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3">
                <p className="text-sm font-semibold">{user.nom}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    navigate("/profil")
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <UserRound size={16} /> Profil
                </button>
                {user.role === "admin" && (
                  <>
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        navigate("/entreprise")
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <Building2 size={16} /> Mon entreprise
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        navigate("/comptabilite")
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <Wallet size={16} /> Comptabilité
                    </button>
                  </>
                )}
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
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