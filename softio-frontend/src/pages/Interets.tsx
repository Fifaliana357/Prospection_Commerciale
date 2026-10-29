import { useEffect, useState } from 'react';
import { Search, Eye, Star } from 'lucide-react';
import { getInterets, type ClientWithInterets } from '../services/interets';
import { useToast } from '../contexts/ToastContext';

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

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Star size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Intérêts des prospects</h1>
            <p className="text-sm text-muted-foreground">
              Visualisez les services et produits qui intéressent vos prospects
            </p>
          </div>
        </div>
      </div>

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

      {/* Filtres produits + total */}
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
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {total} prospect{total > 1 ? 's' : ''}
        </span>
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
      </div>

    {/* Modal détail */}
    {selectedClient && (
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
              ✕
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-primary/10 text-primary font-medium"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {i.produit_concerne}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-border flex justify-end">
            <button
              onClick={() => setSelectedClient(null)}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors"
            >
              ✕ Fermer
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}