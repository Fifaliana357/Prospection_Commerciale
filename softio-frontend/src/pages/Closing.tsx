import { useEffect, useState } from 'react';
import { Search, Trash2, Trophy } from 'lucide-react';
import {
  getClosings,
  deleteClosing,
  type Closing
} from '../services/closings';
import { useToast } from '../contexts/ToastContext';

export default function ClosingPage() {
  const toast = useToast();

  const [closings, setClosings] = useState<Closing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchClosings = async () => {
    try {
      setLoading(true);
      const res = await getClosings({
        search: search || undefined,
        page,
      });
      setClosings(res.data);
      setLastPage(res.last_page);
      setTotal(res.total);
    } catch {
      toast.error('Erreur lors du chargement des closings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClosings();
  }, [search, page]);

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteClosing(deleteId);
      toast.success('Closing supprimé');
      setDeleteId(null);
      fetchClosings();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const formatMontant = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(value) + ' Ar';
  };

  const getClientName = (c: Closing) => {
    if (!c.client) return '—';
    if (c.client.entreprise && c.client.entreprise.trim() !== '') {
      return c.client.entreprise;
    }
    return `${c.client.nom} ${c.client.prenom || ''}`.trim();
  };

  const getEditeur = (c: Closing) => {
    if (c.commercial) {
      return `${c.commercial.nom} ${c.commercial.prenom}`;
    }
    if (c.admin) {
      return `${c.admin.nom} ${c.admin.prenom}`;
    }
    return 'Admin';
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Trophy size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Closing</h1>
            <p className="text-sm text-muted-foreground">
              Gérez vos offres clôturées
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <span className="text-sm text-muted-foreground self-center whitespace-nowrap">
          {total} élément{total > 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="bg-muted/40 border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="px-3 py-3 text-left font-medium">Offre ou Produit</th>
                <th className="px-3 py-3 text-left font-medium">Description</th>
                <th className="px-3 py-3 text-left font-medium">Montant</th>
                <th className="px-3 py-3 text-left font-medium">Client</th>
                <th className="px-3 py-3 text-left font-medium">Email Client</th>
                <th className="px-3 py-3 text-left font-medium">Éditeur</th>
                <th className="px-3 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    Chargement...
                  </td>
                </tr>
              ) : closings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    Aucun closing trouvé
                  </td>
                </tr>
              ) : (
                closings.map((c) => (
                  <tr key={c.id_closing} className="hover:bg-accent/40 transition-colors">
                    <td className="px-3 py-2.5 font-medium">{c.produit}</td>
                    <td className="px-3 py-2.5 max-w-[220px] truncate">
                      {c.description || '—'}
                    </td>
                    <td className="px-3 py-2.5 font-medium whitespace-nowrap">
                      {formatMontant(Number(c.montant))}
                    </td>
                    <td className="px-3 py-2.5">{getClientName(c)}</td>
                    <td className="px-3 py-2.5">{c.client?.email || '—'}</td>
                    <td className="px-3 py-2.5">{getEditeur(c)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => setDeleteId(c.id_closing)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20"
                          title="Supprimer"
                        >
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

        {/* Pagination */}
        {lastPage > 1 && (
          <div className="flex items-center justify-end gap-1.5 px-4 py-3 border-t border-border">
            {Array.from({ length: lastPage }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`min-w-[36px] h-9 rounded-lg text-sm font-medium ${
                  page === p
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-accent'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal suppression */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 shadow-xl text-center">
            <div className="w-14 h-14 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              !
            </div>
            <h3 className="text-lg font-semibold mb-2">Êtes-vous sûr ?</h3>
            <p className="text-muted-foreground mb-6">
              Ce closing sera définitivement supprimé.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-5 py-2 border border-border rounded-lg hover:bg-accent"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}