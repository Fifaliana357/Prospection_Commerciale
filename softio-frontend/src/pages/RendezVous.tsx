import { useEffect, useState } from 'react';
import {
  Search, Plus, Pencil, Trash2, CalendarDays, Check
} from 'lucide-react';
import {
  getRendezVous,
  createRendezVous,
  updateRendezVous,
  deleteRendezVous,
  type RendezVous
} from '../services/rendezvous';
import { getClients, type Client } from '../services/clients';
import { useToast } from '../contexts/ToastContext';

export default function RendezVousPage() {
  const toast = useToast();

  const [rdvs, setRdvs] = useState<RendezVous[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtre, setFiltre] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<RendezVous | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Recherche prospect
  const [prospectSearch, setProspectSearch] = useState('');
  const [selectedClientName, setSelectedClientName] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [form, setForm] = useState({
    id_client: '',
    date_rdv: '',
    heure: '',
    lieu: '',
    type_rdv: 'Direct',
    lien_rdv: '',
    telephone: '',
    commentaire: '',
  });

  const filteredClients = clients.filter((c) => {
    const term = prospectSearch.toLowerCase();
    if (!term) return true;
    return (
      c.nom?.toLowerCase().includes(term) ||
      c.prenom?.toLowerCase().includes(term) ||
      c.matricule?.toLowerCase().includes(term)
    );
  });

  const fetchRdvs = async () => {
    try {
      setLoading(true);
      const res = await getRendezVous({
        search: search || undefined,
        filtre: filtre || undefined,
        page,
      });
      setRdvs(res.data);
      setLastPage(res.last_page);
      setTotal(res.total);
    } catch {
      toast.error('Erreur lors du chargement des rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRdvs();
  }, [search, filtre, page]);

  useEffect(() => {
    getClients({ page: 1 })
      .then((res) => setClients(res.data || []))
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setProspectSearch('');
    setSelectedClientName('');
    setShowSuggestions(false);
    setForm({
      id_client: '',
      date_rdv: '',
      heure: '',
      lieu: '',
      type_rdv: 'Direct',
      lien_rdv: '',
      telephone: '',
      commentaire: '',
    });
    setShowModal(true);
  };

  const openEdit = (rdv: RendezVous) => {
    const date = new Date(rdv.date_rdv);
    setEditing(rdv);
    setForm({
      id_client: String(rdv.id_client),
      date_rdv: date.toISOString().slice(0, 10),
      heure: date.toTimeString().slice(0, 5),
      lieu: rdv.lieu || '',
      type_rdv: rdv.type_rdv || 'Direct',
      lien_rdv: rdv.lien_rdv || '',
      telephone: rdv.client?.telephone || '',
      commentaire: rdv.commentaire || '',
    });
    setShowSuggestions(false);
    setShowModal(true); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id_client || !form.date_rdv) {
      toast.error('Prospect et date sont obligatoires');
      return;
    }

    const dateTime = `${form.date_rdv} ${form.heure || '09:00'}:00`;

    try {
      setSaving(true);
      const payload: any = {
        id_client: Number(form.id_client),
        date_rdv: dateTime,
        type_rdv: form.type_rdv,
        commentaire: form.commentaire || null,
        lieu: null,
        lien_rdv: null,
      };

      // On ne garde que le champ correspondant au mode
      if (
        form.type_rdv === 'Direct' ||
        form.type_rdv === 'Livraison' ||
        form.type_rdv === 'Réunion'
      ) {
        payload.lieu = form.lieu || null;
      } else if (form.type_rdv === 'Visio conférence') {
        payload.lien_rdv = form.lien_rdv || null;
      }
      // Pour Téléphonique on n'envoie pas de lieu/lien (le n° est déjà sur le client)

      if (editing) {
        await updateRendezVous(editing.id_rendez_vous, payload);
        toast.success('Rendez-vous modifié');
      } else {
        await createRendezVous(payload);
        toast.success('Rendez-vous créé');
      }
      setShowModal(false);
      fetchRdvs();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteRendezVous(deleteId);
      toast.success('Rendez-vous supprimé');
      setDeleteId(null);
      fetchRdvs();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <CalendarDays size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Rendez-vous</h1>
            <p className="text-sm text-muted-foreground">
              Gérez vos rendez-vous avec vos prospects
            </p>
          </div>
        </div>
      </div>

      {/* Search + Bouton */}
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
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium"
        >
          <Plus size={18} />
          Nouveau rendez-vous
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          {[
            { value: '', label: 'Tout' },
            { value: 'aujourdhui', label: "Aujourd'hui" },
            { value: 'demain', label: 'Demain' },
            { value: 'semaine', label: 'Cette semaine' },
            { value: 'mois', label: 'Ce mois' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setFiltre(f.value);
                setPage(1);
              }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filtre === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="text-sm text-muted-foreground">{total} rendez-vous</span>
      </div>

      {/* Table */}
      <div className="bg-muted/40 border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="px-3 py-3 text-left font-medium">Date</th>
                <th className="px-3 py-3 text-left font-medium">Lieu</th>
                <th className="px-3 py-3 text-left font-medium">Type</th>
                <th className="px-3 py-3 text-left font-medium">Client</th>
                <th className="px-3 py-3 text-left font-medium">Email</th>
                <th className="px-3 py-3 text-left font-medium">Téléphone</th>
                <th className="px-3 py-3 text-left font-medium">Lien</th>
                <th className="px-3 py-3 text-left font-medium">Commentaire</th>
                <th className="px-3 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    Chargement...
                  </td>
                </tr>
              ) : rdvs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    Aucun rendez-vous
                  </td>
                </tr>
              ) : (
                rdvs.map((rdv) => (
                  <tr key={rdv.id_rendez_vous} className="hover:bg-accent/40">
                    <td className="px-3 py-2.5 whitespace-nowrap font-medium">
                      {formatDate(rdv.date_rdv)}
                    </td>
                    <td className="px-3 py-2.5">{rdv.lieu || '—'}</td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                        {rdv.type_rdv || 'Direct'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-medium">
                      {rdv.client
                        ? rdv.client.entreprise
                          ? rdv.client.entreprise
                          : `${rdv.client.nom} ${rdv.client.prenom || ''}`.trim()
                        : '—'}
                    </td>
                    <td className="px-3 py-2.5">{rdv.client?.email || '—'}</td>
                    <td className="px-3 py-2.5">{rdv.client?.telephone || '—'}</td>
                    <td className="px-3 py-2.5 max-w-[160px]">
                      {rdv.lien_rdv ? (
                        <a
                          href={rdv.lien_rdv.startsWith('http') ? rdv.lien_rdv : `https://${rdv.lien_rdv}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline truncate block"
                          title={rdv.lien_rdv}
                        >
                          {rdv.lien_rdv}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-2.5 max-w-[180px] truncate">
                      {rdv.commentaire || '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(rdv)}
                          className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteId(rdv.id_rendez_vous)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20"
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
      </div>

      {/* ==================== MODAL ==================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CalendarDays size={18} />
                {editing ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-accent"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Prospect + Nom */}
              {/* Prospect uniquement en création */}
              {!editing && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="text-sm font-medium">Numéro du Prospect *</label>
                    <input
                      type="text"
                      placeholder="Cliquer pour chercher..."
                      value={prospectSearch}
                      onChange={(e) => {
                        setProspectSearch(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg bg-background"
                    />
                    {showSuggestions && filteredClients.length > 0 && (
                      <div className="absolute z-20 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredClients.slice(0, 8).map((c) => {
                          const displayName =
                            c.type === 'entreprise'
                              ? c.entreprise || c.nom
                              : `${c.nom} ${c.prenom || ''}`.trim();

                          return (
                            <button
                              key={c.id_client}
                              type="button"
                              onClick={() => {
                                setForm({
                                  ...form,
                                  id_client: String(c.id_client),
                                  telephone: c.telephone || '',
                                });
                                setProspectSearch(c.matricule || '');
                                setSelectedClientName(displayName);
                                setShowSuggestions(false);
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                            >
                              <span className="font-medium">{c.matricule}</span>
                              <span className="text-muted-foreground"> — {displayName}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Nom du prospect</label>
                    <input
                      type="text"
                      value={selectedClientName}
                      readOnly
                      className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg bg-muted/50 text-muted-foreground"
                    />
                  </div>
                </div>
              )}

              {/* Date + Heure */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Date *</label>
                  <input
                    type="date"
                    required
                    value={form.date_rdv}
                    onChange={(e) =>
                      setForm({ ...form, date_rdv: e.target.value })
                    }
                    className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Heure</label>
                  <input
                    type="time"
                    value={form.heure}
                    onChange={(e) =>
                      setForm({ ...form, heure: e.target.value })
                    }
                    className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg bg-background"
                  />
                </div>
              </div>

              {/* Mode */}
              <div>
                <label className="text-sm font-medium">Mode de rendez-vous</label>
                <select
                  value={form.type_rdv}
                  onChange={(e) =>
                    setForm({ ...form, type_rdv: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg bg-background"
                >
                  <option value="Direct">Direct</option>
                  <option value="Téléphonique">Téléphonique</option>
                  <option value="Visio conférence">Visio conférence</option>
                  <option value="Livraison">Livraison</option>
                  <option value="Réunion">Réunion</option>
                </select>
              </div>

              {/* Champs conditionnels */}
              {/* Champs conditionnels obligatoires */}
              {(form.type_rdv === 'Direct' ||
                form.type_rdv === 'Livraison' ||
                form.type_rdv === 'Réunion') && (
                <div>
                  <label className="text-sm font-medium">Lieu *</label>
                  <input
                    required
                    value={form.lieu}
                    onChange={(e) => setForm({ ...form, lieu: e.target.value })}
                    className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg bg-background"
                    placeholder="Adresse ou lieu du rendez-vous"
                  />
                </div>
              )}

              {form.type_rdv === 'Visio conférence' && (
                <div>
                  <label className="text-sm font-medium">Lien (Google Meet, Zoom...) *</label>
                  <input
                    required
                    value={form.lien_rdv}
                    onChange={(e) => setForm({ ...form, lien_rdv: e.target.value })}
                    className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg bg-background"
                    placeholder="https://..."
                  />
                </div>
              )}

              {form.type_rdv === 'Téléphonique' && (
                <div>
                  <label className="text-sm font-medium">Numéro de téléphone *</label>
                  <input
                    required
                    value={form.telephone}
                    onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                    className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg bg-background"
                    placeholder="Ex: 034 00 000 00"
                  />
                </div>
              )}

              {/* Commentaire */}
              <div>
                <label className="text-sm font-medium">Commentaire</label>
                <textarea
                  value={form.commentaire}
                  onChange={(e) =>
                    setForm({ ...form, commentaire: e.target.value })
                  }
                  rows={3}
                  className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg bg-background resize-none"
                  placeholder="Note ou commentaire optionnel..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-accent"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  <Check size={16} />
                  {saving ? 'Enregistrement...' : 'Sauvegarder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal suppression */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 shadow-xl text-center">
            <div className="w-14 h-14 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              !
            </div>
            <h3 className="text-lg font-semibold mb-2">Êtes-vous sûr ?</h3>
            <p className="text-muted-foreground mb-6">
              Ce rendez-vous sera définitivement supprimé.
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