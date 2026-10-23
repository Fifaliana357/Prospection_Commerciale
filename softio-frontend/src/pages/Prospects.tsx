import { useState, useEffect } from "react"
import {
  Search, Plus, Phone, Building2, User,
  ChevronDown, Pencil, Trash2
} from "lucide-react"
import { cn } from "@/lib/utils"
import Modal from "@/components/ui/Modal"
import { prospectsApi } from "@/services/api"
import { useToast } from "@/components/ui/Toast"

interface Prospect {
  id: number
  matricule: string
  nom: string
  prenom: string
  type: "particulier" | "entreprise"
  email: string
  contact: string
  entreprise: string
  classification: string
  pays: string
  domaine: string
}

const initialProspects: Prospect[] = [
  { id: 1, matricule: "P-0042", nom: "Rakoto", prenom: "Jean", type: "particulier", email: "jean.rakoto@email.com", contact: "034 12 345 67", entreprise: "-", classification: "Chaud", pays: "Madagascar", domaine: "IT" },
  { id: 2, matricule: "P-0043", nom: "", prenom: "", type: "entreprise", email: "contact@nirinfo.mg", contact: "034 70 840 46", entreprise: "Nir'Info", classification: "Nouveau", pays: "Madagascar", domaine: "Informatique" },
  { id: 3, matricule: "P-0044", nom: "Rasoanaivo", prenom: "Mamy", type: "particulier", email: "mamy.raso@email.com", contact: "033 98 765 43", entreprise: "-", classification: "En cours", pays: "Madagascar", domaine: "Commerce" },
  { id: 4, matricule: "P-0045", nom: "Andrianasolo", prenom: "Faly", type: "particulier", email: "faly.andri@email.com", contact: "032 11 223 34", entreprise: "SoftLabs", classification: "Chaud", pays: "Madagascar", domaine: "IT" },
  { id: 5, matricule: "P-0046", nom: "", prenom: "", type: "entreprise", email: "info@softlabs.mg", contact: "034 56 789 01", entreprise: "SoftLabs", classification: "Perdu", pays: "Madagascar", domaine: "Services" },
]

const emptyForm: {
  nom: string
  prenom: string
  type: "particulier" | "entreprise"
  email: string
  contact: string
  entreprise: string
  classification: string
  pays: string
  domaine: string
} = {
  nom: "",
  prenom: "",
  type: "particulier",
  email: "",
  contact: "",
  entreprise: "",
  classification: "Nouveau",
  pays: "Madagascar",
  domaine: "",
}

const classifications = ["Tous", "Nouveau", "En cours", "Chaud", "Perdu", "Gagné"]
const types = ["Tous", "Particulier", "Entreprise"]

const badgeColor: Record<string, string> = {
  Nouveau: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "En cours": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  Chaud: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  Perdu: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  Gagné: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
}

