import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  BriefcaseBusiness, CalendarDays, Check,
  ClipboardList, Eye, FileText, Minus, Package, Plus, Search, ShoppingCart,
  Trash2, X,
} from "lucide-react"
import Modal from "@/components/ui/Modal"
import DatePicker from "@/components/ui/DatePicker"
import Select from "@/components/ui/Select"
import TablePagination from "@/components/ui/TablePagination"
import TableSummary from "@/components/ui/TableSummary"
import PageHeader from "@/components/ui/PageHeader"
import { useToast } from "@/contexts/ToastContext"
import { formatMGA } from "@/lib/utils"
import type { Client } from "@/services/clients"
import type { Offre, Produit } from "@/services/catalogue"
import {
  createInvoiceFromSale,
  createSale,
  deleteSale,
  getSale,
  getSales,
  getSalesCatalog,
  updateSale,
  validateSale,
  type PaginatedSales,
  type Sale,
  type SaleLine,
  type SaleLineType,
  type SalePayload,
} from "@/services/ventes"

type View = "enregistrement" | "liste" | "brouillon"
type ModalMode = "editor" | "detail" | "delete" | "dates" | null
type CatalogProduct = Produit & { stock_disponible: number }
type BasketLine = {
  key: string
  id_produit: number | null
  id_offre: number | null
  type_ligne: SaleLineType
  designation: string
  reference: string
  quantite: number
  prix_unitaire: number
  remise: number
  montant: number
}

const inputClass = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
const buttonClass = "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function formatAmount(value: number) {
  return formatMGA(value)
}

function formatDate(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value)
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("fr-FR")
}

function clientLabel(client?: { nom?: string | null; prenom?: string | null; entreprise?: string | null } | null) {
  if (!client) return "—"
  return client.entreprise || [client.prenom, client.nom].filter(Boolean).join(" ") || "—"
}

