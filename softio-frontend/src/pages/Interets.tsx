import { useState } from "react"
import {
  Search,
  Plus,
  MoreHorizontal,
  Package,
  Building2,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { RecordFormModal } from "@/components/ui/Modal"

const interets = [
  {
    id: 1,
    prospect: "Jean Rakoto",
    type: "particulier",
    produit: "Power Station 1000wh",
    typeOffre: "Produit",
    date: "18/10/2026",
    niveau: "Élevé",
    commentaire: "Très intéressé, demande un devis rapidement",
  },
  {
    id: 2,
    prospect: "Nir'Info",
    type: "entreprise",
    produit: "Speaker Champignon",
    typeOffre: "Produit",
    date: "17/10/2026",
    niveau: "Moyen",
    commentaire: "Souhaite comparer avec d'autres modèles",
  },
  {
    id: 3,
    prospect: "Mamy Rasoanaivo",
    type: "particulier",
    produit: "Formation Softio",
    typeOffre: "Service",
    date: "15/10/2026",
    niveau: "Élevé",
    commentaire: "Besoin de formation pour son équipe",
  },
  {
    id: 4,
    prospect: "SoftLabs",
    type: "entreprise",
    produit: "Power Station 300wh",
    typeOffre: "Produit",
    date: "12/10/2026",
    niveau: "Faible",
    commentaire: "Simple prise d'information",
  },
  {
    id: 5,
    prospect: "Faly Andrianasolo",
    type: "particulier",
    produit: "Gourde Thermos",
    typeOffre: "Produit",
    date: "10/10/2026",
    niveau: "Moyen",
    commentaire: "Intéressé pour un achat groupé",
  },
]

const niveaux = ["Tous", "Élevé", "Moyen", "Faible"]

const niveauStyle: Record<string, string> = {
  Élevé: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  Moyen: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  Faible: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
}

export default function Interets() {
  const [interestItems, setInterestItems] = useState(interets)
  const [search, setSearch] = useState("")
  const [filterNiveau, setFilterNiveau] = useState("Tous")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [initialValues, setInitialValues] = useState<Record<string, string>>({})

  const openCreate = () => {
    setEditingId(null)
    setInitialValues({ date: new Date().toLocaleDateString("fr-FR"), type: "particulier", typeOffre: "Produit", niveau: "Moyen" })
    setModalOpen(true)
  }

  const openEdit = (interest: (typeof interets)[number]) => {
    setEditingId(interest.id)
    setInitialValues({
      prospect: interest.prospect,
      type: interest.type,
      produit: interest.produit,
      typeOffre: interest.typeOffre,
      date: interest.date,
      niveau: interest.niveau,
      commentaire: interest.commentaire,
    })
    setModalOpen(true)
  }

  const saveInterest = (values: Record<string, string>) => {
    const updated = {
      id: editingId ?? Date.now(),
      prospect: values.prospect,
      type: values.type,
      produit: values.produit,
      typeOffre: values.typeOffre,
      date: values.date,
      niveau: values.niveau,
      commentaire: values.commentaire,
    }
    setInterestItems((current) => editingId
      ? current.map((item) => item.id === editingId ? updated : item)
      : [updated, ...current])
  }

  const filtered = interestItems.filter((i) => {
    const matchSearch =
      i.prospect.toLowerCase().includes(search.toLowerCase()) ||
      i.produit.toLowerCase().includes(search.toLowerCase())

    const matchNiveau = filterNiveau === "Tous" || i.niveau === filterNiveau

    return matchSearch && matchNiveau
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Intérêts</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Suivez les centres d’intérêt de vos prospects
          </p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus size={18} />
          Ajouter un intérêt
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Rechercher un prospect ou produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {niveaux.map((n) => (
              <button
                key={n}
                onClick={() => setFilterNiveau(n)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  filterNiveau === n
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Liste */}
      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl py-16 text-center text-muted-foreground">
            Aucun intérêt trouvé
          </div>
        ) : (
          filtered.map((i) => (
            <div
              key={i.id}
              className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {i.type === "entreprise" ? <Building2 size={18} /> : <User size={18} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{i.prospect}</h3>
                      <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", niveauStyle[i.niveau])}>
                        {i.niveau}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package size={14} />
                      <span>{i.produit}</span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">{i.typeOffre}</span>
                    </div>
                    {i.commentaire && (
                      <p className="text-sm text-muted-foreground mt-2">{i.commentaire}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{i.date}</span>
                  <button onClick={() => openEdit(i)} title="Modifier" aria-label={`Modifier l’intérêt de ${i.prospect}`} className="p-2 rounded-lg hover:bg-accent text-muted-foreground">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <RecordFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={saveInterest}
        title={editingId ? "Modifier l’intérêt" : "Ajouter un intérêt"}
        initialValues={initialValues}
        fields={[
          { name: "prospect", label: "Prospect", required: true },
          { name: "type", label: "Type de prospect", type: "select", required: true, options: [{ label: "Particulier", value: "particulier" }, { label: "Entreprise", value: "entreprise" }] },
          { name: "produit", label: "Produit ou service", required: true },
          { name: "typeOffre", label: "Type d’offre", type: "select", required: true, options: ["Produit", "Service"].map((value) => ({ label: value, value })) },
          { name: "date", label: "Date", required: true, placeholder: "JJ/MM/AAAA" },
          { name: "niveau", label: "Niveau d’intérêt", type: "select", required: true, options: ["Élevé", "Moyen", "Faible"].map((value) => ({ label: value, value })) },
          { name: "commentaire", label: "Commentaire", type: "textarea" },
        ]}
      />
    </div>
  )
}