import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Trash2, MessageSquare, CheckCircle2, XCircle, Target, CalendarDays
} from 'lucide-react';
import {
  getProspections,
  deleteProspection,
  updateProspection,
  type Prospection
} from '../services/prospections';
import { useToast } from '../contexts/ToastContext';

export default function Prospections() {
  const toast = useToast();
  const navigate = useNavigate();

  const [prospections, setProspections] = useState<Prospection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [etatFilter, setEtatFilter] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchProspections = async () => {
    try {
      setLoading(true);
      const res = await getProspections({
        search: search || undefined,
        etat: etatFilter || undefined,
        page,
      });
      setProspections(res.data);
      setLastPage(res.last_page);
      setTotal(res.total);
    } catch {
      toast.error('Erreur lors du chargement des prospections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProspections();
  }, [search, etatFilter, page]);

  const handleCloturer = async (id: number) => {
    try {
      await updateProspection(id, { etat: 'cloture', est_perdu: false });
      toast.success('Prospection clôturée');
      fetchProspections();
    } catch {
      toast.error('Erreur');
    }
  };

  const handlePerdu = async (id: number) => {
    try {
      await updateProspection(id, { est_perdu: true });
      toast.success('Prospection marquée comme perdue');
      fetchProspections();
    } catch {
      toast.error('Erreur');
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProspection(deleteId);
      toast.success('Prospection supprimée');
      setDeleteId(null);
      fetchProspections();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const getEtatBadge = (p: Prospection) => {
    if (p.est_perdu) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-600">Perdu</span>;
    }
    if (p.etat === 'cloture') {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600">Clôturé</span>;
    }
    return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600">Non clôturé</span>;
  };

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= lastPage; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Target size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Prospections</h1>
            <p className="text-sm text-muted-foreground">Gérez vos actions de prospection</p>
          </div>
        </div>
      </div>

      {/* Search + Actions */}
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
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <button
          onClick={() => navigate('/prospections/create')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground hover:opacity-90 rounded-lg font-medium"
        >
          <Plus size={18} />
          Nouvelle prospection
        </button>
      </div>

      {/* Filtres + Total */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          {[
            { value: '', label: 'Tout' },
            { value: 'non_cloture', label: 'Non clôturé' },
            { value: 'cloture', label: 'Clôturé' },
            { value: 'perdu', label: 'Perdu' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setEtatFilter(f.value);
                setPage(1);
              }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                etatFilter === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="text-sm text-muted-foreground">{total} élément{total > 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-muted/40 border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="px-3 py-3 text-left font-medium">Matricule</th>
                <th className="px-3 py-3 text-left font-medium">Date</th>
                <th className="px-3 py-3 text-left font-medium">Objet / Produit</th>
                <th className="px-3 py-3 text-left font-medium">Contact</th>
                <th className="px-3 py-3 text-left font-medium">Prospect</th>
                <th className="px-3 py-3 text-left font-medium">Entreprise</th>
                <th className="px-3 py-3 text-left font-medium">État</th>
                <th className="px-3 py-3 text-left font-medium">Commercial</th>
                <th className="px-3 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    Chargement...
                  </td>
                </tr>
              ) : prospections.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    Aucune prospection trouvée
                  </td>
                </tr>
              ) : (
                prospections.map((p) => (
                  <tr key={p.id_prospection} className="hover:bg-accent/40 transition-colors">
                    <td className="px-3 py-2.5 font-medium whitespace-nowrap">
                      P-{String(p.id_prospection).padStart(4, '0')}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {new Date(p.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-3 py-2.5 max-w-[200px] truncate">
                      {p.produit_prospecte || p.offre?.denomination || '—'}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {p.client?.telephone || '—'}
                    </td>
                    <td className="px-3 py-2.5 font-medium">
                      {p.client ? `${p.client.nom} ${p.client.prenom || ''}`.trim() : '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      {p.client?.entreprise || '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      {getEtatBadge(p)}
                    </td>
                    <td className="px-3 py-2.5">
                      {p.commercial
                        ? `${p.commercial.nom} ${p.commercial.prenom}`
                        : 'Admin'}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Voir messages */}
                        <button
                          onClick={() => navigate(`/prospections/${p.id_prospection}`)}
                          className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"
                          title="Voir les messages"
                        >
                          <MessageSquare size={15} />
                        </button>

                        {/* Clôturer */}
                        {!p.est_perdu && p.etat !== 'cloture' && (
                          <button
                            onClick={() => handleCloturer(p.id_prospection)}
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                            title="Clôturer"
                          >
                            <CheckCircle2 size={15} />
                          </button>
                        )}

                        {/* Fixer un rendez-vous */}
                        <button
                          onClick={() => {
                            // Pour l’instant on redirige vers la page RDV (on l’améliorera plus tard)
                            navigate(`/rendez-vous?prospection=${p.id_prospection}`);
                          }}
                          className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
                          title="Fixer un rendez-vous"
                        >
                          <CalendarDays size={15} />
                        </button>

                        {/* Supprimer */}
                        <button
                          onClick={() => setDeleteId(p.id_prospection)}
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
            {getPageNumbers().map((p) => (
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
              Cette prospection et ses messages seront supprimés.
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