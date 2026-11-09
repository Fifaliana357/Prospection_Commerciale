import { Fragment, useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"
import {
  AlertTriangle, Check, ChevronDown, ChevronUp, Clock3, Eye, MapPin, PackageCheck,
  Pencil, RefreshCw, Search, Truck,
} from "lucide-react"
import Modal from "@/components/ui/Modal"
import DatePicker from "@/components/ui/DatePicker"
import DateTimePicker from "@/components/ui/DateTimePicker"
import Select from "@/components/ui/Select"
import TablePagination from "@/components/ui/TablePagination"
import TableSummary from "@/components/ui/TableSummary"
import PageHeader from "@/components/ui/PageHeader"
import { useToast } from "@/contexts/ToastContext"
import { useSearchParams } from "react-router-dom"
import {
  getDeliveries,
  getDeliveryHistory,
  updateDelivery,
  type Delivery,
  type DeliveryHistoryEntry,
  type DeliveryPayload,
  type DeliveryStatus,
  type EditableDeliveryStatus,
} from "@/services/livraisons"

const statusFilters = ["tous", "a_preparer", "en_cours", "retardee", "livree", "retournee"] as const
type StatusFilter = typeof statusFilters[number]

const fieldClass = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
const statusLabels: Record<DeliveryStatus, string> = {
  a_preparer: "À préparer",
  en_cours: "En cours de livraison",
  livree: "Livrée",
  retardee: "Retardée",
  retournee: "Retournée",
}
const statusStyles: Record<DeliveryStatus, string> = {
  a_preparer: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  en_cours: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  livree: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  retardee: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  retournee: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
}

function messageFromError(error: unknown, fallback: string) {
  if (typeof error !== "object" || error === null || !("response" in error)) return fallback
  const response = error.response
  if (typeof response !== "object" || response === null || !("data" in response)) return fallback
  const data = response.data
  if (typeof data !== "object" || data === null || !("message" in data)) return fallback
  return typeof data.message === "string" ? data.message : fallback
}

function isStatusFilter(value: string): value is StatusFilter {
  return statusFilters.some((status) => status === value)
}

function isEditableStatus(value: string): value is EditableDeliveryStatus {
  return value === "a_preparer" || value === "en_cours" || value === "livree" || value === "retournee"
}

function dateLabel(value: string | null | undefined) {
  if (!value) return "—"
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-")
    return `${day}/${month}/${year}`
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("fr-FR")
}

function dateTimeLabel(value: string | null | undefined) {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("fr-FR")
}

function dateTimeLocal(value: string | null) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

function emptyPayload(delivery: Delivery): DeliveryPayload {
  return {
    adresse: delivery.adresse || "",
    statut: delivery.statut,
    date_prevue: delivery.date_prevue || "",
    date_livraison: dateTimeLocal(delivery.date_livraison),
    livreur: delivery.livreur || "",
    commentaire: delivery.commentaire || "",
  }
}

function clientName(delivery: Delivery) {
  const client = delivery.vente.client
  if (!client) return "Client non renseigné"
  return client.entreprise || [client.prenom, client.nom].filter(Boolean).join(" ")
}

function historyStatusLabel(status: string | null) {
  return status ? Object.entries(statusLabels).find(([key]) => key === status)?.[1] || status : "Création"
}

export default function SAV() {
  const toast = useToast()
  const toastRef = useRef(toast)
  const [searchParams] = useSearchParams()
  const requestedStatus = searchParams.get("statut")
  const initialStatus: StatusFilter = requestedStatus && isStatusFilter(requestedStatus)
    ? requestedStatus
    : "tous"
  const [data, setData] = useState<Awaited<ReturnType<typeof getDeliveries>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<StatusFilter>(initialStatus)
  const [page, setPage] = useState(1)
  const [refresh, setRefresh] = useState(0)
  const [editing, setEditing] = useState<Delivery | null>(null)
  const [form, setForm] = useState<DeliveryPayload | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [history, setHistory] = useState<Record<number, DeliveryHistoryEntry[]>>({})
  const [historyLoadingId, setHistoryLoadingId] = useState<number | null>(null)
  const [deliveringId, setDeliveringId] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          setLoading(true)
          const result = await getDeliveries({
            search: search.trim() || undefined,
            statut: status,
            page,
          })
          if (active) setData(result)
        } catch (error: unknown) {
          if (active) toastRef.current.error(messageFromError(error, "Impossible de charger les livraisons."))
        } finally {
          if (active) setLoading(false)
        }
      })()
    }, 250)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [search, status, page, refresh])

  const openEditor = (delivery: Delivery) => {
    setEditing(delivery)
    setForm(emptyPayload(delivery))
  }

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editing || !form) return
    try {
      setSaving(true)
      await updateDelivery(editing.id_livraison, {
        ...form,
        date_livraison: form.date_livraison ? new Date(form.date_livraison).toISOString() : "",
      })
      toast.success("Livraison mise à jour.")
      setEditing(null)
      setForm(null)
      setRefresh((value) => value + 1)
    } catch (error: unknown) {
      toast.error(messageFromError(error, "Impossible de mettre à jour la livraison."))
    } finally {
      setSaving(false)
    }
  }

  const markDelivered = async (delivery: Delivery) => {
    try {
      setDeliveringId(delivery.id_livraison)
      await updateDelivery(delivery.id_livraison, {
        ...emptyPayload(delivery),
        statut: "livree",
        date_livraison: new Date().toISOString(),
      })
      toast.success("Livraison marquée comme livrée.")
      setRefresh((value) => value + 1)
      if (expandedId === delivery.id_livraison) setHistory((value) => {
        const next = { ...value }
        delete next[delivery.id_livraison]
        return next
      })
    } catch (error: unknown) {
      toast.error(messageFromError(error, "Impossible de modifier le statut de la livraison."))
    } finally {
      setDeliveringId(null)
    }
  }

  const toggleHistory = async (delivery: Delivery) => {
    if (expandedId === delivery.id_livraison) {
      setExpandedId(null)
      return
    }
    setExpandedId(delivery.id_livraison)
    if (history[delivery.id_livraison]) return
    try {
      setHistoryLoadingId(delivery.id_livraison)
      const entries = await getDeliveryHistory(delivery.id_livraison)
      setHistory((current) => ({ ...current, [delivery.id_livraison]: entries }))
    } catch (error: unknown) {
      toast.error(messageFromError(error, "Impossible de charger l’historique."))
    } finally {
      setHistoryLoadingId(null)
    }
  }

  const deliveries = data?.deliveries.data || []
  const summary = data?.summary
  const pageInfo = data?.deliveries

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader title="Service après-vente" description="Suivez la préparation et la livraison des ventes validées." icon={<Truck size={23} />} />

      <section className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Livraisons en retard" count={summary?.en_retard ?? 0} icon={AlertTriangle} tone="text-red-600" onClick={() => { setStatus("retardee"); setPage(1) }} />
        <SummaryCard label="En cours de livraison" count={summary?.en_cours ?? 0} icon={Clock3} tone="text-blue-600" onClick={() => { setStatus("en_cours"); setPage(1) }} />
        <SummaryCard label="Livrées" count={summary?.livrees ?? 0} icon={PackageCheck} tone="text-emerald-600" onClick={() => { setStatus("livree"); setPage(1) }} />
      </section>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="flex min-w-0 flex-1">
            <label className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Vente, client ou livreur..." className={`${fieldClass} pl-9`} aria-label="Rechercher une livraison" />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="whitespace-nowrap text-muted-foreground">Statut</span>
            <Select value={status} onChange={(value) => { if (isStatusFilter(value)) { setStatus(value); setPage(1) } }} options={[
              { value: "tous", label: "Tous" },
              { value: "a_preparer", label: "À préparer" },
              { value: "en_cours", label: "En cours de livraison" },
              { value: "retardee", label: "Retardée" },
              { value: "livree", label: "Livrée" },
              { value: "retournee", label: "Retournée" },
            ]} />
          </label>
          <button type="button" onClick={() => setRefresh((value) => value + 1)} disabled={loading} className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-3 text-muted-foreground hover:bg-accent disabled:opacity-50" aria-label="Actualiser les livraisons">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <TableSummary total={pageInfo?.total ?? 0} label="livraisons" />
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {loading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Chargement des livraisons...</p>
        ) : deliveries.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <PackageCheck className="mx-auto mb-3 text-muted-foreground" size={28} />
            <p className="font-medium">Aucune livraison à afficher</p>
            <p className="mt-1 text-sm text-muted-foreground">Les livraisons sont créées lorsqu’une vente est validée.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1320px] text-left text-sm [&>tbody>tr:last-child>td]:border-b-0">
              <thead className="bg-primary text-primary-foreground">
                <tr>
                  <th className="px-4 py-3">Vente / Client</th>
                  <th className="px-4 py-3">Livraison</th>
                  <th className="px-4 py-3">Livreur</th>
                  <th className="px-4 py-3">Date prévue</th>
                  <th className="px-4 py-3">Date réelle de livraison</th>
                  <th className="px-4 py-3">Commentaire</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {deliveries.map((delivery) => (
                  <Fragment key={delivery.id_livraison}>
                    <tr className="align-top hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-primary">{delivery.vente.numero || `V-${delivery.vente.id_vente}`}</p>
                        <p className="mt-0.5">{clientName(delivery)}</p>
                        {delivery.vente.client?.telephone && <p className="text-xs text-muted-foreground">{delivery.vente.client.telephone}</p>}
                      </td>
                      <td className="max-w-[240px] px-4 py-3">
                        <p className="flex items-start gap-1.5"><MapPin className="mt-0.5 shrink-0 text-muted-foreground" size={14} /><span className="line-clamp-2">{delivery.adresse || "Adresse à renseigner"}</span></p>
                      </td>
                      <td className="px-4 py-3">{delivery.livreur || "À assigner"}</td>
                      <td className="px-4 py-3">{dateLabel(delivery.date_prevue)}</td>
                      <td className="whitespace-nowrap px-4 py-3">{dateTimeLabel(delivery.date_livraison)}</td>
                      <td className="max-w-[220px] px-4 py-3"><span className="line-clamp-2">{delivery.commentaire || "—"}</span></td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[delivery.statut_affiche]}`}>
                          {statusLabels[delivery.statut_affiche]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          {delivery.statut !== "livree" && delivery.statut !== "retournee" && (
                            <button type="button" onClick={() => void markDelivered(delivery)} disabled={deliveringId !== null} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-emerald-600 px-2.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                              <Check size={14} />{deliveringId === delivery.id_livraison ? "Mise à jour..." : "Marquer comme livrée"}
                            </button>
                          )}
                          <button type="button" onClick={() => openEditor(delivery)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-accent" aria-label={`Modifier la livraison ${delivery.vente.numero || delivery.vente.id_vente}`}>
                            <Pencil size={14} />
                          </button>
                          <button type="button" onClick={() => void toggleHistory(delivery)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-2 text-xs font-medium hover:bg-accent" aria-expanded={expandedId === delivery.id_livraison}>
                            <Eye size={14} />Historique {expandedId === delivery.id_livraison ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === delivery.id_livraison && (
                      <tr className="bg-muted/20">
                        <td colSpan={8} className="px-5 py-4">
                          <h3 className="mb-3 text-sm font-semibold">Historique des statuts</h3>
                          {historyLoadingId === delivery.id_livraison ? (
                            <p className="text-sm text-muted-foreground">Chargement...</p>
                          ) : (history[delivery.id_livraison] || []).length === 0 ? (
                            <p className="text-sm text-muted-foreground">Aucun changement de statut enregistré.</p>
                          ) : (
                            <ol className="space-y-3">
                              {history[delivery.id_livraison].map((entry) => (
                                <li key={entry.id_historique} className="flex flex-wrap items-start gap-x-3 gap-y-1 text-sm">
                                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                                  <span className="font-medium">{historyStatusLabel(entry.ancien_statut)} → {historyStatusLabel(entry.nouveau_statut)}</span>
                                  <span className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString("fr-FR")}</span>
                                  <span className="text-xs text-muted-foreground">par {entry.auteur}</span>
                                  {entry.commentaire && <p className="basis-full pl-5 text-xs text-muted-foreground">{entry.commentaire}</p>}
                                </li>
                              ))}
                            </ol>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pageInfo && pageInfo.total > 0 && (
          <div className="flex justify-end">
            <TablePagination page={pageInfo.current_page} lastPage={pageInfo.last_page} onChange={setPage} />
          </div>
        )}
      </section>

      <Modal open={editing !== null} onClose={() => { if (!saving) { setEditing(null); setForm(null) } }} title="Modifier la livraison" size="lg" closing={saving}>
        {form && (
          <form onSubmit={(event) => void save(event)} className="space-y-4">
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              Vente <strong className="text-foreground">{editing?.vente.numero || `V-${editing?.vente.id_vente}`}</strong> · {editing ? clientName(editing) : ""}
            </p>
            <label className="block space-y-1.5 text-sm font-medium">
              Adresse ou lieu de livraison
              <textarea rows={2} value={form.adresse} onChange={(event) => setForm({ ...form, adresse: event.target.value })} className={fieldClass} placeholder="Adresse complète ou lieu de rendez-vous" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5 text-sm font-medium">
                Statut
                <Select value={form.statut} onChange={(value) => { if (isEditableStatus(value)) setForm({ ...form, statut: value }) }} options={[
                  { value: "a_preparer", label: "À préparer" },
                  { value: "en_cours", label: "En cours de livraison" },
                  { value: "livree", label: "Livrée" },
                  { value: "retournee", label: "Retournée" },
                ]} />
                <span className="block text-xs font-normal text-muted-foreground">Le statut « Retardée » est calculé à partir de la date prévue.</span>
              </label>
              <label className="block space-y-1.5 text-sm font-medium">
                Date prévue
                <DatePicker value={form.date_prevue} onChange={(date_prevue) => setForm({ ...form, date_prevue })} ariaLabel="Date prévue" />
              </label>
              <label className="block space-y-1.5 text-sm font-medium">
                Livreur ou commercial responsable
                <input value={form.livreur} onChange={(event) => setForm({ ...form, livreur: event.target.value })} className={fieldClass} placeholder="Nom du responsable" />
              </label>
              <label className="block space-y-1.5 text-sm font-medium">
                Date réelle de livraison
                <DateTimePicker value={form.date_livraison} onChange={(date_livraison) => setForm({ ...form, date_livraison })} disabled={form.statut !== "livree" && form.statut !== "retournee"} />
              </label>
            </div>
            <label className="block space-y-1.5 text-sm font-medium">
              Commentaire
              <textarea rows={3} value={form.commentaire} onChange={(event) => setForm({ ...form, commentaire: event.target.value })} className={fieldClass} placeholder="Instructions ou note de livraison" />
            </label>
            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <button type="button" onClick={() => { setEditing(null); setForm(null) }} disabled={saving} className="rounded-lg border border-border px-4 py-2.5 text-sm hover:bg-accent disabled:opacity-50">Annuler</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? "Enregistrement..." : "Enregistrer"}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

function SummaryCard({
  label,
  count,
  icon: Icon,
  tone,
  onClick,
}: {
  label: string
  count: number
  icon: typeof AlertTriangle
  tone: string
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} className="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition hover:border-primary/30 hover:bg-accent/30">
      <span className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon size={18} className={tone} />
      </span>
      <span className={`mt-2 block text-2xl font-bold ${tone}`}>{count}</span>
    </button>
  )
}
