import { useEffect, useMemo, useRef, useState } from "react"
import type { PointerEvent as ReactPointerEvent } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft, FileImage, FileText, Palette, Printer,
  RotateCcw, Save, Settings2, Signature,
} from "lucide-react"
import { useToast } from "@/contexts/ToastContext"
import { getSessionUser } from "@/lib/session"
import {
  getFacturationDocument,
  type DocumentType,
  type FacturationDocument,
} from "@/services/facturation"

type PaperFormat = "A4" | "A5" | "Ticket"

interface PreviewSettings {
  paperFormat: PaperFormat
  companyName: string
  companyEmail: string
  companyPhone: string
  companyAddress: string
  footer: string
  accent: string
  logo: string
  logoWidth: number
  logoX: number
  logoY: number
  signature: string
  signatureWidth: number
  signatureX: number
  signatureY: number
  showReference: boolean
  showDiscount: boolean
}

const palette = [
  { name: "Bleu pétrole", value: "#176a70" },
  { name: "Bleu marine", value: "#244a73" },
  { name: "Vert", value: "#287a57" },
  { name: "Bordeaux", value: "#8f3f55" },
]

const settingsKey = `@Softio:facturation:preview:${getSessionUser().email || "default"}`

function defaultSettings(): PreviewSettings {
  const user = getSessionUser()
  return {
    paperFormat: "A4",
    companyName: user.nom,
    companyEmail: user.email,
    companyPhone: "",
    companyAddress: "",
    footer: "Merci pour votre confiance.",
    accent: palette[0].value,
    logo: "",
    logoWidth: 140,
    logoX: 0,
    logoY: 0,
    signature: "",
    signatureWidth: 150,
    signatureX: 0,
    signatureY: 0,
    showReference: true,
    showDiscount: true,
  }
}

function formatAmount(value: number) {
  return `${new Intl.NumberFormat("fr-FR").format(value)} MGA`
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
    && typeof settings.footer === "string"
    && typeof settings.accent === "string"
    && typeof settings.logo === "string"
    && typeof settings.logoWidth === "number"
    && typeof settings.logoX === "number"
    && typeof settings.logoY === "number"
    && typeof settings.signature === "string"
    && typeof settings.signatureWidth === "number"
    && typeof settings.signatureX === "number"
    && typeof settings.signatureY === "number"
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

function fileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result)
      else reject(new Error("Le fichier sélectionné n’a pas pu être lu."))
    }
    reader.onerror = () => reject(new Error("Impossible de lire le fichier sélectionné."))
    reader.readAsDataURL(file)
  })
}

