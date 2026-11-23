import { useEffect, useRef, useState } from 'react';
import {
  Search, Upload, Trash2, FileText, Image, FileSpreadsheet, File,
  RefreshCw, FolderOpen, Download, Layers, ChevronDown, ChevronUp, HardDrive,
} from 'lucide-react';
import {
  getFichiers, uploadFichier, deleteFichier, type Fichier,
} from '../services/bibliotheque';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import PageHeader from '../components/ui/PageHeader';
import { ModalPortal } from '../components/ui/Modal';
import FilterPills from '../components/ui/FilterPills';
import ProtectedImage from '../components/ui/ProtectedImage';

const TYPE_FILTERS = [
  { value: 'tous', label: 'Tous', icon: <Layers size={14} /> },
  { value: 'pdf', label: 'PDF', icon: <FileText size={14} /> },
  { value: 'image', label: 'Images', icon: <Image size={14} /> },
  { value: 'word', label: 'Word', icon: <FileText size={14} /> },
  { value: 'excel', label: 'Excel', icon: <FileSpreadsheet size={14} /> },
  { value: 'powerpoint', label: 'PowerPoint', icon: <File size={14} /> },
];

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' o';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
  return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
}

function typeIcon(type: string) {
  switch (type) {
    case 'pdf':
      return <FileText size={28} className="text-red-500" />;
    case 'image':
      return <Image size={28} className="text-blue-500" />;
    case 'excel':
      return <FileSpreadsheet size={28} className="text-emerald-600" />;
    case 'word':
      return <FileText size={28} className="text-sky-600" />;
    case 'powerpoint':
      return <FileText size={28} className="text-orange-500" />;
    default:
      return <File size={28} className="text-muted-foreground" />;
  }
}

export default function Bibliotheque() {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<Fichier[]>([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('tous');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [totalSize, setTotalSize] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [maxSize] = useState(5 * 1024 * 1024 * 1024);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [storageExpanded, setStorageExpanded] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getFichiers({
        search: search || undefined,
        type: type !== 'tous' ? type : undefined,
      });
      setFiles(res.data || []);
      setTotalSize(res.total_size || 0);
      setTotalFiles(res.total || res.data?.length || 0);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, type]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      await uploadFichier(file);
      toast.success('Fichier téléversé');
      fetchData();
    } catch {
      toast.error('Erreur lors du téléversement');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDownload = async (id: number, nom: string) => {
    try {
      const res = await api.get(`/bibliotheque/${id}/download`, {
        responseType: 'blob',
      });
      const objectUrl = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = nom;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      toast.error('Erreur de téléchargement');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteFichier(deleteId);
      toast.success('Fichier supprimé');
      setDeleteId(null);
      fetchData();
    } catch {
      toast.error('Erreur suppression');
    }
  };

  const usagePct = maxSize > 0 ? Math.min(100, Math.round((totalSize / maxSize) * 100)) : 0;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <PageHeader title="Bibliothèque" description="Gérez vos fichiers et documents." icon={<FolderOpen size={23} />} />

      <div className="list-toolbar mb-4">
        <div className="relative min-w-[14rem] flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un dossier ou un fichier"
            className="w-full rounded-xl bg-card py-2.5 pl-10 pr-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            aria-label="Rechercher un fichier"
          />
        </div>
        <FilterPills value={type} options={TYPE_FILTERS} onChange={setType} />
        <button
          type="button"
          onClick={fetchData}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-accent"
          title="Actualiser"
          aria-label="Actualiser les fichiers"
        >
          <RefreshCw size={18} />
        </button>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:opacity-90">
          <Upload size={18} />
          {uploading ? 'Envoi...' : 'Téléverser'}
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
        <span className="whitespace-nowrap text-xs text-muted-foreground" data-toolbar-total>
          {totalFiles} fichier{totalFiles === 1 ? '' : 's'}
        </span>
      </div>

      <div className="rounded-xl bg-card shadow-sm min-h-[240px] p-4">
          {loading ? (
            <p className="text-center text-muted-foreground py-16">Chargement...</p>
          ) : files.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">Aucun fichier à afficher</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {files.map((f) => {
                const isImage = f.type === 'image';
                return (
                  <div
                    key={f.id_fichier}
                    className="relative group rounded-xl border border-border p-3 text-center hover:shadow-md transition-shadow"
                  >
                    <div className="absolute top-2 right-2 flex gap-1 z-10">
                      <button
                        type="button"
                        onClick={() => handleDownload(f.id_fichier, f.nom)}
                        className="library-file-action inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 p-1 shadow text-primary hover:bg-primary hover:text-white transition-colors"
                        title="Télécharger"
                      >
                        <Download size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(f.id_fichier)}
                        className="library-file-action inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 p-1 shadow text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                        title="Supprimer le fichier"
                        aria-label={`Supprimer ${f.nom}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="pt-1">
                      {isImage ? (
                        <ProtectedImage
                          endpoint={`/bibliotheque/${f.id_fichier}/preview`}
                          alt={f.nom}
                          className="mb-2 h-24 w-full rounded-lg object-contain"
                        />
                      ) : (
                        <div className="w-full h-24 flex items-center justify-center rounded-lg bg-muted/40 mb-2">
                          {typeIcon(f.type)}
                        </div>
                      )}
                      <p className="text-xs truncate">{f.nom}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatSize(f.taille)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>

      <div className="fixed bottom-4 right-4 z-40">
        <div className="min-w-[13rem] rounded-2xl border border-primary/15 bg-card p-3 shadow-[0_8px_24px_rgba(15,35,40,0.14)]">
          {storageExpanded && (
            <div className="flex justify-center pb-2">
              <div className="relative h-36 w-36">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-primary/15" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${usagePct} ${100 - usagePct}`}
                    className="text-primary"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <HardDrive size={30} className="mb-1 text-primary" />
                  <span className="text-xs font-semibold">{formatSize(totalSize)} / 5 Go</span>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStorageExpanded((expanded) => !expanded)}
              className="flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold text-primary"
              aria-expanded={storageExpanded}
              aria-label={storageExpanded ? "Masquer l’espace de stockage" : "Afficher l’espace de stockage"}
            >
              {storageExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              <HardDrive size={15} />
              <span className="whitespace-nowrap">Espace de stockage</span>
            </button>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-4 border-primary/15 text-sm font-semibold text-foreground">
              {usagePct}%
            </span>
          </div>
        </div>
      </div>

      {deleteId && (
        <ModalPortal onClose={() => setDeleteId(null)}>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-xl w-full max-w-sm p-6 shadow-xl text-center">
            <h3 className="font-semibold mb-2">Supprimer ce fichier ?</h3>
            <p className="text-sm text-muted-foreground mb-5">Action irréversible.</p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-lg shadow-sm text-sm hover:bg-accent"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
}