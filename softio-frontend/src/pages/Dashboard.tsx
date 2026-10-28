import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AlertTriangle, CheckCircle2, Users, Target, Trophy, ArrowUpRight, Loader2 } from "lucide-react"
import api from "../services/api"
import { getSessionUser } from "@/lib/session"

interface Alerte { id_produit: number; designation: string; stock_actuel: number }
interface Stats {
  total_clients: number
  prospections_actives: number
  prospections_gagnees: number
  alertes_stock: Alerte[]
}

function Ring({ value }: { value: number }) {
  const r = 54
  const c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 140 140" className="h-40 w-40 -rotate-90" role="img" aria-label={`Taux de conversion ${value} %`}>
      <circle cx="70" cy="70" r={r} fill="none" strokeWidth="14" className="stroke-muted" />
      <circle
        cx="70" cy="70" r={r} fill="none" strokeWidth="14" strokeLinecap="round"
        className="ring-draw stroke-primary"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value / 100)}
        style={{ ["--ring-full" as string]: c }}
      />
    </svg>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const user = getSessionUser()

  useEffect(() => {
    api.get("/dashboard/stats")
      .then((res) => setStats(res.data))
      .catch((err) => { if (err.response?.status === 401) navigate("/login") })
      .finally(() => setLoading(false))
  }, [navigate])

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-20 text-muted-foreground">
        <Loader2 className="animate-spin" size={18} /> Chargement…
      </div>
    )
  }

  const actives = stats?.prospections_actives ?? 0
  const gagnees = stats?.prospections_gagnees ?? 0
  const total = actives + gagnees
  const taux = total ? Math.round((gagnees / total) * 100) : 0
  const alertes = stats?.alertes_stock ?? []
  const date = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm capitalize text-muted-foreground">{date}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">Bonjour {user.nom.split(" ")[0]}</h1>
      </div>

      <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col items-center gap-8 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:p-8">
          <div className="relative shrink-0">
            <Ring value={taux} />
            <div className="absolute inset-0 grid place-items-center">
              <span className="font-display text-4xl font-semibold">{taux}<span className="text-xl text-muted-foreground"> %</span></span>
            </div>
          </div>
          <div className="w-full">
            <h2 className="font-display text-xl font-semibold">Taux de conversion</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {total ? `${gagnees} prospection${gagnees > 1 ? "s" : ""} gagnée${gagnees > 1 ? "s" : ""} sur ${total}.` : "Aucune prospection pour l'instant."}
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-3">
              <Link to="/prospection" className="group rounded-xl bg-muted/60 p-4 transition hover:bg-muted">
                <dt className="flex items-center justify-between text-sm text-muted-foreground"><span className="flex items-center gap-1.5"><Target size={14} />En cours</span><ArrowUpRight size={14} className="opacity-0 transition group-hover:opacity-100" /></dt>
                <dd className="mt-1 font-display text-3xl font-semibold">{actives}</dd>
              </Link>
              <Link to="/closing" className="group rounded-xl bg-primary/10 p-4 transition hover:bg-primary/15">
                <dt className="flex items-center justify-between text-sm text-primary"><span className="flex items-center gap-1.5"><Trophy size={14} />Gagnées</span><ArrowUpRight size={14} className="opacity-0 transition group-hover:opacity-100" /></dt>
                <dd className="mt-1 font-display text-3xl font-semibold text-primary">{gagnees}</dd>
              </Link>
            </dl>
          </div>
        </div>

        <Link to="/clients" className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-6 transition hover:border-primary/40 sm:p-8">
          <div className="flex items-center justify-between">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-muted-foreground"><Users size={18} /></span>
            <ArrowUpRight size={18} className="text-muted-foreground transition group-hover:text-primary" />
          </div>
          <div className="mt-8">
            <p className="font-display text-5xl font-semibold">{stats?.total_clients ?? 0}</p>
            <p className="mt-1 text-sm text-muted-foreground">clients dans votre portefeuille</p>
          </div>
        </Link>
      </section>

      <section className="rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-display text-lg font-semibold">Stock à surveiller</h2>
          {alertes.length > 0 && (
            <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">{alertes.length} produit{alertes.length > 1 ? "s" : ""}</span>
          )}
        </div>
        {alertes.length === 0 ? (
          <div className="flex items-center gap-3 px-6 py-10 text-sm text-muted-foreground">
            <CheckCircle2 className="text-primary" size={20} />
            Tous les produits ont un stock suffisant.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {alertes.map((a) => (
              <li key={a.id_produit} className="flex items-center justify-between gap-4 px-6 py-3.5">
                <span className="flex items-center gap-3 text-sm font-medium"><AlertTriangle size={16} className="text-destructive" />{a.designation}</span>
                <span className="rounded-md bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive">Reste {a.stock_actuel}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
