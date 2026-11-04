import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import {
  AlertCircle, AlertTriangle, CalendarDays, ChartNoAxesCombined, Filter, RefreshCw,
  ShoppingCart, Star, Trophy, Users,
} from "lucide-react"
import api from "@/services/api"
import { useToast } from "@/contexts/ToastContext"
import { Link } from "react-router-dom"
import PageHeader from "@/components/ui/PageHeader"
import TableSummary from "@/components/ui/TableSummary"
import DatePicker from "@/components/ui/DatePicker"
import Select from "@/components/ui/Select"

type DashboardTab = "ventes" | "scoring" | "etoiles"
type Period = "day" | "week" | "month"
type SalesType = "all" | "produit" | "service"
type CommercialOption = { id_commercial: number; nom: string; prenom?: string | null }
type TrendPoint = { periode: string; total: number }
type ProductRank = { designation: string; total: number; qte: number }
type ClientRank = { id_client: number; nom_client: string; total: number; nb_ventes: number }
type Distribution = { type_ligne: string; total: number }
type MessageScore = { note: number; total: number }
type InterestRating = {
  produit_concerne: string | null
  tres_interesse: number
  moyennement_interesse: number
  peu_interesse: number
  pas_interesse: number
  total: number
}

type DashboardStats = {
  prospects: number
  prospections: number
  en_cours: number
  closings: number
  rdv_aujourdhui: number
  chiffre_affaires: number
  nombre_ventes: number
  ventes_non_validees: number
  livraisons_en_retard: number
  clients_avec_achat: number
  evolution: TrendPoint[]
  top_produits: ProductRank[]
  top_clients: ClientRank[]
  repartition: Distribution[]
  scoring_messages: MessageScore[]
  interets_par_etoile: InterestRating[]
  responsables: CommercialOption[]
}

const cardClass = "rounded-xl border border-border bg-card p-4 shadow-sm"
const buttonClass = "inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"

function currentYearRange() {
  const year = new Date().getFullYear()
  return { from: `${year}-01-01`, to: `${year}-12-31` }
}

function money(value: number) {
  return `${new Intl.NumberFormat("fr-FR").format(Number(value) || 0)} Ar`
}

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object"
    && error !== null
    && "response" in error
    && typeof error.response === "object"
    && error.response !== null
    && "data" in error.response
    && typeof error.response.data === "object"
    && error.response.data !== null
    && "message" in error.response.data
    && typeof error.response.data.message === "string"
  ) {
    return error.response.data.message
  }
  return "Erreur lors du chargement des statistiques"
}

function periodLabel(value: string, period: Period) {
  if (period === "day") {
    const date = new Date(`${value}T00:00:00`)
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
  }
  if (period === "month") {
    const date = new Date(`${value}-01T00:00:00`)
    return date.toLocaleDateString("fr-FR", { month: "short", year: "numeric" })
  }
  const match = value.match(/^(\d{4})(\d{2})$/)
  return match ? `Sem. ${match[2]}, ${match[1]}` : value
}