export default function FacturationApercu() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const toastRef = useRef(toast)
  const dragRef = useRef<{
    target: "logo" | "signature"
    startX: number
    startY: number
    offsetX: number
    offsetY: number
  } | null>(null)
  const [initialSettings] = useState(readInitialSettings)
  const [document, setDocument] = useState<FacturationDocument | null>(null)
  const [settings, setSettings] = useState<PreviewSettings>(initialSettings.settings)
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)

  useEffect(() => {
    toastRef.current = toast
  }, [toast])

  useEffect(() => {
    if (initialSettings.error) toastRef.current.error(initialSettings.error)
  }, [initialSettings.error])

  useEffect(() => {
    let active = true
    const documentId = Number(id)
    if (!Number.isInteger(documentId) || documentId < 1) {
      toastRef.current.error("Identifiant de document invalide.")
      return () => { active = false }
    }

    getFacturationDocument(documentId)
      .then((result) => {
        if (active) setDocument(result)
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
    () => (document?.lignes ?? []).reduce((sum, line) => sum + line.montant, 0) + (document?.remise_globale ?? 0),
    [document],
  )

  const saveSettings = () => {
    try {
      setSavingSettings(true)
      localStorage.setItem(settingsKey, JSON.stringify(settings))
      toast.success("La mise en page a été enregistrée.")
    } catch {
      toast.error("Impossible d’enregistrer la mise en page. Vérifiez l’espace de stockage disponible.")
    } finally {
      setSavingSettings(false)
    }
  }

  const updateImage = async (field: "logo" | "signature", file?: File) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Sélectionnez un fichier image.")
      return
    }
    if (file.size > 1_000_000) {
      toast.error("L’image doit faire 1 Mo ou moins.")
      return
    }
    try {
      const image = await fileAsDataUrl(file)
      setSettings((current) => ({ ...current, [field]: image }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de charger cette image.")
    }
  }

  const startImageDrag = (target: "logo" | "signature", event: ReactPointerEvent<HTMLImageElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      target,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: settings[`${target}X`],
      offsetY: settings[`${target}Y`],
    }
  }

  const moveImage = (event: ReactPointerEvent<HTMLImageElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const x = Math.max(-120, Math.min(320, drag.offsetX + event.clientX - drag.startX))
    const y = Math.max(-100, Math.min(700, drag.offsetY + event.clientY - drag.startY))
    setSettings((current) => drag.target === "logo"
      ? { ...current, logoX: x, logoY: y }
      : { ...current, signatureX: x, signatureY: y })
  }

  const changeFormat = (value: string) => {
    if (value === "A4" || value === "A5" || value === "Ticket") {
      setSettings((current) => ({ ...current, paperFormat: value }))
    }
  }

  const format = settings.paperFormat
  const paperWidth = format === "A4" ? "794px" : format === "A5" ? "559px" : "360px"
  const paperPadding = format === "Ticket" ? "24px" : format === "A5" ? "34px" : "52px"
  const pageSize = format === "Ticket" ? "80mm auto" : format
  const companyLines = [settings.companyEmail, settings.companyPhone, settings.companyAddress].filter(Boolean)

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
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={saveSettings}
            disabled={savingSettings}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            <Save size={16} /> {savingSettings ? "Enregistrement..." : "Enregistrer la mise en page"}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!document}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <Printer size={16} /> Imprimer / PDF
          </button>
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
              <Settings2 size={17} className="text-primary" />
              <h2 className="font-semibold">Mise en page</h2>
            </div>

            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Format du papier</span>
              <select value={format} onChange={(event) => changeFormat(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5">
                <option value="A4">A4 — Portrait</option>
                <option value="A5">A5 — Portrait</option>
                <option value="Ticket">Ticket — 80 mm</option>
              </select>
            </label>

            <div className="space-y-2">
              <p className="flex items-center gap-2 text-sm font-medium"><Palette size={15} /> Couleur principale</p>
              <div className="flex flex-wrap gap-2">
                {palette.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setSettings((current) => ({ ...current, accent: color.value }))}
                    className={`h-8 w-8 rounded-full ring-offset-2 ${settings.accent === color.value ? "ring-2 ring-primary" : ""}`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                    aria-label={`Couleur ${color.name}`}
                  />
                ))}
                <input
                  type="color"
                  value={settings.accent}
                  onChange={(event) => setSettings((current) => ({ ...current, accent: event.target.value }))}
                  className="h-8 w-10 cursor-pointer rounded border border-border p-0.5"
                  aria-label="Choisir une couleur"
                />
              </div>
            </div>

            <div className="space-y-3 border-t border-border pt-3">
              <p className="text-sm font-semibold">Informations de l’émetteur</p>
              <label className="block space-y-1 text-xs font-medium">
                <span>Nom de l’entreprise</span>
                <input value={settings.companyName} onChange={(event) => setSettings({ ...settings, companyName: event.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </label>
              <label className="block space-y-1 text-xs font-medium">
                <span>E-mail</span>
                <input type="email" value={settings.companyEmail} onChange={(event) => setSettings({ ...settings, companyEmail: event.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </label>
              <label className="block space-y-1 text-xs font-medium">
                <span>Téléphone</span>
                <input value={settings.companyPhone} onChange={(event) => setSettings({ ...settings, companyPhone: event.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </label>
              <label className="block space-y-1 text-xs font-medium">
                <span>Adresse</span>
                <textarea value={settings.companyAddress} onChange={(event) => setSettings({ ...settings, companyAddress: event.target.value })} className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm" rows={2} />
              </label>
            </div>

            <div className="space-y-3 border-t border-border pt-3">
              <p className="text-sm font-semibold">Logo et signature</p>
              <p className="text-xs text-muted-foreground">Glissez les images dans l’aperçu pour les déplacer.</p>
              <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-accent">
                <span className="inline-flex items-center gap-2"><FileImage size={15} /> Ajouter un logo</span>
                <input type="file" accept="image/*" className="sr-only" onChange={(event) => void updateImage("logo", event.target.files?.[0])} />
              </label>
              {settings.logo && (
                <div className="space-y-2">
                  <img src={settings.logo} alt="Logo de l’entreprise" className="max-h-14 max-w-full object-contain" />
                  <input aria-label="Largeur du logo" type="range" min="60" max="260" value={settings.logoWidth} onChange={(event) => setSettings({ ...settings, logoWidth: Number(event.target.value) })} className="w-full" />
                  <button type="button" onClick={() => setSettings({ ...settings, logo: "" })} className="text-xs text-destructive hover:underline">Retirer le logo</button>
                </div>
              )}
              <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-accent">
                <span className="inline-flex items-center gap-2"><Signature size={15} /> Ajouter une signature</span>
                <input type="file" accept="image/*" className="sr-only" onChange={(event) => void updateImage("signature", event.target.files?.[0])} />
              </label>
              {settings.signature && (
                <div className="space-y-2">
                  <img src={settings.signature} alt="Signature de l’entreprise" className="max-h-16 max-w-full object-contain" />
                  <input aria-label="Largeur de la signature" type="range" min="60" max="260" value={settings.signatureWidth} onChange={(event) => setSettings({ ...settings, signatureWidth: Number(event.target.value) })} className="w-full" />
                  <button type="button" onClick={() => setSettings({ ...settings, signature: "" })} className="text-xs text-destructive hover:underline">Retirer la signature</button>
                </div>
              )}
            </div>

            <div className="space-y-3 border-t border-border pt-3">
              <p className="text-sm font-semibold">Affichage</p>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={settings.showReference} onChange={(event) => setSettings({ ...settings, showReference: event.target.checked })} />
                Afficher les références
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={settings.showDiscount} onChange={(event) => setSettings({ ...settings, showDiscount: event.target.checked })} />
                Afficher les remises
              </label>
              <label className="block space-y-1 text-xs font-medium">
                <span>Texte de pied de page</span>
                <input value={settings.footer} onChange={(event) => setSettings({ ...settings, footer: event.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </label>
            </div>

            <button type="button" onClick={() => setSettings(defaultSettings())} className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
              <RotateCcw size={14} /> Réinitialiser les paramètres
            </button>
          </aside>

          <section className="min-w-0 overflow-auto rounded-xl bg-slate-200/70 p-3 sm:p-6 dark:bg-slate-900/50">
            <div
              className="document-preview-sheet mx-auto min-h-[900px] bg-white text-slate-800 shadow-xl"
              style={{ width: paperWidth, maxWidth: "100%", padding: paperPadding }}
            >
              <header className="flex items-start justify-between gap-4 border-b-2 pb-5" style={{ borderColor: settings.accent }}>
                <div className="min-w-0">
                  {settings.logo ? (
                    <img
                      src={settings.logo}
                      alt="Logo"
                      onPointerDown={(event) => startImageDrag("logo", event)}
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
                  <h2 className="mt-2 text-xl font-bold uppercase" style={{ color: settings.accent }}>{documentTypeLabel(document.type)}</h2>
                  <p className="mt-1 text-sm font-semibold">N° {document.numero}</p>
                  <p className="mt-1 text-xs text-slate-500">Date : {formatDate(document.date_devis)}</p>
                </div>
              </header>

              <div className="my-8 grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Adressé à</p>
                  <p className="font-semibold">{clientLabel(document)}</p>
                  {document.client.email && <p className="mt-1 break-all text-sm text-slate-600">{document.client.email}</p>}
                  {document.client.telephone && <p className="mt-1 text-sm text-slate-600">{document.client.telephone}</p>}
                </div>
                {document.intitule && (
                  <div className="sm:text-right">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Objet</p>
                    <p className="font-medium">{document.intitule}</p>
                  </div>
                )}
              </div>

              {format === "Ticket" ? (
                <div className="space-y-3 border-y border-dashed py-4">
                  {(document.lignes ?? []).map((line) => (
                    <div key={line.id_ligne_devis} className="border-b border-slate-100 pb-2 text-sm">
                      <p className="font-semibold">{line.designation}</p>
                      <div className="mt-1 flex justify-between gap-2 text-xs text-slate-600">
                        <span>{line.quantite} × {formatAmount(line.prix_unitaire)}</span><strong>{formatAmount(line.montant)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full min-w-0 border-collapse text-left text-xs" style={{ minWidth: 0 }}>
                    <thead>
                      <tr style={{ backgroundColor: settings.accent, color: "white" }}>
                        {settings.showReference && <th className="px-3 py-3 font-semibold">Référence</th>}
                        <th className="px-3 py-3 font-semibold">Désignation</th>
                        <th className="px-3 py-3 text-right font-semibold">Prix unitaire</th>
                        <th className="px-3 py-3 text-center font-semibold">Qté</th>
                        {settings.showDiscount && <th className="px-3 py-3 text-right font-semibold">Remise</th>}
                        <th className="px-3 py-3 text-right font-semibold">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(document.lignes ?? []).map((line) => (
                        <tr key={line.id_ligne_devis} className="border-b border-slate-100 last:border-0">
                          {settings.showReference && <td className="px-3 py-3 text-slate-500">{line.produit?.reference || line.offre?.denomination || "—"}</td>}
                          <td className="px-3 py-3 font-medium">{line.designation}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-right">{formatAmount(line.prix_unitaire)}</td>
                          <td className="px-3 py-3 text-center">{line.quantite}</td>
                          {settings.showDiscount && <td className="whitespace-nowrap px-3 py-3 text-right">{line.remise ? formatAmount(line.remise) : "—"}</td>}
                          <td className="whitespace-nowrap px-3 py-3 text-right font-semibold">{formatAmount(line.montant)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="ml-auto mt-6 w-full max-w-[290px] space-y-2 text-sm">
                <div className="flex justify-between gap-4 text-slate-600"><span>Sous-total</span><span>{formatAmount(subtotal)}</span></div>
                {settings.showDiscount && document.remise_globale > 0 && (
                  <div className="flex justify-between gap-4 text-slate-600"><span>Remise globale</span><span>− {formatAmount(document.remise_globale)}</span></div>
                )}
                <div className="flex justify-between gap-4 text-slate-600"><span>Total HT</span><span>{formatAmount(document.montant_ht)}</span></div>
                {document.inclure_tva && (
                  <div className="flex justify-between gap-4 text-slate-600"><span>TVA ({document.taux_tva} %)</span><span>{formatAmount(document.montant_ttc - document.montant_ht)}</span></div>
                )}
                <div className="flex justify-between gap-4 border-t-2 pt-3 text-base font-bold" style={{ borderColor: settings.accent, color: settings.accent }}>
                  <span>Total TTC</span><span>{formatAmount(document.montant_ttc)}</span>
                </div>
              </div>

              {document.remarque && <div className="mt-8 border-t border-slate-200 pt-4 text-sm"><p className="mb-1 font-semibold">Remarque</p><p className="whitespace-pre-wrap text-slate-600">{document.remarque}</p></div>}

              <footer className="mt-14 flex items-end justify-between gap-4 border-t border-slate-200 pt-4 text-xs text-slate-500">
                <p>{settings.footer}</p>
                {settings.signature && (
                  <div className="text-center">
                    <img
                      src={settings.signature}
                      alt="Signature"
                      onPointerDown={(event) => startImageDrag("signature", event)}
                      onPointerMove={moveImage}
                      onPointerUp={() => { dragRef.current = null }}
                      style={{ width: `${settings.signatureWidth}px`, transform: `translate(${settings.signatureX}px, ${settings.signatureY}px)`, touchAction: "none" }}
                      className="mb-1 max-h-20 cursor-move object-contain"
                    />
                    <p>{settings.companyName}</p>
                  </div>
                )}
              </footer>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
