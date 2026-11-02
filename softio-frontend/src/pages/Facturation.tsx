import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  CalendarDays, Check, ChevronLeft, ChevronRight, ClipboardList, Eye, FileText,
  Mail, Minus, Plus, Search, Trash2, X,
} from "lucide-react"
import Modal from "@/components/ui/Modal"
import { useToast } from "@/contexts/ToastContext"
import type { Client } from "@/services/clients"
import type { Offre, Produit } from "@/services/catalogue"
import {
  createFacturationDocument,
  deleteFacturationDocument,
  emailFacturationDocument,
  getFacturationCatalog,
  getFacturationDocument,
  getFacturationDocuments,
  updateFacturationDocument,
  validateFacturationDocument,
  type DocumentType,
  type FacturationDocument,
  type FacturationLine,
  type FacturationPayload,
  type LineType,
} from "@/services/facturation"

type View = "enregistrement" | "liste" | "brouillon"
type ModalMode = "document" | "detail" | "delete" | "dates" | null
type BasketLine = {
  key: string
  id_produit: number | null
  id_offre: number | null
  type_ligne: LineType
  designation: string
  quantite: number
  prix_unitaire: number
  remise: number
  montant: number
}

const inputClass = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
const buttonClass = "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
const today = () => new Date().toISOString().slice(0, 10)

function formatAmount(value: number) {
  return `${new Intl.NumberFormat("fr-FR").format(value)} MGA`
}

function formatDate(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString("fr-FR")
}

