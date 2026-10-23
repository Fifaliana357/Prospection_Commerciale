import { useState } from "react"
import { Search, Plus, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { RecordFormModal } from "@/components/ui/Modal"

const ventes = [
  { id: 1, num: "VTE-2026-0001", type: "Produit", montant: "360 000", date: "16/10/2026", totalHT: "300 000", tva: "60 000", statut: "Validé" },
  { id: 2, num: "VTE-2026-0002", type: "Produit", montant: "1 200 000", date: "15/10/2026", totalHT: "1 000 000", tva: "200 000", statut: "Validé" },
  { id: 3, num: "VTE-2026-0003", type: "Service", montant: "450 000", date: "14/10/2026", totalHT: "450 000", tva: "0", statut: "Brouillon" },
  { id: 4, num: "VTE-2026-0004", type: "Produit", montant: "2 400 000", date: "12/10/2026", totalHT: "2 000 000", tva: "400 000", statut: "Validé" },
  { id: 5, num: "VTE-2026-0005", type: "Produit", montant: "180 000", date: "10/10/2026", totalHT: "150 000", tva: "30 000", statut: "Validé" },
]

const statutStyle: Record<string, string> = {
  Validé: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  Brouillon: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
}

export default function Ventes() {
  const [saleItems, setSaleItems] = useState(ventes)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("Tous")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [initialValues, setInitialValues] = useState<Record<string, string>>({})

  const openCreate = () => {
    setEditingId(null)
    setInitialValues({ type: "Produit", date: new Date().toLocaleDateString("fr-FR"), statut: "Brouillon" })
    setModalOpen(true)
  }

  const openEdit = (sale: (typeof ventes)[number]) => {
    setEditingId(sale.id)
    setInitialValues({ num: sale.num, type: sale.type, montant: sale.montant.replace(/\s/g, ""), date: sale.date, totalHT: sale.totalHT.replace(/\s/g, ""), tva: sale.tva.replace(/\s/g, ""), statut: sale.statut })
    setModalOpen(true)
  }

  const saveSale = (values: Record<string, string>) => {
    const updated = {
      id: editingId ?? Date.now(),
      num: values.num || `VTE-2026-${String(saleItems.length + 1).padStart(4, "0")}`,
      type: values.type,
      montant: values.montant,
      date: values.date,
      totalHT: values.totalHT,
      tva: values.tva,
      statut: values.statut,
    }
    setSaleItems((current) => editingId
      ? current.map((item) => item.id === editingId ? updated : item)
      : [updated, ...current])
  }

  const filtered = saleItems.filter((v) => {
    const matchSearch = v.num.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === "Tous" || v.type === filterType
    return matchSearch && matchType
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ventes</h1>
          <p className="text-muted-foreground text-sm mt-1">Consultez et gérez vos ventes</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
          <Plus size={18} /> Nouvelle vente
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Rechercher par N° de vente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {["Tous", "Produit", "Service"].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  filterType === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t}
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
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">N° Vente</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Montant</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Total HT</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">TVA</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-primary">{v.num}</td>
                  <td className="px-4 py-3">{v.type}</td>
                  <td className="px-4 py-3 font-semibold">{v.montant} MGA</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.totalHT} MGA</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.tva} MGA</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.date}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex px-2.5 py-1 rounded-full text-xs font-medium", statutStyle[v.statut])}>
                      {v.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(v)} title="Modifier" aria-label={`Modifier la vente ${v.num}`} className="p-2 rounded-lg hover:bg-accent text-muted-foreground">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border text-sm text-muted-foreground">
          {filtered.length} vente(s)
        </div>
        <RecordFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={saveSale}
          title={editingId ? "Modifier la vente" : "Nouvelle vente"}
          initialValues={initialValues}
          fields={[
            { name: "num", label: "N° Vente" },
            { name: "type", label: "Type", type: "select", required: true, options: ["Produit", "Service"].map((value) => ({ label: value, value })) },
            { name: "montant", label: "Montant TTC (MGA)", type: "number", required: true },
            { name: "totalHT", label: "Total HT (MGA)", type: "number", required: true },
            { name: "tva", label: "TVA (MGA)", type: "number", required: true },
            { name: "date", label: "Date", required: true, placeholder: "JJ/MM/AAAA" },
            { name: "statut", label: "Statut", type: "select", required: true, options: ["Brouillon", "Validé"].map((value) => ({ label: value, value })) },
          ]}
        />
      </div>
    </div>
  )
}