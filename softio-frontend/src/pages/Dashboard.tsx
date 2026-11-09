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
import { formatMGA } from "@/lib/utils"

type DashboardTab = "ventes" | "scoring" | "etoiles"
type Period = "day" | "week" | "month"
type SalesType = "all" | "produit" | "service"
type CommercialOption = { id_commercial: number | null; nom: string; prenom?: string | null }
type TrendPoint = { periode: string; total: number }
type ProductRank = { designation: string; total: number; qte: number }
type ClientRank = { id_client: number; nom_client: string; total: number; nb_ventes: number }
type Distribution = { type_ligne: string; total: number }
type MessageScore = { note: number; total: number }
type MessageScoreGroup = { label: string; total: number; average: number }
type ProspectStarGroup = {
  label: string
  total: number
  interested: number
  medium: number
  neutral: number
  not_interested: number
  not_rated: number
}
type ProspectStarSummary = {
  total: number
  rated: number
  average: number | null
  four_or_five_stars: number
  distribution: Array<{ note: number; total: number }>
  by_offer: ProspectStarGroup[]
  by_responsible: ProspectStarGroup[]
}
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
  scoring_by_offer: MessageScoreGroup[]
  scoring_by_responsible: MessageScoreGroup[]
  offres: Array<{ id_offre: number; denomination: string }>
  interets_par_etoile: InterestRating[]
  prospection_star_summary: ProspectStarSummary
  responsables: CommercialOption[]
}

const cardClass = "rounded-xl border border-border bg-card p-4 shadow-sm"
const buttonClass = "inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"

