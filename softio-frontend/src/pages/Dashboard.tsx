import { useState, useEffect } from "react"
import {
  Users,
  MessageSquare,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
} from "lucide-react"
import { dashboardApi, type DashboardStats } from "@/services/api"

const stats = [
  {
    title: "Prospects",
    value: "1 248",
    change: "+12.5%",
    trend: "up",
    icon: Users,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    title: "Prospections",
    value: "386",
    change: "+8.2%",
    trend: "up",
    icon: MessageSquare,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    title: "RDV du jour",
    value: "12",
    change: "-3.1%",
    trend: "down",
    icon: Calendar,
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    title: "Ventes du mois",
    value: "42.8M",
    change: "+18.7%",
    trend: "up",
    icon: TrendingUp,
    color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
]

const recentActivities = [
  { name: "Rakoto Jean", action: "Nouveau prospect ajouté", time: "Il y a 12 min", type: "prospect" },
  { name: "Société NirInfo", action: "Prospection clôturée", time: "Il y a 34 min", type: "closing" },
  { name: "Rasoanaivo Mamy", action: "RDV planifié", time: "Il y a 1h", type: "rdv" },
  { name: "Andrianasolo Faly", action: "Message envoyé", time: "Il y a 2h", type: "message" },
  { name: "Société SoftLabs", action: "Vente enregistrée", time: "Il y a 3h", type: "vente" },
]

export default function Dashboard() {
  const [liveStats, setLiveStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    dashboardApi.getStats()
      .then((data) => setLiveStats(data))
      .catch((err) => console.warn("Dashboard stats non joint:", err))
  }, [])

  const displayStats = stats.map((s) => {
    if (!liveStats) return s
    if (s.title === "Prospects") return { ...s, value: String(liveStats.prospectsCount) }
    if (s.title === "Prospections") return { ...s, value: String(liveStats.prospectionsCount) }
    if (s.title === "RDV du jour") return { ...s, value: String(liveStats.rdvDuJourCount) }
    if (s.title === "Ventes du mois") return { ...s, value: liveStats.ventesMoisMontant }
    return s
  })

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Vue d’ensemble de votre activité commerciale
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("fr-FR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayStats.map((stat) => (
          <div
            key={stat.title}
            className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 rounded-lg ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div
                className={`flex items-center gap-1 text-xs font-medium ${
                  stat.trend === "up" ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {stat.trend === "up" ? (
                  <ArrowUpRight size={14} />
                ) : (
                  <ArrowDownRight size={14} />
                )}
                {stat.change}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{stat.title}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graphique / Zone principale */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold">Évolution des ventes</h2>
              <p className="text-sm text-muted-foreground">Derniers 6 mois</p>
            </div>
            <button className="p-2 rounded-lg hover:bg-accent text-muted-foreground">
              <MoreHorizontal size={18} />
            </button>
          </div>

          {/* Placeholder graphique */}
          <div className="h-64 flex items-end justify-between gap-3 px-2">
            {[40, 65, 45, 80, 55, 90].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-primary/80 rounded-t-md transition-all hover:bg-primary"
                  style={{ height: `${height}%` }}
                />
                <span className="text-xs text-muted-foreground">
                  {["Mai", "Juin", "Juil", "Août", "Sept", "Oct"][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Activités récentes */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-4">Activités récentes</h2>
          <div className="space-y-4">
            {recentActivities.map((activity, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                  {activity.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{activity.name}</p>
                  <p className="text-xs text-muted-foreground">{activity.action}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}