function saleType(sale: Pick<Sale, "type_document" | "lignes">) {
  const types = new Set((sale.lignes ?? []).map((line) => line.type_ligne))
  if (types.size > 1 || sale.type_document === "mixte") return "Mixte"
  if (types.has("service") || sale.type_document === "service") return "Service"
  return "Produit"
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

function toBasketLine(line: SaleLine, index: number): BasketLine {
  return {
    key: String(line.id_ligne_vente ?? index),
    id_produit: line.id_produit,
    id_offre: line.id_offre,
    type_ligne: line.type_ligne,
    designation: line.designation,
    reference: line.produit?.reference || line.offre?.denomination || "",
    quantite: Number(line.quantite),
    prix_unitaire: Number(line.prix_unitaire),
    remise: Number(line.remise),
    montant: Number(line.montant),
  }
}

function SaleEditor({
  clients,
  products,
  services,
  initialSale,
  saving,
  onClose,
  onSubmit,
}: {
  clients: Client[]
  products: CatalogProduct[]
  services: Offre[]
  initialSale: Sale | null
  saving: boolean
  onClose: () => void
  onSubmit: (payload: SalePayload, validate: boolean) => void
}) {
  const [clientId, setClientId] = useState(initialSale ? String(initialSale.id_client) : "")
  const [date, setDate] = useState(initialSale?.date_vente?.slice(0, 10) || today())
  const [title, setTitle] = useState(initialSale?.intitule ?? "")
  const [note, setNote] = useState(initialSale?.remarque ?? "")
  const [includeTax, setIncludeTax] = useState(Boolean(initialSale?.inclure_tva))
  const [taxRate, setTaxRate] = useState(String(initialSale?.taux_tva ?? 20))
  const [paymentMethod, setPaymentMethod] = useState(initialSale?.methode_paiement ?? "")
  const [paymentTerms, setPaymentTerms] = useState(initialSale?.modalites ?? "")
  const [lineType, setLineType] = useState<SaleLineType>("produit")
  const [itemSearch, setItemSearch] = useState("")
  const [selectedItemId, setSelectedItemId] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [discount, setDiscount] = useState("0")
  const [basket, setBasket] = useState<BasketLine[]>(() => (initialSale?.lignes ?? []).map(toBasketLine))

  const product = products.find((item) => String(item.id_produit) === selectedItemId)
  const service = services.find((item) => String(item.id_offre) === selectedItemId)
  const selectedProduct = lineType === "produit" ? product : undefined
  const selectedService = lineType === "service" ? service : undefined
  const selectedName = selectedProduct?.designation || selectedService?.denomination || ""
  const selectedReference = selectedProduct?.reference || selectedService?.denomination || ""
  const unitPrice = Number(selectedProduct?.prix_unitaire ?? selectedService?.tarif ?? 0)
  const lineDiscount = Math.max(0, Number(discount) || 0)
  const lineGross = unitPrice * quantity
  const lineAmount = Math.max(0, lineGross - lineDiscount)
  const subtotal = basket.reduce((sum, line) => sum + line.montant, 0)
  const taxAmount = includeTax ? Math.round(subtotal * (Number(taxRate) || 0) / 100) : 0
  const total = subtotal + taxAmount

  const selectItem = (value: string) => {
    setItemSearch(value)
    if (lineType === "produit") {
      const matched = products.find((item) => item.reference === value
        || item.designation === value
        || `${item.reference ? `${item.reference} — ` : ""}${item.designation}` === value)
      setSelectedItemId(matched ? String(matched.id_produit) : "")
    } else {
      const matched = services.find((item) => item.denomination === value)
      setSelectedItemId(matched ? String(matched.id_offre) : "")
    }
  }

  const changeLineType = (value: SaleLineType) => {
    setLineType(value)
    setSelectedItemId("")
    setItemSearch("")
    setQuantity(1)
    setDiscount("0")
  }

  const addLine = () => {
    if (!selectedItemId || !selectedName) return
    const availableStock = selectedProduct?.stock_disponible ?? Number.POSITIVE_INFINITY
    if (lineType === "produit" && quantity > availableStock) return
    if (lineDiscount > lineGross) return
    const line: BasketLine = {
      key: `${Date.now()}-${Math.random()}`,
      id_produit: lineType === "produit" ? Number(selectedItemId) : null,
      id_offre: lineType === "service" ? Number(selectedItemId) : null,
      type_ligne: lineType,
      designation: selectedName,
      reference: selectedReference,
      quantite: quantity,
      prix_unitaire: unitPrice,
      remise: lineDiscount,
      montant: lineAmount,
    }
    setBasket((current) => [...current, line])
    setSelectedItemId("")
    setItemSearch("")
    setQuantity(1)
    setDiscount("0")
  }

  const removeLine = (key: string) => setBasket((current) => current.filter((line) => line.key !== key))

  const submit = (validate: boolean) => {
    if (!clientId) return
    const payload: SalePayload = {
      id_client: Number(clientId),
      date_vente: date,
      intitule: title.trim() || undefined,
      remarque: note.trim() || undefined,
      inclure_tva: includeTax,
      taux_tva: Number(taxRate) || 0,
      methode_paiement: paymentMethod || undefined,
      modalites: paymentTerms.trim() || undefined,
      statut: validate ? "validee" : "brouillon",
      lignes: basket.map((line) => ({
        id_produit: line.id_produit,
        id_offre: line.id_offre,
        type_ligne: line.type_ligne,
        quantite: line.quantite,
        remise: line.remise,
      })),
    }
    onSubmit(payload, validate)
  }

  const itemOptions = lineType === "produit"
    ? products.map((item) => ({ id: item.id_produit, label: [item.reference, item.designation].filter(Boolean).join(" — ") }))
    : services.map((item) => ({ id: item.id_offre, label: item.denomination }))

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium">
          <span>Client / prospect</span>
          <Select
            required
            value={clientId}
            onChange={setClientId}
            placeholder="Sélectionner un client"
            options={clients.map((client) => ({ value: String(client.id_client), label: clientLabel(client) }))}
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          <span>Date de vente</span>
          <DatePicker required value={date} onChange={setDate} ariaLabel="Date de vente" />
        </label>
        <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
          <span>Intitulé (facultatif)</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} placeholder="Objet de la vente" />
        </label>
      </div>

      <section className="rounded-xl border border-border bg-background">
        <div className="grid gap-4 border-b border-border p-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-medium">
            <span>Type</span>
            <Select value={lineType} onChange={(value) => changeLineType(value as SaleLineType)} options={[
              { value: "produit", label: "Produit" },
              { value: "service", label: "Service" },
            ]} />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            <span>{lineType === "produit" ? "Référence / produit" : "Service"}</span>
            <input
              list="sale-item-options"
              value={itemSearch}
              onChange={(event) => selectItem(event.target.value)}
              className={inputClass}
              placeholder={lineType === "produit" ? "Rechercher une référence produit..." : "Rechercher un service..."}
            />
            <datalist id="sale-item-options">
              {itemOptions.map((option) => <option key={option.id} value={option.label} />)}
              {(lineType === "produit" ? products : []).map((item) => <option key={`name-${item.id_produit}`} value={item.designation} />)}
              {(lineType === "service" ? services : []).map((item) => <option key={`service-${item.id_offre}`} value={item.denomination} />)}
            </datalist>
          </label>

          <label className="space-y-1.5 text-sm font-medium">
            <span>Désignation</span>
            <input readOnly value={selectedName} className={`${inputClass} bg-muted/40`} />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            <span>{lineType === "produit" ? "Stock disponible" : "Type de ligne"}</span>
            <input readOnly value={lineType === "produit" ? String(selectedProduct?.stock_disponible ?? "") : (selectedService ? "Service" : "")} className={`${inputClass} bg-muted/40`} />
          </label>

          <label className="space-y-1.5 text-sm font-medium">
            <span>Prix unitaire (MGA)</span>
            <input readOnly value={selectedItemId ? formatAmount(unitPrice) : ""} className={`${inputClass} bg-muted/40`} />
          </label>
          <div className="space-y-1.5 text-sm font-medium">
            <span className="block">Quantité</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="rounded-lg border border-border p-2.5 hover:bg-accent" aria-label="Diminuer la quantité"><Minus size={16} /></button>
              <input type="number" min={1} max={lineType === "produit" ? (selectedProduct?.stock_disponible ?? undefined) : undefined} value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))} className={`${inputClass} text-center`} />
              <button type="button" onClick={() => setQuantity((value) => value + 1)} className="rounded-lg border border-border p-2.5 hover:bg-accent" aria-label="Augmenter la quantité"><Plus size={16} /></button>
            </div>
          </div>

          <label className="space-y-1.5 text-sm font-medium">
            <span>Remise (MGA)</span>
            <input type="number" min={0} max={lineGross} value={discount} onChange={(event) => setDiscount(event.target.value)} className={inputClass} />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            <span>Montant</span>
            <input readOnly value={formatAmount(lineAmount)} className={`${inputClass} border-amber-300 bg-amber-50/70 font-semibold text-amber-900`} />
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="rounded-lg border border-border px-3 py-2 text-sm">Total du panier <strong className="ml-1 text-primary">{formatAmount(total)}</strong></p>
          <button
            type="button"
            onClick={addLine}
            disabled={!selectedItemId || !selectedName || (lineType === "produit" && quantity > (selectedProduct?.stock_disponible ?? 0)) || lineDiscount > lineGross}
            className={`${buttonClass} bg-primary text-primary-foreground hover:opacity-90`}
          >
            <Plus size={16} /> Ajouter
          </button>
        </div>
      </section>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full min-w-0 table-fixed text-xs sm:text-sm">
          <thead className="bg-primary text-primary-foreground">
            <tr>
              <th className="break-words px-1.5 py-2 text-left sm:px-2">Référence / type</th>
              <th className="break-words px-1.5 py-2 text-left sm:px-2">Désignation</th>
              <th className="break-words px-1.5 py-2 text-right sm:px-2">Prix</th>
              <th className="break-words px-1.5 py-2 text-center sm:px-2">Quantité</th>
              <th className="break-words px-1.5 py-2 text-right sm:px-2">Remise</th>
              <th className="break-words px-1.5 py-2 text-right sm:px-2">Montant</th>
              <th className="break-words px-1.5 py-2 text-center sm:px-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {basket.length ? basket.map((line) => (
              <tr key={line.key} className="border-b border-border last:border-0">
                <td className="break-words px-1.5 py-2 sm:px-2">{line.reference || (line.type_ligne === "produit" ? "Produit" : "Service")}</td>
                <td className="break-words px-1.5 py-2 font-medium sm:px-2">{line.designation}</td>
                <td className="break-words px-1.5 py-2 text-right sm:px-2">{formatAmount(line.prix_unitaire)}</td>
                <td className="px-1.5 py-2 text-center sm:px-2">{line.quantite}</td>
                <td className="break-words px-1.5 py-2 text-right sm:px-2">{formatAmount(line.remise)}</td>
                <td className="break-words px-1.5 py-2 text-right font-semibold sm:px-2">{formatAmount(line.montant)}</td>
                <td className="px-1.5 py-2 text-center sm:px-2">
                  <button type="button" onClick={() => removeLine(line.key)} title="Retirer la ligne" aria-label={`Retirer ${line.designation}`} className="rounded-full p-2 text-destructive hover:bg-destructive/10"><Trash2 size={15} /></button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Le panier est vide.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 rounded-xl bg-muted/30 p-4 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={includeTax} onChange={(event) => setIncludeTax(event.target.checked)} />
          Inclure la TVA
        </label>
        {includeTax && (
          <label className="flex items-center gap-2 text-sm font-medium">
            Taux TVA
            <input type="number" min={0} max={100} value={taxRate} onChange={(event) => setTaxRate(event.target.value)} className={`${inputClass} max-w-24`} />
            %
          </label>
        )}
        <label className="space-y-1.5 text-sm font-medium">
          <span>Méthode de paiement (facultatif)</span>
          <Select value={paymentMethod} onChange={setPaymentMethod} options={[
            { value: "", label: "Non renseignée" },
            { value: "Espèces", label: "Espèces" },
            { value: "Virement", label: "Virement" },
            { value: "Mobile money", label: "Mobile money" },
            { value: "Chèque", label: "Chèque" },
          ]} />
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          <span>Modalités de paiement</span>
          <input value={paymentTerms} onChange={(event) => setPaymentTerms(event.target.value)} className={inputClass} />
        </label>
        <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
          <span>Remarque</span>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} className={`${inputClass} min-h-20 resize-y`} />
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div className="text-sm text-muted-foreground">
          Total HT <strong className="ml-1 text-foreground">{formatAmount(subtotal)}</strong>
          {includeTax && <span className="ml-3">TVA <strong className="text-foreground">{formatAmount(taxAmount)}</strong></span>}
          <span className="ml-3">Total TTC <strong className="text-primary">{formatAmount(total)}</strong></span>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onClose} className={`${buttonClass} border border-border hover:bg-accent`}>Annuler</button>
          <button type="button" onClick={() => submit(false)} disabled={saving || !clientId || !basket.length} className={`${buttonClass} border border-primary text-primary hover:bg-primary/5`}>
            <FileText size={15} /> Enregistrer brouillon
          </button>
          <button type="button" onClick={() => submit(true)} disabled={saving || !clientId || !basket.length} className={`${buttonClass} bg-primary text-primary-foreground hover:opacity-90`}>
            <Check size={15} /> {saving ? "Validation..." : "Valider"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Ventes() {
  const navigate = useNavigate()
  const toast = useToast()
  const toastRef = useRef(toast)
  const [view, setView] = useState<View>("enregistrement")
  const [mode, setMode] = useState<ModalMode>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [services, setServices] = useState<Offre[]>([])
  const [sales, setSales] = useState<PaginatedSales["data"]>([])
  const [totalSales, setTotalSales] = useState(0)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [saving, setSaving] = useState(false)
  const [invoiceLoadingId, setInvoiceLoadingId] = useState<number | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("tous")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [draftDateFrom, setDraftDateFrom] = useState("")
  const [draftDateTo, setDraftDateTo] = useState("")
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [editorInitial, setEditorInitial] = useState<Sale | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)

  useEffect(() => {
    toastRef.current = toast
  }, [toast])

  useEffect(() => {
    let active = true
    getSalesCatalog()
      .then((catalog) => {
        if (!active) return
        setClients(catalog.clients)
        setProducts(catalog.produits)
        setServices(catalog.services)
      })
      .catch((error: unknown) => {
        if (active) toastRef.current.error(getErrorMessage(error, "Impossible de charger le catalogue de ventes"))
      })
      .finally(() => {
        if (active) setLoadingCatalog(false)
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (view === "enregistrement") return
    let active = true
    getSales({
      view: view === "brouillon" ? "brouillons" : "liste",
      search: search || undefined,
      type: filterType,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page,
    })
      .then((response) => {
        if (!active) return
        setSales(response.data)
        setTotalSales(response.total)
        setLastPage(response.last_page)
      })
      .catch((error: unknown) => {
        if (active) toastRef.current.error(getErrorMessage(error, "Erreur de chargement des ventes"))
      })
      .finally(() => {
        if (active) setLoadingList(false)
      })
    return () => { active = false }
  }, [view, search, filterType, dateFrom, dateTo, page, refreshKey])

  const refreshSales = () => {
    setLoadingList(true)
    setPage(1)
    setRefreshKey((key) => key + 1)
  }

  const openNewSale = () => {
    setEditingId(null)
    setEditorInitial(null)
    setMode("editor")
  }

  const openEdit = async (sale: Sale) => {
    try {
      setSaving(true)
      const fullSale = await getSale(sale.id_vente)
      setSelectedSale(fullSale)
      setEditorInitial(fullSale)
      setEditingId(fullSale.id_vente)
      setMode("editor")
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Impossible de charger le brouillon"))
    } finally {
      setSaving(false)
    }
  }

  const closeModal = () => setMode(null)

  const saveSale = async (payload: SalePayload, validate: boolean) => {
    try {
      setSaving(true)
      const data = { ...payload, statut: validate ? "validee" as const : "brouillon" as const }
      if (editingId) {
        await updateSale(editingId, data)
      } else {
        await createSale(data)
      }
      toast.success(validate ? "Vente validée et stock mis à jour" : "Brouillon de vente enregistré")
      setMode(null)
      setView(validate ? "liste" : "brouillon")
      setPage(1)
      refreshSales()
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Erreur lors de l’enregistrement de la vente"))
    } finally {
      setSaving(false)
    }
  }

  const showDetails = async (sale: Sale) => {
    setSelectedSale(sale)
    setMode("detail")
    setLoadingDetail(true)
    try {
      setSelectedSale(await getSale(sale.id_vente))
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Impossible de charger le détail de la vente"))
      setMode(null)
    } finally {
      setLoadingDetail(false)
    }
  }

  const removeSale = async () => {
    if (!selectedSale) return
    try {
      setSaving(true)
      await deleteSale(selectedSale.id_vente)
      toast.success("Brouillon supprimé")
      setMode(null)
      refreshSales()
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Impossible de supprimer le brouillon"))
    } finally {
      setSaving(false)
    }
  }

  const validateDraft = async (sale: Sale) => {
    try {
      setSaving(true)
      await validateSale(sale.id_vente)
      toast.success("Vente validée et stock mis à jour")
      setMode(null)
      setView("liste")
      refreshSales()
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Impossible de valider la vente"))
    } finally {
      setSaving(false)
    }
  }

  const openInvoice = async (sale: Sale) => {
    try {
      setInvoiceLoadingId(sale.id_vente)
      const invoice = await createInvoiceFromSale(sale.id_vente)
      toast.success(`Facture ${invoice.numero} prête`)
      navigate(`/facturation/${invoice.id_devis}/apercu`)
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Impossible de créer la facture"))
    } finally {
      setInvoiceLoadingId(null)
    }
  }

  const openDates = () => {
    setDraftDateFrom(dateFrom)
    setDraftDateTo(dateTo)
    setMode("dates")
  }

  const applyDates = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (draftDateFrom && draftDateTo && draftDateFrom > draftDateTo) {
      toast.error("La date de début doit précéder la date de fin")
      return
    }
    setDateFrom(draftDateFrom)
    setDateTo(draftDateTo)
    setLoadingList(true)
    setPage(1)
    setMode(null)
  }

  const openDelete = (sale: Sale) => {
    setSelectedSale(sale)
    setMode("delete")
  }

  const tabs: Array<{ key: View; label: string }> = [
    { key: "enregistrement", label: "Enregistrement" },
    { key: "liste", label: "Liste" },
    { key: "brouillon", label: "Brouillon" },
  ]

  const filters = [
    { key: "tous", label: "Tous", icon: ClipboardList },
    { key: "produit", label: "Produit", icon: Package },
    { key: "service", label: "Service", icon: BriefcaseBusiness },
  ]

  const pageTitle = view === "enregistrement" ? "Nouvelle vente" : view === "brouillon" ? "Brouillons" : "Liste des ventes"
  const pageSubtitle = view === "enregistrement"
    ? "Enregistrez une vente de produit ou de service"
    : view === "brouillon"
      ? "Ventes non validées : ouvrez-les pour les terminer ou supprimez-les"
      : "Consultez et filtrez vos ventes"

  const visibleTotal = useMemo(() => new Intl.NumberFormat("fr-FR").format(totalSales), [totalSales])

  return (
    <div className="space-y-4">
      <PageHeader
        title={pageTitle}
        description={pageSubtitle}
        icon={view === "enregistrement" ? <ShoppingCart size={23} /> : <ClipboardList size={23} />}
        action={view !== "enregistrement" ? (
          <button type="button" onClick={openNewSale} disabled={loadingCatalog} className={`${buttonClass} bg-primary text-primary-foreground hover:opacity-90`}>
            <Plus size={17} /> Nouvelle vente
          </button>
        ) : undefined}
      />

      <nav className="page-tabs" role="tablist" aria-label="Navigation des ventes">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={view === tab.key}
            onClick={() => { setView(tab.key); setPage(1); if (tab.key !== "enregistrement") setLoadingList(true) }}
            className="page-tab"
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {view === "enregistrement" ? (
        <section className="rounded-xl border border-border bg-card p-6 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShoppingCart size={25} />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Enregistrer une vente</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            Choisissez un client, ajoutez des produits ou services au panier, puis enregistrez un brouillon ou validez la vente.
            Le stock des produits est vérifié et déduit à la validation.
          </p>
          <button type="button" onClick={openNewSale} disabled={loadingCatalog} className={`${buttonClass} mt-5 bg-primary text-primary-foreground hover:opacity-90`}>
            <Plus size={17} /> {loadingCatalog ? "Chargement du catalogue..." : "Créer une vente"}
          </button>
          {loadingCatalog && <p className="mt-3 text-xs text-muted-foreground">Chargement des clients, produits et services...</p>}
        </section>
      ) : (
        <>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="search"
                placeholder="Rechercher par N° de vente ou nom de prospect..."
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); setLoadingList(true) }}
                className={`${inputClass} pl-9 pr-10`}
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-primary" size={16} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {filters.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setFilterType(key); setPage(1); setLoadingList(true) }}
                  className={`${buttonClass} rounded-full border border-border px-3.5 py-2 text-xs ${filterType === key ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-accent"}`}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
              <button type="button" onClick={openDates} className={`${buttonClass} rounded-full border border-border bg-card px-3.5 py-2 text-xs text-muted-foreground hover:bg-accent`}>
                <CalendarDays size={14} /> Dates{dateFrom || dateTo ? " •" : ""}
              </button>
              {(dateFrom || dateTo) && (
                <button type="button" onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); setLoadingList(true) }} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <X size={13} /> Effacer dates
                </button>
              )}
              <TableSummary total={totalSales} label="ventes" />
            </div>
          </div>

          <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-primary text-primary-foreground">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase">Type</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase">N° Vente</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase">Nom et prénom</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase">Montant</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase">Date</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase">Remarque</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase">Enregistré par</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingList ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">Chargement des ventes...</td></tr>
                  ) : sales.length ? sales.map((sale) => (
                    <tr key={sale.id_vente} className="border-b border-border last:border-0 odd:bg-card even:bg-muted/20 hover:bg-primary/5">
                      <td className="px-3 py-3">
                        <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{saleType(sale)}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-semibold text-primary">{sale.numero || `${sale.date_vente?.slice(0, 4) || "2026"}-${String(sale.id_vente).padStart(4, "0")}`}</td>
                      <td className="px-3 py-3 font-medium">{clientLabel(sale.client)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-right font-semibold">{formatAmount(Number(sale.montant_ttc ?? sale.montant_total))}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">{formatDate(sale.date_vente ?? sale.created_at)}</td>
                      <td className="max-w-44 truncate px-3 py-3 text-muted-foreground" title={sale.remarque || ""}>{sale.remarque || "—"}</td>
                      <td className="px-3 py-3 text-muted-foreground">{sale.commercial ? [sale.commercial.prenom, sale.commercial.nom].filter(Boolean).join(" ") : "Administrateur"}</td>
                      <td className="px-3 py-3">
                        <div className="flex justify-center gap-1.5">
                          {sale.statut === "brouillon" && (
                            <button type="button" onClick={() => openDelete(sale)} className="rounded-full bg-rose-500 p-2 text-white hover:bg-rose-600" title="Supprimer le brouillon" aria-label="Supprimer le brouillon"><Trash2 size={14} /></button>
                          )}
                          <button type="button" onClick={() => void showDetails(sale)} className="rounded-full bg-amber-400 p-2 text-amber-950 hover:bg-amber-500" title="Détail de la vente" aria-label="Voir le détail"><ClipboardList size={14} /></button>
                          {sale.statut !== "brouillon" && (
                            <button
                              type="button"
                              onClick={() => sale.id_devis ? navigate(`/facturation/${sale.id_devis}/apercu`) : void openInvoice(sale)}
                              disabled={invoiceLoadingId === sale.id_vente}
                              className="rounded-full bg-primary p-2 text-primary-foreground hover:opacity-90 disabled:opacity-50"
                              title={sale.id_devis ? "Afficher la facture" : "Créer une facture"}
                              aria-label={sale.id_devis ? "Afficher la facture" : "Créer une facture"}
                            >
                              <FileText size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                      {view === "brouillon" ? "Aucun brouillon de vente." : "Aucune vente trouvée."}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground">
              <span>{visibleTotal} vente(s)</span>
              <TablePagination page={page} lastPage={lastPage} onChange={(value) => { setPage(value); setLoadingList(true) }} />
            </div>
          </section>
        </>
      )}

      <Modal open={mode === "editor"} onClose={closeModal} title={editingId ? "Modifier le brouillon de vente" : "Nouvelle vente"} size="2xl">
        {loadingCatalog ? (
          <p className="py-12 text-center text-muted-foreground">Chargement du catalogue...</p>
        ) : clients.length === 0 ? (
          <div className="py-8 text-center">
            <p className="font-medium">Aucun client disponible</p>
            <p className="mt-2 text-sm text-muted-foreground">Ajoutez ou attribuez un client avant d’enregistrer une vente.</p>
          </div>
        ) : (
          <SaleEditor
            key={editorInitial?.id_vente ?? "new-sale"}
            clients={clients}
            products={products}
            services={services}
            initialSale={editorInitial}
            saving={saving}
            onClose={closeModal}
            onSubmit={(payload, shouldValidate) => void saveSale(payload, shouldValidate)}
          />
        )}
      </Modal>

      <Modal open={mode === "detail"} onClose={closeModal} title={selectedSale ? `Détail de la vente ${selectedSale.numero ?? selectedSale.id_vente}` : "Détail de la vente"} size="2xl">
        {loadingDetail || !selectedSale ? (
          <p className="py-12 text-center text-muted-foreground">Chargement...</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col justify-between gap-3 rounded-xl bg-primary/10 p-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs text-muted-foreground">Nom du prospect</p>
                <p className="font-semibold">{clientLabel(selectedSale.client)}</p>
                <p className="text-sm text-muted-foreground">{selectedSale.client?.email || selectedSale.client?.telephone || " "}</p>
              </div>
              <div className="flex items-center justify-between gap-5 rounded-lg border border-border bg-card px-4 py-3 sm:justify-end">
                <div><p className="text-xs text-muted-foreground">Type</p><p className="font-semibold">{saleType(selectedSale)}</p></div>
                <div><p className="text-xs text-muted-foreground">Total</p><p className="font-bold text-primary">{formatAmount(Number(selectedSale.montant_ttc ?? selectedSale.montant_total))}</p></div>
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full min-w-0 table-fixed text-xs sm:text-sm">
                <thead className="bg-primary text-primary-foreground">
                  <tr><th className="px-3 py-2.5 text-left">Référence</th><th className="px-3 py-2.5 text-left">Désignation</th><th className="px-3 py-2.5 text-right">Prix unitaire</th><th className="px-3 py-2.5 text-center">Quantité</th><th className="px-3 py-2.5 text-right">Montant</th></tr>
                </thead>
                <tbody>
                  {(selectedSale.lignes ?? []).map((line) => (
                    <tr key={line.id_ligne_vente} className="border-b border-border last:border-0">
                      <td className="px-3 py-2.5">{line.produit?.reference || line.offre?.denomination || "—"}</td>
                      <td className="px-3 py-2.5">{line.designation}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right">{formatAmount(line.prix_unitaire)}</td>
                      <td className="px-3 py-2.5 text-center">{line.quantite}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-medium">{formatAmount(line.montant)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <div className="text-sm text-muted-foreground">
                {formatDate(selectedSale.date_vente)}
                {selectedSale.remarque ? ` · ${selectedSale.remarque}` : ""}
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                {selectedSale.statut === "brouillon" ? (
                  <>
                    <button type="button" onClick={() => void openEdit(selectedSale)} disabled={saving} className={`${buttonClass} border border-border hover:bg-accent`}><Eye size={15} /> Modifier</button>
                    <button type="button" onClick={() => void validateDraft(selectedSale)} disabled={saving} className={`${buttonClass} bg-primary text-primary-foreground hover:opacity-90`}><Check size={15} /> Valider</button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => selectedSale.id_devis ? navigate(`/facturation/${selectedSale.id_devis}/apercu`) : void openInvoice(selectedSale)}
                    disabled={invoiceLoadingId === selectedSale.id_vente}
                    className={`${buttonClass} bg-primary text-primary-foreground hover:opacity-90`}
                  >
                    <FileText size={15} /> Facture
                  </button>
                )}
                <button type="button" onClick={closeModal} className={`${buttonClass} border border-border hover:bg-accent`}>Fermer</button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={mode === "delete"} onClose={closeModal} title="Supprimer le brouillon" size="sm">
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">Supprimer le brouillon <strong className="text-foreground">{selectedSale?.numero}</strong> ? Cette action est définitive.</p>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" onClick={closeModal} className={`${buttonClass} border border-border hover:bg-accent`}>Annuler</button>
            <button type="button" onClick={() => void removeSale()} disabled={saving} className={`${buttonClass} bg-destructive text-destructive-foreground hover:opacity-90`}><Trash2 size={15} /> {saving ? "Suppression..." : "Supprimer"}</button>
          </div>
        </div>
      </Modal>

      <Modal open={mode === "dates"} onClose={closeModal} title="Filtrer par dates" size="sm">
        <form onSubmit={applyDates} className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium"><span>Du</span><DatePicker value={draftDateFrom} onChange={setDraftDateFrom} /></label>
            <label className="space-y-1.5 text-sm font-medium"><span>Au</span><DatePicker value={draftDateTo} onChange={setDraftDateTo} /></label>
          </div>
          <div className="flex justify-between gap-2 border-t border-border pt-4">
            <button type="button" onClick={() => { setDraftDateFrom(""); setDraftDateTo(""); setDateFrom(""); setDateTo(""); setPage(1); setLoadingList(true); setMode(null) }} className={`${buttonClass} text-muted-foreground hover:bg-accent`}><X size={15} /> Effacer</button>
            <button type="submit" className={`${buttonClass} bg-primary text-primary-foreground hover:opacity-90`}><Check size={15} /> Valider</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
