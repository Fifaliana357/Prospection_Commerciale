import { useEffect, useState } from 'react';
import { Search, Plus, Pencil, Trash2, UserCog } from 'lucide-react';
import {
  getCommerciaux,
  createCommercial,
  updateCommercial,
  deleteCommercial,
  type Commercial,
} from '../services/commerciaux';
import { useToast } from '../contexts/ToastContext';
import TablePagination from '../components/ui/TablePagination';
import TableSummary from '../components/ui/TableSummary';
import PageHeader from '../components/ui/PageHeader';
import { ModalPortal } from '../components/ui/Modal';

export default function Commerciaux() {
  const toast = useToast();
  const [items, setItems] = useState<Commercial[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Commercial | null>(null);
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    actif: true,
  });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getCommerciaux({ search: search || undefined, page });
      setItems(res.data || []);
      setTotal(res.total || 0);
      setLastPage(res.last_page || 1);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, page]);

  const openCreate = () => {
    setEditItem(null);
    setForm({ nom: '', prenom: '', email: '', telephone: '', actif: true });
    setShowModal(true);
  };

  const openEdit = (c: Commercial) => {
    setEditItem(c);
    setForm({
      nom: c.nom || '',
      prenom: c.prenom || '',
      email: c.email || '',
      telephone: c.telephone || '',
      actif: c.actif,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom || !form.email) {
      toast.error('Nom et email obligatoires');
      return;
    }
    try {
      setSaving(true);
      if (editItem) {
        await updateCommercial(editItem.id_commercial, {
          nom: form.nom,
          prenom: form.prenom || undefined,
          email: form.email,
          telephone: form.telephone || undefined,
          actif: form.actif,
        });
        toast.success('Commercial modifié');
      } else {
        const res = await createCommercial({
          nom: form.nom,
          prenom: form.prenom || undefined,
          email: form.email,
          telephone: form.telephone || undefined,
          actif: form.actif,
        });
        toast.success(
          res.password_temporaire
            ? `Créé. MDP temporaire : ${res.password_temporaire}`
            : 'Commercial créé'
        );
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCommercial(deleteId);
      toast.success('Commercial supprimé');
      setDeleteId(null);
      fetchData();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <PageHeader title="Commerciaux" description="Gérez les commerciaux de votre équipe." icon={<UserCog size={23} />} />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <TableSummary total={total} label="commerciaux" />
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90"
        >
          <Plus size={18} /> Nouveau commercial
        </button>
      </div>

      <div className="rounded-xl bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="px-3 py-3 text-left font-medium">Nom</th>
                <th className="px-3 py-3 text-left font-medium">Prénoms</th>
                <th className="px-3 py-3 text-left font-medium">Email</th>
                <th className="px-3 py-3 text-left font-medium">Contact</th>
                <th className="px-3 py-3 text-left font-medium">Éditeur</th>
                <th className="px-3 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">Chargement...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">Aucun commercial</td></tr>
              ) : (
                items.map((c) => (
                  <tr key={c.id_commercial} className="hover:bg-accent/40">
                    <td className="px-3 py-2.5 font-medium">{c.nom}</td>
                    <td className="px-3 py-2.5">{c.prenom || '—'}</td>
                    <td className="px-3 py-2.5">{c.email}</td>
                    <td className="px-3 py-2.5">{c.telephone || '—'}</td>
                    <td className="px-3 py-2.5">
                      {c.admin
                        ? [c.admin.prenom, c.admin.nom].filter(Boolean).join(' ')
                        : '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => setDeleteId(c.id_commercial)} className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TablePagination page={page} lastPage={lastPage} onChange={setPage} />
        <div className="px-4 py-2 text-xs text-muted-foreground">{total} commercial(aux)</div>
      </div>

      {showModal && (
        <ModalPortal onClose={() => setShowModal(false)}>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 shadow-sm">
              <h2 className="font-semibold">{editItem ? 'Modifier le commercial' : 'Nouveau commercial'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-accent">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Nom *</label>
                  <input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-background shadow-sm text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium">Prénom(s)</label>
                  <input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-background shadow-sm text-sm" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Email *</label>
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-background shadow-sm text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Contact</label>
                <input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-background shadow-sm text-sm" />
              </div>
              {editItem && (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.actif} onChange={(e) => setForm({ ...form, actif: e.target.checked })} className="rounded" />
                  Compte actif
                </label>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg shadow-sm text-sm hover:bg-accent">Annuler</button>
                <button type="submit" disabled={saving} className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm disabled:opacity-50">
                  {saving ? '...' : editItem ? 'Sauvegarder' : 'Valider'}
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

      {deleteId && (
        <ModalPortal onClose={() => setDeleteId(null)}>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-xl w-full max-w-sm p-6 shadow-xl text-center">
            <h3 className="font-semibold mb-2">Êtes-vous sûr ?</h3>
            <p className="text-sm text-muted-foreground mb-5">Cette action est irréversible.</p>
            <div className="flex justify-center gap-2">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-lg shadow-sm text-sm hover:bg-accent">Annuler</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Confirmer</button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
}