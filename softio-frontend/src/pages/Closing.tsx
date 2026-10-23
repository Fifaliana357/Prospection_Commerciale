import { useState } from "react"
import {
  Search,
  Plus,
  Handshake,
  MoreHorizontal,
  Trash2,
} from "lucide-react"
import { RecordFormModal } from "@/components/ui/Modal"

const closings = [
  {
    id: 1,
    offre: "Speaker",
    description: "Livraison effectuée au domicile",
    montant: "18 000",
    client: "Client",
    email: "-",
    editeur: "Admin",
  },
  {
    id: 2,
    offre: "Power station 1000wh",
    description: "Remis au transporteur par taxi",
    montant: "1 950 000",
    client: "Client",
    email: "-",
    editeur: "Admin",
  },
  {
    id: 3,
    offre: "Power station 300wh",
    description: "Récupérée au siège de Mada",
    montant: "600 000",
    client: "Njiva",
    email: "-",
    editeur: "Admin",
  },
  {
    id: 4,
    offre: "Power station 300wh",
    description: "Livraison effectuée au domicile",
    montant: "750 000",
    client: "Tiana",
    email: "-",
    editeur: "Admin",
  },
  {
    id: 5,
    offre: "Speaker champignon",
    description: "Achat d'une speaker champignon",
    montant: "10 000",
    client: "Client",
    email: "-",
    editeur: "Admin",
  },
  {
    id: 6,
    offre: "Speaker",
    description: "Achat de speaker",
    montant: "18 000",
    client: "Lucas Jeannot",
    email: "-",
    editeur: "Admin",
  },
  {
    id: 7,
    offre: "Gourde Thermos",
    description: "Achat de deux gourdes",
    montant: "22 000",
    client: "Client",
    email: "-",
    editeur: "Admin",
  },
]

export default function Closing() {
  const [closingItems, setClosingItems] = useState(closings)
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [initialValues, setInitialValues] = useState<Record<string, string>>({})

  const openCreate = () => {
    setEditingId(null)
    setInitialValues({})
    setModalOpen(true)
  }

  const openEdit = (closing: (typeof closings)[number]) => {
    setEditingId(closing.id)
    setInitialValues({ offre: closing.offre, description: closing.description, montant: closing.montant.replace(/\s/g, ""), client: closing.client, email: closing.email, editeur: closing.editeur })
    setModalOpen(true)
  }

  const saveClosing = (values: Record<string, string>) => {
    const updated = {
      id: editingId ?? Date.now(),
      offre: values.offre,
      description: values.description,
      montant: values.montant,
      client: values.client,
      email: values.email || "-",
      editeur: values.editeur || "Admin",
    }
    setClosingItems((current) => editingId
      ? current.map((item) => item.id === editingId ? updated : item)
      : [updated, ...current])
  }

  const filtered = closingItems.filter((c) =>
    c.offre.toLowerCase().includes(search.toLowerCase()) ||
    c.client.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Closings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Historique des offres clôturées (affaires gagnées)
          </p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus size={18} />
          Nouveau closing
        </button>
      </div>

      {/* Recherche */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="Rechercher par offre, client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Offre / Produit</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Montant</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Éditeur</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    Aucun closing trouvé
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Handshake size={15} className="text-primary shrink-0" />
                        <span className="font-medium">{c.offre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                      {c.description}
                    </td>
                    <td className="px-4 py-3 font-semibold text-primary">
                      {c.montant} MGA
                    </td>
                    <td className="px-4 py-3">{c.client}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.editeur}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(c)} title="Modifier" aria-label={`Modifier le closing ${c.offre}`} className="p-2 rounded-lg hover:bg-accent text-muted-foreground">
                          <MoreHorizontal size={16} />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-red-50 text-red-500 dark:hover:bg-red-900/20">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-border text-sm text-muted-foreground">
          {filtered.length} closing(s)
        </div>
        <RecordFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={saveClosing}
          title={editingId ? "Modifier le closing" : "Nouveau closing"}
          initialValues={initialValues}
          fields={[
            { name: "offre", label: "Offre / Produit", required: true },
            { name: "description", label: "Description", type: "textarea", required: true },
            { name: "montant", label: "Montant (MGA)", type: "number", required: true },
            { name: "client", label: "Client", required: true },
            { name: "email", label: "Email", type: "email" },
            { name: "editeur", label: "Éditeur", required: true },
          ]}
        />
      </div>
    </div>
  )
}