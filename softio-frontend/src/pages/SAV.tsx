import { useState } from "react"
import { Search, Plus, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { RecordFormModal } from "@/components/ui/Modal"

const tickets = [
  { id: 1, num: "SAV-2026-001", client: "Jean Rakoto", sujet: "Problème de charge Power Station", priorite: "Haute", statut: "Ouvert", date: "20/10/2026" },
  { id: 2, num: "SAV-2026-002", client: "Nir'Info", sujet: "Demande de remplacement speaker", priorite: "Moyenne", statut: "En cours", date: "19/10/2026" },
  { id: 3, num: "SAV-2026-003", client: "Mamy Rasoanaivo", sujet: "Question sur la garantie", priorite: "Basse", statut: "Résolu", date: "18/10/2026" },
  { id: 4, num: "SAV-2026-004", client: "SoftLabs", sujet: "Produit défectueux à la réception", priorite: "Haute", statut: "Ouvert", date: "17/10/2026" },
  { id: 5, num: "SAV-2026-005", client: "Tiana", sujet: "Demande de facture", priorite: "Basse", statut: "Résolu", date: "15/10/2026" },
]

const prioriteStyle: Record<string, string> = {
  Haute: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  Moyenne: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  Basse: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
}

const statutStyle: Record<string, string> = {
  Ouvert: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "En cours": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  Résolu: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
}

export default function SAV() {
  const [ticketItems, setTicketItems] = useState(tickets)
  const [search, setSearch] = useState("")
  const [filterStatut, setFilterStatut] = useState("Tous")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [initialValues, setInitialValues] = useState<Record<string, string>>({})

  const openCreate = () => {
    setEditingId(null)
    setInitialValues({ date: new Date().toLocaleDateString("fr-FR"), priorite: "Moyenne", statut: "Ouvert" })
    setModalOpen(true)
  }

  const openEdit = (ticket: (typeof tickets)[number]) => {
    setEditingId(ticket.id)
    setInitialValues({ num: ticket.num, client: ticket.client, sujet: ticket.sujet, priorite: ticket.priorite, statut: ticket.statut, date: ticket.date })
    setModalOpen(true)
  }

  const saveTicket = (values: Record<string, string>) => {
    const updated = {
      id: editingId ?? Date.now(),
      num: values.num || `SAV-2026-${String(ticketItems.length + 1).padStart(3, "0")}`,
      client: values.client,
      sujet: values.sujet,
      priorite: values.priorite,
      statut: values.statut,
      date: values.date,
    }
    setTicketItems((current) => editingId
      ? current.map((item) => item.id === editingId ? updated : item)
      : [updated, ...current])
  }

  const filtered = ticketItems.filter((t) => {
    const matchSearch =
      t.num.toLowerCase().includes(search.toLowerCase()) ||
      t.client.toLowerCase().includes(search.toLowerCase()) ||
      t.sujet.toLowerCase().includes(search.toLowerCase())
    const matchStatut = filterStatut === "Tous" || t.statut === filterStatut
    return matchSearch && matchStatut
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Service Après-Vente</h1>
          <p className="text-muted-foreground text-sm mt-1">Gérez les tickets et réclamations clients</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
          <Plus size={18} /> Nouveau ticket
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Rechercher un ticket, client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {["Tous", "Ouvert", "En cours", "Résolu"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatut(s)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  filterStatut === s ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">N° Ticket</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Sujet</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Priorité</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-primary">{t.num}</td>
                  <td className="px-4 py-3">{t.client}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{t.sujet}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex px-2.5 py-1 rounded-full text-xs font-medium", prioriteStyle[t.priorite])}>
                      {t.priorite}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex px-2.5 py-1 rounded-full text-xs font-medium", statutStyle[t.statut])}>
                      {t.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{t.date}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(t)} title="Modifier" aria-label={`Modifier le ticket ${t.num}`} className="p-2 rounded-lg hover:bg-accent text-muted-foreground">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border text-sm text-muted-foreground">
          {filtered.length} ticket(s)
        </div>
        <RecordFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={saveTicket}
          title={editingId ? "Modifier le ticket SAV" : "Nouveau ticket SAV"}
          initialValues={initialValues}
          fields={[
            { name: "num", label: "N° Ticket" },
            { name: "client", label: "Client", required: true },
            { name: "sujet", label: "Sujet", required: true },
            { name: "priorite", label: "Priorité", type: "select", required: true, options: ["Basse", "Moyenne", "Haute"].map((value) => ({ label: value, value })) },
            { name: "statut", label: "Statut", type: "select", required: true, options: ["Ouvert", "En cours", "Résolu"].map((value) => ({ label: value, value })) },
            { name: "date", label: "Date", required: true, placeholder: "JJ/MM/AAAA" },
          ]}
        />
      </div>
    </div>
  )
}