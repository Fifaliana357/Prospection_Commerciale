import { useState } from "react"
import { Search, Plus, MoreHorizontal, Mail, Phone } from "lucide-react"
import { RecordFormModal } from "@/components/ui/Modal"

const commerciaux = [
  { id: 1, nom: "Randria", prenom: "Hasina", email: "hasina@nirinfo.mg", contact: "034 55 281 46", prospects: 42, ventes: 18 },
  { id: 2, nom: "Mamy", prenom: "Nirina", email: "niryinfo@gmail.com", contact: "034 70 840 46", prospects: 35, ventes: 12 },
  { id: 3, nom: "Fitiavantsoa", prenom: "Fenohery", email: "fitiavantsoa@email.com", contact: "034 40 053 83", prospects: 28, ventes: 9 },
  { id: 4, nom: "Sitrakiniaina", prenom: "Sarobidy", email: "sarobidy@email.com", contact: "033 51 347 87", prospects: 21, ventes: 7 },
]

export default function Commerciaux() {
  const [team, setTeam] = useState(commerciaux)
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [initialValues, setInitialValues] = useState<Record<string, string>>({})

  const openCreate = () => {
    setEditingId(null)
    setInitialValues({})
    setModalOpen(true)
  }

  const openEdit = (commercial: (typeof commerciaux)[number]) => {
    setEditingId(commercial.id)
    setInitialValues({
      prenom: commercial.prenom,
      nom: commercial.nom,
      email: commercial.email,
      contact: commercial.contact,
    })
    setModalOpen(true)
  }

  const saveCommercial = (values: Record<string, string>) => {
    const updated = {
      id: editingId ?? Date.now(),
      prenom: values.prenom,
      nom: values.nom,
      email: values.email,
      contact: values.contact,
      prospects: editingId ? team.find((item) => item.id === editingId)?.prospects ?? 0 : 0,
      ventes: editingId ? team.find((item) => item.id === editingId)?.ventes ?? 0 : 0,
    }
    setTeam((current) => editingId
      ? current.map((item) => item.id === editingId ? updated : item)
      : [updated, ...current])
  }

  const filtered = team.filter((c) =>
    `${c.prenom} ${c.nom}`.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Commerciaux</h1>
          <p className="text-muted-foreground text-sm mt-1">Gérez votre équipe commerciale</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
          <Plus size={18} /> Ajouter un commercial
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="Rechercher un commercial..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <div key={c.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">
                {c.prenom.charAt(0)}{c.nom.charAt(0)}
              </div>
              <button onClick={() => openEdit(c)} title="Modifier" aria-label={`Modifier ${c.prenom} ${c.nom}`} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
                <MoreHorizontal size={16} />
              </button>
            </div>
            <h3 className="font-semibold text-lg">{c.prenom} {c.nom}</h3>
            <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail size={14} />
                <span className="truncate">{c.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} />
                <span>{c.contact}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
              <div>
                <p className="text-muted-foreground">Prospects</p>
                <p className="font-semibold">{c.prospects}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Ventes</p>
                <p className="font-semibold">{c.ventes}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <RecordFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={saveCommercial}
        title={editingId ? "Modifier le commercial" : "Ajouter un commercial"}
        description="Coordonnées du membre de l’équipe commerciale."
        initialValues={initialValues}
        fields={[
          { name: "prenom", label: "Prénom", required: true },
          { name: "nom", label: "Nom", required: true },
          { name: "email", label: "Email", type: "email", required: true },
          { name: "contact", label: "Téléphone", type: "tel", required: true },
        ]}
      />
    </div>
  )
}