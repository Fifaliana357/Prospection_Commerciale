import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Pencil, Trash2, Package, Download, Printer, ImageIcon,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
  getProduits, createProduit, updateProduit, deleteProduit,
  getOffres, createOffre, updateOffre, deleteOffre,
  type Produit, type Offre,
} from '../services/catalogue';
import Barcode from '../components/Barcode';
import TablePagination from '../components/ui/TablePagination';
import TableSummary from '../components/ui/TableSummary';
import PageHeader from '../components/ui/PageHeader';
import { ModalPortal } from '../components/ui/Modal';
import { useToast } from '../contexts/ToastContext';
import { formatMGA } from '../lib/utils';
import { getSessionUser } from '../lib/session';

type Tab = 'produit' | 'service' | 'historique';

const API_URL = 'http://127.0.0.1:8000';

function photoUrl(photo?: string | null) {
  if (!photo) return null;
  if (photo.startsWith('http')) return photo;
  const clean = photo.replace(/^\/+/, '').replace(/^storage\//, '');
  return `${API_URL}/storage/${clean}`;
}

export default function Catalogue() {
  const toast = useToast();
  const toastRef = useRef(toast);
  const navigate = useNavigate();
  const canEditCatalog = getSessionUser().role === 'admin';
  const [tab, setTab] = useState<Tab>('produit');

  const [produits, setProduits] = useState<Produit[]>([]);
  const [productHistory, setProductHistory] = useState<Produit[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [pTotal, setPTotal] = useState(0);
  const [pPage, setPPage] = useState(1);
  const [pLast, setPLast] = useState(1);

  const [offres, setOffres] = useState<Offre[]>([]);
  const [oTotal, setOTotal] = useState(0);
  const [oPage, setOPage] = useState(1);
  const [oLast, setOLast] = useState(1);

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal produit
  const [showPModal, setShowPModal] = useState(false);
  const [editProduit, setEditProduit] = useState<Produit | null>(null);
  const [pForm, setPForm] = useState({
    reference: '',
    designation: '',
    description: '',
    prix_unitaire: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  // Modal service
  const [showOModal, setShowOModal] = useState(false);
  const [editOffre, setEditOffre] = useState<Offre | null>(null);
  const [oForm, setOForm] = useState({
    denomination: '',
    description: '',
    tarif: '',
  });

  const [deleteTarget, setDeleteTarget] = useState<{ type: Tab; id: number } | null>(null);

  const [photoModal, setPhotoModal] = useState<{
    open: boolean;
    url: string | null;
    title: string;
    reference?: string;
  }>({ open: false, url: null, title: '' });

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const fetchProduits = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getProduits({ search: search || undefined, page: pPage });
      setProduits(res.data || []);
      setPTotal(res.total || 0);
      setPLast(res.last_page || 1);
    } catch {
      toastRef.current.error('Erreur chargement produits');
    } finally {
      setLoading(false);
    }
  }, [pPage, search]);

  const fetchOffres = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getOffres({ search: search || undefined, page: oPage });
      setOffres(res.data || []);
      setOTotal(res.total || 0);
      setOLast(res.last_page || 1);
    } catch {
      toastRef.current.error('Erreur chargement services');
    } finally {
      setLoading(false);
    }
  }, [oPage, search]);

  const fetchProductHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      let all: Produit[] = [];
      let page = 1;
      let last = 1;
      do {
        const res = await getProduits({ search: search || undefined, page });
        all = [...all, ...(res.data || [])];
        last = res.last_page || 1;
        page++;
      } while (page <= last);
      setProductHistory(
        all.sort((a, b) => {
          const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
          const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
          return dateB - dateA;
        }),
      );
    } catch {
      toastRef.current.error('Erreur chargement de l’historique des produits');
    } finally {
      setHistoryLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (tab === 'produit') void fetchProduits();
      else if (tab === 'service') void fetchOffres();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [tab, fetchProduits, fetchOffres]);

  useEffect(() => {
    if (tab !== 'historique') return;
    const timer = window.setTimeout(() => void fetchProductHistory(), 0);
    return () => window.clearTimeout(timer);
  }, [tab, fetchProductHistory]);

  const openCreateProduit = () => {
    setEditProduit(null);
    setPForm({ reference: '', designation: '', description: '', prix_unitaire: '' });
    setPhotoFile(null);
    setPhotoPreview(null);
    setShowPModal(true);
  };

  const openEditProduit = (p: Produit) => {
    setEditProduit(p);
    setPForm({
      reference: p.reference || '',
      designation: p.designation || '',
      description: p.description || '',
      prix_unitaire: String(p.prix_unitaire ?? ''),
    });
    setPhotoFile(null);
    setPhotoPreview(photoUrl(p.photo));
    setShowPModal(true);
  };

  const saveProduit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pForm.reference || !pForm.designation || !pForm.prix_unitaire) {
      toast.error('Référence, désignation et prix obligatoires');
      return;
    }
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append('reference', pForm.reference);
      fd.append('designation', pForm.designation);
      fd.append('description', pForm.description || '');
      fd.append('prix_unitaire', pForm.prix_unitaire);
      if (photoFile) fd.append('photo', photoFile);

      if (editProduit) {
        await updateProduit(editProduit.id_produit, fd);
        toast.success('Produit modifié');
      } else {
        await createProduit(fd);
        toast.success('Produit créé');
      }
      setShowPModal(false);
      fetchProduits();
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const openCreateOffre = () => {
    setEditOffre(null);
    setOForm({ denomination: '', description: '', tarif: '' });
    setShowOModal(true);
  };

  const openEditOffre = (o: Offre) => {
    setEditOffre(o);
    setOForm({
      denomination: o.denomination || '',
      description: o.description || '',
      tarif: String(o.tarif ?? ''),
    });
    setShowOModal(true);
  };

  const saveOffre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oForm.denomination || !oForm.tarif) {
      toast.error('Dénomination et tarif obligatoires');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        denomination: oForm.denomination,
        description: oForm.description || undefined,
        tarif: Number(oForm.tarif),
      };
      if (editOffre) {
        await updateOffre(editOffre.id_offre, payload);
        toast.success('Service modifié');
      } else {
        await createOffre(payload);
        toast.success('Service créé');
      }
      setShowOModal(false);
      fetchOffres();
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'produit') {
        await deleteProduit(deleteTarget.id);
        toast.success('Produit supprimé');
        fetchProduits();
      } else {
        await deleteOffre(deleteTarget.id);
        toast.success('Service supprimé');
        fetchOffres();
      }
      setDeleteTarget(null);
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const exportExcel = () => {
    const rows = produits.map((p) => ({
      Référence: p.reference,
      Désignation: p.designation,
      Description: p.description || '',
      Montant: Number(p.prix_unitaire),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Produits');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), 'Produits.xlsx');
  };

  const formatMoney = (n: number) => formatMGA(n);

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">
      <PageHeader title="Services et produits" description="Gérez votre catalogue." icon={<Package size={23} />} />

      {/* Tabs */}
      <div className="page-tabs mb-4" role="tablist" aria-label="Catalogue">
        {([
          { key: 'produit' as Tab, label: 'Produit' },
          { key: 'service' as Tab, label: 'Service' },
          { key: 'historique' as Tab, label: 'Historique' },
        ]).map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => {
              setTab(t.key);
              setSearch('');
            }}
            className="page-tab"
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search + actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (tab === 'produit') setPPage(1);
              else if (tab === 'service') setOPage(1);
            }}
            placeholder="Rechercher..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {tab === 'produit' && (
          <>
            <button
              onClick={exportExcel}
              className="inline-flex items-center gap-2 px-3 py-2.5 rounded-lg bg-card shadow-sm text-sm hover:bg-accent"
            >
              <Download size={16} /> Exporter
            </button>
            <button
              onClick={() => navigate('/catalogue/impression')}
              className="inline-flex items-center gap-2 px-3 py-2.5 rounded-lg bg-card shadow-sm text-sm hover:bg-accent"
            >
              <Printer size={16} /> Tout imprimer
            </button>
          </>
        )}

        {canEditCatalog && tab !== 'historique' && (
          <button
            onClick={tab === 'produit' ? openCreateProduit : openCreateOffre}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90"
          >
            <Plus size={18} />
            {tab === 'produit' ? 'Nouveau produit' : 'Nouveau service'}
          </button>
        )}
        {tab !== 'historique' ? (
          <TableSummary total={tab === 'produit' ? pTotal : oTotal} label={tab === 'produit' ? 'produits' : 'services'} />
        ) : (
          <TableSummary total={productHistory.length} label="produits dans l’historique" />
        )}
      </div>

      {/* Table Produits */}
      {tab === 'produit' && (
        <div className="rounded-xl bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="px-3 py-3 text-left font-medium">Référence</th>
                  <th className="px-3 py-3 text-left font-medium">Désignation</th>
                  <th className="px-3 py-3 text-left font-medium">Description</th>
                  <th className="px-3 py-3 text-left font-medium">Montant</th>
                  <th className="px-3 py-3 text-left font-medium">Code-barre</th>
                  <th className="px-3 py-3 text-right font-medium">{canEditCatalog ? 'Actions' : 'Photo'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      Chargement...
                    </td>
                  </tr>
                ) : produits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      Aucun produit
                    </td>
                  </tr>
                ) : (
                  produits.map((p) => (
                    <tr key={p.id_produit} className="hover:bg-accent/40">
                      <td className="px-3 py-2.5 font-medium whitespace-nowrap">{p.reference}</td>
                      <td className="px-3 py-2.5">{p.designation}</td>
                      <td className="px-3 py-2.5 max-w-[200px] truncate">{p.description || '—'}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {formatMoney(Number(p.prix_unitaire))}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="bg-white rounded px-1 py-0.5 inline-block">
                          <Barcode value={p.reference} designation={p.designation} height={36} />
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex justify-end gap-1.5">
                          {canEditCatalog && <button
                            onClick={() => openEditProduit(p)}
                            className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"
                            title="Modifier"
                          >
                            <Pencil size={15} />
                          </button>}
                          <button
                            onClick={() =>
                              setPhotoModal({
                                open: true,
                                url: photoUrl(p.photo),
                                title: p.designation,
                                reference: p.reference,
                              })
                            }
                            className={`p-1.5 rounded-lg ${
                              p.photo
                                ? 'bg-sky-500/10 text-sky-600 hover:bg-sky-500/20'
                                : 'bg-muted text-muted-foreground'
                            }`}
                            title="Voir la photo"
                          >
                            <ImageIcon size={15} />
                          </button>
                          {canEditCatalog && <button
                            onClick={() => setDeleteTarget({ type: 'produit', id: p.id_produit })}
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20"
                            title="Supprimer"
                          >
                            <Trash2 size={15} />
                          </button>}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <TablePagination page={pPage} lastPage={pLast} onChange={setPPage} />
        </div>
      )}

      {tab === 'historique' && (
        <div className="rounded-xl bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="px-3 py-3 text-left font-medium">Référence</th>
                  <th className="px-3 py-3 text-left font-medium">Désignation</th>
                  <th className="px-3 py-3 text-right font-medium">Créé le</th>
                  <th className="px-3 py-3 text-right font-medium">Dernière modification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {historyLoading ? (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">Chargement...</td></tr>
                ) : productHistory.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">Aucun produit dans l’historique</td></tr>
                ) : productHistory.map((product) => (
                  <tr key={product.id_produit} className="hover:bg-accent/40">
                    <td className="px-3 py-2.5 font-medium whitespace-nowrap">{product.reference}</td>
                    <td className="px-3 py-2.5">{product.designation}</td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground">
                      {product.created_at ? new Date(product.created_at).toLocaleString('fr-FR') : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground">
                      {product.updated_at ? new Date(product.updated_at).toLocaleString('fr-FR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Table Services */}
      {tab === 'service' && (
        <div className="rounded-xl bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="px-3 py-3 text-left font-medium">Dénomination</th>
                  <th className="px-3 py-3 text-left font-medium">Description</th>
                  <th className="px-3 py-3 text-left font-medium">Montant</th>
                  {canEditCatalog && <th className="px-3 py-3 text-right font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={canEditCatalog ? 4 : 3} className="px-4 py-12 text-center text-muted-foreground">
                      Chargement...
                    </td>
                  </tr>
                ) : offres.length === 0 ? (
                  <tr>
                    <td colSpan={canEditCatalog ? 4 : 3} className="px-4 py-12 text-center text-muted-foreground">
                      Aucun service
                    </td>
                  </tr>
                ) : (
                  offres.map((o) => (
                    <tr key={o.id_offre} className="hover:bg-accent/40">
                      <td className="px-3 py-2.5 font-medium">{o.denomination}</td>
                      <td className="px-3 py-2.5 max-w-[280px] truncate">{o.description || '—'}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {formatMoney(Number(o.tarif))}
                      </td>
                      {canEditCatalog && <td className="px-3 py-2.5">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => openEditOffre(o)}
                            className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ type: 'service', id: o.id_offre })}
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <TablePagination page={oPage} lastPage={oLast} onChange={setOPage} />
        </div>
      )}

      {/* Modal Produit */}
      {showPModal && (
        <ModalPortal onClose={() => setShowPModal(false)}>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 shadow-sm sticky top-0 bg-card">
              <h2 className="font-semibold">
                {editProduit ? 'Modifier le produit' : 'Nouveau produit'}
              </h2>
              <button onClick={() => setShowPModal(false)} className="p-1.5 rounded-lg hover:bg-accent">
                <span className="modal-close-symbol">✕</span>
              </button>
            </div>
          <form onSubmit={saveProduit} className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Référence *</label>
                <input
                  required
                  value={pForm.reference}
                  onChange={(e) => setPForm({ ...pForm, reference: e.target.value })}
                  className="mt-1 w-full px-3 py-2.5 rounded-lg bg-background shadow-sm text-sm"
                  disabled={!!editProduit}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Prix unitaire (MGA) *</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={pForm.prix_unitaire}
                  onChange={(e) => setPForm({ ...pForm, prix_unitaire: e.target.value })}
                  className="mt-1 w-full px-3 py-2.5 rounded-lg bg-background shadow-sm text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Désignation *</label>
              <input
                required
                value={pForm.designation}
                onChange={(e) => setPForm({ ...pForm, designation: e.target.value })}
                className="mt-1 w-full px-3 py-2.5 rounded-lg bg-background shadow-sm text-sm"
              />
            </div>

            {/* Photo */}
            <div>
              <label className="text-sm font-medium">Photo</label>
              <div className="mt-1">
                {photoPreview ? (
                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl border border-dashed border-border cursor-pointer hover:bg-accent/50">
                      <img src={photoPreview} alt="" className="w-10 h-10 object-cover rounded-lg" />
                      <span className="text-sm text-muted-foreground">
                        {photoFile ? photoFile.name : 'Remplacer la photo'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            setPhotoFile(f);
                            setPhotoPreview(URL.createObjectURL(f));
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview(null);
                      }}
                      className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0"
                      title="Supprimer la photo"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-border cursor-pointer hover:bg-accent text-sm text-muted-foreground w-full justify-center">
                    <ImageIcon size={16} />
                    Importer une photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setPhotoFile(f);
                          setPhotoPreview(URL.createObjectURL(f));
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={pForm.description}
                onChange={(e) => setPForm({ ...pForm, description: e.target.value })}
                rows={4}
                className="mt-1 w-full px-3 py-2.5 rounded-lg bg-background shadow-sm text-sm resize-none"
                placeholder="Description du produit..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowPModal(false)}
                className="px-4 py-2 rounded-lg shadow-sm text-sm hover:bg-accent"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm disabled:opacity-50"
              >
                {saving ? '...' : editProduit ? 'Sauvegarder' : 'Valider'}
              </button>
            </div>
          </form>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Modal Service */}
      {showOModal && (
        <ModalPortal onClose={() => setShowOModal(false)}>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 shadow-sm">
              <h2 className="font-semibold">
                {editOffre ? 'Modifier le service' : 'Nouveau service'}
              </h2>
              <button onClick={() => setShowOModal(false)} className="p-1.5 rounded-lg hover:bg-accent">
                <span className="modal-close-symbol">✕</span>
              </button>
            </div>
            <form onSubmit={saveOffre} className="p-5 space-y-3">
              <div>
                <label className="text-sm font-medium">Dénomination *</label>
                <input
                  required
                  value={oForm.denomination}
                  onChange={(e) => setOForm({ ...oForm, denomination: e.target.value })}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-background shadow-sm text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tarif (MGA) *</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={oForm.tarif}
                  onChange={(e) => setOForm({ ...oForm, tarif: e.target.value })}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-background shadow-sm text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={oForm.description}
                  onChange={(e) => setOForm({ ...oForm, description: e.target.value })}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-background shadow-sm text-sm resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowOModal(false)}
                  className="px-4 py-2 rounded-lg shadow-sm text-sm hover:bg-accent"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm disabled:opacity-50"
                >
                  {saving ? '...' : 'Valider'}
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Modal suppression */}
      {deleteTarget && (
        <ModalPortal onClose={() => setDeleteTarget(null)}>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-xl w-full max-w-sm p-6 shadow-xl text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
              !
            </div>
            <h3 className="font-semibold mb-2">Êtes-vous sûr ?</h3>
            <p className="text-sm text-muted-foreground mb-5">Cette action est irréversible.</p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg shadow-sm text-sm hover:bg-accent"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Aperçu photo */}
      {photoModal.open && (
      <ModalPortal onClose={() => setPhotoModal({ open: false, url: null, title: '' })}>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={() => setPhotoModal({ open: false, url: null, title: '' })}
      >
        <div
          className="bg-card rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <ImageIcon size={16} className="text-primary shrink-0" />
              <span className="font-medium text-sm truncate">{photoModal.title}</span>
              {photoModal.reference && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                  {photoModal.reference}
                </span>
              )}
            </div>
            <button
              onClick={() => setPhotoModal({ open: false, url: null, title: '' })}
              className="p-1 rounded-lg hover:bg-accent"
            >
              <span className="modal-close-symbol">✕</span>
            </button>
          </div>
          <div className="p-4">
            {photoModal.url ? (
              <img
                src={photoModal.url}
                alt={photoModal.title}
                className="w-full rounded-xl object-contain max-h-[60vh]"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ImageIcon size={40} className="opacity-30 mb-3" />
                <p className="text-sm">Aucune photo pour ce produit</p>
              </div>
            )}
          </div>
        </div>
      </div>
      </ModalPortal>
    )}
  </div>
  );
}