export default function Prospects() {
  const { showToast } = useToast()
  const [prospects, setProspects] = useState<Prospect[]>(initialProspects)
  const [search, setSearch] = useState("")
  const [filterClass, setFilterClass] = useState("Tous")
  const [filterType, setFilterType] = useState("Tous")

  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [modalClosing, setModalClosing] = useState(false)

  const closeFormModal = () => {
    setModalClosing(true)
    window.setTimeout(() => {
      setModalOpen(false)
      setModalClosing(false)
    }, 160)
  }

  useEffect(() => {
    prospectsApi.getAll()
      .then((data) => {
        if (data && data.length > 0) {
          setProspects(data as Prospect[])
        }
      })
      .catch((err) => {
        console.warn("Backend non joint, conservation des données locales:", err)
      })
  }, [])

  const filtered = prospects.filter((p) => {
    const matchSearch =
      p.nom.toLowerCase().includes(search.toLowerCase()) ||
      p.prenom.toLowerCase().includes(search.toLowerCase()) ||
      p.entreprise.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.matricule.toLowerCase().includes(search.toLowerCase())
    const matchClass = filterClass === "Tous" || p.classification === filterClass
    const matchType = filterType === "Tous" || p.type.toLowerCase() === filterType.toLowerCase()
    return matchSearch && matchClass && matchType
  })

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setModalClosing(false)
    setModalOpen(true)
  }

  const openEdit = (p: Prospect) => {
    setEditingId(p.id)
    setForm({
      nom: p.nom,
      prenom: p.prenom,
      type: p.type,
      email: p.email,
      contact: p.contact,
      entreprise: p.entreprise === "-" ? "" : p.entreprise,
      classification: p.classification,
      pays: p.pays,
      domaine: p.domaine,
    })
    setModalClosing(false)
    setModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...form,
      entreprise: form.entreprise || "-",
    }

    if (editingId) {
      // Modification
      prospectsApi.update(editingId, payload)
        .then((updated) => {
          setProspects((prev) =>
            prev.map((p) => (p.id === editingId ? (updated as Prospect) : p))
          )
          showToast("Prospect modifié avec succès", "success")
        })
        .catch(() => {
          setProspects((prev) =>
            prev.map((p) => (p.id === editingId ? { ...p, ...payload } : p))
          )
          showToast("Prospect modifié (hors ligne)", "info")
        })
    } else {
      // Création — on ajoute EN FIN de liste (ordre ID desc depuis le backend)
      prospectsApi.create(payload)
        .then((created) => {
          setProspects((prev) => [...prev, created as Prospect])
          showToast("Prospect ajouté avec succès", "success")
        })
        .catch(() => {
          const maxId = prospects.reduce((m, p) => Math.max(m, p.id), 0)
          const nextNum = maxId + 1
          const newProspect: Prospect = {
            id: nextNum,
            matricule: `P-${String(nextNum).padStart(4, "0")}`,
            ...payload,
          }
          setProspects((prev) => [...prev, newProspect])
          showToast("Prospect ajouté (hors ligne)", "info")
        })
    }
    closeFormModal()
  }

  const handleDelete = () => {
    if (deleteId) {
      prospectsApi.delete(deleteId)
        .then(() => showToast("Prospect supprimé", "success"))
        .catch(() => showToast("Prospect supprimé (hors ligne)", "info"))
      setProspects((prev) => prev.filter((p) => p.id !== deleteId))
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prospects</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gérez vos prospects et clients potentiels
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={18} />
          Nouveau prospect
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Rechercher par nom, email, matricule..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="relative">
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[140px]"
            >
              {classifications.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
          </div>
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[140px]"
            >
              {types.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Matricule</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Prospect</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Classification</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Domaine</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    Aucun prospect trouvé
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-primary">{p.matricule}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          {p.type === "entreprise" ? <Building2 size={16} /> : <User size={16} />}
                        </div>
                        <div>
                          <p className="font-medium">
                            {p.type === "entreprise" ? p.entreprise : `${p.prenom} ${p.nom}`}
                          </p>
                          <p className="text-xs text-muted-foreground">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone size={14} />
                        <span>{p.contact}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize">{p.type}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex px-2.5 py-1 rounded-full text-xs font-medium", badgeColor[p.classification])}>
                        {p.classification}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.domaine}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                          title="Modifier"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteId(p.id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 dark:hover:bg-red-900/20"
                          title="Supprimer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
          <span>{filtered.length} prospect(s)</span>
        </div>
      </div>

      {/* Modal Ajout / Modification */}
      <Modal
        open={modalOpen}
        onClose={closeFormModal}
        title={editingId ? "Modifier le prospect" : "Nouveau prospect"}
        size="lg"
        closing={modalClosing}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Type</label>
            <div className="flex gap-2">
              {(["particulier", "entreprise"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t })}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium border transition-colors capitalize",
                    form.type === t
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {form.type === "particulier" ? (
              <>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Prénom</label>
                  <input
                    required
                    value={form.prenom}
                    onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Nom</label>
                  <input
                    required
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </>
            ) : (
              <div className="sm:col-span-2">
                <label className="text-sm font-medium mb-1.5 block">Raison sociale</label>
                <input
                  required
                  value={form.entreprise}
                  onChange={(e) => setForm({ ...form, entreprise: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Contact</label>
              <input
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Classification</label>
              <select
                value={form.classification}
                onChange={(e) => setForm({ ...form, classification: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {["Nouveau", "En cours", "Chaud", "Perdu", "Gagné"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Domaine</label>
              <input
                value={form.domaine}
                onChange={(e) => setForm({ ...form, domaine: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Pays</label>
              <input
                value={form.pays}
                onChange={(e) => setForm({ ...form, pays: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={closeFormModal}
              className="px-4 py-2.5 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              {editingId ? "Enregistrer" : "Créer le prospect"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmation Suppression */}
      <Modal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Confirmer la suppression"
        size="sm"
      >
        <p className="text-sm text-muted-foreground mb-6">
          Êtes-vous sûr de vouloir supprimer ce prospect ? Cette action est irréversible.
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