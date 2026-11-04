import { useEffect, useMemo, useRef, useState } from "react"
import type { PointerEvent as ReactPointerEvent } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft, CheckCircle2, Download, FileText, Mail, Pencil,
  Save,
} from "lucide-react"
import { useToast } from "@/contexts/ToastContext"
import { getSessionUser } from "@/lib/session"
import Barcode from "@/components/Barcode"
import Modal from "@/components/ui/Modal"
import Select from "@/components/ui/Select"
import {
  emailFacturationDocument,
  getFacturationDocument,
  updateFacturationDocument,
  validateFacturationDocument,
  type DocumentType,
  type FacturationDocument,
} from "@/services/facturation"
import { getCompanySettings } from "@/services/account"

type PaperFormat = "A4" | "A5" | "Ticket"
type IssuerDetails = Pick<PreviewSettings, "companyName" | "companyEmail" | "companyPhone" | "companyAddress" | "companyNif" | "companyStat" | "companyRcs">
type RecipientDetails = { name: string; email: string; phone: string; address: string }

interface PreviewSettings {
  paperFormat: PaperFormat
  companyName: string
  companyEmail: string
  companyPhone: string
  companyAddress: string
  companyNif: string
  companyStat: string
  companyRcs: string
  footer: string
  accent: string
  logo: string
  logoWidth: number
  logoX: number
  logoY: number
  showReference: boolean
  showDiscount: boolean
}

const buttonClass = "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"

const settingsKey = `@Softio:facturation:preview:${getSessionUser().email || "default"}`

function defaultSettings(): PreviewSettings {
  const user = getSessionUser()
  return {
    paperFormat: "A4",
    companyName: user.nom,
    companyEmail: user.email,
    companyPhone: "",
    companyAddress: "",
    companyNif: "",
    companyStat: "",
    companyRcs: "",
    footer: "Merci de votre confiance !",
    accent: "#176a70",
    logo: "",
    logoWidth: 140,
    logoX: 0,
    logoY: 0,
    showReference: true,
    showDiscount: true,
  }
}

function readRecipientOverrides(key: string): { values: RecipientDetails | null; error: string | null } {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return { values: null, error: null }
    const value: unknown = JSON.parse(raw)
    if (
      typeof value !== "object"
      || value === null
      || !("name" in value) || typeof value.name !== "string"
      || !("email" in value) || typeof value.email !== "string"
      || !("phone" in value) || typeof value.phone !== "string"
      || !("address" in value) || typeof value.address !== "string"
    ) {
      throw new Error("Les informations du destinataire enregistrées sont invalides.")
    }
    return {
      values: {
        name: value.name,
        email: value.email,
        phone: value.phone,
        address: value.address,
      },
      error: null,
    }
  } catch (error) {
    return {
      values: null,
      error: error instanceof Error ? error.message : "Impossible de charger les informations du destinataire.",
    }
  }
}

function formatAmount(value: number) {
  return `${new Intl.NumberFormat("fr-FR").format(value)} MGA`
}

function formatPaperAmount(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value)
}

function formatDate(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString("fr-FR")
}

function documentTypeLabel(type: DocumentType) {
  return type === "facture" ? "Facture" : type === "devis" ? "Devis" : "Proforma"
}

function clientLabel(document: FacturationDocument) {
  return document.client.entreprise || [document.client.prenom, document.client.nom].filter(Boolean).join(" ")
}

function isPreviewSettings(value: unknown): value is PreviewSettings {
  if (!value || typeof value !== "object") return false
  const settings = value as Record<string, unknown>
  return (settings.paperFormat === "A4" || settings.paperFormat === "A5" || settings.paperFormat === "Ticket")
    && typeof settings.companyName === "string"
    && typeof settings.companyEmail === "string"
    && typeof settings.companyPhone === "string"
    && typeof settings.companyAddress === "string"
    && (typeof settings.companyNif === "string" || settings.companyNif === undefined)
    && (typeof settings.companyStat === "string" || settings.companyStat === undefined)
    && (typeof settings.companyRcs === "string" || settings.companyRcs === undefined)
    && typeof settings.footer === "string"
    && typeof settings.accent === "string"
    && typeof settings.logo === "string"
    && typeof settings.logoWidth === "number"
    && typeof settings.logoX === "number"
    && typeof settings.logoY === "number"
    && typeof settings.showReference === "boolean"
    && typeof settings.showDiscount === "boolean"
}

