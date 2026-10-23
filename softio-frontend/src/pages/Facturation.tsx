import { useState } from "react"
import { Search, Plus, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { RecordFormModal } from "@/components/ui/Modal"

const factures = [
  { id: 1, num: "2026-0010", type: "Facture", montant: "9 200 000", date: "07/07/2026", totalHT: "9 200 000", tva: "0", statut: "Validée" },
  { id: 2, num: "2026-0009", type: "Facture", montant: "1 200 000", date: "01/07/2026", totalHT: "1 200 000", tva: "0", statut: "Validée" },
  { id: 3, num: "2026-0008", type: "Devis", montant: "4 000 000", date: "29/06/2026", totalHT: "4 000 000", tva: "0", statut: "Brouillon" },
  { id: 4, num: "2026-0007", type: "Proforma", montant: "2 500 000", date: "20/06/2026", totalHT: "2 500 000", tva: "0", statut: "Validée" },
  { id: 5, num: "2026-0006", type: "Facture", montant: "850 000", date: "15/06/2026", totalHT: "850 000", tva: "0", statut: "Validée" },
]

const statutStyle: Record<string, string> = {
  Validée: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  Brouillon: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
}

export default function Facturation() {
  const [documentItems, setDocumentItems] = useState(factures)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("Tous")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [initialValues, setInitialValues] = useState<Record<string, string>>({})

  const openCreate = () => {
    setEditingId(null)
    setInitialValues({ type: "Facture", date: new Date().toLocaleDateString("fr-FR"), statut: "Brouillon" })
    setModalOpen(true)
  }

  const openEdit = (document: (typeof factures)[number]) => {
    setEditingId(document.id)
    setInitialValues({ num: document.num, type: document.type, montant: document.montant.replace(/\s/g, ""), date: document.date, statut: document.statut })
    setModalOpen(true)
  }

  const saveDocument = (values: Record<string, string>) => {
    const updated = {
      id: editingId ?? Date.now(),
      num: values.num || `2026-${String(documentItems.length + 1).padStart(4, "0")}`,
      type: values.type,
      montant: values.montant,
      date: values.date,
      totalHT: values.montant,
      tva: "0",
      statut: values.statut,
    }
    setDocumentItems((current) => editingId
      ? current.map((item) => item.id === editingId ? updated : item)
      : [updated, ...current])
  }

  const filtered = documentItems.filter((f) => {
    const matchSearch = f.num.includes(search)
    const matchType = filterType === "Tous" || f.type === filterType
    return matchSearch && matchType
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Facturation</h1>
          <p className="text-muted-foreground text-sm mt-1">Factures, devis et proformas</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
          <Plus size={18} /> Créer un document
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Rechercher par N°..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {["Tous", "Facture", "Devis", "Proforma"].map((t) => (
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
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">N° Document</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Montant</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-primary">{f.num}</td>
                  <td className="px-4 py-3">{f.type}</td>
                  <td className="px-4 py-3 font-semibold">{f.montant} MGA</td>
                  <td className="px-4 py-3 text-muted-foreground">{f.date}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex px-2.5 py-1 rounded-full text-xs font-medium", statutStyle[f.statut])}>
                      {f.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(f)} title="Modifier" aria-label={`Modifier le document ${f.num}`} className="p-2 rounded-lg hover:bg-accent text-muted-foreground">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border text-sm text-muted-foreground">
          {filtered.length} document(s)
        </div>
        <RecordFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={saveDocument}
          title={editingId ? "Modifier le document" : "Créer un document"}
          initialValues={initialValues}
          fields={[
            { name: "num", label: "N° Document" },
            { name: "type", label: "Type", type: "select", required: true, options: ["Facture", "Devis", "Proforma"].map((value) => ({ label: value, value })) },
            { name: "montant", label: "Montant (MGA)", type: "number", required: true },
            { name: "date", label: "Date", required: true, placeholder: "JJ/MM/AAAA" },
            { name: "statut", label: "Statut", type: "select", required: true, options: ["Brouillon", "Validée"].map((value) => ({ label: value, value })) },
          ]}
        />
      </div>
    </div>
  )
}