function clientLabel(client: { nom: string; prenom?: string | null; entreprise?: string | null }) {
  return client.entreprise || [client.prenom, client.nom].filter(Boolean).join(" ")
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

function documentTypeLabel(type: DocumentType) {
  return type === "facture" ? "Facture" : type === "devis" ? "Devis" : "Proforma"
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
      <span className="px-2 text-sm text-muted-foreground">Page {page} sur {lastPage}</span>
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

export default function Facturation() {
  const navigate = useNavigate()
  const toast = useToast()
  const toastRef = useRef(toast)
  const [view, setView] = useState<View>("enregistrement")
  const [mode, setMode] = useState<ModalMode>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [products, setProducts] = useState<Produit[]>([])
  const [services, setServices] = useState<Offre[]>([])
  const [documents, setDocuments] = useState<FacturationDocument[]>([])
  const [documentsTotal, setDocumentsTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [loadingList, setLoadingList] = useState(false)
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [saving, setSaving] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("tous")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [draftDateFrom, setDraftDateFrom] = useState("")
  const [draftDateTo, setDraftDateTo] = useState("")
  const [selectedDocument, setSelectedDocument] = useState<FacturationDocument | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [documentForm, setDocumentForm] = useState({
    clientId: "",
    type: "proforma" as DocumentType,
    date: today(),
    title: "",
    note: "",
    discount: "0",
    includeTax: false,
  })
  const [lineType, setLineType] = useState<LineType>("service")
  const [selectedItemId, setSelectedItemId] = useState("")
  const [itemQuantity, setItemQuantity] = useState(1)
  const [itemDiscount, setItemDiscount] = useState("0")
  const [basket, setBasket] = useState<BasketLine[]>([])

  useEffect(() => {
    toastRef.current = toast
  }, [toast])

  useEffect(() => {
    let active = true
    const loadCatalog = async () => {
      try {
        const catalog = await getFacturationCatalog()
        if (active) {
          setClients(catalog.clients)
          setProducts(catalog.produits)
          setServices(catalog.services)
        }
      } catch (error: unknown) {
        if (active) toastRef.current.error(getErrorMessage(error, "Impossible de charger le catalogue de facturation"))
      } finally {
        if (active) setLoadingCatalog(false)
      }
    }

    void loadCatalog()
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (view === "enregistrement") return
    let active = true
    getFacturationDocuments({
      view: view === "brouillon" ? "brouillons" : "liste",
      search: search || undefined,
      type: filterType,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page,
    })
      .then((response) => {
        if (!active) return
        setDocuments(response.data)
        setDocumentsTotal(response.total)
        setLastPage(response.last_page)
      })
      .catch((error: unknown) => {
        if (active) toastRef.current.error(getErrorMessage(error, "Erreur de chargement des documents"))
      })
      .finally(() => {
        if (active) setLoadingList(false)
      })
    return () => { active = false }
  }, [view, search, filterType, dateFrom, dateTo, page, refreshKey])

  const selectedProduct = products.find((item) => String(item.id_produit) === selectedItemId)
  const selectedService = services.find((item) => String(item.id_offre) === selectedItemId)
  const selectedItem = lineType === "produit" ? selectedProduct : selectedService
  const selectedName = lineType === "produit" ? selectedProduct?.designation : selectedService?.denomination
  const selectedPrice = lineType === "produit" ? Number(selectedProduct?.prix_unitaire ?? 0) : Number(selectedService?.tarif ?? 0)
  const subtotal = basket.reduce((sum, line) => sum + line.montant, 0)
  const globalDiscount = Math.max(0, Number(documentForm.discount) || 0)
  const totalHt = Math.max(0, subtotal - globalDiscount)
  const taxAmount = documentForm.includeTax ? Math.round(totalHt * 0.2) : 0
  const totalTtc = totalHt + taxAmount

  const closeModal = () => {
    setMode(null)
    setSelectedDocument(null)
  }

  const resetDocumentForm = () => {
    setEditingId(null)
    setDocumentForm({
      clientId: "",
      type: "proforma",
      date: today(),
      title: "",
      note: "",
      discount: "0",
      includeTax: false,
    })
    setBasket([])
    setLineType("service")
    setSelectedItemId("")
    setItemQuantity(1)
    setItemDiscount("0")
  }

  const openNewDocument = () => {
    resetDocumentForm()
    setMode("document")
  }

  const addLine = () => {
    if (!selectedItem || !selectedName) {
      toast.error(`Sélectionnez un ${lineType === "produit" ? "produit" : "service"}`)
      return
    }
    const gross = selectedPrice * itemQuantity
    const discount = Math.max(0, Number(itemDiscount) || 0)
    if (discount > gross) {
      toast.error("La remise dépasse le montant de la ligne")
      return
    }

    setBasket((current) => [...current, {
      key: `${Date.now()}-${current.length}`,
      id_produit: lineType === "produit" ? selectedProduct?.id_produit ?? null : null,
      id_offre: lineType === "service" ? selectedService?.id_offre ?? null : null,
      type_ligne: lineType,
      designation: selectedName,
      quantite: itemQuantity,
      prix_unitaire: selectedPrice,
      remise: discount,
      montant: gross - discount,
    }])
    setSelectedItemId("")
    setItemQuantity(1)
    setItemDiscount("0")
  }

  const openEditDocument = async (document: FacturationDocument) => {
    try {
      setLoadingDetail(true)
      const fullDocument = await getFacturationDocument(document.id_devis)
      if (fullDocument.statut !== "brouillon") {
        toast.error("Seuls les brouillons peuvent être modifiés")
        return
      }
      setEditingId(fullDocument.id_devis)
      setDocumentForm({
        clientId: String(fullDocument.client.id_client),
        type: fullDocument.type,
        date: fullDocument.date_devis.slice(0, 10),
        title: fullDocument.intitule ?? "",
        note: fullDocument.remarque ?? "",
        discount: String(fullDocument.remise_globale ?? 0),
        includeTax: fullDocument.inclure_tva,
      })
      setBasket((fullDocument.lignes ?? []).map((line: FacturationLine, index) => ({
        key: `${line.id_ligne_devis ?? index}-${Date.now()}`,
        id_produit: line.id_produit,
        id_offre: line.id_offre,
        type_ligne: line.type_ligne,
        designation: line.designation,
        quantite: Number(line.quantite),
        prix_unitaire: Number(line.prix_unitaire),
        remise: Number(line.remise ?? 0),
        montant: Number(line.montant),
      })))
      setMode("document")
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Impossible d’ouvrir ce brouillon"))
    } finally {
      setLoadingDetail(false)
    }
  }

  const createPayload = (): FacturationPayload => ({
    id_client: Number(documentForm.clientId),
    type: documentForm.type,
    date_devis: documentForm.date,
    intitule: documentForm.title.trim() || undefined,
    remarque: documentForm.note.trim() || undefined,
    remise_globale: globalDiscount,
    inclure_tva: documentForm.includeTax,
    taux_tva: 20,
    lignes: basket.map((line) => ({
      id_produit: line.id_produit,
      id_offre: line.id_offre,
      type_ligne: line.type_ligne,
      quantite: line.quantite,
      remise: line.remise,
    })),
  })

  const saveDocument = async (validate = false) => {
    if (!documentForm.clientId) {
      toast.error("Sélectionnez un client")
      return
    }
    if (!basket.length) {
      toast.error("Ajoutez au moins une ligne au document")
      return
    }
    if (globalDiscount > subtotal) {
      toast.error("La remise globale dépasse le total des lignes")
      return
    }

    try {
      setSaving(true)
      const saved = editingId
        ? await updateFacturationDocument(editingId, createPayload())
        : await createFacturationDocument(createPayload())
      setEditingId(saved.id_devis)

      if (validate) {
        await validateFacturationDocument(saved.id_devis)
        toast.success(`${documentTypeLabel(saved.type)} validé${saved.type === "facture" ? "e" : ""}`)
      } else {
        toast.success("Brouillon enregistré")
      }
      setMode(null)
      setLoadingList(true)
      setView(validate ? "liste" : "brouillon")
      setPage(1)
      resetDocumentForm()
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Erreur lors de l’enregistrement du document"))
    } finally {
      setSaving(false)
    }
  }

  const refreshDocuments = () => {
    setLoadingList(true)
    setPage(1)
    setRefreshKey((key) => key + 1)
  }

  const validateDraft = async (document: FacturationDocument) => {
    try {
      setSaving(true)
      await validateFacturationDocument(document.id_devis)
      toast.success(`${documentTypeLabel(document.type)} validé`)
      refreshDocuments()
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Impossible de valider le document"))
    } finally {
      setSaving(false)
    }
  }

  const deleteDraft = async () => {
    if (!selectedDocument) return
    try {
      setSaving(true)
      await deleteFacturationDocument(selectedDocument.id_devis)
      toast.success("Brouillon supprimé")
      closeModal()
      refreshDocuments()
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Impossible de supprimer le brouillon"))
    } finally {
      setSaving(false)
    }
  }

  const showDetails = async (document: FacturationDocument) => {
    setSelectedDocument(document)
    setMode("detail")
    setLoadingDetail(true)
    try {
      const fullDocument = await getFacturationDocument(document.id_devis)
      setSelectedDocument(fullDocument)
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Impossible de charger le document"))
      setMode(null)
    } finally {
      setLoadingDetail(false)
    }
  }

  const sendEmail = async () => {
    if (!selectedDocument) return
    try {
      setSaving(true)
      const message = await emailFacturationDocument(selectedDocument.id_devis)
      toast.success(message)
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Erreur lors de l’envoi de l’e-mail"))
    } finally {
      setSaving(false)
    }
  }

  const openDateFilter = () => {
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
    setPage(1)
    setLoadingList(true)
    setMode(null)
  }

  const changeView = (nextView: View) => {
    setView(nextView)
    setPage(1)
    setLoadingList(nextView !== "enregistrement")
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <header className="rounded-2xl border border-primary/10 bg-gradient-to-r from-primary/10 via-card to-primary/5 p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-400 text-white shadow-sm">
            <FileText size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {view === "liste" ? "Liste des factures" : view === "brouillon" ? "Brouillons" : "Facturation"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {view === "liste"
                ? "Consultez et filtrez vos documents validés."
                : view === "brouillon"
                  ? "Reprenez vos documents non validés ou supprimez-les."
                  : "Créez un devis, une proforma ou une facture."}
            </p>
          </div>
        </div>
      </header>

      <nav className="flex w-fit items-center gap-1 border-b border-border" aria-label="Facturation">
        {([
          ["enregistrement", "Enregistrement", Plus],
          ["liste", "Liste", ClipboardList],
          ["brouillon", "Brouillon", FileText],
        ] as const).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            onClick={() => changeView(value)}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              view === value ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </nav>

      {view === "enregistrement" ? (
        <section className="space-y-4">
          <div className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-semibold">Préparez votre document</h2>
              <p className="mt-1 text-sm text-muted-foreground">Ajoutez des produits ou services, puis enregistrez en brouillon ou validez.</p>
            </div>
            <button type="button" onClick={openNewDocument} disabled={loadingCatalog} className={`${buttonClass} bg-primary text-primary-foreground hover:opacity-90`}>
              <Plus size={17} /> {loadingCatalog ? "Chargement..." : "Nouveau document"}
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <button type="button" onClick={() => changeView("liste")} className="rounded-xl border border-border bg-card p-4 text-left hover:border-primary/40">
              <p className="text-sm text-muted-foreground">Documents validés</p>
              <p className="mt-1 text-2xl font-bold">Consulter la liste</p>
            </button>
            <button type="button" onClick={() => changeView("brouillon")} className="rounded-xl border border-border bg-card p-4 text-left hover:border-primary/40">
              <p className="text-sm text-muted-foreground">Documents en attente</p>
              <p className="mt-1 text-2xl font-bold">Voir les brouillons</p>
            </button>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">TVA proposée</p>
              <p className="mt-1 text-2xl font-bold">20 %</p>
            </div>
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <label className="relative flex-1">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                  setLoadingList(true)
                }}
                placeholder="Rechercher par N° de document ou nom du client..."
                className={`${inputClass} pl-10`}
                aria-label="Rechercher une facture"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                ["tous", "Tous"],
                ["produit", "Produit"],
                ["service", "Service"],
                ["devis", "Devis"],
                ["proforma", "Proforma"],
                ["facture", "Facture"],
              ].map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => {
                    setFilterType(value)
                    setPage(1)
                    setLoadingList(true)
                  }}
                  className={`${buttonClass} rounded-full border border-border px-3 py-2 text-xs ${
                    filterType === value ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent"
                  }`}
                >
                  {label}
                </button>
              ))}
              <button type="button" onClick={openDateFilter} className={`${buttonClass} rounded-full border border-border bg-card px-3 py-2 text-xs hover:bg-accent`}>
                <CalendarDays size={14} /> Dates
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-primary text-primary-foreground">
                  <tr>
                    <th className="px-3 py-3 text-left font-semibold">Type</th>
                    <th className="px-3 py-3 text-left font-semibold">N° document</th>
                    <th className="px-3 py-3 text-left font-semibold">Nom et prénom</th>
                    <th className="px-3 py-3 text-right font-semibold">Montant</th>
                    <th className="px-3 py-3 text-left font-semibold">Date</th>
                    <th className="px-3 py-3 text-left font-semibold">Remarque</th>
                    <th className="px-3 py-3 text-left font-semibold">Enregistré par</th>
                    <th className="px-3 py-3 text-center font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loadingList ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">Chargement...</td></tr>
                  ) : documents.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                      {view === "brouillon" ? "Aucun brouillon." : "Aucun document trouvé."}
                    </td></tr>
                  ) : documents.map((document) => (
                    <tr key={document.id_devis} className="hover:bg-accent/30">
                      <td className="px-3 py-3">{documentTypeLabel(document.type)}</td>
                      <td className="px-3 py-3 font-medium text-primary">{document.numero}</td>
                      <td className="px-3 py-3 font-medium">{document.client ? clientLabel(document.client) : "—"}</td>
                      <td className="px-3 py-3 text-right font-semibold">{formatAmount(document.montant_ttc)}</td>
                      <td className="px-3 py-3 text-muted-foreground">{formatDate(document.date_devis)}</td>
                      <td className="max-w-40 truncate px-3 py-3 text-muted-foreground">{document.remarque || "—"}</td>
                      <td className="px-3 py-3">{document.commercial ? [document.commercial.prenom, document.commercial.nom].filter(Boolean).join(" ") : "Administrateur"}</td>
                      <td className="px-3 py-3">
                        <div className="flex justify-center gap-1.5">
                          {view === "brouillon" ? (
                            <>
                              <button type="button" onClick={() => void openEditDocument(document)} disabled={loadingDetail} className="rounded-full bg-amber-500 p-2 text-white hover:opacity-80" aria-label="Modifier le brouillon" title="Modifier">
                                <FileText size={14} />
                              </button>
                              <button type="button" onClick={() => void validateDraft(document)} disabled={saving} className="rounded-full bg-emerald-600 p-2 text-white hover:opacity-80" aria-label="Valider le brouillon" title="Valider">
                                <Check size={14} />
                              </button>
                              <button type="button" onClick={() => { setSelectedDocument(document); setMode("delete") }} disabled={saving} className="rounded-full bg-destructive p-2 text-white hover:opacity-80" aria-label="Supprimer le brouillon" title="Supprimer">
                                <Trash2 size={14} />
                              </button>
                            </>
                          ) : (
                            <button type="button" onClick={() => void showDetails(document)} className="rounded-full bg-primary p-2 text-primary-foreground hover:opacity-80" aria-label="Afficher le document" title="Détail et impression">
                              <FileText size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">{documentsTotal} document(s)</div>
            <Pagination page={page} lastPage={lastPage} onChange={(nextPage) => {
              setPage(nextPage)
              setLoadingList(true)
            }} />
          </div>
        </section>
      )}

      <Modal open={mode === "document"} onClose={closeModal} title={editingId ? "Modifier le brouillon" : "Nouveau document"} size="lg">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm font-medium">
              <span>Type de document</span>
              <select value={documentForm.type} onChange={(event) => setDocumentForm({ ...documentForm, type: event.target.value as DocumentType })} className={inputClass}>
                <option value="proforma">Proforma</option>
                <option value="devis">Devis</option>
                <option value="facture">Facture</option>
              </select>
            </label>
            <label className="block space-y-1.5 text-sm font-medium">
              <span>Date</span>
              <input type="date" value={documentForm.date} onChange={(event) => setDocumentForm({ ...documentForm, date: event.target.value })} className={inputClass} />
            </label>
            <label className="block space-y-1.5 text-sm font-medium sm:col-span-2">
              <span>Client</span>
              <select required value={documentForm.clientId} onChange={(event) => setDocumentForm({ ...documentForm, clientId: event.target.value })} className={inputClass}>
                <option value="" disabled>Sélectionner un client</option>
                {clients.map((client) => <option key={client.id_client} value={client.id_client}>{clientLabel(client)}</option>)}
              </select>
            </label>
            <label className="block space-y-1.5 text-sm font-medium sm:col-span-2">
              <span>Objet (facultatif)</span>
              <input value={documentForm.title} onChange={(event) => setDocumentForm({ ...documentForm, title: event.target.value })} className={inputClass} placeholder="Objet du document" />
            </label>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <h3 className="mb-3 font-semibold">Ajouter une ligne</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5 text-sm font-medium">
                <span>Type</span>
                <select value={lineType} onChange={(event) => { setLineType(event.target.value as LineType); setSelectedItemId("") }} className={inputClass}>
                  <option value="service">Service</option>
                  <option value="produit">Produit</option>
                </select>
              </label>
              <label className="block space-y-1.5 text-sm font-medium">
                <span>Désignation</span>
                <select value={selectedItemId} onChange={(event) => setSelectedItemId(event.target.value)} className={inputClass}>
                  <option value="">Sélectionner...</option>
                  {lineType === "produit"
                    ? products.map((product) => <option key={product.id_produit} value={product.id_produit}>{product.reference || "Produit"} — {product.designation}</option>)
                    : services.map((service) => <option key={service.id_offre} value={service.id_offre}>{service.denomination}</option>)}
                </select>
              </label>
              <label className="block space-y-1.5 text-sm font-medium">
                <span>Prix / tarif unitaire</span>
                <input readOnly value={selectedItem ? formatAmount(selectedPrice) : ""} className={`${inputClass} bg-muted/50`} />
              </label>
              <label className="block space-y-1.5 text-sm font-medium">
                <span>Quantité</span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setItemQuantity((value) => Math.max(1, value - 1))} className="rounded-lg border border-border p-2.5 hover:bg-accent" aria-label="Diminuer la quantité"><Minus size={14} /></button>
                  <input type="number" min={1} value={itemQuantity} onChange={(event) => setItemQuantity(Math.max(1, Number(event.target.value)))} className={`${inputClass} text-center`} />
                  <button type="button" onClick={() => setItemQuantity((value) => value + 1)} className="rounded-lg border border-border p-2.5 hover:bg-accent" aria-label="Augmenter la quantité"><Plus size={14} /></button>
                </div>
              </label>
              <label className="block space-y-1.5 text-sm font-medium">
                <span>Remise (MGA)</span>
                <input type="number" min={0} value={itemDiscount} onChange={(event) => setItemDiscount(event.target.value)} className={inputClass} />
              </label>
              <div className="flex items-end">
                <button type="button" onClick={addLine} className={`${buttonClass} w-full bg-primary text-primary-foreground hover:opacity-90`}>
                  <Plus size={16} /> Ajouter à la liste
                </button>
              </div>
            </div>
            {selectedName && <p className="mt-3 text-sm text-muted-foreground">Ligne : {selectedName} — {formatAmount(Math.max(0, selectedPrice * itemQuantity - (Number(itemDiscount) || 0)))}</p>}
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="bg-primary text-primary-foreground">
                  <tr>
                    <th className="px-3 py-2.5 text-left">Référence / type</th>
                    <th className="px-3 py-2.5 text-left">Désignation</th>
                    <th className="px-3 py-2.5 text-right">Prix</th>
                    <th className="px-3 py-2.5 text-center">Qté</th>
                    <th className="px-3 py-2.5 text-right">Remise</th>
                    <th className="px-3 py-2.5 text-right">Montant</th>
                    <th className="px-3 py-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {basket.length === 0 ? (
                    <tr><td colSpan={7} className="px-3 py-5 text-center text-muted-foreground">Le panier est vide.</td></tr>
                  ) : basket.map((line) => (
                    <tr key={line.key}>
                      <td className="px-3 py-2.5 capitalize">{line.type_ligne}</td>
                      <td className="px-3 py-2.5">{line.designation}</td>
                      <td className="px-3 py-2.5 text-right">{formatAmount(line.prix_unitaire)}</td>
                      <td className="px-3 py-2.5 text-center">{line.quantite}</td>
                      <td className="px-3 py-2.5 text-right">{line.remise ? formatAmount(line.remise) : "—"}</td>
                      <td className="px-3 py-2.5 text-right font-semibold">{formatAmount(line.montant)}</td>
                      <td className="px-3 py-2.5 text-center">
                        <button type="button" onClick={() => setBasket((current) => current.filter((item) => item.key !== line.key))} className="rounded-lg p-2 text-destructive hover:bg-destructive/10" aria-label={`Retirer ${line.designation}`}>
                          <X size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm font-medium">
              <span>Remise globale (MGA)</span>
              <input type="number" min={0} value={documentForm.discount} onChange={(event) => setDocumentForm({ ...documentForm, discount: event.target.value })} className={inputClass} />
            </label>
            <label className="flex items-center gap-3 self-end rounded-lg border border-border p-3 text-sm font-medium">
              <input type="checkbox" checked={documentForm.includeTax} onChange={(event) => setDocumentForm({ ...documentForm, includeTax: event.target.checked })} className="h-4 w-4 accent-primary" />
              Inclure la TVA (20 %)
            </label>
            <label className="block space-y-1.5 text-sm font-medium sm:col-span-2">
              <span>Remarque (facultatif)</span>
              <textarea value={documentForm.note} onChange={(event) => setDocumentForm({ ...documentForm, note: event.target.value })} className={`${inputClass} min-h-20 resize-y`} />
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-primary/5 p-4">
            <div>
              <p className="text-sm text-muted-foreground">Total du panier</p>
              <p className="text-xl font-bold text-primary">{formatAmount(totalTtc)}</p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={closeModal} className={`${buttonClass} border border-border hover:bg-accent`}>Annuler</button>
              <button type="button" onClick={() => void saveDocument(false)} disabled={saving || loadingCatalog} className={`${buttonClass} border border-primary text-primary hover:bg-primary/5`}>
                <FileText size={15} /> {saving ? "Enregistrement..." : "Enregistrer brouillon"}
              </button>
              <button type="button" onClick={() => void saveDocument(true)} disabled={saving || loadingCatalog} className={`${buttonClass} bg-primary text-primary-foreground hover:opacity-90`}>
                <Check size={15} /> {saving ? "Validation..." : "Valider"}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal open={mode === "detail"} onClose={closeModal} title={selectedDocument ? `Détail ${documentTypeLabel(selectedDocument.type)} ${selectedDocument.numero}` : "Détail du document"} size="lg">
        {loadingDetail || !selectedDocument ? (
          <p className="py-12 text-center text-muted-foreground">Chargement...</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col justify-between gap-3 rounded-xl bg-primary/10 p-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs text-muted-foreground">Nom du client</p>
                <p className="font-semibold">{clientLabel(selectedDocument.client)}</p>
                <p className="text-sm text-muted-foreground">{selectedDocument.client.email || selectedDocument.client.telephone}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold text-primary">{formatAmount(selectedDocument.montant_ttc)}</p>
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[620px] text-sm">
                <thead className="bg-primary text-primary-foreground">
                  <tr><th className="px-3 py-2.5 text-left">Référence</th><th className="px-3 py-2.5 text-left">Désignation</th><th className="px-3 py-2.5 text-right">Prix unitaire</th><th className="px-3 py-2.5 text-center">Quantité</th><th className="px-3 py-2.5 text-right">Remise</th><th className="px-3 py-2.5 text-right">Montant</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(selectedDocument.lignes ?? []).map((line) => (
                    <tr key={line.id_ligne_devis}>
                      <td className="px-3 py-2.5">{line.produit?.reference || line.offre?.denomination || (line.type_ligne === "produit" ? "Produit" : "Service")}</td>
                      <td className="px-3 py-2.5">{line.designation}</td>
                      <td className="px-3 py-2.5 text-right">{formatAmount(line.prix_unitaire)}</td>
                      <td className="px-3 py-2.5 text-center">{line.quantite}</td>
                      <td className="px-3 py-2.5 text-right">{line.remise ? formatAmount(line.remise) : "—"}</td>
                      <td className="px-3 py-2.5 text-right font-medium">{formatAmount(line.montant)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <div className="text-sm text-muted-foreground">
                {formatDate(selectedDocument.date_devis)}
                {selectedDocument.remarque ? ` · ${selectedDocument.remarque}` : ""}
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/facturation/${selectedDocument.id_devis}/apercu`)}
                  className={`${buttonClass} bg-primary text-primary-foreground hover:opacity-90`}
                >
                  <Eye size={15} /> Aperçu du document
                </button>
                {selectedDocument.statut === "valide" && (
                  <button type="button" onClick={() => void sendEmail()} disabled={saving} className={`${buttonClass} border border-primary text-primary hover:bg-primary/5`}>
                    <Mail size={15} /> {saving ? "Envoi..." : "Envoyer par e-mail"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={mode === "delete"} onClose={closeModal} title="Supprimer le brouillon" size="sm">
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Supprimer le document <strong className="text-foreground">{selectedDocument?.numero}</strong> ? Cette action est définitive.
          </p>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" onClick={closeModal} className={`${buttonClass} border border-border hover:bg-accent`}>Annuler</button>
            <button type="button" onClick={() => void deleteDraft()} disabled={saving} className={`${buttonClass} bg-destructive text-destructive-foreground hover:opacity-90`}>
              <Trash2 size={15} /> {saving ? "Suppression..." : "Supprimer"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={mode === "dates"} onClose={closeModal} title="Filtrer par dates" size="sm">
        <form onSubmit={applyDateFilter} className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm font-medium"><span>Du</span><input type="date" value={draftDateFrom} onChange={(event) => setDraftDateFrom(event.target.value)} className={inputClass} /></label>
            <label className="block space-y-1.5 text-sm font-medium"><span>Au</span><input type="date" value={draftDateTo} onChange={(event) => setDraftDateTo(event.target.value)} className={inputClass} /></label>
          </div>
          <div className="flex justify-between gap-2 border-t border-border pt-4">
            <button type="button" onClick={() => { setDraftDateFrom(""); setDraftDateTo(""); setDateFrom(""); setDateTo(""); setPage(1); setLoadingList(true); setMode(null) }} className={`${buttonClass} text-muted-foreground hover:bg-accent`}>
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