function readInitialSettings(): { settings: PreviewSettings; error: string | null } {
  try {
    const raw = localStorage.getItem(settingsKey)
    if (!raw) return { settings: defaultSettings(), error: null }
    const value: unknown = JSON.parse(raw)
    if (!isPreviewSettings(value)) {
      throw new Error("Les paramètres d’aperçu enregistrés sont invalides.")
    }
    return { settings: { ...defaultSettings(), ...value }, error: null }
  } catch (error) {
    return {
      settings: defaultSettings(),
      error: error instanceof Error ? error.message : "Impossible de charger les paramètres d’aperçu.",
    }
  }
}

export default function FacturationApercu() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const toastRef = useRef(toast)
  const recipientSettingsKey = useMemo(
    () => `@Softio:facturation:recipient:${getSessionUser().email || "default"}:${id || "default"}`,
    [id],
  )
  const dragRef = useRef<{
    target: "logo"
    startX: number
    startY: number
    offsetX: number
    offsetY: number
  } | null>(null)
  const [initialSettings] = useState(readInitialSettings)
  const [initialRecipients] = useState(() => readRecipientOverrides(recipientSettingsKey))
  const [document, setDocument] = useState<FacturationDocument | null>(null)
  const [settings, setSettings] = useState<PreviewSettings>(initialSettings.settings)
  const [recipientOverrides, setRecipientOverrides] = useState<RecipientDetails | null>(initialRecipients.values)
  const [companyCachetUrl, setCompanyCachetUrl] = useState<string | null>(null)
  const [documentType, setDocumentType] = useState<DocumentType>("proforma")
  const [discountInput, setDiscountInput] = useState("0")
  const [appliedDiscount, setAppliedDiscount] = useState(0)
  const [includeTax, setIncludeTax] = useState(false)
  const [editingCard, setEditingCard] = useState<"issuer" | "recipient" | null>(null)
  const [issuerDraft, setIssuerDraft] = useState<IssuerDetails>({
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    companyAddress: "",
    companyNif: "",
    companyStat: "",
    companyRcs: "",
  })
  const [recipientDraft, setRecipientDraft] = useState<RecipientDetails>({ name: "", email: "", phone: "", address: "" })
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [savingDocument, setSavingDocument] = useState(false)
  const [validatingDocument, setValidatingDocument] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)

  useEffect(() => {
    toastRef.current = toast
  }, [toast])

  useEffect(() => {
    if (initialSettings.error) toastRef.current.error(initialSettings.error)
  }, [initialSettings.error])

  useEffect(() => {
    if (initialRecipients.error) toastRef.current.error(initialRecipients.error)
  }, [initialRecipients.error])

  useEffect(() => {
    let active = true
    void Promise.resolve().then(async () => {
      try {
        const company = await getCompanySettings()
        if (!active) return
        setSettings((current) => ({
          ...current,
          companyName: company.nom_entreprise || current.companyName,
          companyEmail: company.email || current.companyEmail,
          companyPhone: company.telephone || current.companyPhone,
          companyAddress: company.adresse || current.companyAddress,
          companyNif: company.nif || current.companyNif,
          companyStat: company.stat || current.companyStat,
          companyRcs: company.rcs || current.companyRcs,
          logo: company.logo_url || current.logo,
        }))
        setCompanyCachetUrl(company.cachet_url)
      } catch {
        if (active) toastRef.current.error("Impossible de charger les informations de l’entreprise.")
      }
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    const documentId = Number(id)
    if (!Number.isInteger(documentId) || documentId < 1) {
      toastRef.current.error("Identifiant de document invalide.")
      return () => { active = false }
    }

    getFacturationDocument(documentId)
      .then((result) => {
        if (active) {
          setDocument(result)
          setDocumentType(result.type)
          setDiscountInput(String(result.remise_globale ?? 0))
          setAppliedDiscount(Number(result.remise_globale ?? 0))
          setIncludeTax(result.inclure_tva)
        }
      })
      .catch(() => {
        if (active) toastRef.current.error("Impossible de charger le document à prévisualiser.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [id])

  const subtotal = useMemo(
    () => (document?.lignes ?? []).reduce((sum, line) => sum + line.montant, 0),
    [document],
  )
  const totalHt = Math.max(0, subtotal - appliedDiscount)
  const vatAmount = includeTax ? Math.round(totalHt * (document?.taux_tva ?? 20) / 100) : 0
  const totalTtc = totalHt + vatAmount

  const saveSettings = () => {
    try {
      setSavingSettings(true)
      localStorage.setItem(settingsKey, JSON.stringify(settings))
      if (recipientOverrides) {
        localStorage.setItem(recipientSettingsKey, JSON.stringify(recipientOverrides))
      } else {
        localStorage.removeItem(recipientSettingsKey)
      }
      toast.success("La mise en page a été enregistrée.")
    } catch {
      toast.error("Impossible d’enregistrer la mise en page. Vérifiez l’espace de stockage disponible.")
    } finally {
      setSavingSettings(false)
    }
  }

  const startImageDrag = (event: ReactPointerEvent<HTMLImageElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      target: "logo",
      startX: event.clientX,
      startY: event.clientY,
      offsetX: settings.logoX,
      offsetY: settings.logoY,
    }
  }

  const moveImage = (event: ReactPointerEvent<HTMLImageElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const x = Math.max(-120, Math.min(320, drag.offsetX + event.clientX - drag.startX))
    const y = Math.max(-100, Math.min(700, drag.offsetY + event.clientY - drag.startY))
    setSettings((current) => ({ ...current, logoX: x, logoY: y }))
  }

  const openIssuerEditor = () => {
    setIssuerDraft({
      companyName: settings.companyName,
      companyEmail: settings.companyEmail,
      companyPhone: settings.companyPhone,
      companyAddress: settings.companyAddress,
      companyNif: settings.companyNif,
      companyStat: settings.companyStat,
      companyRcs: settings.companyRcs,
    })
    setEditingCard("issuer")
  }

  const openRecipientEditor = () => {
    if (!document) return
    setRecipientDraft({
      name: recipientOverrides?.name ?? clientLabel(document),
      email: recipientOverrides?.email ?? document.client.email ?? "",
      phone: recipientOverrides?.phone ?? document.client.telephone ?? "",
      address: recipientOverrides?.address ?? "",
    })
    setEditingCard("recipient")
  }

  const saveCardEdits = () => {
    if (editingCard === "issuer") setSettings((current) => ({ ...current, ...issuerDraft }))
    if (editingCard === "recipient") setRecipientOverrides(recipientDraft)
    setEditingCard(null)
    toast.success("Les informations ont été mises à jour dans l’aperçu.")
  }

  const documentPayload = () => {
    if (!document) return null
    return {
      id_client: document.client.id_client,
      type: documentType,
      date_devis: document.date_devis,
      intitule: document.intitule ?? "",
      remarque: document.remarque ?? "",
      remise_globale: appliedDiscount,
      inclure_tva: includeTax,
      taux_tva: document.taux_tva,
      lignes: (document.lignes ?? []).map((line) => ({
        id_produit: line.id_produit,
        id_offre: line.id_offre,
        type_ligne: line.type_ligne,
        quantite: line.quantite,
        remise: line.remise,
      })),
    }
  }

  const saveDocument = async () => {
    if (!document || document.statut !== "brouillon") return false
    const discount = Number(discountInput)
    if (!Number.isFinite(discount) || discount < 0 || discount > subtotal) {
      toast.error("La remise globale doit être comprise entre 0 et le total des lignes.")
      return false
    }
    setAppliedDiscount(discount)
    try {
      setSavingDocument(true)
      const payload = documentPayload()
      if (!payload) return false
      payload.remise_globale = discount
      const updated = await updateFacturationDocument(document.id_devis, payload)
      setDocument(updated)
      setDocumentType(updated.type)
      setDiscountInput(String(updated.remise_globale))
      setAppliedDiscount(Number(updated.remise_globale))
      setIncludeTax(updated.inclure_tva)
      toast.success("La facture a été enregistrée.")
      return true
    } catch {
      toast.error("Impossible d’enregistrer la facture.")
      return false
    } finally {
      setSavingDocument(false)
    }
  }

  const validateAndDownload = async () => {
    if (!document) return
    if (document.statut === "brouillon") {
      if (!await saveDocument()) return
      try {
        setValidatingDocument(true)
        const validated = await validateFacturationDocument(document.id_devis)
        setDocument(validated)
        toast.success("Document validé. Préparation du téléchargement.")
        window.setTimeout(() => window.print(), 100)
      } catch {
        toast.error("Impossible de valider le document.")
      } finally {
        setValidatingDocument(false)
      }
      return
    }
    window.print()
  }

  const sendByEmail = async () => {
    if (!document || document.statut !== "valide") return
    try {
      setSendingEmail(true)
      toast.success(await emailFacturationDocument(document.id_devis))
    } catch {
      toast.error("Impossible d’envoyer la facture par e-mail.")
    } finally {
      setSendingEmail(false)
    }
  }

  const changeFormat = (value: string) => {
    if (value === "A4" || value === "A5" || value === "Ticket") {
      setSettings((current) => ({ ...current, paperFormat: value }))
    }
  }

  const format = settings.paperFormat
  const paperWidth = format === "A4" ? "794px" : format === "A5" ? "559px" : "302px"
  const paperPadding = format === "Ticket" ? "18px" : format === "A5" ? "34px" : "52px"
  const pageSize = format === "Ticket" ? "auto" : format
  const companyLines = [
    settings.companyEmail,
    settings.companyPhone,
    settings.companyAddress,
    settings.companyNif && `NIF : ${settings.companyNif}`,
    settings.companyStat && `STAT : ${settings.companyStat}`,
    settings.companyRcs && `RCS : ${settings.companyRcs}`,
  ].filter(Boolean)
  const recipient = document ? {
    name: recipientOverrides?.name ?? clientLabel(document),
    email: recipientOverrides?.email ?? document.client.email ?? "",
    phone: recipientOverrides?.phone ?? document.client.telephone ?? "",
    address: recipientOverrides?.address ?? "",
  } : null

  return (
    <div className="space-y-5">
      <style>{`@media print { @page { size: ${pageSize}; margin: ${format === "Ticket" ? "4mm" : "12mm"}; } }`}</style>
      <div className="print:hidden flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => navigate("/facturation")}
            className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={16} /> Retour à la facturation
          </button>
          <h1 className="font-display text-2xl font-bold">Aperçu de document</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Personnalisez la mise en page, puis imprimez ou enregistrez en PDF.
          </p>
        </div>
      </div>

      {!Number.isInteger(Number(id)) || Number(id) < 1 ? (
        <div className="rounded-xl border border-border bg-card py-20 text-center">
          <FileText className="mx-auto mb-3 text-muted-foreground" size={28} />
          <p className="font-medium">Identifiant de document invalide</p>
        </div>
      ) : loading ? (
        <div className="rounded-xl border border-border bg-card py-20 text-center text-muted-foreground">
          Chargement du document...
        </div>
      ) : !document ? (
        <div className="rounded-xl border border-border bg-card py-20 text-center">
          <FileText className="mx-auto mb-3 text-muted-foreground" size={28} />
          <p className="font-medium">Document introuvable</p>
          <button type="button" onClick={() => navigate("/facturation")} className="mt-4 text-sm text-primary hover:underline">
            Revenir à la facturation
          </button>
        </div>
      ) : (
        <div className="grid items-start gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="print:hidden space-y-4 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <h2 className="font-semibold">Mise en page</h2>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Format</p>
              <div className="grid grid-cols-3 rounded-full bg-[#e6eff0] p-1">
                {(["A4", "A5", "Ticket"] as const).map((paper) => (
                  <button
                    key={paper}
                    type="button"
                    onClick={() => changeFormat(paper)}
                    aria-pressed={format === paper}
                    className={`rounded-full px-2 py-2.5 text-sm font-semibold transition-colors ${
                      format === paper ? "bg-[#176a70] text-white shadow-sm" : "text-[#176a70] hover:bg-white/70"
                    }`}
                  >
                    {paper}
                  </button>
                ))}
              </div>
            </div>

            <label className="block space-y-1.5 text-sm font-medium">
              <span>Type de la facturation</span>
              <Select
                value={documentType}
                onChange={(value) => {
                  if (value === "facture" || value === "devis" || value === "proforma") setDocumentType(value)
                }}
                options={[
                  { value: "proforma", label: "Proforma" },
                  { value: "devis", label: "Devis" },
                  { value: "facture", label: "Facture" },
                ]}
                disabled={document.statut !== "brouillon"}
              />
            </label>

            <div>
              <label htmlFor="global-discount" className="mb-1.5 block text-sm font-medium">
                Remise globale <span className="text-xs font-normal text-muted-foreground">(sur le total, en Ar)</span>
              </label>
              <div className="flex overflow-hidden rounded-xl border border-border">
                <input
                  id="global-discount"
                  type="number"
                  min={0}
                  max={subtotal}
                  value={discountInput}
                  onChange={(event) => setDiscountInput(event.target.value)}
                  disabled={document.statut !== "brouillon"}
                  className="min-w-0 flex-1 bg-background px-3 py-3 text-sm focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const discount = Number(discountInput)
                    if (!Number.isFinite(discount) || discount < 0 || discount > subtotal) {
                      toast.error("La remise globale doit être comprise entre 0 et le total des lignes.")
                      return
                    }
                    setAppliedDiscount(discount)
                  }}
                  disabled={document.statut !== "brouillon"}
                  className="bg-[#176a70] px-4 text-sm font-semibold text-white hover:bg-[#12575c] disabled:opacity-50"
                >
                  Valider
                </button>
              </div>
            </div>

            <label className="flex cursor-pointer items-center justify-between gap-3 border-b border-border pb-4 text-sm font-medium">
              <span>Inclure la TVA <span className="text-xs text-muted-foreground">(20 %)</span></span>
              <input
                type="checkbox"
                checked={includeTax}
                onChange={(event) => setIncludeTax(event.target.checked)}
                disabled={document.statut !== "brouillon"}
                className="h-5 w-5 accent-[#176a70]"
              />
            </label>

            <button type="button" onClick={() => void validateAndDownload()} disabled={savingDocument || validatingDocument} className={`${buttonClass} bg-amber-400 text-slate-900 hover:bg-amber-300`}>
              <Download size={16} /> {validatingDocument ? "Validation..." : "Télécharger et valider"}
            </button>
            <button type="button" onClick={() => void sendByEmail()} disabled={document.statut !== "valide" || sendingEmail} className={`${buttonClass} border border-[#176a70] text-[#176a70] hover:bg-[#176a70]/5`}>
              <Mail size={16} /> {sendingEmail ? "Envoi..." : "Envoyer par mail"}
            </button>
            <button type="button" onClick={saveSettings} disabled={savingSettings} className={`${buttonClass} bg-[#e6eff0] text-[#176a70] hover:bg-[#d9e7e8]`}>
              <Save size={16} /> {savingSettings ? "Enregistrement..." : "Sauvegarder les informations"}
            </button>
            <button type="button" onClick={() => void saveDocument()} disabled={document.statut !== "brouillon" || savingDocument} className={`${buttonClass} bg-emerald-600 text-white hover:bg-emerald-700`}>
              <CheckCircle2 size={16} /> {savingDocument ? "Enregistrement..." : "Enregistrer la facture"}
            </button>
          </aside>

          <section className="min-w-0 overflow-auto rounded-xl bg-slate-200/70 p-3 sm:p-6 dark:bg-slate-900/50">
            <div
              className={`document-preview-sheet mx-auto bg-white text-slate-800 shadow-xl ${format === "Ticket" ? "ticket-preview-sheet" : "min-h-[900px]"}`}
              style={{ width: paperWidth, maxWidth: "100%", padding: paperPadding }}
            >
              <header
                className={format === "Ticket"
                  ? "border-b border-dashed pb-3 text-center"
                  : "flex items-start justify-between gap-4 border-b-2 pb-5"}
                style={{ borderColor: settings.accent }}
              >
                {format === "Ticket" ? (
                  <>
                    <div className="group relative">
                      <button
                        type="button"
                        onClick={openIssuerEditor}
                        className="absolute right-0 top-0 z-10 rounded-full bg-white/90 p-1.5 text-slate-600 opacity-0 shadow transition-opacity group-hover:opacity-100 focus:opacity-100 print:hidden"
                        aria-label="Modifier les informations de l’émetteur"
                      >
                        <Pencil size={12} />
                      </button>
                      {settings.logo ? (
                        <img src={settings.logo} alt="Logo" className="mx-auto mb-2 max-h-12 max-w-full object-contain" />
                      ) : (
                        <div className="mb-1 break-words text-lg font-bold" style={{ color: settings.accent }}>
                          {settings.companyName || "Votre entreprise"}
                        </div>
                      )}
                      {settings.logo && <p className="font-bold" style={{ color: settings.accent }}>{settings.companyName}</p>}
                      {companyLines.map((line) => <p key={line} className="break-words text-[10px] leading-4 text-slate-600">{line}</p>)}
                    </div>
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      {documentTypeLabel(documentType)}{document.statut === "brouillon" ? " · Brouillon" : ""}
                    </p>
                    <p className="text-xs font-semibold">N° {document.numero}</p>
                    <p className="text-[10px] text-slate-600">Date : {formatDate(document.date_devis)}</p>
                    <div className="group relative mt-1 border-t border-dashed border-slate-300 pt-2">
                      <button
                        type="button"
                        onClick={openRecipientEditor}
                        className="absolute right-0 top-1 z-10 rounded-full bg-white/90 p-1.5 text-slate-600 opacity-0 shadow transition-opacity group-hover:opacity-100 focus:opacity-100 print:hidden"
                        aria-label="Modifier les informations du destinataire"
                      >
                        <Pencil size={12} />
                      </button>
                      <p className="break-words text-[10px] font-medium">{recipient?.name}</p>
                      {recipient?.email && <p className="break-all text-[9px] text-slate-600">{recipient.email}</p>}
                      {recipient?.phone && <p className="text-[9px] text-slate-600">{recipient.phone}</p>}
                      {recipient?.address && <p className="break-words text-[9px] text-slate-600">{recipient.address}</p>}
                      {document.intitule && <p className="text-[10px] text-slate-600">{document.intitule}</p>}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="group relative min-w-0 rounded border border-dashed border-slate-300 p-3">
                      <button
                        type="button"
                        onClick={openIssuerEditor}
                        className="absolute right-2 top-2 z-10 rounded-full bg-white/90 p-1.5 text-slate-600 opacity-0 shadow transition-opacity group-hover:opacity-100 focus:opacity-100 print:hidden"
                        aria-label="Modifier les informations de l’émetteur"
                      >
                        <Pencil size={13} />
                      </button>
                      {settings.logo ? (
                        <img
                          src={settings.logo}
                          alt="Logo"
                          onPointerDown={startImageDrag}
                          onPointerMove={moveImage}
                          onPointerUp={() => { dragRef.current = null }}
                          style={{ width: `${settings.logoWidth}px`, transform: `translate(${settings.logoX}px, ${settings.logoY}px)`, touchAction: "none" }}
                          className="mb-2 max-h-20 max-w-full cursor-move object-contain object-left"
                        />
                      ) : (
                        <div className="mb-2 break-words text-xl font-bold tracking-wide" style={{ color: settings.accent }}>{settings.companyName || "Votre entreprise"}</div>
                      )}
                      {companyLines.map((line) => <p key={line} className="break-words text-xs leading-5 text-slate-500">{line}</p>)}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{document.statut === "brouillon" ? "Brouillon" : "Document validé"}</p>
                      <h2 className="mt-2 text-xl font-bold uppercase" style={{ color: settings.accent }}>{documentTypeLabel(documentType)}</h2>
                      <p className="mt-1 text-sm font-semibold">N° {document.numero}</p>
                      <p className="mt-1 text-xs text-slate-500">Date : {formatDate(document.date_devis)}</p>
                    </div>
                  </>
                )}
              </header>

              {format !== "Ticket" && (
                <div className="my-8 grid gap-5 sm:grid-cols-2">
                  <div className="group relative rounded border border-dashed border-slate-300 p-3">
                    <button
                      type="button"
                      onClick={openRecipientEditor}
                      className="absolute right-2 top-2 z-10 rounded-full bg-white/90 p-1.5 text-slate-600 opacity-0 shadow transition-opacity group-hover:opacity-100 focus:opacity-100 print:hidden"
                      aria-label="Modifier les informations du destinataire"
                    >
                      <Pencil size={13} />
                    </button>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Adressé à</p>
                    <p className="font-semibold">{recipient?.name}</p>
                    {recipient?.email && <p className="mt-1 break-all text-sm text-slate-600">{recipient.email}</p>}
                    {recipient?.phone && <p className="mt-1 text-sm text-slate-600">{recipient.phone}</p>}
                    {recipient?.address && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{recipient.address}</p>}
                  </div>
                  {document.intitule && (
                    <div className="sm:text-right">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Objet</p>
                      <p className="font-medium">{document.intitule}</p>
                    </div>
                  )}
                </div>
              )}

              {format === "Ticket" ? (
                <div className="border-y border-dashed py-3 text-[10px]">
                  <div className="mb-2 flex justify-between gap-2 border-b border-slate-300 pb-1 font-bold uppercase">
                    <span>Désignation</span><span>Montant</span>
                  </div>
                  {(document.lignes ?? []).map((line) => (
                    <div key={line.id_ligne_devis} className="flex justify-between gap-2 border-b border-slate-100 py-2 last:border-0">
                      <div className="min-w-0">
                        <p className="break-words font-semibold">{line.designation}</p>
                        <p className="mt-0.5 text-[9px] text-slate-600">
                          {line.quantite} × {formatAmount(line.prix_unitaire)}
                          {line.remise > 0 ? ` · remise ${formatAmount(line.remise)}` : ""}
                        </p>
                      </div>
                      <strong className="shrink-0 whitespace-nowrap">{formatAmount(line.montant)}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full min-w-0 border-collapse text-left text-xs sm:text-sm" style={{ minWidth: 0 }}>
                    <thead>
                      <tr>
                        <th className="normal-case border border-slate-900 px-2 py-2 text-left font-semibold sm:px-3">Désignation</th>
                        <th className="normal-case border border-slate-900 px-2 py-2 text-right font-semibold sm:px-3">PU (en Ar)</th>
                        <th className="normal-case border border-slate-900 px-2 py-2 text-center font-semibold sm:px-3">Quantité</th>
                        <th className="normal-case border border-slate-900 px-2 py-2 text-right font-semibold sm:px-3">Montant (en Ar)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(document.lignes ?? []).map((line) => (
                        <tr key={line.id_ligne_devis} className="border-b border-slate-100 last:border-0">
                          <td className="break-words border border-slate-900 px-2 py-2 sm:px-3">{line.designation}</td>
                          <td className="whitespace-nowrap border border-slate-900 px-2 py-2 text-right sm:px-3">{formatPaperAmount(line.prix_unitaire)}</td>
                          <td className="border border-slate-900 px-2 py-2 text-center sm:px-3">{line.quantite}</td>
                          <td className="whitespace-nowrap border border-slate-900 px-2 py-2 text-right sm:px-3">{formatPaperAmount(line.montant)}</td>
                        </tr>
                      ))}
                      {appliedDiscount > 0 && (
                        <tr>
                          <td colSpan={3} className="border border-slate-900 px-2 py-2 text-right font-medium sm:px-3">Remise globale</td>
                          <td className="border border-slate-900 px-2 py-2 text-right sm:px-3">− {formatPaperAmount(appliedDiscount)}</td>
                        </tr>
                      )}
                      {includeTax && (
                        <tr>
                          <td colSpan={3} className="border border-slate-900 px-2 py-2 text-right font-medium sm:px-3">TVA ({document.taux_tva} %)</td>
                          <td className="border border-slate-900 px-2 py-2 text-right sm:px-3">{formatPaperAmount(vatAmount)}</td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan={2} className="border border-slate-900 px-2 py-2 sm:px-3" />
                        <td className="border border-slate-900 px-2 py-2 font-semibold sm:px-3">Total</td>
                        <td className="border border-slate-900 px-2 py-2 text-right font-bold sm:px-3">{formatPaperAmount(totalTtc)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {format === "Ticket" && <div className="ml-auto mt-4 w-full max-w-none space-y-1 text-xs">
                {format === "Ticket" ? (
                  <>
                    {appliedDiscount > 0 && (
                      <div className="flex justify-between gap-2 text-slate-600"><span>Remise</span><span>− {formatAmount(appliedDiscount)}</span></div>
                    )}
                    {includeTax && (
                      <div className="flex justify-between gap-2 text-slate-600"><span>TVA ({document.taux_tva} %)</span><span>{formatAmount(vatAmount)}</span></div>
                    )}
                    <div className="flex justify-between gap-2 border-t border-slate-800 pt-2 font-bold">
                      <span>Total</span><span>{formatAmount(totalTtc)}</span>
                    </div>
                  </>
                ) : null}
              </div>}

              {document.remarque && (
                <div className={`${format === "Ticket" ? "mt-3 text-[10px]" : "mt-8 border-t border-slate-200 pt-4 text-sm"}`}>
                  <p className="mb-1 font-semibold">Remarque</p>
                  <p className="whitespace-pre-wrap text-slate-600">{document.remarque}</p>
                </div>
              )}

              <footer className={format === "Ticket"
                ? "mt-4 space-y-2 text-center text-[10px] text-slate-600"
                : "mt-8 flex items-end justify-between gap-4 border-t border-slate-200 pt-4 text-xs text-slate-500"}
              >
                {format === "Ticket" && <Barcode value={document.numero || String(document.id_devis)} height={32} />}
                <div className="flex flex-col items-start gap-2 text-slate-800">
                  {format !== "Ticket" && <p className="font-medium">Le responsable</p>}
                  {format !== "Ticket" && companyCachetUrl && (
                    <img src={companyCachetUrl} alt="Cachet de l’entreprise" className="max-h-24 max-w-[220px] object-contain" />
                  )}
                  {format === "Ticket" && <p>{settings.footer}</p>}
                </div>
              </footer>
            </div>
          </section>
        </div>
      )}
      <Modal
        open={editingCard !== null}
        onClose={() => setEditingCard(null)}
        title={editingCard === "issuer" ? "Modifier les informations de l’émetteur" : "Modifier les informations du destinataire"}
        size="lg"
      >
        {editingCard === "issuer" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-medium sm:col-span-2">
              <span>Nom de l’entreprise</span>
              <input value={issuerDraft.companyName} onChange={(event) => setIssuerDraft({ ...issuerDraft, companyName: event.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2.5" />
            </label>
            <label className="space-y-1 text-sm font-medium">
              <span>E-mail</span>
              <input type="email" value={issuerDraft.companyEmail} onChange={(event) => setIssuerDraft({ ...issuerDraft, companyEmail: event.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2.5" />
            </label>
            <label className="space-y-1 text-sm font-medium">
              <span>Téléphone</span>
              <input value={issuerDraft.companyPhone} onChange={(event) => setIssuerDraft({ ...issuerDraft, companyPhone: event.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2.5" />
            </label>
            <label className="space-y-1 text-sm font-medium sm:col-span-2">
              <span>Adresse</span>
              <textarea rows={2} value={issuerDraft.companyAddress} onChange={(event) => setIssuerDraft({ ...issuerDraft, companyAddress: event.target.value })} className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5" />
            </label>
            {([
              ["companyNif", "NIF"],
              ["companyStat", "STAT"],
              ["companyRcs", "RCS"],
            ] as const).map(([field, label]) => (
              <label key={field} className="space-y-1 text-sm font-medium">
                <span>{label}</span>
                <input value={issuerDraft[field]} onChange={(event) => setIssuerDraft({ ...issuerDraft, [field]: event.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2.5" />
              </label>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-medium sm:col-span-2">
              <span>Nom ou entreprise</span>
              <input value={recipientDraft.name} onChange={(event) => setRecipientDraft({ ...recipientDraft, name: event.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2.5" />
            </label>
            <label className="space-y-1 text-sm font-medium">
              <span>E-mail</span>
              <input type="email" value={recipientDraft.email} onChange={(event) => setRecipientDraft({ ...recipientDraft, email: event.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2.5" />
            </label>
            <label className="space-y-1 text-sm font-medium">
              <span>Téléphone</span>
              <input value={recipientDraft.phone} onChange={(event) => setRecipientDraft({ ...recipientDraft, phone: event.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2.5" />
            </label>
            <label className="space-y-1 text-sm font-medium sm:col-span-2">
              <span>Adresse</span>
              <textarea rows={2} value={recipientDraft.address} onChange={(event) => setRecipientDraft({ ...recipientDraft, address: event.target.value })} className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5" />
            </label>
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2 border-t border-border pt-4">
          <button type="button" onClick={() => setEditingCard(null)} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent">Annuler</button>
          <button type="button" onClick={saveCardEdits} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Appliquer</button>
        </div>
      </Modal>
    </div>
  )
}
