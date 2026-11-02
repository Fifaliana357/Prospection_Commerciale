import { useEffect, useRef, useState } from "react"
import {
  Archive, CalendarDays, Check, ChevronLeft, ChevronRight, ClipboardList,
  Minus, Pencil, Plus, Search, Trash2, X,
} from "lucide-react"
import Modal from "@/components/ui/Modal"
import { useToast } from "@/contexts/ToastContext"
import {
  createStockMovement,
  deleteStockMovement,
  getStockInventory,
  getStockMovements,
  updateStockMovement,
  type InventoryProduct,
  type StockMovement,
} from "@/services/stock"

type Tab = "approvisionnement" | "inventaire"
type ModalMode = "create" | "edit" | "delete" | "dates" | null

const inputClass = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
const buttonClass = "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"

function formatAmount(value: number) {
  return `${new Intl.NumberFormat("fr-FR").format(value)} Ar`
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object"
    && error !== null
    && "response" in error
    && typeof error.response === "object"
    && error.response !== null
    && "data" in error.response
    && typeof error.response.data === "object"
    && error.response.data !== null
    && "message" in error.response.data
    && typeof error.response.data.message === "string"
  ) {
    return error.response.data.message
  }
  return fallback
}

function Pagination({
  page,
  lastPage,
  onChange,
}: {
  page: number
  lastPage: number
  onChange: (page: number) => void
}) {
  if (lastPage <= 1) return null

  return (
    <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-accent disabled:opacity-40"
        aria-label="Page précédente"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="px-2 text-sm text-muted-foreground">
        Page {page} sur {lastPage}
      </span>
      <button
        type="button"
        disabled={page >= lastPage}
        onClick={() => onChange(page + 1)}
        className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-accent disabled:opacity-40"
        aria-label="Page suivante"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

export default function Stock() {
  const toast = useToast()
  const toastRef = useRef(toast)
  const [tab, setTab] = useState<Tab>("approvisionnement")
  const [mode, setMode] = useState<ModalMode>(null)
  const [products, setProducts] = useState<InventoryProduct[]>([])
  const [inventory, setInventory] = useState<InventoryProduct[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [summary, setSummary] = useState({ total_value: 0, products_count: 0 })
  const [loadingInventory, setLoadingInventory] = useState(true)
  const [loadingMovements, setLoadingMovements] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [inventorySearch, setInventorySearch] = useState("")
  const [movementSearch, setMovementSearch] = useState("")
  const [inventoryPage, setInventoryPage] = useState(1)
  const [movementPage, setMovementPage] = useState(1)
  const [inventoryLastPage, setInventoryLastPage] = useState(1)
  const [movementLastPage, setMovementLastPage] = useState(1)
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null)
  const [productId, setProductId] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [draftDateFrom, setDraftDateFrom] = useState("")
  const [draftDateTo, setDraftDateTo] = useState("")

  useEffect(() => {
    toastRef.current = toast
  }, [toast])

  useEffect(() => {
    let active = true
    getStockInventory({ search: inventorySearch || undefined, page: inventoryPage })
      .then((response) => {
        if (!active) return
        setInventory(response.data)
        setInventoryLastPage(response.last_page)
        setSummary(response.summary)
      })
      .catch((error: unknown) => {
        if (active) toastRef.current.error(getErrorMessage(error, "Erreur de chargement de l’inventaire"))
      })
      .finally(() => {
        if (active) setLoadingInventory(false)
      })

    return () => { active = false }
  }, [inventorySearch, inventoryPage, refreshKey])

  useEffect(() => {
    let active = true
    getStockMovements({
      search: movementSearch || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page: movementPage,
    })
      .then((response) => {
        if (!active) return
        setMovements(response.data)
        setMovementLastPage(response.last_page)
      })
      .catch((error: unknown) => {
        if (active) toastRef.current.error(getErrorMessage(error, "Erreur de chargement des approvisionnements"))
      })
      .finally(() => {
        if (active) setLoadingMovements(false)
      })

    return () => { active = false }
  }, [movementSearch, dateFrom, dateTo, movementPage, refreshKey])

  useEffect(() => {
    let active = true
    const loadProducts = async () => {
      try {
        const firstPage = await getStockInventory({ page: 1, per_page: 100 })
        const allProducts = [...firstPage.data]
        for (let page = 2; page <= firstPage.last_page; page++) {
          const response = await getStockInventory({ page, per_page: 100 })
          allProducts.push(...response.data)
        }
        if (active) setProducts(allProducts)
      } catch (error: unknown) {
        if (active) toastRef.current.error(getErrorMessage(error, "Impossible de charger les produits"))
      }
    }

    void loadProducts()
    return () => { active = false }
  }, [refreshKey])

  const selectedProduct = products.find((product) => String(product.id_produit) === productId)

  const refreshData = () => {
    setLoadingInventory(true)
    setLoadingMovements(true)
    setRefreshKey((key) => key + 1)
  }

  const openCreateModal = () => {
    setProductId("")
    setQuantity(1)
    setDate(new Date().toISOString().slice(0, 10))
    setMode("create")
  }

  const saveSupply = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!productId) {
      toast.error("Sélectionnez un produit")
      return
    }

    try {
      setSaving(true)
      await createStockMovement({
        id_produit: Number(productId),
        type_mouvement: "entree",
        quantite: quantity,
        date_mouvement: date,
      })
      toast.success("Approvisionnement enregistré")
      setMode(null)
      refreshData()
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Erreur lors de l’approvisionnement"))
    } finally {
      setSaving(false)
    }
  }

  const saveLot = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedMovement) return

    try {
      setSaving(true)
      await updateStockMovement(selectedMovement.id_mouvement, { quantite: quantity })
      toast.success("Quantité du lot mise à jour")
      setMode(null)
      setSelectedMovement(null)
      refreshData()
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Erreur lors de la modification du lot"))
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!selectedMovement) return
    try {
      setSaving(true)
      await deleteStockMovement(selectedMovement.id_mouvement)
      toast.success("Lot supprimé")
      setMode(null)
      setSelectedMovement(null)
      refreshData()
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Erreur lors de la suppression du lot"))
    } finally {
      setSaving(false)
    }
  }

  const openDateModal = () => {
    setDraftDateFrom(dateFrom)
    setDraftDateTo(dateTo)
    setMode("dates")
  }

  const applyDateFilter = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (draftDateFrom && draftDateTo && draftDateFrom > draftDateTo) {
      toast.error("La date de début doit précéder la date de fin")
      return
    }
    setDateFrom(draftDateFrom)
    setDateTo(draftDateTo)
    setMovementPage(1)
    setLoadingMovements(true)
    setMode(null)
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <header className="rounded-2xl border border-primary/10 bg-gradient-to-r from-primary/10 via-card to-primary/5 p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Archive size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {tab === "approvisionnement" ? "Approvisionnement" : "Inventaire"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {tab === "approvisionnement"
                ? "Gérez les entrées de stock et le suivi de chaque lot."
                : "Vue d’ensemble des quantités et de la valeur du stock disponible."}
            </p>
          </div>
        </div>
      </header>

      <nav className="flex w-fit items-center gap-1 border-b border-border" aria-label="Gestion du stock">
        <button
          type="button"
          onClick={() => setTab("approvisionnement")}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            tab === "approvisionnement" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Archive size={16} /> Approvisionnement
        </button>
        <button
          type="button"
          onClick={() => setTab("inventaire")}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            tab === "inventaire" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ClipboardList size={16} /> Inventaire
        </button>
      </nav>

      {tab === "approvisionnement" ? (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={movementSearch}
                onChange={(event) => {
                  setMovementSearch(event.target.value)
                  setMovementPage(1)
                  setLoadingMovements(true)
                }}
                placeholder="Rechercher par référence ou désignation..."
                className={`${inputClass} pl-10`}
                aria-label="Rechercher dans les approvisionnements"
              />
            </label>
            <button type="button" onClick={openDateModal} className={`${buttonClass} border border-border bg-card hover:bg-accent`}>
              <CalendarDays size={16} /> Dates
              {(dateFrom || dateTo) && <span className="h-2 w-2 rounded-full bg-primary" />}
            </button>
            <button type="button" onClick={openCreateModal} className={`${buttonClass} bg-primary text-primary-foreground hover:opacity-90`}>
              <Plus size={17} /> Approvisionner
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-primary text-primary-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Référence</th>
                    <th className="px-4 py-3 text-left font-semibold">Désignation</th>
                    <th className="px-4 py-3 text-center font-semibold">Quantité reçue</th>
                    <th className="px-4 py-3 text-left font-semibold">Date</th>
                    <th className="px-4 py-3 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loadingMovements ? (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">Chargement...</td></tr>
                  ) : movements.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">Aucun approvisionnement trouvé</td></tr>
                  ) : movements.map((movement) => (
                    <tr key={movement.id_mouvement} className="hover:bg-accent/30">
                      <td className="px-4 py-3 font-semibold">{movement.produit?.reference || "—"}</td>
                      <td className="px-4 py-3">{movement.produit?.designation || "Produit supprimé"}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                          +{movement.quantite}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(movement.date_mouvement)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMovement(movement)
                              setQuantity(movement.quantite)
                              setMode("edit")
                            }}
                            className="rounded-full bg-primary p-2 text-primary-foreground hover:opacity-80"
                            aria-label={`Modifier le lot ${movement.produit?.reference ?? ""}`}
                            title="Modifier la quantité du lot"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMovement(movement)
                              setMode("delete")
                            }}
                            disabled={movement.quantite_sortie > 0}
                            className="rounded-full bg-destructive p-2 text-destructive-foreground hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-30"
                            aria-label={`Supprimer le lot ${movement.produit?.reference ?? ""}`}
                            title={movement.quantite_sortie > 0 ? "Le lot contient déjà des sorties" : "Supprimer le lot"}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={movementPage} lastPage={movementLastPage} onChange={(page) => {
              setLoadingMovements(true)
              setMovementPage(page)
            }} />
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex justify-end">
            <div className="min-w-52 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
              <p className="text-xs text-muted-foreground">Valeur totale du stock</p>
              <p className="text-lg font-bold text-primary">{formatAmount(summary.total_value)}</p>
              <p className="text-xs text-muted-foreground">{summary.products_count} produit(s)</p>
            </div>
          </div>

          <label className="relative block">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={inventorySearch}
              onChange={(event) => {
                setInventorySearch(event.target.value)
                setInventoryPage(1)
                setLoadingInventory(true)
              }}
              placeholder="Référence ou désignation..."
              className={`${inputClass} pl-10`}
              aria-label="Rechercher dans l’inventaire"
            />
          </label>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-sm">
                <thead className="bg-primary text-primary-foreground">
                  <tr>
                    <th className="px-3 py-3 text-left font-semibold">Référence</th>
                    <th className="px-3 py-3 text-left font-semibold">Désignation</th>
                    <th className="px-3 py-3 text-right font-semibold">Prix de vente</th>
                    <th className="px-3 py-3 text-center font-semibold">Approvisionné</th>
                    <th className="px-3 py-3 text-center font-semibold">Vendu</th>
                    <th className="px-3 py-3 text-center font-semibold">Stock disponible</th>
                    <th className="px-3 py-3 text-right font-semibold">Valeur du stock</th>
                    <th className="px-3 py-3 text-center font-semibold">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loadingInventory ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">Chargement...</td></tr>
                  ) : inventory.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">Aucun produit trouvé</td></tr>
                  ) : inventory.map((product) => (
                    <tr key={product.id_produit} className="hover:bg-accent/30">
                      <td className="px-3 py-3 font-semibold">{product.reference || "—"}</td>
                      <td className="px-3 py-3">{product.designation}</td>
                      <td className="px-3 py-3 text-right">{formatAmount(product.prix_unitaire)}</td>
                      <td className="px-3 py-3 text-center">{product.quantite_approvisionnee}</td>
                      <td className="px-3 py-3 text-center font-medium text-amber-600">{product.quantite_vendue}</td>
                      <td className="px-3 py-3 text-center font-bold">{product.stock_disponible}</td>
                      <td className="px-3 py-3 text-right">{formatAmount(product.valeur_stock)}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          product.statut === "en_stock"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : product.statut === "faible"
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                              : "bg-destructive/10 text-destructive"
                        }`}>
                          {product.statut === "en_stock" ? "En stock" : product.statut === "faible" ? "Stock faible" : "Rupture"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={inventoryPage} lastPage={inventoryLastPage} onChange={(page) => {
              setLoadingInventory(true)
              setInventoryPage(page)
            }} />
          </div>
        </section>
      )}

      <Modal open={mode === "create"} onClose={() => setMode(null)} title="Nouvel approvisionnement" size="md">
        <form onSubmit={saveSupply} className="space-y-5">
          <label className="block space-y-1.5 text-sm font-medium">
            <span>Référence / produit</span>
            <select required value={productId} onChange={(event) => setProductId(event.target.value)} className={inputClass}>
              <option value="" disabled>Sélectionner un produit</option>
              {products.map((product) => (
                <option key={product.id_produit} value={product.id_produit}>
                  {product.reference || "Sans référence"} — {product.designation}
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-lg bg-muted/50 px-3 py-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Désignation : </span>
            {selectedProduct?.designation || "Sélectionnez d’abord une référence"}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm font-medium">
              <span>Quantité ajoutée</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="rounded-lg border border-border p-2.5 hover:bg-accent" aria-label="Diminuer">
                  <Minus size={14} />
                </button>
                <input type="number" min={1} required value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))} className={`${inputClass} text-center`} />
                <button type="button" onClick={() => setQuantity((value) => value + 1)} className="rounded-lg border border-border p-2.5 hover:bg-accent" aria-label="Augmenter">
                  <Plus size={14} />
                </button>
              </div>
            </label>
            <label className="block space-y-1.5 text-sm font-medium">
              <span>Date d’approvisionnement</span>
              <input type="date" required value={date} onChange={(event) => setDate(event.target.value)} className={inputClass} />
            </label>
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" onClick={() => setMode(null)} className={`${buttonClass} border border-border hover:bg-accent`}>Annuler</button>
            <button type="submit" disabled={saving || products.length === 0} className={`${buttonClass} bg-primary text-primary-foreground hover:opacity-90`}>
              <Check size={16} /> {saving ? "Enregistrement..." : "Valider"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={mode === "edit"} onClose={() => setMode(null)} title="Modifier la quantité du lot" size="md">
        {selectedMovement && (
          <form onSubmit={saveLot} className="space-y-5">
            <div className="rounded-xl bg-primary/10 p-4">
              <p className="text-xs text-muted-foreground">Lot du {formatDate(selectedMovement.date_mouvement)}</p>
              <p className="font-semibold">{selectedMovement.produit?.reference} — {selectedMovement.produit?.designation}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Reçu</p><p className="text-lg font-bold">{selectedMovement.quantite}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Vendu</p><p className="text-lg font-bold text-amber-600">{selectedMovement.quantite_vendue}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">En stock</p><p className="text-lg font-bold text-emerald-600">{selectedMovement.quantite_restante}</p>
              </div>
            </div>
            <label className="block space-y-1.5 text-sm font-medium">
              <span>Nouvelle quantité</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setQuantity((value) => Math.max(selectedMovement.quantite_sortie, value - 1))} className="rounded-lg border border-border p-2.5 hover:bg-accent" aria-label="Diminuer">
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  min={selectedMovement.quantite_sortie}
                  required
                  value={quantity}
                  onChange={(event) => setQuantity(Math.max(selectedMovement.quantite_sortie, Number(event.target.value)))}
                  className={`${inputClass} text-center`}
                />
                <button type="button" onClick={() => setQuantity((value) => value + 1)} className="rounded-lg border border-border p-2.5 hover:bg-accent" aria-label="Augmenter">
                  <Plus size={14} />
                </button>
              </div>
              <span className="block text-xs font-normal text-muted-foreground">
                Minimum : {selectedMovement.quantite_sortie} unité(s) déjà sorties du lot.
              </span>
            </label>
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm">
              Stock restant du lot après modification
              <strong className="float-right">{quantity - selectedMovement.quantite_sortie}</strong>
            </div>
            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <button type="button" onClick={() => setMode(null)} className={`${buttonClass} border border-border hover:bg-accent`}>Annuler</button>
              <button type="submit" disabled={saving} className={`${buttonClass} bg-primary text-primary-foreground hover:opacity-90`}>
                <Check size={16} /> {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={mode === "delete"} onClose={() => setMode(null)} title="Supprimer ce lot" size="sm">
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Confirmer la suppression du lot <strong className="text-foreground">{selectedMovement?.produit?.reference}</strong> ?
            Cette action est définitive.
          </p>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" onClick={() => setMode(null)} className={`${buttonClass} border border-border hover:bg-accent`}>Annuler</button>
            <button type="button" onClick={() => void confirmDelete()} disabled={saving} className={`${buttonClass} bg-destructive text-destructive-foreground hover:opacity-90`}>
              <Trash2 size={15} /> {saving ? "Suppression..." : "Supprimer"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={mode === "dates"} onClose={() => setMode(null)} title="Filtrer par dates" size="sm">
        <form onSubmit={applyDateFilter} className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm font-medium">
              <span>Du</span>
              <input type="date" value={draftDateFrom} onChange={(event) => setDraftDateFrom(event.target.value)} className={inputClass} />
            </label>
            <label className="block space-y-1.5 text-sm font-medium">
              <span>Au</span>
              <input type="date" value={draftDateTo} onChange={(event) => setDraftDateTo(event.target.value)} className={inputClass} />
            </label>
          </div>
          <div className="flex justify-between gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => {
                setDraftDateFrom("")
                setDraftDateTo("")
                setDateFrom("")
                setDateTo("")
                setMovementPage(1)
                setLoadingMovements(true)
                setMode(null)
              }}
              className={`${buttonClass} text-muted-foreground hover:bg-accent`}
            >
              <X size={15} /> Effacer
            </button>
            <button type="submit" className={`${buttonClass} bg-primary text-primary-foreground hover:opacity-90`}>
              <Check size={15} /> Valider
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
