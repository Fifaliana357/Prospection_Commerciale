import { useState, useEffect } from "react"
import {
  Search,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Video,
  Phone,
  Users,
  MoreHorizontal,
  ChevronDown,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { RecordFormModal } from "@/components/ui/Modal"
import { rendezVousApi } from "@/services/api"

const rendezvous = [
  {
    id: 1,
    date: "21/10/2026",
    heure: "09:30",
    prospect: "Jean Rakoto",
    contact: "034 12 345 67",
    mode: "Visio",
    lieu: "Google Meet",
    commentaire: "Présentation de l'offre Power Station",
    statut: "Confirmé",
  },
  {
    id: 2,
    date: "21/10/2026",
    heure: "14:00",
    prospect: "Nir'Info",
    contact: "034 70 840 46",
    mode: "Présentiel",
    lieu: "Siège Nir'Info - Antananarivo",
    commentaire: "Discussion partenariat",
    statut: "Confirmé",
  },
  {
    id: 3,
    date: "22/10/2026",
    heure: "10:00",
    prospect: "Mamy Rasoanaivo",
    contact: "033 98 765 43",
    mode: "Téléphonique",
    lieu: "-",
    commentaire: "Relance devis speaker",
    statut: "En attente",
  },
  {
    id: 4,
    date: "23/10/2026",
    heure: "11:30",
    prospect: "SoftLabs",
    contact: "034 56 789 01",
    mode: "Visio",
    lieu: "Zoom",
    commentaire: "Démo Softio",
    statut: "Confirmé",
  },
  {
    id: 5,
    date: "24/10/2026",
    heure: "15:00",
    prospect: "Faly Andrianasolo",
    contact: "032 11 223 34",
    mode: "Présentiel",
    lieu: "Café de la Gare",
    commentaire: "Premier contact",
    statut: "Annulé",
  },
]

const filtresDate = ["Tout", "Aujourd'hui", "Demain", "Cette semaine", "Ce mois"]
const modes = ["Tous", "Présentiel", "Téléphonique", "Visio"]

const modeIcon: Record<string, LucideIcon> = {
  Présentiel: Users,
  Téléphonique: Phone,
  Visio: Video,
}

const statutStyle: Record<string, string> = {
  Confirmé: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  "En attente": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  Annulé: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
}

export default function RendezVous() {
  const [appointments, setAppointments] = useState(rendezvous)
  const [search, setSearch] = useState("")
  const [filterDate, setFilterDate] = useState("Tout")
  const [filterMode, setFilterMode] = useState("Tous")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [initialValues, setInitialValues] = useState<Record<string, string>>({})

  useEffect(() => {
    rendezVousApi.getAll()
      .then((data) => {
        if (data && data.length > 0) {
          setAppointments(data as typeof rendezvous)
        }
      })
      .catch((err) => console.warn("Backend non joint:", err))
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setInitialValues({ date: new Date().toLocaleDateString("fr-FR"), statut: "Confirmé" })
    setModalOpen(true)
  }

  const openEdit = (appointment: (typeof rendezvous)[number]) => {
    setEditingId(appointment.id)
    setInitialValues({
      date: appointment.date,
      heure: appointment.heure,
      prospect: appointment.prospect,
      contact: appointment.contact,
      mode: appointment.mode,
      lieu: appointment.lieu === "-" ? "" : appointment.lieu,
      commentaire: appointment.commentaire,
      statut: appointment.statut,
    })
    setModalOpen(true)
  }

  const saveAppointment = (values: Record<string, string>) => {
    const updated = {
      date: values.date,
      heure: values.heure,
      prospect: values.prospect,
      contact: values.contact,
      mode: values.mode,
      lieu: values.lieu || "-",
      commentaire: values.commentaire,
      statut: values.statut,
    }

    if (editingId) {
      rendezVousApi.update(editingId, updated)
        .then((res) => {
          setAppointments((current) =>
            current.map((item) => (item.id === editingId ? { ...item, ...res } : item))
          )
        })
        .catch(() => {
          setAppointments((current) =>
            current.map((item) => (item.id === editingId ? { ...item, ...updated, id: editingId } : item))
          )
        })
    } else {
      rendezVousApi.create(updated)
        .then((res) => {
          setAppointments((current) => [res as (typeof rendezvous)[number], ...current])
        })
        .catch(() => {
          setAppointments((current) => [{ ...updated, id: Date.now() }, ...current])
        })
    }
  }

  const filtered = appointments.filter((r) => {
    const matchSearch =
      r.prospect.toLowerCase().includes(search.toLowerCase()) ||
      r.commentaire.toLowerCase().includes(search.toLowerCase()) ||
      r.lieu.toLowerCase().includes(search.toLowerCase())

    const matchMode = filterMode === "Tous" || r.mode === filterMode

    return matchSearch && matchMode
  })

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rendez-vous</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Planifiez et suivez vos rendez-vous avec les prospects
          </p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus size={18} />
          Nouveau rendez-vous
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Rechercher un prospect, lieu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Filtres date */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1 overflow-x-auto">
            {filtresDate.map((f) => (
              <button
                key={f}
                onClick={() => setFilterDate(f)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                  filterDate === f
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Filtre mode */}
          <div className="relative">
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[140px]"
            >
              {modes.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      {/* Liste des RDV */}
      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl py-16 text-center text-muted-foreground">
            Aucun rendez-vous trouvé
          </div>
        ) : (
          filtered.map((r) => {
            const ModeIcon = modeIcon[r.mode] || Calendar
            return (
              <div
                key={r.id}
                className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Date + Heure */}
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary">
                      <span className="text-xs font-medium">
                        {r.date.split("/")[1]}/{r.date.split("/")[0]}
                      </span>
                      <span className="text-lg font-bold leading-tight">
                        {r.date.split("/")[0]}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{r.prospect}</h3>
                        <span
                          className={cn(
                            "inline-flex px-2 py-0.5 rounded-full text-xs font-medium",
                            statutStyle[r.statut]
                          )}
                        >
                          {r.statut}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {r.heure}
                        </span>
                        <span className="flex items-center gap-1">
                          <ModeIcon size={14} />
                          {r.mode}
                        </span>
                        {r.lieu !== "-" && (
                          <span className="flex items-center gap-1">
                            <MapPin size={14} />
                            {r.lieu}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(r)} title="Modifier" aria-label={`Modifier le rendez-vous avec ${r.prospect}`} className="p-2 rounded-lg hover:bg-accent text-muted-foreground">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                </div>

                {r.commentaire && (
                  <p className="mt-3 text-sm text-muted-foreground border-t border-border pt-3">
                    {r.commentaire}
                  </p>
                )}
              </div>
            )
          })
        )}
      </div>
      <RecordFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={saveAppointment}
        title={editingId ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}
        initialValues={initialValues}
        fields={[
          { name: "date", label: "Date", required: true, placeholder: "JJ/MM/AAAA" },
          { name: "heure", label: "Heure", type: "time", required: true },
          { name: "prospect", label: "Prospect", required: true },
          { name: "contact", label: "Contact", type: "tel", required: true },
          { name: "mode", label: "Mode", type: "select", required: true, options: ["Présentiel", "Téléphonique", "Visio"].map((value) => ({ label: value, value })) },
          { name: "lieu", label: "Lieu / lien" },
          { name: "statut", label: "Statut", type: "select", required: true, options: ["Confirmé", "En attente", "Annulé"].map((value) => ({ label: value, value })) },
          { name: "commentaire", label: "Commentaire", type: "textarea" },
        ]}
      />
    </div>
  )
}