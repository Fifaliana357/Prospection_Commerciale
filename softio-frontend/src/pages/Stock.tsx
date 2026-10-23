import { useState } from "react"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { RecordFormModal } from "@/components/ui/Modal"

const mouvements = [
  { id: 1, ref: "PS-001", designation: "Power Station 300wh", quantite: 10, date: "18/10/2026", type: "Entrée" },
  { id: 2, ref: "SP-001", designation: "Speaker Champignon", quantite: 25, date: "17/10/2026", type: "Entrée" },
  { id: 3, ref: "PS-002", designation: "Power Station 1000wh", quantite: 3, date: "15/10/2026", type: "Sortie" },
  { id: 4, ref: "GT-001", designation: "Gourde Thermos", quantite: 15, date: "14/10/2026", type: "Entrée" },
  { id: 5, ref: "SP-002", designation: "Speaker Standard", quantite: 8, date: "12/10/2026", type: "Sortie" },
]

const inventaire = [
  { ref: "PS-001", designation: "Power Station 300wh", stock: 12, statut: "En stock" },
  { ref: "PS-002", designation: "Power Station 1000wh", stock: 5, statut: "En stock" },
  { ref: "SP-001", designation: "Speaker Champignon", stock: 48, statut: "En stock" },
  { ref: "SP-002", designation: "Speaker Standard", stock: 30, statut: "En stock" },
  { ref: "GT-001", designation: "Gourde Thermos", stock: 3, statut: "Stock faible" },
]

export default function Stock() {
  const [movementItems, setMovementItems] = useState(mouvements)
  const [inventoryItems, setInventoryItems] = useState(inventaire)
  const [tab, setTab] = useState<"mouvements" | "inventaire">("mouvements")
  const [modalOpen, setModalOpen] = useState(false)

  const saveMovement = (values: Record<string, string>) => {
    const quantity = Number(values.quantite)
    const movement = {
      id: Date.now(),
      ref: values.ref,
      designation: values.designation,
      quantite: quantity,
      date: values.date,
      type: values.type,
    }
    setMovementItems((current) => [movement, ...current])
    setInventoryItems((current) => {
      const existing = current.find((item) => item.ref === values.ref)
      if (!existing) {
        return [{
          ref: values.ref,
          designation: values.designation,
          stock: values.type === "Entrée" ? quantity : 0,
          statut: values.type === "Entrée" && quantity >= 5 ? "En stock" : "Stock faible",
        }, ...current]
      }
      return current.map((item) => {
        if (item.ref !== values.ref) return item
        const stock = Math.max(0, item.stock + (values.type === "Entrée" ? quantity : -quantity))
        return { ...item, designation: values.designation, stock, statut: stock < 5 ? "Stock faible" : "En stock" }
      })
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion de stock</h1>
          <p className="text-muted-foreground text-sm mt-1">Approvisionnements et inventaire</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
          <Plus size={18} /> Approvisionner
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab("mouvements")}
          className={cn("px-4 py-2 rounded-md text-sm font-medium transition-colors", tab === "mouvements" ? "bg-background shadow-sm" : "text-muted-foreground")}
        >
          Mouvements
        </button>
        <button
          onClick={() => setTab("inventaire")}
          className={cn("px-4 py-2 rounded-md text-sm font-medium transition-colors", tab === "inventaire" ? "bg-background shadow-sm" : "text-muted-foreground")}
        >
          Inventaire
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {tab === "mouvements" ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Référence</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Désignation</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Quantité</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {movementItems.map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-primary">{m.ref}</td>
                    <td className="px-4 py-3">{m.designation}</td>
                    <td className="px-4 py-3 font-semibold">{m.quantite}</td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", m.type === "Entrée" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300")}>
                        {m.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{m.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Référence</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Désignation</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stock disponible</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
                </tr>
              </thead>
              <tbody>
                {inventoryItems.map((i) => (
                  <tr key={i.ref} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-primary">{i.ref}</td>
                    <td className="px-4 py-3">{i.designation}</td>
                    <td className="px-4 py-3 font-semibold">{i.stock}</td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", i.statut === "En stock" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300")}>
                        {i.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <RecordFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={saveMovement}
          title="Enregistrer un mouvement de stock"
          description="Ajoutez une entrée ou une sortie pour actualiser l’inventaire."
          initialValues={{ type: "Entrée", date: new Date().toLocaleDateString("fr-FR") }}
          fields={[
            { name: "ref", label: "Référence", required: true },
            { name: "designation", label: "Désignation", required: true },
            { name: "quantite", label: "Quantité", type: "number", required: true },
            { name: "type", label: "Type de mouvement", type: "select", required: true, options: ["Entrée", "Sortie"].map((value) => ({ label: value, value })) },
            { name: "date", label: "Date", required: true, placeholder: "JJ/MM/AAAA" },
          ]}
          submitLabel="Enregistrer le mouvement"
        />
      </div>
    </div>
  )
}