function currentYearRange() {
  const today = new Date()
  const year = today.getFullYear()
  const to = `${year}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  return { from: `${year}-01-01`, to }
}

function money(value: number) {
  return formatMGA(value)
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value)
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

function periodTooltipLabel(value: string, period: Period) {
  if (period === "week") {
    const match = value.match(/^(\d{4})(\d{2})$/)
    if (match) {
      const year = Number(match[1])
      const week = Number(match[2])
      const januaryFourth = new Date(Date.UTC(year, 0, 4))
      const weekday = (januaryFourth.getUTCDay() + 6) % 7
      const monday = new Date(Date.UTC(year, 0, 4 - weekday + (week - 1) * 7))
      const sunday = new Date(monday)
      sunday.setUTCDate(monday.getUTCDate() + 6)
      const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC",
      })
      return `Semaine du ${dateFormatter.format(monday).slice(0, 5)} au ${dateFormatter.format(sunday).slice(0, 5)}`
    }
  }
  if (period === "day") {
    return new Date(`${value}T00:00:00`).toLocaleDateString("fr-FR", { dateStyle: "long" })
  }
  return periodLabel(value, period)
}

function EvolutionChart({ data, period }: { data: TrendPoint[]; period: Period }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [chartWidth, setChartWidth] = useState(960)
  const chartContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = chartContainerRef.current
    if (!container) return

    const observer = new ResizeObserver(([entry]) => {
      if (entry) setChartWidth(Math.max(320, entry.contentRect.width))
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  if (!data.length) {
    return <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">Aucune vente sur cette période</p>
  }

  const width = chartWidth
  const height = 280
  const padLeft = 76
  const padRight = 8
  const padTop = 20
  const padBottom = 34
  const chartHeight = height - padTop - padBottom
  const maxValue = Math.max(...data.map((point) => Number(point.total) || 0), 0)
  const rawStep = Math.max(maxValue, 1) / 5
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const normalizedStep = rawStep / magnitude
  const stepFactor = [1, 2, 2.5, 5, 10].find((factor) => factor >= normalizedStep) ?? 10
  const step = stepFactor * magnitude
  const chartMax = step * 5
  const labelStride = Math.ceil(data.length / (chartWidth < 640 ? 5 : 12))
  const points = data.map((point, index) => ({
    x: data.length === 1 ? (padLeft + width - padRight) / 2 : padLeft + index * (width - padLeft - padRight) / (data.length - 1),
    y: height - padBottom - (Number(point.total) || 0) / chartMax * chartHeight,
  }))
  const line = points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`
    const previous = points[index - 1]
    const beforePrevious = points[index - 2] ?? previous
    const next = points[index + 1] ?? point
    const controlOneX = previous.x + (point.x - beforePrevious.x) / 6
    const controlOneY = Math.max(
      Math.min(previous.y, point.y),
      Math.min(Math.max(previous.y, point.y), previous.y + (point.y - beforePrevious.y) / 6),
    )
    const controlTwoX = point.x - (next.x - previous.x) / 6
    const controlTwoY = Math.max(
      Math.min(previous.y, point.y),
      Math.min(Math.max(previous.y, point.y), point.y - (next.y - previous.y) / 6),
    )
    return `${path} C ${controlOneX} ${controlOneY}, ${controlTwoX} ${controlTwoY}, ${point.x} ${point.y}`
  }, "")
  const baseline = height - padBottom
  const area = `${line} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`
  const activePoint = activeIndex === null ? null : points[activeIndex] ?? null
  const activeLabel = activeIndex === null ? "" : periodTooltipLabel(data[activeIndex].periode, period)
  const activeAmount = activeIndex === null ? "" : money(Number(data[activeIndex].total) || 0)
  const tooltipWidth = Math.min(240, Math.max(96, Math.max(activeLabel.length * 5.8, activeAmount.length * 5.8) + 28))
  const tooltipHeight = 48
  const tooltipX = activePoint
    ? Math.max(padLeft, Math.min(width - tooltipWidth - 8, activePoint.x - tooltipWidth / 2))
    : 0
  const tooltipBelow = Boolean(activePoint && activePoint.y - tooltipHeight - 10 < padTop)
  const tooltipY = activePoint
    ? tooltipBelow ? activePoint.y + 14 : activePoint.y - tooltipHeight - 10
    : 0

  return (
    <div ref={chartContainerRef} className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-72 w-full" role="group" aria-label="Évolution du chiffre d’affaires">
        {Array.from({ length: 6 }, (_, index) => {
          const y = padTop + index * chartHeight / 5
          const value = step * (5 - index)
          return (
            <g key={value}>
              <line x1={padLeft} x2={width - padRight} y1={y} y2={y} stroke="hsl(var(--border))" />
              <text x={padLeft - 8} y={y + 4} textAnchor="end" fill="hsl(var(--muted-foreground))" fontSize="11">
                {formatNumber(value)}
              </text>
            </g>
          )
        })}
        <path d={area} fill="hsl(var(--primary) / 0.12)" />
        <path d={line} fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((point, index) => (
          <g key={`${data[index].periode}-${index}`}>
            <circle cx={point.x} cy={point.y} r="4" fill="hsl(var(--primary))" stroke="hsl(var(--card))" strokeWidth="2" />
            <circle
              cx={point.x}
              cy={point.y}
              r="12"
              fill="transparent"
              role="button"
              tabIndex={0}
              aria-label={`${periodTooltipLabel(data[index].periode, period)} : ${money(Number(data[index].total) || 0)}`}
              pointerEvents="none"
              onFocus={() => setActiveIndex(index)}
              onBlur={() => setActiveIndex(null)}
            />
            {(index % labelStride === 0 || index === data.length - 1) && (
              <text x={point.x} y={height - 7} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="11">
                {periodLabel(data[index].periode, period)}
              </text>
            )}
          </g>
        ))}
        <rect
          x={padLeft}
          y={padTop}
          width={width - padLeft - padRight}
          height={chartHeight}
          fill="transparent"
          onMouseMove={(event) => {
            const bounds = event.currentTarget.ownerSVGElement?.getBoundingClientRect()
            if (!bounds) return
            if (data.length === 1) {
              setActiveIndex(0)
              return
            }
            const svgX = (event.clientX - bounds.left) / bounds.width * width
            const nearestIndex = Math.round((svgX - padLeft) / (width - padLeft - padRight) * (data.length - 1))
            setActiveIndex(Math.max(0, Math.min(data.length - 1, nearestIndex)))
          }}
          onMouseLeave={() => setActiveIndex(null)}
        />
        {activePoint && (
          <g pointerEvents="none">
            <path
              d={tooltipBelow
                ? `M ${activePoint.x - 6} ${tooltipY} L ${activePoint.x} ${tooltipY - 6} L ${activePoint.x + 6} ${tooltipY} Z`
                : `M ${activePoint.x - 6} ${tooltipY + tooltipHeight} L ${activePoint.x} ${tooltipY + tooltipHeight + 6} L ${activePoint.x + 6} ${tooltipY + tooltipHeight} Z`}
              fill="hsl(var(--primary))"
            />
            <rect x={tooltipX} y={tooltipY} width={tooltipWidth} height={tooltipHeight} rx="8" fill="hsl(var(--primary))" />
            <text x={tooltipX + 10} y={tooltipY + 17} fill="hsl(var(--primary-foreground))" fontSize="10" fontWeight="600">
              {activeLabel}
            </text>
            <circle cx={tooltipX + 14} cy={tooltipY + 35} r="4" fill="hsl(var(--primary-foreground))" />
            <text x={tooltipX + 24} y={tooltipY + 39} fill="hsl(var(--primary-foreground))" fontSize="10">
              {activeAmount}
            </text>
            <circle cx={activePoint.x} cy={activePoint.y} r="5" fill="hsl(var(--primary))" stroke="hsl(var(--card))" strokeWidth="2" />
          </g>
        )}
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

