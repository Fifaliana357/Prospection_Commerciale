import { useEffect, useState, useRef } from 'react';
import {
  Search, Plus, Pencil, Trash2, Download, Upload, User, X, Check, FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { getClients, createClient, updateClient, deleteClient, type Client } from '../services/clients';
import { useToast } from '../contexts/ToastContext';

export default function Prospects() {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [entryMode, setEntryMode] = useState<'manual' | 'excel'>('manual');
  const [saving, setSaving] = useState(false);

  // Import Excel
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [form, setForm] = useState({
    type: 'particulier' as 'particulier' | 'entreprise',
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    facebook: '',
    linkedin: '',
    entreprise: '',
    classification: '',
    profession: '',
    site_web: '',
    pays: 'Madagascar',
    domaine: '',
  });

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await getClients({
        search: search || undefined,
        type: typeFilter || undefined,
        page,
      });
      setClients(res.data);
      setLastPage(res.last_page);
      setTotal(res.total);
    } catch {
      toast.error('Erreur lors du chargement des prospects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [search, typeFilter, page]);

  const openCreateModal = () => {
    setEditingClient(null);
    setEntryMode('manual');
    setSelectedFile(null);
    setForm({
      type: 'particulier',
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      facebook: '',
      linkedin: '',
      entreprise: '',
      classification: '',
      profession: '',
      site_web: '',
      pays: 'Madagascar',
      domaine: '',
    });
    setShowModal(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setEntryMode('manual');
    setForm({
      type: (client.type === 'entreprise' ? 'entreprise' : 'particulier'),
      nom: client.nom || '',
      prenom: client.prenom || '',
      email: client.email || '',
      telephone: client.telephone || '',
      facebook: client.facebook || '',
      linkedin: client.linkedin || '',
      entreprise: client.entreprise || '',
      classification: client.classification || '',
      profession: client.profession || '',
      site_web: client.site_web || '',
      pays: client.pays || 'Madagascar',
      domaine: client.domaine || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nom.trim()) {
      toast.error('Le nom est obligatoire');
      return;
    }
    if (form.type === 'entreprise' && !form.entreprise.trim()) {
      toast.error('La raison sociale est obligatoire pour une entreprise');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...form,
        matricule: editingClient?.matricule || `P-${Date.now().toString().slice(-4)}`,
      };

      if (editingClient) {
        await updateClient(editingClient.id_client, payload);
        toast.success('Prospect modifié avec succès');
      } else {
        await createClient(payload);
        toast.success('Prospect créé avec succès');
      }
      setShowModal(false);
      fetchClients();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteClient(deleteId);
      toast.success('Prospect supprimé');
      setDeleteId(null);
      fetchClients();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  // ========== EXPORT ==========
  const handleExport = () => {
    const data = clients.map((c) => ({
      Matricule: c.matricule,
      Type: c.type,
      Nom: c.nom,
      Prénom: c.prenom || '',
      Email: c.email || '',
      Téléphone: c.telephone || '',
      Facebook: c.facebook || '',
      LinkedIn: c.linkedin || '',
      Entreprise: c.entreprise || '',
      Classification: c.classification || '',
      Profession: c.profession || '',
      'Site web': c.site_web || '',
      Pays: c.pays || '',
      Domaine: c.domaine || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Prospects');
    XLSX.writeFile(wb, 'Prospects.xlsx');
    toast.success('Export Excel réussi');
  };

  // ========== IMPORT ==========
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleImportExcel = async () => {
    if (!selectedFile) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }

    try {
      setSaving(true);
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);

      if (rows.length === 0) {
        toast.error('Le fichier est vide');
        return;
      }

      let success = 0;
      for (const row of rows) {
        try {
          await createClient({
            matricule: row.Matricule || `P-${Date.now().toString().slice(-4)}`,
            type: (row.Type || 'particulier').toLowerCase().includes('entreprise') ? 'entreprise' : 'particulier',
            nom: row.Nom || row.nom || 'Sans nom',
            prenom: row.Prénom || row.Prenom || row.prenom || '',
            email: row.Email || row.email || '',
            telephone: row.Téléphone || row.Telephone || row.telephone || '',
            facebook: row.Facebook || row.facebook || '',
            linkedin: row.LinkedIn || row.linkedin || '',
            entreprise: row.Entreprise || row.entreprise || row['Raison sociale'] || '',
            classification: row.Classification || row.classification || '',
            profession: row.Profession || row.profession || '',
            site_web: row['Site web'] || row.site_web || '',
            pays: row.Pays || row.pays || 'Madagascar',
            domaine: row.Domaine || row.domaine || '',
          });
          success++;
        } catch (err) {
          console.error(err);
        }
      }

      toast.success(`${success} prospect(s) importé(s)`);
      setShowModal(false);
      setSelectedFile(null);
      fetchClients();
    } catch {
      toast.error('Erreur lors de la lecture du fichier Excel');
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Pagination numbers
  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= lastPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <User size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Prospects</h1>
            <p className="text-sm text-muted-foreground">Gérez vos contacts et prospects</p>
          </div>
        </div>
      </div>

      {/* Search + Export */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Rechercher par: nom, prénom, contact ou email"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-foreground hover:bg-accent transition-colors"
        >
          <Download size={16} />
          Exporter
        </button>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground hover:opacity-90 rounded-lg font-medium transition-opacity"
        >
          <Plus size={18} />
          Nouveau prospect
        </button>
      </div>


      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          {[
            { value: '', label: 'Tout' },
            { value: 'particulier', label: 'Particulier' },
            { value: 'entreprise', label: 'Entreprise' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setTypeFilter(f.value);
                setPage(1);
              }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                typeFilter === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {total} élément{total > 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="bg-muted/40 border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="px-3 py-3 text-left font-medium whitespace-nowrap">Matricule</th>
                <th className="px-3 py-3 text-left font-medium">Type</th>
                <th className="px-3 py-3 text-left font-medium">Contact</th>
                <th className="px-3 py-3 text-left font-medium">Nom</th>
                <th className="px-3 py-3 text-left font-medium">Prénom</th>
                <th className="px-3 py-3 text-left font-medium">Email</th>
                <th className="px-3 py-3 text-left font-medium">Facebook</th>
                <th className="px-3 py-3 text-left font-medium">LinkedIn</th>
                <th className="px-3 py-3 text-left font-medium">Entreprise</th>
                <th className="px-3 py-3 text-left font-medium">Classification</th>
                <th className="px-3 py-3 text-left font-medium">Pays</th>
                <th className="px-3 py-3 text-left font-medium">Domaine</th>
                <th className="px-3 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={13} className="px-4 py-12 text-center text-muted-foreground">
                    Chargement...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-12 text-center text-muted-foreground">
                    Aucun prospect trouvé
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id_client} className="hover:bg-accent/40 transition-colors">
                    <td className="px-3 py-2.5 font-medium whitespace-nowrap">{client.matricule}</td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary capitalize">
                        {client.type}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{client.telephone || '—'}</td>
                    <td className="px-3 py-2.5 font-medium">{client.nom}</td>
                    <td className="px-3 py-2.5">{client.prenom || '—'}</td>
                    <td className="px-3 py-2.5">{client.email || '—'}</td>
                    <td className="px-3 py-2.5 max-w-[140px] truncate">{client.facebook || '—'}</td>
                    <td className="px-3 py-2.5 max-w-[140px] truncate">{client.linkedin || '—'}</td>
                    <td className="px-3 py-2.5">{client.entreprise || '—'}</td>
                    <td className="px-3 py-2.5">{client.classification || '—'}</td>
                    <td className="px-3 py-2.5">{client.pays || '—'}</td>
                    <td className="px-3 py-2.5">{client.domaine || '—'}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(client)}
                          className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
                          title="Modifier"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteId(client.id_client)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
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

        {/* Pagination style ancien */}
        {lastPage > 1 && (
          <div className="flex items-center justify-end gap-1.5 px-4 py-3 border-t border-border">
            {getPageNumbers().map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${
                  page === p
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-accent'
                }`}
              >
                {p}
              </button>
            ))}
            {page < lastPage && (
              <button
                onClick={() => setPage(page + 1)}
                className="min-w-[36px] h-9 rounded-lg text-sm bg-secondary hover:bg-accent"
              >
                ›
              </button>
            )}
          </div>
        )}
      </div>

      {/* ==================== MODAL CRÉATION / ÉDITION ==================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="text-lg font-semibold">
                {editingClient ? 'Modifier le prospect' : 'Nouveau prospect'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-accent">
                <X size={20} />
              </button>
            </div>

            {!editingClient && (
              <div className="px-6 pt-4">
                <label className="text-sm font-medium text-muted-foreground">Mode d'entrée des données</label>
                <div className="mt-1.5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setEntryMode('manual'); setSelectedFile(null); }}
                    className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                      entryMode === 'manual'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    Saisir manuellement
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryMode('excel')}
                    className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                      entryMode === 'excel'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    Importer un fichier Excel
                  </button>
                </div>
              </div>
            )}

            {entryMode === 'excel' && !editingClient ? (
              <div className="p-6 space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  {selectedFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <FileSpreadsheet className="text-primary" size={36} />
                      <p className="font-medium text-foreground">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">Cliquez pour changer de fichier</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto mb-3 text-muted-foreground" size={32} />
                      <p className="font-medium">Cliquez pour sélectionner un fichier Excel</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        .xlsx ou .xls
                      </p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-accent"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleImportExcel}
                    disabled={!selectedFile || saving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                  >
                    <Check size={16} />
                    {saving ? 'Import en cours...' : 'Valider'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                      className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="particulier">Particulier</option>
                      <option value="entreprise">Entreprise</option>
                    </select>
                  </div>

                  {form.type === 'entreprise' ? (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium">Raison sociale *</label>
                      <input
                        required
                        value={form.entreprise}
                        onChange={(e) => setForm({ ...form, entreprise: e.target.value, nom: e.target.value })}
                        className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="text-sm font-medium">Nom *</label>
                        <input
                          required
                          value={form.nom}
                          onChange={(e) => setForm({ ...form, nom: e.target.value })}
                          className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Prénom</label>
                        <input
                          value={form.prenom}
                          onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                          className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Contact</label>
                    <input
                      value={form.telephone}
                      onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                      className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Pays</label>
                    <input
                      value={form.pays}
                      onChange={(e) => setForm({ ...form, pays: e.target.value })}
                      className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg bg-background"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Facebook</label>
                    <input
                      value={form.facebook}
                      onChange={(e) => setForm({ ...form, facebook: e.target.value })}
                      className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">LinkedIn</label>
                    <input
                      value={form.linkedin}
                      onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                      className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg bg-background"
                    />
                  </div>
                </div>

                {form.type === 'entreprise' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Classification</label>
                      <select
                        value={form.classification}
                        onChange={(e) => setForm({ ...form, classification: e.target.value })}
                        className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg bg-background"
                      >
                        <option value="">Veuillez sélectionner</option>
                        <option value="TPE">TPE</option>
                        <option value="PE">PE</option>
                        <option value="ME">ME</option>
                        <option value="GE">GE</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Site web</label>
                      <input
                        value={form.site_web}
                        onChange={(e) => setForm({ ...form, site_web: e.target.value })}
                        className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Domaine</label>
                      <input
                        value={form.domaine}
                        onChange={(e) => setForm({ ...form, domaine: e.target.value })}
                        className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg bg-background"
                      />
                    </div>
                  </div>
                )}

                {form.type === 'particulier' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Profession</label>
                      <input
                        value={form.profession}
                        onChange={(e) => setForm({ ...form, profession: e.target.value })}
                        className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Domaine</label>
                      <input
                        value={form.domaine}
                        onChange={(e) => setForm({ ...form, domaine: e.target.value })}
                        className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg bg-background"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
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
            )}
          </div>
        </div>
      )}

      {/* ==================== MODAL CONFIRMATION SUPPRESSION ==================== */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 shadow-xl text-center">
            <div className="w-14 h-14 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              !
            </div>
            <h3 className="text-lg font-semibold mb-2">Êtes-vous sûr ?</h3>
            <p className="text-muted-foreground mb-6">
              Ce prospect et ses données liées seront supprimés.
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