function EvolutionChart({ data, period }: { data: TrendPoint[]; period: Period }) {
  if (!data.length) {
    return <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">Aucune vente sur cette période</p>
  }

  const width = 900
  const height = 260
  const padX = 28
  const padY = 20
  const max = Math.max(...data.map((point) => Number(point.total) || 0), 1)
  const labelStride = Math.ceil(data.length / 12)
  const points = data.map((point, index) => ({
    x: data.length === 1 ? width / 2 : padX + index * (width - padX * 2) / (data.length - 1),
    y: height - padY - (Number(point.total) || 0) / max * (height - padY * 2),
  }))
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")
  const area = `${line} L ${points[points.length - 1].x} ${height - padY} L ${points[0].x} ${height - padY} Z`

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height + 30}`} className="h-64 min-w-[700px] w-full" role="img" aria-label="Évolution du chiffre d’affaires">
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const y = padY + fraction * (height - padY * 2)
          return <line key={fraction} x1={padX} x2={width - padX} y1={y} y2={y} stroke="hsl(var(--border))" strokeDasharray="3 5" />
        })}
        <path d={area} fill="hsl(var(--primary) / 0.12)" />
        <path d={line} fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((point, index) => (
          <g key={`${data[index].periode}-${index}`}>
            <circle cx={point.x} cy={point.y} r="4" fill="hsl(var(--primary))" stroke="hsl(var(--card))" strokeWidth="2" />
            {(index % labelStride === 0 || index === data.length - 1) && (
              <text x={point.x} y={height + 16} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="11">
                {periodLabel(data[index].periode, period)}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  )
}

function DonutChart({ data }: { data: Distribution[] }) {
  const productTotal = Number(data.find((item) => item.type_ligne === "produit")?.total) || 0
  const serviceTotal = Number(data.find((item) => item.type_ligne === "service")?.total) || 0
  const total = productTotal + serviceTotal
  const productPercent = total ? productTotal / total * 100 : 0

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 py-5">
      <div
        className="grid h-40 w-40 place-items-center rounded-full"
        style={{ background: total ? `conic-gradient(hsl(var(--primary)) ${productPercent}%, hsl(38 92% 65%) 0)` : "hsl(var(--muted))" }}
        role="img"
        aria-label={`Produits ${Math.round(productPercent)} %, services ${Math.round(100 - productPercent)} %`}
      >
        <div className="grid h-24 w-24 place-items-center rounded-full bg-card text-center">
          <div><p className="text-xl font-bold">{total ? "100%" : "—"}</p><p className="text-xs text-muted-foreground">des ventes</p></div>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-primary" />Produits · {total ? Math.round(productPercent) : 0}%</span>
        <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />Services · {total ? Math.round(100 - productPercent) : 0}%</span>
      </div>
    </div>
  )
}

function RankList<T extends ProductRank | ClientRank>({
  data,
  metric,
  formatValue,
  name,
  countLabel,
}: {
  data: T[]
  metric: "amount" | "count"
  formatValue: (value: number) => string
  name: (item: T) => string
  countLabel: (item: T) => string
}) {
  if (!data.length) return <p className="py-8 text-center text-sm text-muted-foreground">Aucune vente sur cette période</p>
  const values = data.map((item) => metric === "amount" ? Number(item.total) : ("qte" in item ? Number(item.qte) : Number(item.nb_ventes)))
  const max = Math.max(...values, 1)

  return (
    <ol className="space-y-4">
      {data.map((item, index) => {
        const value = values[index]
        return (
          <li key={`${name(item)}-${index}`}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-medium"><span className="mr-2 text-muted-foreground">{index + 1}.</span>{name(item)}</span>
              <span className="shrink-0 text-xs font-semibold">{metric === "amount" ? formatValue(value) : `${value} ${countLabel(item)}`}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(3, value / max * 100)}%` }} />
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export default function Dashboard() {
  const toast = useToast()
  const toastRef = useRef(toast)
  const initialRange = currentYearRange()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<DashboardTab>("ventes")
  const [dateFrom, setDateFrom] = useState(initialRange.from)
  const [dateTo, setDateTo] = useState(initialRange.to)
  const [type, setType] = useState<SalesType>("all")
  const [commercialId, setCommercialId] = useState("")
  const [period, setPeriod] = useState<Period>("month")
  const [interestSearch, setInterestSearch] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    toastRef.current = toast
  }, [toast])

  useEffect(() => {
    let active = true
    const timeout = window.setTimeout(() => {
      setLoading(true)
      api.get<DashboardStats>("/dashboard", {
        params: {
          date_from: dateFrom,
          date_to: dateTo,
          type,
          commercial_id: commercialId || undefined,
          period,
          interest_search: interestSearch.trim() || undefined,
        },
      })
        .then((response) => {
          if (active) setStats(response.data)
        })
        .catch((error: unknown) => {
          if (active) toastRef.current.error(getErrorMessage(error))
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }, interestSearch ? 250 : 0)

    return () => {
      active = false
      window.clearTimeout(timeout)
    }
  }, [dateFrom, dateTo, type, commercialId, period, interestSearch, refreshKey])

  const tabs: Array<{ key: DashboardTab; label: string }> = [
    { key: "ventes", label: "Ventes" },
    { key: "scoring", label: "Scoring des messages" },
    { key: "etoiles", label: "Par étoile" },
  ]

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <PageHeader title="Tableau de bord" description="Suivez votre chiffre d’affaires, vos ventes et vos performances commerciales." icon={<ChartNoAxesCombined size={23} />} />

      <nav className="flex flex-wrap gap-1 border-b border-border" aria-label="Vues statistiques">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`rounded-t-lg px-4 py-2.5 text-sm transition-colors ${tab === item.key ? "bg-card font-semibold text-primary shadow-sm" : "text-muted-foreground hover:bg-accent"}`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === "ventes" && (
        <>
          <div className="flex flex-wrap items-end gap-2">
            <label className="space-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CalendarDays size={13} /> Du</span>
              <DatePicker value={dateFrom} max={dateTo} onChange={setDateFrom} ariaLabel="Date de début" />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>Au</span>
              <DatePicker value={dateTo} min={dateFrom} onChange={setDateTo} ariaLabel="Date de fin" />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Filter size={13} /> Type</span>
              <Select value={type} onChange={(value) => setType(value as SalesType)} options={[
                { value: "all", label: "Tous" },
                { value: "produit", label: "Produits" },
                { value: "service", label: "Services" },
              ]} />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>Responsable</span>
              <Select value={commercialId} onChange={setCommercialId} className="min-w-36" options={[
                { value: "", label: "Tous" },
                ...(stats?.responsables ?? []).map((responsable) => ({
                  value: String(responsable.id_commercial),
                  label: [responsable.prenom, responsable.nom].filter(Boolean).join(" "),
                })),
              ]} />
            </label>
            <button type="button" onClick={() => setRefreshKey((value) => value + 1)} disabled={loading} className={`${buttonClass} h-10`} aria-label="Actualiser les statistiques">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className={cardClass}><p className="text-xs uppercase tracking-wide text-muted-foreground">Chiffre d’affaires</p><p className="mt-1 text-2xl font-bold text-primary">{money(stats?.chiffre_affaires ?? 0)}</p></div>
            <div className={cardClass}><p className="text-xs uppercase tracking-wide text-muted-foreground">Nombre de ventes</p><p className="mt-1 text-2xl font-bold text-emerald-600">{stats?.nombre_ventes ?? 0}</p></div>
            <div className={cardClass}><p className="text-xs uppercase tracking-wide text-muted-foreground">Ventes non validées</p><p className="mt-1 text-2xl font-bold text-rose-500">{stats?.ventes_non_validees ?? 0}</p></div>
            <Link to="/sav?statut=retardee" className={`${cardClass} transition hover:border-red-300 hover:bg-red-50/50 dark:hover:bg-red-950/20`} aria-label={`${stats?.livraisons_en_retard ?? 0} livraisons en retard. Ouvrir le suivi SAV.`}>
              <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground"><AlertTriangle size={14} className="text-red-600" /> Livraisons en retard</p>
              <p className="mt-1 text-2xl font-bold text-red-600">{stats?.livraisons_en_retard ?? 0}</p>
            </Link>
          </div>

          <section className={cardClass}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-semibold"><ChartNoAxesCombined size={17} className="text-primary" /> Évolution du chiffre d’affaires</h2>
              <div className="flex rounded-lg bg-muted p-1">
                {([
                  ["day", "Jour"],
                  ["week", "Semaine"],
                  ["month", "Mois"],
                ] as const).map(([key, label]) => (
                  <button key={key} type="button" onClick={() => setPeriod(key)} className={`rounded-md px-3 py-1.5 text-xs ${period === key ? "bg-card font-semibold text-primary shadow-sm" : "text-muted-foreground"}`}>{label}</button>
                ))}
              </div>
            </div>
            {loading ? <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">Chargement...</p> : <EvolutionChart data={stats?.evolution ?? []} period={period} />}
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className={cardClass}>
              <h2 className="mb-3 flex items-center gap-2 font-semibold"><ShoppingCart size={17} className="text-primary" /> Produit / Service</h2>
              <DonutChart data={stats?.repartition ?? []} />
            </section>
            <section className={cardClass}>
              <h2 className="mb-2 flex items-center gap-2 font-semibold"><Filter size={17} className="text-primary" /> Du prospect à la vente</h2>
              <p className="mb-6 text-xs text-muted-foreground">Clients ayant acheté pendant la période sélectionnée, comparés au nombre de prospects.</p>
              <div className="space-y-5 py-2">
                {[
                  { label: "Prospects", value: stats?.prospects ?? 0, color: "bg-sky-500" },
                  { label: "Clients avec achat", value: stats?.clients_avec_achat ?? 0, color: "bg-primary" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex justify-between text-sm"><span>{item.label}</span><strong>{item.value}</strong></div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.min(100, (item.value / Math.max(stats?.prospects ?? 0, 1)) * 100)}%` }} /></div>
                  </div>
                ))}
                <p className="text-center text-sm text-muted-foreground">
                  Conversion : {stats?.prospects ? Math.round((stats.clients_avec_achat / stats.prospects) * 100) : 0}%
                </p>
              </div>
            </section>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <RankCard<ProductRank>
              title="Top produits et services"
              icon={<Trophy size={17} className="text-primary" />}
              data={stats?.top_produits ?? []}
              options={["Chiffre d’affaires", "Quantité vendue"]}
              labels={["amount", "count"]}
              name={(item) => item.designation}
              countLabel={() => "unités"}
              formatValue={money}
            />
            <RankCard<ClientRank>
              title="Top clients"
              icon={<Users size={17} className="text-primary" />}
              data={stats?.top_clients ?? []}
              options={["Chiffre d’affaires", "Nombre de ventes"]}
              labels={["amount", "count"]}
              name={(item) => item.nom_client || "—"}
              countLabel={(item) => item.nb_ventes === 1 ? "vente" : "ventes"}
              formatValue={money}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Prospects", value: stats?.prospects ?? 0, icon: Users },
              { label: "Prospections", value: stats?.prospections ?? 0, icon: Filter },
              { label: "En cours", value: stats?.en_cours ?? 0, icon: ChartNoAxesCombined },
              { label: "RDV aujourd’hui", value: stats?.rdv_aujourdhui ?? 0, icon: CalendarDays },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className={cardClass}>
                <div className="mb-2 flex items-center justify-between"><p className="text-xs text-muted-foreground">{label}</p><Icon size={15} className="text-primary" /></div>
                <p className="text-xl font-bold">{value}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "scoring" && (
        <section className={cardClass}>
          <h2 className="mb-1 flex items-center gap-2 font-semibold"><Star size={17} className="text-amber-500" /> Scoring des messages</h2>
          <p className="mb-5 text-sm text-muted-foreground">Répartition des notes attribuées aux messages de prospection sur la période choisie.</p>
          {loading ? <p className="py-12 text-center text-sm text-muted-foreground">Chargement...</p> : stats?.scoring_messages.length ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }, (_, index) => 5 - index).map((score) => {
                const total = stats.scoring_messages.find((item) => Number(item.note) === score)?.total ?? 0
                const max = Math.max(...stats.scoring_messages.map((item) => Number(item.total)), 1)
                return (
                  <div key={score} className="grid grid-cols-[7rem_1fr_3rem] items-center gap-3 text-sm">
                    <span className="flex items-center gap-1 text-amber-500">{score} <Star size={14} fill="currentColor" /></span>
                    <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${total / max * 100}%` }} /></div>
                    <span className="text-right text-muted-foreground">{total}</span>
                  </div>
                )
              })}
            </div>
          ) : <p className="py-12 text-center text-sm text-muted-foreground">Aucune note de message sur cette période.</p>}
        </section>
      )}

      {tab === "etoiles" && (
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
            <label className="relative min-w-48 flex-1">
              <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="search" value={interestSearch} onChange={(event) => setInterestSearch(event.target.value)} placeholder="Rechercher une offre..." aria-label="Rechercher une offre" className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm" />
            </label>
            <TableSummary total={stats?.interets_par_etoile.length ?? 0} label="offres" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-primary text-primary-foreground">
                <tr>
                  <th className="px-3 py-3 text-left">Offres</th>
                  <th className="px-3 py-3 text-center">Très intéressé <span className="block text-emerald-300">★★★★★</span></th>
                  <th className="px-3 py-3 text-center">Moyennement intéressé <span className="block text-amber-300">★★★</span></th>
                  <th className="px-3 py-3 text-center">Peu intéressé <span className="block text-rose-300">★★</span></th>
                  <th className="px-3 py-3 text-center">Pas intéressé <span className="block text-slate-300">★</span></th>
                  <th className="px-3 py-3 text-center">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">Chargement...</td></tr>
                ) : stats?.interets_par_etoile.length ? stats.interets_par_etoile.map((item) => (
                  <tr key={item.produit_concerne ?? "sans-offre"} className="odd:bg-card even:bg-muted/20">
                    <td className="px-3 py-3 font-medium">{item.produit_concerne || "Offre non précisée"}</td>
                    <td className="px-3 py-3 text-center">{item.tres_interesse}</td>
                    <td className="px-3 py-3 text-center">{item.moyennement_interesse}</td>
                    <td className="px-3 py-3 text-center">{item.peu_interesse}</td>
                    <td className="px-3 py-3 text-center">{item.pas_interesse}</td>
                    <td className="px-3 py-3 text-center font-semibold">{item.total}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">Aucun intérêt enregistré sur cette période.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {stats?.ventes_non_validees === 0 && stats.nombre_ventes > 0 && tab === "ventes" && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><AlertCircle size={14} />Toutes les ventes affichées sont validées.</div>
      )}
    </div>
  )
}

function RankCard<T extends ProductRank | ClientRank>({
  title,
  icon,
  data,
  options,
  labels,
  name,
  countLabel,
  formatValue,
}: {
  title: string
  icon: ReactNode
  data: T[]
  options: [string, string]
  labels: ["amount", "count"]
  name: (item: T) => string
  countLabel: (item: T) => string
  formatValue: (value: number) => string
}) {
  const [metric, setMetric] = useState<"amount" | "count">("amount")

  return (
    <section className={cardClass}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold">{icon}{title}</h2>
        <div className="flex rounded-lg bg-muted p-1">
          {options.map((option, index) => {
            const key = labels[index]
            return <button key={key} type="button" onClick={() => setMetric(key)} className={`rounded-md px-2.5 py-1.5 text-xs ${metric === key ? "bg-card font-semibold text-primary shadow-sm" : "text-muted-foreground"}`}>{option}</button>
          })}
        </div>
      </div>
      <RankList data={data} metric={metric} formatValue={formatValue} name={name} countLabel={countLabel} />
    </section>
  )
}