function ScoreGroupBars({ data, loading }: { data: MessageScoreGroup[]; loading: boolean }) {
  if (loading) return <p className="py-8 text-center text-sm text-muted-foreground">Chargement...</p>
  if (!data.length) return <p className="py-8 text-center text-sm text-muted-foreground">Aucune note sur cette période.</p>

  const maxTotal = Math.max(...data.map((item) => Number(item.total)), 1)
  return (
    <div className="space-y-4 py-2">
      {data.map((item) => (
        <div key={item.label}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium">{item.label}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{formatNumber(Number(item.total))} msg · {Number(item.average).toFixed(1)} / 5</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Number(item.total) / maxTotal * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

const prospectStarCategories = [
  { key: "interested", label: "4–5 étoiles", color: "#0ea326" },
  { key: "medium", label: "3 étoiles", color: "#9cbe00" },
  { key: "neutral", label: "2 étoiles", color: "#f0a000" },
  { key: "not_interested", label: "1 étoile", color: "#d83d3d" },
  { key: "not_rated", label: "Non noté", color: "#b8c5c6" },
] as const

function ProspectStarBars({ data, loading }: { data: ProspectStarGroup[]; loading: boolean }) {
  if (loading) return <p className="py-8 text-center text-sm text-muted-foreground">Chargement...</p>
  if (!data.length) return <p className="py-8 text-center text-sm text-muted-foreground">Aucun prospect sur cette période.</p>

  const maxTotal = Math.max(...data.map((item) => Number(item.total)), 1)
  return (
    <div className="space-y-4 py-2">
      <div className="flex flex-wrap gap-x-3 gap-y-2 text-[11px] text-muted-foreground">
        {prospectStarCategories.map((category) => <span key={category.key} className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color }} />{category.label}</span>)}
      </div>
      {data.map((item) => (
        <div key={item.label} className="grid grid-cols-[7rem_minmax(0,1fr)_5.5rem] items-center gap-3 text-xs">
          <span className="truncate font-medium" title={item.label}>{item.label}</span>
          <div className="flex h-3 overflow-hidden rounded-full bg-muted" aria-label={`${item.total} prospects`}>
            {prospectStarCategories.map((category) => {
              const value = Number(item[category.key])
              return value > 0 ? <span key={category.key} style={{ width: `${value / maxTotal * 100}%`, backgroundColor: category.color }} /> : null
            })}
          </div>
          <span className="text-right text-muted-foreground">{formatNumber(Number(item.total))} pros.</span>
        </div>
      ))}
    </div>
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
  const [offerId, setOfferId] = useState("")
  const [period, setPeriod] = useState<Period>("month")
  const [starSearch, setStarSearch] = useState("")
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
          offer_id: tab === "scoring" ? offerId || undefined : undefined,
          period,
          star_search: tab === "etoiles" ? starSearch.trim() || undefined : undefined,
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
    }, starSearch ? 250 : 0)

    return () => {
      active = false
      window.clearTimeout(timeout)
    }
  }, [dateFrom, dateTo, type, commercialId, offerId, period, starSearch, refreshKey, tab])

  const tabs: Array<{ key: DashboardTab; label: string }> = [
    { key: "ventes", label: "Ventes" },
    { key: "scoring", label: "Scoring des messages" },
    { key: "etoiles", label: "Par étoile" },
  ]
  const scoreCounts = Array.from({ length: 6 }, (_, note) => {
    return {
      note,
      total: Number(stats?.scoring_messages.find((item) => Number(item.note) === note)?.total ?? 0),
    }
  })
  const scoredMessages = scoreCounts.reduce((sum, item) => sum + item.total, 0)
  const averageScore = scoredMessages
    ? scoreCounts.reduce((sum, item) => sum + item.note * item.total, 0) / scoredMessages
    : 0
  const maxScoreCount = Math.max(...scoreCounts.map((item) => item.total), 1)
  const highScoreCount = scoreCounts.filter((item) => item.note >= 4).reduce((sum, item) => sum + item.total, 0)
  const scoreColors = ["#94a3b8", "#d83d3d", "#e99a00", "#a4bf00", "#27a51b", "#128a38"]
  let scoreGradientStart = 0
  const scoreGradient = scoreCounts.map((item) => {
    const start = scoreGradientStart
    scoreGradientStart += scoredMessages ? item.total / scoredMessages * 100 : 0
    return `${scoreColors[item.note]} ${start}% ${scoreGradientStart}%`
  }).join(", ")

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <PageHeader title="Tableau de bord" description="Suivez votre chiffre d’affaires, vos ventes et vos performances commerciales." icon={<ChartNoAxesCombined size={23} />} />

      <nav className="page-tabs" role="tablist" aria-label="Vues statistiques">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key)}
            className="page-tab"
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
              <DatePicker value={dateFrom} max={dateTo} onChange={setDateFrom} ariaLabel="Date de début" className="h-10 w-[9.5rem] px-3 pr-10" calendarClassName="w-[min(18rem,calc(100vw-2rem))] p-3" />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>Au</span>
              <DatePicker value={dateTo} min={dateFrom} onChange={setDateTo} ariaLabel="Date de fin" className="h-10 w-[9.5rem] px-3 pr-10" calendarClassName="w-[min(18rem,calc(100vw-2rem))] p-3" />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Filter size={13} /> Type</span>
              <Select value={type} onChange={(value) => setType(value as SalesType)} className="h-10 min-h-10 min-w-[8.5rem] px-3 py-1" options={[
                { value: "all", label: "Tous" },
                { value: "produit", label: "Produits" },
                { value: "service", label: "Services" },
              ]} />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>Offre</span>
              <Select value={offerId} onChange={setOfferId} className="h-10 min-h-10 min-w-[10rem] px-3 py-1" options={[
                { value: "", label: "Toutes" },
                ...(stats?.offres ?? []).map((offre) => ({ value: String(offre.id_offre), label: offre.denomination })),
              ]} />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>Responsable</span>
              <Select value={commercialId} onChange={setCommercialId} className="h-10 min-h-10 min-w-[10rem] px-3 py-1" options={[
                { value: "", label: "Tous" },
                ...(stats?.responsables ?? []).map((responsable) => ({
                  value: responsable.id_commercial === null ? "admin" : String(responsable.id_commercial),
                  label: responsable.id_commercial === null
                    ? "Admin"
                    : [responsable.prenom, responsable.nom].filter(Boolean).join(" "),
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
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            <label className="space-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CalendarDays size={13} /> Période</span>
              <DatePicker value={dateFrom} max={dateTo} onChange={setDateFrom} ariaLabel="Date de début du scoring" className="h-10 w-[9.5rem] px-3 pr-10" calendarClassName="w-[min(18rem,calc(100vw-2rem))] p-3" />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>Au</span>
              <DatePicker value={dateTo} min={dateFrom} onChange={setDateTo} ariaLabel="Date de fin du scoring" className="h-10 w-[9.5rem] px-3 pr-10" calendarClassName="w-[min(18rem,calc(100vw-2rem))] p-3" />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>Responsable</span>
              <Select value={commercialId} onChange={setCommercialId} className="h-10 min-h-10 min-w-[10rem] px-3 py-1" options={[
                { value: "", label: "Tous" },
                ...(stats?.responsables ?? []).map((responsable) => ({
                  value: responsable.id_commercial === null ? "admin" : String(responsable.id_commercial),
                  label: responsable.id_commercial === null
                    ? "Admin"
                    : [responsable.prenom, responsable.nom].filter(Boolean).join(" "),
                })),
              ]} />
            </label>
            <button type="button" onClick={() => setRefreshKey((value) => value + 1)} disabled={loading} className={`${buttonClass} h-10`} aria-label="Actualiser le scoring">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className={cardClass}><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Messages notés</p><p className="mt-1 text-2xl font-bold text-primary">{loading ? "—" : formatNumber(scoredMessages)}</p><p className="mt-1 text-xs text-muted-foreground">Notes reçues sur la période</p></div>
            <div className={cardClass}><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Score moyen</p><p className="mt-1 text-2xl font-bold text-amber-500">{loading || !scoredMessages ? "—" : `${Math.round(averageScore / 5 * 100)} %`}</p><p className="mt-1 text-xs text-muted-foreground">{scoredMessages ? `${averageScore.toFixed(1)} / 5 étoiles` : "Aucune note disponible"}</p></div>
            <div className={cardClass}><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes 4–5 étoiles</p><p className="mt-1 text-2xl font-bold text-emerald-600">{loading ? "—" : formatNumber(highScoreCount)}</p><p className="mt-1 text-xs text-muted-foreground">{scoredMessages ? `${Math.round(highScoreCount / scoredMessages * 100)} % des notes` : "Pas encore de données"}</p></div>
            <div className={cardClass}><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes 5 étoiles</p><p className="mt-1 text-2xl font-bold text-amber-500">{loading ? "—" : formatNumber(scoreCounts[4].total)}</p><p className="mt-1 text-xs text-muted-foreground">Évaluations maximales</p></div>
            <div className={cardClass}><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Analyse IA</p><p className="mt-1 text-lg font-bold text-muted-foreground">Non disponible</p><p className="mt-1 text-xs text-muted-foreground">Les scores IA ne sont pas encore alimentés</p></div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <section className={`${cardClass} min-h-[300px]`}>
              <h2 className="mb-4 flex items-center gap-2 font-semibold"><ChartNoAxesCombined size={17} className="text-primary" /> Répartition des notes</h2>
              {loading ? <p className="flex h-56 items-center justify-center text-sm text-muted-foreground">Chargement...</p> : scoredMessages ? (
                <div className="flex h-[230px] flex-wrap items-center justify-center gap-8">
                  <div className="grid h-44 w-44 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${scoreGradient})` }} role="img" aria-label={`Répartition de ${scoredMessages} notes par nombre d’étoiles`}>
                    <div className="grid h-28 w-28 place-items-center rounded-full bg-card text-center"><div><p className="text-2xl font-bold">{formatNumber(scoredMessages)}</p><p className="text-xs text-muted-foreground">notes</p></div></div>
                  </div>
                  <div className="space-y-3 text-xs text-muted-foreground">
                    {scoreCounts.slice().reverse().map(({ note, total }) => (
                      <div key={note} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: scoreColors[note] }} /><span className="min-w-16">{note} étoile{note > 1 ? "s" : ""}</span><strong className="text-foreground">{formatNumber(total)}</strong><span>· {Math.round(total / scoredMessages * 100)} %</span></div>
                    ))}
                  </div>
                </div>
              ) : <p className="flex h-56 items-center justify-center text-sm text-muted-foreground">Aucune note enregistrée sur cette période.</p>}
            </section>

            <section className={`${cardClass} min-h-[300px]`}>
              <h2 className="mb-4 flex items-center gap-2 font-semibold"><Star size={17} className="text-amber-500" /> Détail par note</h2>
              {loading ? <p className="flex h-56 items-center justify-center text-sm text-muted-foreground">Chargement...</p> : (
                <div className="space-y-5 py-3">
                  {scoreCounts.slice().reverse().map(({ note, total }) => (
                    <div key={note} className="grid grid-cols-[5.5rem_1fr_3rem] items-center gap-3 text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">{note} <Star size={14} className="text-amber-500" fill="currentColor" /></span>
                      <div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full transition-[width]" style={{ width: `${total / maxScoreCount * 100}%`, backgroundColor: scoreColors[note] }} /></div>
                      <span className="text-right font-medium text-muted-foreground">{formatNumber(total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <section className={cardClass}>
              <h2 className="mb-2 flex items-center gap-2 font-semibold"><Users size={17} className="text-primary" /> Par responsable</h2>
              <ScoreGroupBars data={stats?.scoring_by_responsible ?? []} loading={loading} />
            </section>
            <section className={cardClass}>
              <h2 className="mb-2 flex items-center gap-2 font-semibold"><ChartNoAxesCombined size={17} className="text-primary" /> Par offre</h2>
              <ScoreGroupBars data={stats?.scoring_by_offer ?? []} loading={loading} />
            </section>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <section className={cardClass}>
              <h2 className="mb-2 flex items-center gap-2 font-semibold"><ChartNoAxesCombined size={17} className="text-primary" /> Le score prédit-il la vente ?</h2>
              <p className="py-8 text-center text-sm text-muted-foreground">Cette comparaison nécessite des scores IA et des résultats de vente reliés à chaque message.</p>
            </section>
            <section className={cardClass}>
              <h2 className="mb-2 flex items-center gap-2 font-semibold"><Star size={17} className="text-amber-500" /> L’IA et vos étoiles</h2>
              <p className="py-8 text-center text-sm text-muted-foreground">Les classes IA ne sont pas encore calculées ni enregistrées pour les messages.</p>
            </section>
          </div>

          <section className={cardClass}>
            <h2 className="mb-2 flex items-center gap-2 font-semibold"><AlertCircle size={17} className="text-primary" /> Désaccords à examiner</h2>
            <p className="py-6 text-center text-sm text-muted-foreground">Aucun désaccord calculable tant que les classes IA ne sont pas alimentées.</p>
          </section>
        </div>
      )}

      {tab === "etoiles" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            <label className="space-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CalendarDays size={13} /> Période</span>
              <DatePicker value={dateFrom} max={dateTo} onChange={setDateFrom} ariaLabel="Date de début des étoiles" className="h-10 w-[9.5rem] px-3 pr-10" calendarClassName="w-[min(18rem,calc(100vw-2rem))] p-3" />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>Au</span>
              <DatePicker value={dateTo} min={dateFrom} onChange={setDateTo} ariaLabel="Date de fin des étoiles" className="h-10 w-[9.5rem] px-3 pr-10" calendarClassName="w-[min(18rem,calc(100vw-2rem))] p-3" />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>Offre</span>
              <Select value={offerId} onChange={setOfferId} className="h-10 min-h-10 min-w-[10rem] px-3 py-1" options={[
                { value: "", label: "Toutes" },
                ...(stats?.offres ?? []).map((offre) => ({ value: String(offre.id_offre), label: offre.denomination })),
              ]} />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>Responsable</span>
              <Select value={commercialId} onChange={setCommercialId} className="h-10 min-h-10 min-w-[10rem] px-3 py-1" options={[
                { value: "", label: "Tous" },
                ...(stats?.responsables ?? []).map((responsable) => ({
                  value: responsable.id_commercial === null ? "admin" : String(responsable.id_commercial),
                  label: responsable.id_commercial === null ? "Admin" : [responsable.prenom, responsable.nom].filter(Boolean).join(" "),
                })),
              ]} />
            </label>
            <button type="button" onClick={() => setRefreshKey((value) => value + 1)} disabled={loading} className={`${buttonClass} h-10`} aria-label="Actualiser les étoiles">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className={cardClass}><p className="text-xs uppercase tracking-wide text-muted-foreground">Prospections</p><p className="mt-1 text-2xl font-bold text-primary">{formatNumber(stats?.prospection_star_summary.total ?? 0)}</p><p className="mt-1 text-xs text-muted-foreground">Toutes offres confondues</p></div>
            <div className={cardClass}><p className="text-xs uppercase tracking-wide text-muted-foreground">Prospections notées</p><p className="mt-1 text-2xl font-bold text-amber-500">{stats?.prospection_star_summary.total ? `${Math.round((stats.prospection_star_summary.rated / stats.prospection_star_summary.total) * 100)} %` : "0 %"}</p><p className="mt-1 text-xs text-muted-foreground">{formatNumber(stats?.prospection_star_summary.rated ?? 0)} notées · {formatNumber((stats?.prospection_star_summary.total ?? 0) - (stats?.prospection_star_summary.rated ?? 0))} sans note</p></div>
            <div className={cardClass}><p className="text-xs uppercase tracking-wide text-muted-foreground">Note moyenne</p><p className="mt-1 text-2xl font-bold text-lime-600">{stats?.prospection_star_summary.average == null ? "—" : `${Number(stats.prospection_star_summary.average).toFixed(1)} / 4`}</p><p className="mt-1 text-xs text-muted-foreground">Parmi les prospections notées</p></div>
            <div className={cardClass}><p className="text-xs uppercase tracking-wide text-muted-foreground">4 étoiles</p><p className="mt-1 text-2xl font-bold text-green-600">{stats?.prospection_star_summary.total ? `${Math.round((stats.prospection_star_summary.four_or_five_stars / stats.prospection_star_summary.total) * 100)} %` : "0 %"}</p><p className="mt-1 text-xs text-muted-foreground">{formatNumber(stats?.prospection_star_summary.four_or_five_stars ?? 0)} prospects très intéressés</p></div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
            <section className={`${cardClass} min-h-[270px]`}>
              <h2 className="mb-3 flex items-center gap-2 font-semibold"><Star size={17} className="text-primary" /> Répartition des étoiles</h2>
              {loading ? <p className="flex h-48 items-center justify-center text-sm text-muted-foreground">Chargement...</p> : (() => {
                const summary = stats?.prospection_star_summary
                if (!summary?.total) return <p className="flex h-48 items-center justify-center text-sm text-muted-foreground">Aucune prospection sur cette période.</p>
                const unnoted = Math.max(0, summary.total - summary.rated)
                const levels = [
                  { label: "4 étoiles", value: summary.distribution.filter((item) => Number(item.note) >= 4).reduce((sum, item) => sum + Number(item.total), 0), color: "#0ea326" },
                  { label: "3 étoiles", value: Number(summary.distribution.find((item) => Number(item.note) === 3)?.total ?? 0), color: "#9cbe00" },
                  { label: "2 étoiles", value: Number(summary.distribution.find((item) => Number(item.note) === 2)?.total ?? 0), color: "#f0a000" },
                  { label: "1 étoile", value: Number(summary.distribution.find((item) => Number(item.note) === 1)?.total ?? 0), color: "#d83d3d" },
                  { label: "Non noté", value: unnoted, color: "#b8c5c6" },
                ]
                let offset = 0
                const gradient = levels.map((level) => {
                  const start = offset
                  offset += level.value / summary.total * 100
                  return `${level.color} ${start}% ${offset}%`
                }).join(", ")
                return (
                  <div className="flex h-[210px] flex-col items-center justify-center gap-4">
                    <div className="grid h-36 w-36 place-items-center rounded-full" style={{ background: `conic-gradient(${gradient})` }} role="img" aria-label={`${summary.total} prospections réparties par étoiles`}>
                      <div className="grid h-20 w-20 place-items-center rounded-full bg-card text-center"><div><p className="text-xl font-bold">{formatNumber(summary.total)}</p><p className="text-[10px] text-muted-foreground">prospects</p></div></div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 text-[10px] text-muted-foreground">
                      {levels.map((level) => <span key={level.label} className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: level.color }} />{level.label} · {Math.round(level.value / summary.total * 100)} %</span>)}
                    </div>
                  </div>
                )
              })()}
            </section>
            <section className={`${cardClass} min-h-[270px]`}>
              <h2 className="mb-3 flex items-center gap-2 font-semibold"><Users size={17} className="text-primary" /> Étoiles par responsable</h2>
              <ProspectStarBars data={stats?.prospection_star_summary.by_responsible ?? []} loading={loading} />
            </section>
          </div>

          <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
              <label className="relative min-w-48 flex-1">
                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="search" value={starSearch} onChange={(event) => setStarSearch(event.target.value)} placeholder="Rechercher une offre..." aria-label="Rechercher une offre" className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm" />
              </label>
              <TableSummary total={stats?.prospection_star_summary.by_offer.length ?? 0} label="offres" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-sm">
                <thead className="bg-primary text-primary-foreground">
                  <tr>
                    <th className="px-3 py-3 text-left">Offres</th>
                    <th className="px-3 py-3 text-center">Intéressé <span className="block text-green-300">★★★★</span></th>
                    <th className="px-3 py-3 text-center">Moyennement intéressé <span className="block text-lime-300">★★★</span></th>
                    <th className="px-3 py-3 text-center">Neutre <span className="block text-amber-300">★★</span></th>
                    <th className="px-3 py-3 text-center">Non intéressé <span className="block text-rose-300">★</span></th>
                    <th className="px-3 py-3 text-center">Non noté</th>
                    <th className="px-3 py-3 text-center">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Chargement...</td></tr> : stats?.prospection_star_summary.by_offer.length ? stats.prospection_star_summary.by_offer.map((item) => (
                    <tr key={item.label} className="odd:bg-card even:bg-muted/20">
                      <td className="px-3 py-3 font-medium">{item.label}</td>
                      <td className="px-3 py-3 text-center">{item.interested}</td>
                      <td className="px-3 py-3 text-center">{item.medium}</td>
                      <td className="px-3 py-3 text-center">{item.neutral}</td>
                      <td className="px-3 py-3 text-center">{item.not_interested}</td>
                      <td className="px-3 py-3 text-center">{item.not_rated}</td>
                      <td className="px-3 py-3 text-center font-semibold">{item.total}</td>
                    </tr>
                  )) : <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Aucune prospection sur cette période.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </div>
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
