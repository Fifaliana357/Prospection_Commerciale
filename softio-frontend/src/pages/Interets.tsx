import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Search, Eye, Plus, Star, Trash2 } from 'lucide-react';
import { createInteret, deleteInteret, getInterets, type ClientWithInterets } from '../services/interets';
import { useToast } from '../contexts/ToastContext';
import TablePagination from '../components/ui/TablePagination';
import TableSummary from '../components/ui/TableSummary';
import PageHeader from '../components/ui/PageHeader';
import { ModalPortal } from '../components/ui/Modal';

export default function Interets() {
  const toast = useToast();

  const [clients, setClients] = useState<ClientWithInterets[]>([]);
  const [produits, setProduits] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [produitFilter, setProduitFilter] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal détail
  const [selectedClient, setSelectedClient] = useState<ClientWithInterets | null>(null);
  const [deletingInteretId, setDeletingInteretId] = useState<number | null>(null);
  const [newInterest, setNewInterest] = useState('');
  const [addingInterest, setAddingInterest] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getInterets({
        search: search || undefined,
        produit: produitFilter || undefined,
        page,
      });
      setClients(res.clients.data || []);
      setLastPage(res.clients.last_page || 1);
      setTotal(res.clients.total || 0);
      setProduits(res.produits || []);
    } catch {
      toast.error('Erreur lors du chargement des intérêts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, produitFilter, page]);

  const handleDeleteInteret = async (idInteret: number) => {
    if (!window.confirm('Supprimer cet intérêt ?')) return;

    try {
      setDeletingInteretId(idInteret);
      await deleteInteret(idInteret);
      setSelectedClient((current) => current && ({
        ...current,
        interets: current.interets.filter((interet) => interet.id_interet !== idInteret),
      }));
      toast.success('Intérêt supprimé');
      await fetchData();
    } catch {
      toast.error('Erreur lors de la suppression de l’intérêt');
    } finally {
      setDeletingInteretId(null);
    }
  };

  const handleAddInteret = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const produitConcerne = newInterest.trim();
    if (!selectedClient || !produitConcerne) return;

    try {
      setAddingInterest(true);
      const response = await createInteret({
        id_client: selectedClient.id_client,
        produit_concerne: produitConcerne,
      });
      setSelectedClient((current) => current && ({
        ...current,
        interets: [...current.interets, response.interet],
      }));
      setNewInterest('');
      toast.success('Intérêt ajouté');
      await fetchData();
    } catch {
      toast.error("Erreur lors de l'ajout de l'intérêt");
    } finally {
      setAddingInterest(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <PageHeader title="Intérêts des prospects" description="Visualisez les services et produits qui intéressent vos prospects." icon={<Star size={23} />} />

      {/* Search */}
      <div className="relative mb-4 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input
          type="text"
          placeholder="Rechercher un prospect..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* Filtres produits */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setProduitFilter('');
              setPage(1);
            }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              produitFilter === ''
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
          >
            Tout
          </button>
          {produits.map((p) => (
            <button
              key={p}
              onClick={() => {
                setProduitFilter(p);
                setPage(1);
              }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                produitFilter === p
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <TableSummary total={total} label="prospects avec intérêts" />
      </div>

      {/* Table */}
      <div className="bg-muted/40 border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="px-4 py-3 text-left font-medium">Nom et Prénom</th>
                <th className="px-4 py-3 text-left font-medium">Contact</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Facebook</th>
                <th className="px-4 py-3 text-left font-medium">LinkedIn</th>
                <th className="px-4 py-3 text-left font-medium">Intérêts</th>
                <th className="px-4 py-3 text-right font-medium">Vue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    Chargement...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    Aucun intérêt trouvé
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id_client} className="hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          {(client.nom?.[0] || '') + (client.prenom?.[0] || '')}
                        </span>
                        {client.nom} {client.prenom || ''}
                      </div>
                    </td>
                    <td className="px-4 py-3">{client.telephone || '—'}</td>
                    <td className="px-4 py-3">{client.email || '—'}</td>
                    <td className="px-4 py-3">
                      {client.facebook ? (
                        <a
                          href={client.facebook}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          Profil
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {client.linkedin ? (
                        <a
                          href={client.linkedin}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          Profil
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {client.interets?.slice(0, 2).map((i) => (
                          <span
                            key={i.id_interet}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-primary/10 text-primary"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            {i.produit_concerne}
                          </span>
                        ))}
                        {(client.interets?.length || 0) > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{client.interets.length - 2} autre
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedClient(client)}
                        className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
                        title="Voir les détails"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TablePagination page={page} lastPage={lastPage} onChange={setPage} />
      </div>

    {/* Modal détail */}
    {selectedClient && (
      <ModalPortal onClose={() => setSelectedClient(null)}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Star size={16} />
              </div>
              <h2 className="font-semibold text-foreground">Intérêts du prospect</h2>
            </div>
            <button
              onClick={() => setSelectedClient(null)}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <span className="modal-close-symbol">✕</span>
            </button>
          </div>

          {/* Contenu */}
          <div className="p-5 space-y-4">
            {/* Carte prospect */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <div className="w-11 h-11 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                {(selectedClient.nom?.[0] || '') + (selectedClient.prenom?.[0] || '')}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">
                  {selectedClient.nom} {selectedClient.prenom || ''}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {selectedClient.email || selectedClient.telephone || '—'}
                </p>
              </div>
            </div>

            {/* Liste des intérêts */}
            <div className="flex flex-wrap gap-2">
              {selectedClient.interets?.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun intérêt enregistré</p>
              ) : (
                selectedClient.interets.map((i) => (
                  <span
                    key={i.id_interet}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {i.produit_concerne}
                    <button
                      type="button"
                      onClick={() => handleDeleteInteret(i.id_interet)}
                      disabled={deletingInteretId === i.id_interet}
                      className="ml-1 rounded-full p-0.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50"
                      title="Supprimer cet intérêt"
                      aria-label={`Supprimer l’intérêt ${i.produit_concerne}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </span>
                ))
              )}
            </div>
            <form onSubmit={(event) => void handleAddInteret(event)} className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={newInterest}
                onChange={(event) => setNewInterest(event.target.value)}
                maxLength={191}
                placeholder="Ajouter un intérêt..."
                aria-label="Nouvel intérêt"
                className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                type="submit"
                disabled={addingInterest || !newInterest.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={16} />
                {addingInterest ? 'Ajout...' : 'Ajouter'}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-border flex justify-end">
            <button
              onClick={() => setSelectedClient(null)}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors"
            >
              <span className="modal-close-symbol">✕</span> Fermer
            </button>
          </div>
        </div>
      </div>
      </ModalPortal>
    )}
    </div>
  );
}