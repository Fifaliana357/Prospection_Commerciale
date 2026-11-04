import { useState, useRef, useEffect, useCallback } from "react"
import {
  Menu, Moon, Sun, Bell, LogOut, Palette, CheckCheck, UserRound, Building2, Wallet,
  Search, Command, X, ArrowRight, LayoutDashboard, UsersRound, Target, CalendarDays,
  Sparkles, Trophy, ShoppingCart, FileText, LifeBuoy, Package, Boxes, UserCog,
  BookOpen, GraduationCap, ChartNoAxesCombined,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"
import Modal from "@/components/ui/Modal"
import { getSessionUser, logout } from "@/lib/session"
import { useLocation, useNavigate } from "react-router-dom"
import {
  getNotifications,
  getUnreadCount,
  markRead,
  type Notif,
} from "@/services/notifications"

const titles: Record<string, string> = {
  dashboard: "Aujourd’hui",
  apparence: "Apparence",
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

function normalizeSearchValue(value: string) {
  return value
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

const destinations: Array<{ label: string; path: string; group: string; icon: LucideIcon; adminOnly?: boolean }> = [
  { label: "Tableau de bord", path: "/dashboard", group: "Pilotage", icon: LayoutDashboard },
  { label: "Prospects", path: "/prospects", group: "Prospection", icon: UsersRound },
  { label: "Pipeline de prospection", path: "/prospections", group: "Prospection", icon: Target },
  { label: "Rendez-vous", path: "/rendez-vous", group: "Prospection", icon: CalendarDays },
  { label: "Intérêts", path: "/interets", group: "Prospection", icon: Sparkles },
  { label: "Closing", path: "/closing", group: "Prospection", icon: Trophy },
  { label: "Clients", path: "/clients", group: "Ventes", icon: UserRound },
  { label: "Ventes", path: "/ventes", group: "Ventes", icon: ShoppingCart },
  { label: "Facturation", path: "/facturation", group: "Ventes", icon: FileText },
  { label: "SAV et livraisons", path: "/sav", group: "Ventes", icon: LifeBuoy },
  { label: "Produits et catalogue", path: "/catalogue", group: "Catalogue", icon: Package },
  { label: "Stock", path: "/stock", group: "Catalogue", icon: Boxes },
  { label: "Équipe commerciale", path: "/commerciaux", group: "Équipe", icon: UserCog, adminOnly: true },
  { label: "Bibliothèque", path: "/bibliotheque", group: "Ressources", icon: BookOpen },
  { label: "Tutoriels", path: "/tutoriels", group: "Ressources", icon: GraduationCap },
  { label: "Statistiques", path: "/statistiques", group: "Pilotage", icon: ChartNoAxesCombined },
  { label: "Notifications", path: "/notifications", group: "Compte", icon: Bell },
  { label: "Profil", path: "/profil", group: "Compte", icon: UserRound },
  { label: "Apparence et thèmes", path: "/apparence", group: "Compte", icon: Palette },
  { label: "Mon entreprise", path: "/entreprise", group: "Compte", icon: Building2, adminOnly: true },
  { label: "Comptabilité", path: "/comptabilite", group: "Compte", icon: Wallet, adminOnly: true },
]

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { theme, toggleTheme } = useTheme()
  const [user, setUser] = useState(getSessionUser)
  const navigate = useNavigate()
  const location = useLocation()
  const page = titles[location.pathname.split("/")[1]] ?? ""
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showQuickNav, setShowQuickNav] = useState(false)
  const [quickSearch, setQuickSearch] = useState("")
  const [notifications, setNotifications] = useState<Notif[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationError, setNotificationError] = useState(false)

  const notifRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const quickSearchRef = useRef<HTMLInputElement>(null)
  const matchingDestinations = destinations.filter((destination) => {
    if (destination.adminOnly && user.role !== "admin") {
      return false
    }

    const search = normalizeSearchValue(quickSearch)
    if (!search) return true

    const haystack = normalizeSearchValue(`${destination.label} ${destination.group}`)
    return haystack.includes(search)
  }).slice(0, 8)

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
    if (showQuickNav) quickSearchRef.current?.focus()
  }, [showQuickNav])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setShowQuickNav(true)
        setShowNotifications(false)
        setShowUserMenu(false)
      }
      if (e.key === "Escape") {
        setShowNotifications(false)
        setShowUserMenu(false)
        setShowQuickNav(false)
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
    <>
    <header className="h-14 sticky top-0 z-20 flex items-center justify-between px-3 sm:px-5 bg-background/90 backdrop-blur-md shadow-sm">
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-accent"
        title="Ouvrir le menu"
      >
        <Menu size={20} />
      </button>

      <h2 className="ml-2 font-semibold text-base md:ml-0">{page}</h2>

      <button
        type="button"
        onClick={() => setShowQuickNav(true)}
        className="ml-6 hidden h-10 max-w-md flex-1 items-center gap-2 rounded-xl border border-border bg-card/80 px-3 text-left text-sm text-muted-foreground shadow-sm transition hover:border-primary/30 hover:bg-card lg:flex"
        aria-label="Rechercher une page"
      >
        <Search size={16} />
        <span className="flex-1 truncate">Rechercher une rubrique, un mot-clé...</span>
        <kbd className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"><Command size={10} /> K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
        <button
          type="button"
          onClick={() => setShowQuickNav(true)}
          className="rounded-lg p-2 text-muted-foreground hover:bg-accent lg:hidden"
          title="Rechercher une page"
          aria-label="Rechercher une page"
        >
          <Search size={18} />
        </button>
        <button
          type="button"
          onClick={() => navigate("/apparence")}
          className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-primary"
          title="Personnaliser l’apparence"
          aria-label="Personnaliser l’apparence"
        >
          <Palette size={18} />
        </button>

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
                  onClick={() => {
                    setShowUserMenu(false)
                    navigate("/apparence")
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Palette size={16} /> Apparence
                </button>
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
    {showQuickNav && (
      <Modal
        open={showQuickNav}
        onClose={() => { setShowQuickNav(false); setQuickSearch("") }}
        title="Recherche dans Softio"
        size="2xl"
        hideHeader
        topAligned
        contentClassName="overflow-hidden p-0"
      >
        <div className="mx-auto w-full max-w-4xl">
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search size={19} className="shrink-0 text-primary" />
            <input
              ref={quickSearchRef}
              value={quickSearch}
              onChange={(event) => setQuickSearch(event.target.value)}
              placeholder="Rechercher un menu ou un outil..."
              className="h-14 min-w-0 flex-1 border-0 bg-transparent text-sm outline-none ring-0 focus:border-0 focus:shadow-none focus:outline-none focus:ring-0"
              aria-label="Rechercher une rubrique"
            />
            <button type="button" onClick={() => { setShowQuickNav(false); setQuickSearch("") }} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent" aria-label="Fermer la recherche"><X size={17} /></button>
          </div>
          <div className="max-h-[min(60vh,480px)] overflow-y-auto p-2">
            {matchingDestinations.length ? matchingDestinations.map(({ label, path, group, icon: Icon }) => (
              <button
                type="button"
                key={path}
                onClick={() => { navigate(path); setShowQuickNav(false); setQuickSearch("") }}
                className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-primary/8"
              >
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary"><Icon size={17} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block text-xs text-muted-foreground">{group}</span>
                </span>
                <ArrowRight size={15} className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            )) : (
              <p className="px-3 py-10 text-center text-sm text-muted-foreground">Aucune rubrique ne correspond à « {quickSearch} ».</p>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-2.5 text-[11px] text-muted-foreground">
            <span>Accès rapide aux rubriques et outils Softio</span>
            <span className="rounded border border-border bg-card px-1.5 py-0.5">Esc</span>
          </div>
        </div>
      </Modal>
    )}
    </>
  )
}