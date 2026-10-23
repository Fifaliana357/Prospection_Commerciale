import { useState } from "react"
import { Search, Upload, FileText, Image, File, Pencil } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { RecordFormModal } from "@/components/ui/Modal"

const fichiers = [
  { id: 1, nom: "Presentation Softio.pptx", type: "pptx", taille: "2.4 MB", date: "20/10/2026" },
  { id: 2, nom: "Catalogue produits.pdf", type: "pdf", taille: "5.1 MB", date: "18/10/2026" },
  { id: 3, nom: "Liste clients.xlsx", type: "xlsx", taille: "340 KB", date: "15/10/2026" },
  { id: 4, nom: "Photo équipe.png", type: "png", taille: "1.8 MB", date: "12/10/2026" },
  { id: 5, nom: "Contrat type.docx", type: "docx", taille: "89 KB", date: "10/10/2026" },
]

const typeIcon: Record<string, LucideIcon> = {
  pdf: FileText,
  pptx: FileText,
  xlsx: FileText,
  docx: FileText,
  png: Image,
  jpg: Image,
}

export default function Bibliotheque() {
  const [documents, setDocuments] = useState(fichiers)
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [initialValues, setInitialValues] = useState<Record<string, string>>({})

  const openUpload = () => {
    setEditingId(null)
    setInitialValues({})
    setModalOpen(true)
  }

  const openEdit = (document: (typeof fichiers)[number]) => {
    setEditingId(document.id)
    setInitialValues({ nom: document.nom })
    setModalOpen(true)
  }

  const saveDocument = (values: Record<string, string>) => {
    const fileName = values.nom
    const extension = fileName.split(".").pop()?.toLowerCase() || "file"
    const updated = {
      id: editingId ?? Date.now(),
      nom: fileName,
      type: extension,
      taille: editingId ? documents.find((item) => item.id === editingId)?.taille ?? "—" : "—",
      date: new Date().toLocaleDateString("fr-FR"),
    }
    setDocuments((current) => editingId
      ? current.map((item) => item.id === editingId ? updated : item)
      : [updated, ...current])
  }

  const filtered = documents.filter((f) =>
    f.nom.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bibliothèque</h1>
          <p className="text-muted-foreground text-sm mt-1">Gérez vos fichiers et documents</p>
        </div>
        <button onClick={openUpload} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
          <Upload size={18} /> Téléverser
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="Rechercher un fichier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((f) => {
          const Icon = typeIcon[f.type] || File
          return (
            <div key={f.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Icon size={22} />
                </div>
                <button onClick={() => openEdit(f)} title="Renommer" aria-label={`Renommer ${f.nom}`} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
                  <Pencil size={15} />
                </button>
              </div>
              <h3 className="font-medium text-sm truncate">{f.nom}</h3>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>{f.taille}</span>
                <span>{f.date}</span>
              </div>
            </div>
          )
        })}
      </div>
      <RecordFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={saveDocument}
        title={editingId ? "Renommer le document" : "Téléverser un document"}
        description={editingId ? "Modifiez le nom affiché dans la bibliothèque." : "Choisissez un fichier à ajouter à la bibliothèque."}
        initialValues={initialValues}
        fields={editingId
          ? [{ name: "nom", label: "Nom du document", required: true }]
          : [{ name: "nom", label: "Fichier", type: "file", required: true }]}
        submitLabel={editingId ? "Enregistrer" : "Ajouter le document"}
      />
    </div>
  )
}