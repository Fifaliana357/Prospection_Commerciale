import { useEffect, useState, useRef } from 'react';
import {
  Search, Plus, Pencil, Trash2, Download, Upload, User, X, Check, FileSpreadsheet,
  AtSign, Building2, Link2, MapPin, Phone, UserRound,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { getClients, createClient, updateClient, deleteClient, type Client } from '../services/clients';
import { useToast } from '../contexts/ToastContext';
import TablePagination from '../components/ui/TablePagination';
import TableSummary from '../components/ui/TableSummary';
import PageHeader from '../components/ui/PageHeader';
import { ModalPortal } from '../components/ui/Modal';
import Select from '../components/ui/Select';

const prospectInputClass = "mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10";
const fieldHintClass = "mt-1.5 block min-w-0 break-words text-xs font-normal leading-relaxed text-muted-foreground";

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
  const [deleting, setDeleting] = useState(false);

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
      const payload = { ...form };

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
    if (!deleteId || deleting) return;
    try {
      setDeleting(true);
      await deleteClient(deleteId);
      toast.success('Prospect supprimé');
      setDeleteId(null);
      fetchClients();
    } catch {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
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
  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader title="Prospects" description="Gérez vos contacts et prospects" icon={<User size={23} />} />

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
        <TableSummary total={total} label="prospects" />
      </div>

      {/* Table */}
      <div className="bg-muted/40 border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="px-2 py-2.5 text-left font-medium whitespace-nowrap">Matricule</th>
                <th className="px-2 py-2.5 text-left font-medium">Type</th>
                <th className="px-2 py-2.5 text-left font-medium">Contact</th>
                <th className="px-2 py-2.5 text-left font-medium">Nom</th>
                <th className="px-2 py-2.5 text-left font-medium">Prénom</th>
                <th className="px-2 py-2.5 text-left font-medium">Profession</th>
                <th className="px-2 py-2.5 text-left font-medium">Email</th>
                <th className="px-2 py-2.5 text-left font-medium">Facebook</th>
                <th className="px-2 py-2.5 text-left font-medium">LinkedIn</th>
                <th className="px-2 py-2.5 text-left font-medium">Entreprise</th>
                <th className="px-2 py-2.5 text-left font-medium">Classification</th>
                <th className="px-2 py-2.5 text-left font-medium">Pays</th>
                <th className="px-2 py-2.5 text-left font-medium">Domaine</th>
                <th className="px-2 py-2.5 text-left font-medium">Site web</th>
                <th className="px-2 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={15} className="px-4 py-12 text-center text-muted-foreground">
                    Chargement...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-4 py-12 text-center text-muted-foreground">
                    Aucun prospect trouvé
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id_client} className="hover:bg-accent/40 transition-colors">
                    <td className="px-2 py-2.5 font-medium whitespace-nowrap">{client.matricule}</td>
                    <td className="px-2 py-2.5">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary capitalize">
                        {client.type}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 whitespace-nowrap">{client.telephone || '—'}</td>
                    <td className="px-2 py-2.5 font-medium">
                      {client.type === 'entreprise' || (client.entreprise && client.entreprise.trim() !== '')
                        ? (client.entreprise || client.nom || '—')
                        : (client.nom || '—')}
                    </td>
                    <td className="px-2 py-2.5">
                      {client.type === 'entreprise' || (client.entreprise && client.entreprise.trim() !== '')
                        ? '—'
                        : (client.prenom || '—')}
                    </td>
                    <td className="px-2 py-2.5">{client.profession || '—'}</td>
                    <td className="px-2 py-2.5">{client.email || '—'}</td>
                    <td className="px-2 py-2.5 max-w-[140px] truncate">{client.facebook || '—'}</td>
                    <td className="px-2 py-2.5 max-w-[140px] truncate">{client.linkedin || '—'}</td>
                    <td className="px-2 py-2.5">{client.entreprise || '—'}</td>
                    <td className="px-2 py-2.5">{client.classification || '—'}</td>
                    <td className="px-2 py-2.5">{client.pays || '—'}</td>
                    <td className="px-2 py-2.5">{client.domaine || '—'}</td>
                    <td className="px-2 py-2.5">
                      {client.site_web ? (
                        <a
                          href={client.site_web.startsWith('http') ? client.site_web : `https://${client.site_web}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          {client.site_web}
                        </a>
                      ) : (
                        '—'
                      )}
</td>
                    <td className="px-2 py-2.5">
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

        <TablePagination page={page} lastPage={lastPage} onChange={setPage} />
      </div>

      {/* ==================== MODAL CRÉATION / ÉDITION ==================== */}
      {showModal && (
        <ModalPortal onClose={() => setShowModal(false)}>
        <div className="animate-modal-overlay-enter fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/55 p-2 backdrop-blur-sm sm:p-3">
          <div role="dialog" aria-modal="true" aria-labelledby="prospect-modal-title" className="animate-modal-dialog-enter my-auto flex max-h-[calc(100dvh-1rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-5 py-4 sm:px-7">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  {editingClient ? <Pencil size={19} /> : <UserRound size={20} />}
                </span>
                <div className="min-w-0">
                  <h2 id="prospect-modal-title" className="truncate text-lg font-semibold tracking-tight">
                    {editingClient ? 'Modifier le prospect' : 'Nouveau prospect'}
                  </h2>
                  <p className="text-xs text-muted-foreground">Renseignez les informations de contact et de profil.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition duration-200 hover:rotate-90 hover:bg-accent hover:text-foreground"
                aria-label="Fermer la fenêtre"
              >
                <X size={19} />
              </button>
            </div>

            {!editingClient && (
              <div className="border-b border-border/70 px-5 py-3 sm:px-7">
                <label className="text-sm font-medium text-muted-foreground">Mode d’entrée des données</label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => { setEntryMode('manual'); setSelectedFile(null); }}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors ${
                      entryMode === 'manual'
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    <UserRound size={15} />
                    Saisir manuellement
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryMode('excel')}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors ${
                      entryMode === 'excel'
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    <FileSpreadsheet size={15} />
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
              <form onSubmit={handleSubmit} className="min-h-0 space-y-4 overflow-y-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:p-5">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3 [&>div]:min-w-0">
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium">
                      {form.type === 'entreprise' ? <Building2 size={15} className="text-primary" /> : <UserRound size={15} className="text-primary" />}
                      Type
                    </label>
                    <Select
                      value={form.type}
                      onChange={(type) => setForm({ ...form, type: type as typeof form.type })}
                      className="mt-1"
                      options={[
                        { value: "particulier", label: "Particulier" },
                        { value: "entreprise", label: "Entreprise" },
                      ]}
                    />
                  </div>

                  {form.type === 'entreprise' ? (
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-1.5 text-sm font-medium"><Building2 size={15} className="text-primary" /> Raison sociale *</label>
                      <input
                        required
                        value={form.entreprise}
                        onChange={(e) => setForm({ ...form, entreprise: e.target.value, nom: e.target.value })}
                        autoComplete="organization"
                        className={prospectInputClass}
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium"><UserRound size={15} className="text-primary" /> Nom *</label>
                        <input
                          required
                          value={form.nom}
                          onChange={(e) => setForm({ ...form, nom: e.target.value })}
                          autoComplete="family-name"
                          className={prospectInputClass}
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium"><UserRound size={15} className="text-primary" /> Prénom</label>
                        <input
                          value={form.prenom}
                          onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                          autoComplete="given-name"
                          className={prospectInputClass}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3 [&>div]:min-w-0">
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium"><AtSign size={15} className="text-primary" /> Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      autoComplete="email"
                      aria-describedby="prospect-email-hint"
                      className={prospectInputClass}
                    />
                    <span id="prospect-email-hint" className={fieldHintClass}>Format attendu : nom@domaine.com. Exemple : prenom.nom@gmail.com ou contact@entreprise.mg.</span>
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium"><Phone size={15} className="text-primary" /> Contact</label>
                    <input
                      value={form.telephone}
                      onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                      autoComplete="tel"
                      className={prospectInputClass}
                    />
                    <span className={fieldHintClass}>Exemple : 034 00 000 00 ou +261 34 00 000 00.</span>
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium"><MapPin size={15} className="text-primary" /> Pays</label>
                    <input
                      value={form.pays}
                      onChange={(e) => setForm({ ...form, pays: e.target.value })}
                      autoComplete="country-name"
                      className={prospectInputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 [&>div]:min-w-0">
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium"><Link2 size={15} className="text-primary" /> Lien Facebook</label>
                    <input
                      value={form.facebook}
                      onChange={(e) => setForm({ ...form, facebook: e.target.value })}
                      aria-describedby="prospect-facebook-hint"
                      className={prospectInputClass}
                    />
                    <span id="prospect-facebook-hint" className={fieldHintClass}>Lien du profil ou de la page, par exemple https://www.facebook.com/nom.du.profil.</span>
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium"><Link2 size={15} className="text-primary" /> Lien LinkedIn</label>
                    <input
                      value={form.linkedin}
                      onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                      aria-describedby="prospect-linkedin-hint"
                      className={prospectInputClass}
                    />
                    <span id="prospect-linkedin-hint" className={fieldHintClass}>Exemple : https://www.linkedin.com/in/nom-du-profil ou /company/nom.</span>
                  </div>
                </div>

                {form.type === 'entreprise' && (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3 [&>div]:min-w-0">
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium"><Building2 size={15} className="text-primary" /> Classification</label>
                      <Select
                        value={form.classification}
                        onChange={(classification) => setForm({ ...form, classification })}
                        className="mt-1"
                        placeholder="Veuillez sélectionner"
                        options={[
                          { value: "TPE", label: "TPE" },
                          { value: "PE", label: "PE" },
                          { value: "ME", label: "ME" },
                          { value: "GE", label: "GE" },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium"><Link2 size={15} className="text-primary" /> Site web</label>
                      <input
                        value={form.site_web}
                        onChange={(e) => setForm({ ...form, site_web: e.target.value })}
                        className={prospectInputClass}
                      />
                      <span className={fieldHintClass}>Exemple : https://www.entreprise.mg</span>
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium"><Building2 size={15} className="text-primary" /> Domaine</label>
                      <input
                        value={form.domaine}
                        onChange={(e) => setForm({ ...form, domaine: e.target.value })}
                        className={prospectInputClass}
                      />
                    </div>
                  </div>
                )}

                {form.type === 'particulier' && (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 [&>div]:min-w-0">
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium"><UserRound size={15} className="text-primary" /> Profession</label>
                      <input
                        value={form.profession}
                        onChange={(e) => setForm({ ...form, profession: e.target.value })}
                        className={prospectInputClass}
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium"><Building2 size={15} className="text-primary" /> Domaine</label>
                      <input
                        value={form.domaine}
                        onChange={(e) => setForm({ ...form, domaine: e.target.value })}
                        className={prospectInputClass}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-2 flex flex-col-reverse justify-end gap-2 border-t border-border pt-6 sm:flex-row sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50"
                  >
                    <Check size={16} />
                    {saving ? 'Enregistrement...' : 'Sauvegarder'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ==================== MODAL CONFIRMATION SUPPRESSION ==================== */}
      {deleteId && (
        <ModalPortal onClose={() => setDeleteId(null)}>
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
                disabled={deleting}
                className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? 'Suppression...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
}