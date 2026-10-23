import { useState, useEffect } from "react"
import {
  Search,
  Plus,
  MessageSquare,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building2,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import Modal from "@/components/ui/Modal"
import { prospectionsApi, prospectsApi } from "@/services/api"
import type { ProspectModel } from "@/services/api"
import { useToast } from "@/components/ui/Toast"

interface ProspectionItem {
  id: number
  date: string
  objet: string
  contact: string
  nom: string
  entreprise: string
  fonction: string
  etat: string
  editeur: string
  score: number | null
  prospect_id?: number | null
}

const initialProspections: ProspectionItem[] = [
  { id: 1, date: "16/10/2026", objet: "Salut", contact: "034 36 040 22", nom: "Szs Ketaka", entreprise: "-", fonction: "-", etat: "Non clôturé", editeur: "Admin", score: 49 },
  { id: 2, date: "16/10/2026", objet: "Présentation Softio", contact: "034 70 840 46", nom: "Jean Rakoto", entreprise: "Nir'Info", fonction: "Directeur", etat: "Non clôturé", editeur: "Admin", score: 69 },
  { id: 3, date: "23/09/2026", objet: "Commande speaker", contact: "032 11 112 02", nom: "Client", entreprise: "-", fonction: "-", etat: "Clôturé", editeur: "Admin", score: null },
  { id: 4, date: "23/09/2026", objet: "Commande power station 1000wh", contact: "034 20 701 15", nom: "Client", entreprise: "-", fonction: "-", etat: "Clôturé", editeur: "Admin", score: null },
  { id: 5, date: "23/09/2026", objet: "Proposition speaker champignon", contact: "034 50 917 65", nom: "Njiva", entreprise: "-", fonction: "-", etat: "Clôturé", editeur: "Admin", score: null },
  { id: 6, date: "20/09/2026", objet: "Relance devis", contact: "033 98 765 43", nom: "Mamy Rasoanaivo", entreprise: "SoftLabs", fonction: "Responsable Achat", etat: "Perdu", editeur: "Admin", score: 22 },
]

const etats = ["Tout", "Clôturé", "Non clôturé", "Perdu"]

const etatStyle: Record<string, string> = {
  "Clôturé": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  "Non clôturé": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "Perdu": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
}

const etatIcon: Record<string, LucideIcon> = {
  "Clôturé": CheckCircle2,
  "Non clôturé": Clock,
  "Perdu": XCircle,
}

const emptyForm = {
  prospect_id: "" as string | number,
  date: "",
  objet: "",
  contact: "",
  nom: "",
  entreprise: "",
  fonction: "",
  etat: "Non clôturé",
}

export default function Prospection() {
  const { showToast } = useToast()
  const [prospectionItems, setProspectionItems] = useState<ProspectionItem[]>(initialProspections)
  const [prospects, setProspects] = useState<ProspectModel[]>([])
  const [search, setSearch] = useState("")
  const [filterEtat, setFilterEtat] = useState("Tout")
  const [modalOpen, setModalOpen] = useState(false)
  const [modalClosing, setModalClosing] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)

  // Charger les prospections depuis le backend
  useEffect(() => {
    prospectionsApi.getAll()
      .then((data) => {
        if (data && data.length > 0) {
          setProspectionItems(data as ProspectionItem[])
        }
      })
      .catch((err) => console.warn("Backend non joint:", err))
  }, [])

  // Charger la liste des prospects pour le sélecteur
  useEffect(() => {
    prospectsApi.getAll()
      .then((data) => setProspects(data))
      .catch(() => {})
  }, [])

  const closeModal = () => {
    setModalClosing(true)
    setTimeout(() => {
      setModalOpen(false)
      setModalClosing(false)
    }, 160)
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({
      ...emptyForm,
      date: new Date().toLocaleDateString("fr-FR"),
    })
    setModalOpen(true)
  }

  const openEdit = (item: ProspectionItem) => {
    setEditingId(item.id)
    setForm({
      prospect_id: item.prospect_id ?? "",
      date: item.date,
      objet: item.objet,
      contact: item.contact,
      nom: item.nom,
      entreprise: item.entreprise === "-" ? "" : item.entreprise,
      fonction: item.fonction === "-" ? "" : item.fonction,
      etat: item.etat,
    })
    setModalOpen(true)
  }

  // Quand un prospect est sélectionné dans le dropdown, pré-remplir nom/contact/entreprise
  const handleProspectSelect = (id: string) => {
    if (!id) {
      setForm((f) => ({ ...f, prospect_id: "", nom: "", contact: "", entreprise: "" }))
      return
    }
    const selected = prospects.find((p) => String(p.id) === id)
    if (selected) {
      const nom = selected.type === "entreprise"
        ? selected.entreprise
        : `${selected.prenom} ${selected.nom}`.trim()
      setForm((f) => ({
        ...f,
        prospect_id: selected.id,
        nom,
        contact: selected.contact,
        entreprise: selected.entreprise !== "-" ? selected.entreprise : "",
      }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      date: form.date,
      objet: form.objet,
      contact: form.contact,
      nom: form.nom,
      entreprise: form.entreprise || "-",
      fonction: form.fonction || "-",
      etat: form.etat,
      editeur: "Admin",
      score: null,
      prospect_id: form.prospect_id || null,
    }

    if (editingId) {
      prospectionsApi.update(editingId, payload)
        .then((res) => {
          setProspectionItems((current) =>
            current.map((item) => (item.id === editingId ? { ...item, ...res } : item))
          )
          showToast("Prospection modifiée avec succès", "success")
        })
        .catch(() => {
          setProspectionItems((current) =>
            current.map((item) =>
              item.id === editingId ? { ...item, ...payload, id: editingId } : item
            )
          )
          showToast("Prospection modifiée (hors ligne)", "info")
        })
    } else {
      prospectionsApi.create(payload)
        .then((res) => {
          setProspectionItems((current) => [...current, res as ProspectionItem])
          showToast("Prospection ajoutée avec succès", "success")
        })
        .catch(() => {
          setProspectionItems((current) => [
            ...current,
            { ...payload, id: Date.now() } as ProspectionItem,
          ])
          showToast("Prospection ajoutée (hors ligne)", "info")
        })
    }
    closeModal()
  }

  const handleDelete = () => {
    if (deleteId) {
      prospectionsApi.delete(deleteId)
        .then(() => showToast("Prospection supprimée", "success"))
        .catch(() => showToast("Prospection supprimée (hors ligne)", "info"))
      setProspectionItems((prev) => prev.filter((p) => p.id !== deleteId))
      setDeleteId(null)
    }
  }

  const filtered = prospectionItems.filter((p) => {
    const matchSearch =
      p.objet.toLowerCase().includes(search.toLowerCase()) ||
      p.nom.toLowerCase().includes(search.toLowerCase()) ||
      p.contact.includes(search) ||
      p.entreprise.toLowerCase().includes(search.toLowerCase())

    const matchEtat = filterEtat === "Tout" || p.etat === filterEtat

    return matchSearch && matchEtat
  })

  const inputClass = "w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prospection</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Suivez vos actions de prospection et vos échanges
          </p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus size={18} />
          Nouvelle prospection
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Rechercher par objet, nom, contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Boutons d'état */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {etats.map((etat) => (
              <button
                key={etat}
                onClick={() => setFilterEtat(etat)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  filterEtat === etat
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {etat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Objet</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Prospect</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">État</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Score</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Éditeur</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    Aucune prospection trouvée
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const Icon = etatIcon[p.etat] ?? Clock
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{p.date}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <MessageSquare size={15} className="text-primary shrink-0" />
                          <span className="font-medium">{p.objet}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{p.nom}</p>
                        {p.entreprise !== "-" && (
                          <p className="text-xs text-muted-foreground">{p.entreprise}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.contact}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                            etatStyle[p.etat]
                          )}
                        >
                          <Icon size={12} />
                          {p.etat}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {p.score !== null ? (
                          <span
                            className={cn(
                              "font-semibold text-sm",
                              p.score >= 60
                                ? "text-emerald-600"
                                : p.score >= 40
                                ? "text-amber-600"
                                : "text-red-500"
                            )}
                          >
                            {p.score}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.editeur}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(p)}
                            title="Modifier"
                            aria-label={`Modifier ${p.objet}`}
                            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteId(p.id)}
                            title="Supprimer"
                            className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 dark:hover:bg-red-900/20"
                          >
                            <XCircle size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
          <span>{filtered.length} prospection(s)</span>
        </div>
      </div>

      {/* Modal Ajout / Modification */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? "Modifier la prospection" : "Nouvelle prospection"}
        size="lg"
        closing={modalClosing}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sélecteur de prospect */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Prospect</label>
            <div className="relative">
              <select
                value={String(form.prospect_id)}
                onChange={(e) => handleProspectSelect(e.target.value)}
                className={inputClass}
              >
                <option value="">— Saisir manuellement —</option>
                {prospects.map((p) => {
                  const label = p.type === "entreprise"
                    ? p.entreprise
                    : `${p.prenom} ${p.nom}`.trim()
                  const icon = p.type === "entreprise" ? "🏢" : "👤"
                  return (
                    <option key={p.id} value={String(p.id)}>
                      {icon} {label} — {p.contact}
                    </option>
                  )
                })}
              </select>
            </div>
            {form.prospect_id && (() => {
              const sel = prospects.find((p) => String(p.id) === String(form.prospect_id))
              if (!sel) return null
              return (
                <div className="mt-2 flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/20 text-sm">
                  <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    {sel.type === "entreprise" ? <Building2 size={14} /> : <User size={14} />}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {sel.type === "entreprise" ? sel.entreprise : `${sel.prenom} ${sel.nom}`.trim()}
                    </p>
                    <p className="text-xs text-muted-foreground">{sel.matricule} · {sel.contact}</p>
                  </div>
                </div>
              )
            })()}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nom (pré-rempli ou saisi manuellement) */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nom du contact</label>
              <input
                required
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                className={inputClass}
                placeholder="Nom complet"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Contact</label>
              <input
                required
                type="tel"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                className={inputClass}
                placeholder="034 XX XXX XX"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Entreprise</label>
              <input
                value={form.entreprise}
                onChange={(e) => setForm({ ...form, entreprise: e.target.value })}
                className={inputClass}
                placeholder="Optionnel"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Fonction</label>
              <input
                value={form.fonction}
                onChange={(e) => setForm({ ...form, fonction: e.target.value })}
                className={inputClass}
                placeholder="Optionnel"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Date</label>
              <input
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className={inputClass}
                placeholder="JJ/MM/AAAA"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">État</label>
              <select
                required
                value={form.etat}
                onChange={(e) => setForm({ ...form, etat: e.target.value })}
                className={inputClass}
              >
                {["Non clôturé", "Clôturé", "Perdu"].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium mb-1.5 block">Objet</label>
              <input
                required
                value={form.objet}
                onChange={(e) => setForm({ ...form, objet: e.target.value })}
                className={inputClass}
                placeholder="Objet de la prospection"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2.5 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              {editingId ? "Enregistrer" : "Créer la prospection"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Suppression */}
      <Modal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Confirmer la suppression"
        size="sm"
      >
        <p className="text-sm text-muted-foreground mb-6">
          Êtes-vous sûr de vouloir supprimer cette prospection ? Cette action est irréversible.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => setDeleteId(null)}
            className="px-4 py-2.5 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2.5 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            Supprimer
          </button>
        </div>
      </Modal>
    </div>
  )
}