import { useState, useEffect } from "react"
import { Search, Plus, Package, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { initialCatalogueItems as items } from "@/lib/catalogue"
import { RecordFormModal } from "@/components/ui/Modal"
import { catalogueApi } from "@/services/api"

export default function Catalogue() {
  const [catalogueItems, setCatalogueItems] = useState(items)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("Tous")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [initialValues, setInitialValues] = useState<Record<string, string>>({})

  useEffect(() => {
    catalogueApi.getAll()
      .then((data) => {
        if (data && data.length > 0) {
          setCatalogueItems(data as typeof items)
        }
      })
      .catch((err) => console.warn("Backend non joint:", err))
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setInitialValues({ type: "Produit", prix: "", stock: "0" })
    setModalOpen(true)
  }

  const openEdit = (item: (typeof items)[number]) => {
    setEditingId(item.id)
    setInitialValues({
      ref: item.ref,
      designation: item.designation,
      type: item.type,
      prix: item.prix.replace(/\s/g, ""),
      stock: item.stock?.toString() ?? "",
    })
    setModalOpen(true)
  }

  const saveItem = (values: Record<string, string>) => {
    const updated = {
      ref: values.ref,
      designation: values.designation,
      type: values.type,
      prix: values.prix,
      stock: values.type === "Service" ? null : Number(values.stock),
    }

    if (editingId) {
      catalogueApi.update(editingId, updated)
        .then((res) => {
          setCatalogueItems((current) =>
            current.map((item) => (item.id === editingId ? { ...item, ...res } : item))
          )
        })
        .catch(() => {
          setCatalogueItems((current) =>
            current.map((item) => (item.id === editingId ? { ...item, ...updated, id: editingId } : item))
          )
        })
    } else {
      catalogueApi.create(updated)
        .then((res) => {
          setCatalogueItems((current) => [res as (typeof items)[number], ...current])
        })
        .catch(() => {
          setCatalogueItems((current) => [{ ...updated, id: Date.now() }, ...current])
        })
    }
  }

  const filtered = catalogueItems.filter((i) => {
    const matchSearch =
      i.designation.toLowerCase().includes(search.toLowerCase()) ||
      i.ref.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === "Tous" || i.type === filterType
    return matchSearch && matchType
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produits & Services</h1>
          <p className="text-muted-foreground text-sm mt-1">Gérez votre catalogue</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
          <Plus size={18} /> Ajouter
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Rechercher par désignation ou référence..."
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div key={item.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Package size={18} />
              </div>
              <button onClick={() => openEdit(item)} title="Modifier" aria-label={`Modifier ${item.designation}`} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
                <MoreHorizontal size={16} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-1">{item.ref}</p>
            <h3 className="font-semibold mb-2">{item.designation}</h3>
            <div className="flex items-center justify-between">
              <span className="text-primary font-bold">{item.prix} MGA</span>
              <span className="text-xs bg-muted px-2 py-1 rounded">{item.type}</span>
            </div>
            {item.stock !== null && (
              <p className="text-xs text-muted-foreground mt-2">
                Stock : <span className={item.stock < 10 ? "text-red-500 font-medium" : ""}>{item.stock}</span>
              </p>
            )}
          </div>
        ))}
      </div>
      <RecordFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={saveItem}
        title={editingId ? "Modifier le produit ou service" : "Ajouter au catalogue"}
        description="Renseignez les informations de l’offre."
        initialValues={initialValues}
        fields={[
          { name: "ref", label: "Référence", required: true },
          { name: "designation", label: "Désignation", required: true },
          { name: "type", label: "Type", type: "select", required: true, options: [{ label: "Produit", value: "Produit" }, { label: "Service", value: "Service" }] },
          { name: "prix", label: "Prix (MGA)", type: "number", required: true },
          { name: "stock", label: "Stock disponible", type: "number" },
        ]}
      />
    </div>
  )
}