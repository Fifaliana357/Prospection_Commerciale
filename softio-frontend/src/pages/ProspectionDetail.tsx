import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, XCircle, Trash2, Send, MessageSquare,
  Star, CalendarDays, RotateCcw, History
} from 'lucide-react';
import {
  getProspection,
  updateProspection,
  deleteProspection,
  addMessage,
  type Prospection,
  type Proposition
} from '../services/prospections';
import { createClosing } from '../services/closings';
import { createRendezVous } from '../services/rendezvous';
import { getInterets, createInteret } from '../services/interets';
import { useToast } from '../contexts/ToastContext';

export default function ProspectionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [prospection, setProspection] = useState<Prospection | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sortant' | 'entrant' | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Forms messages
  const [form, setForm] = useState({
    objet: '',
    message: '',
    type_message: 'Contact',
    note: 0,
  });

  // Closing
  const [showClosing, setShowClosing] = useState(false);
  const [closingForm, setClosingForm] = useState({ produit: '', objet: '', description: '', montant: '' });
  const [savingClosing, setSavingClosing] = useState(false);

  // RDV
  const [showRdv, setShowRdv] = useState(false);
  const [rdvForm, setRdvForm] = useState({
    date_rdv: '', heure: '', type_rdv: 'Direct', lieu: '', lien_rdv: '', telephone: '', commentaire: ''
  });
  const [savingRdv, setSavingRdv] = useState(false);

  // Relance
  const [showRelance, setShowRelance] = useState(false);
  const [relanceDate, setRelanceDate] = useState('');

  // Intérêts
  const [showInterets, setShowInterets] = useState(false);
  const [interetInput, setInteretInput] = useState('');
  const [interetsList, setInteretsList] = useState<string[]>([]);

  // Score history
  const [showScore, setShowScore] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getProspection(Number(id));
      setProspection(data);
    } catch {
      toast.error('Erreur lors du chargement');
      navigate('/prospections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleAddMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prospection || !form.message.trim()) {
      toast.error('Le message est obligatoire');
      return;
    }
    try {
      setSaving(true);
      await addMessage(prospection.id_prospection, {
        objet: form.objet || null,
        message: form.message,
        type: activeTab,
        type_message: form.type_message,
        note: activeTab === 'entrant' ? form.note : null,
      });
      toast.success('Message ajouté');
      setForm({ objet: '', message: '', type_message: 'Contact', note: 0 });
      setActiveTab(null);
      fetchData();
    } catch {
      toast.error('Erreur lors de l\'ajout');
    } finally {
      setSaving(false);
    }
  };

  const handleClosing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prospection || !closingForm.produit || !closingForm.montant) {
      toast.error('Produit et montant obligatoires');
      return;
    }
    try {
      setSavingClosing(true);
      await createClosing({
        id_prospection: prospection.id_prospection,
        id_client: prospection.id_client,
        produit: closingForm.produit,
        description: [closingForm.objet, closingForm.description].filter(Boolean).join(' — ') || null,
        montant: Number(closingForm.montant),
      });
      toast.success('Prospection clôturée');
      setShowClosing(false);
      fetchData();
    } catch {
      toast.error('Erreur');
    } finally {
      setSavingClosing(false);
    }
  };

  const handleRdv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prospection || !rdvForm.date_rdv) {
      toast.error('Date obligatoire');
      return;
    }
    try {
      setSavingRdv(true);
      await createRendezVous({
        id_client: prospection.id_client,
        date_rdv: `${rdvForm.date_rdv} ${rdvForm.heure || '09:00'}:00`,
        type_rdv: rdvForm.type_rdv,
        lieu: rdvForm.lieu || null,
        lien_rdv: rdvForm.lien_rdv || null,
        commentaire: rdvForm.commentaire || null,
      });
      toast.success('Rendez-vous créé');
      setShowRdv(false);
    } catch {
      toast.error('Erreur');
    } finally {
      setSavingRdv(false);
    }
  };

  const openInterets = async () => {
    if (!prospection) return;
    try {
      const res = await getInterets({ search: prospection.client?.nom || '' });
      const clientData = (res.clients?.data || res.clients || []).find(
        (c: any) => c.id_client === prospection.id_client
      );
      const existing = (clientData?.interets || []).map((i: any) => i.produit_concerne);
      setInteretsList(existing);
    } catch {
      setInteretsList([]);
    }
    setShowInterets(true);
  };

  const handlePerdu = async () => {
    if (!prospection) return;
    try {
      await updateProspection(prospection.id_prospection, { est_perdu: true });
      toast.success('Marquée comme perdue');
      fetchData();
    } catch {
      toast.error('Erreur');
    }
  };

  const handleDelete = async () => {
    if (!prospection) return;
    try {
      await deleteProspection(prospection.id_prospection);
      toast.success('Supprimée');
      navigate('/prospections');
    } catch {
      toast.error('Erreur');
    }
  };

  const handleSaveInterets = async () => {
    if (!prospection || interetsList.length === 0) {
      setShowInterets(false);
      return;
    }
    try {
      for (const produit of interetsList) {
        await createInteret({
          id_client: prospection.id_client,
          produit_concerne: produit,
          niveau: 3,
        });
      }
      toast.success('Intérêts enregistrés');
      setShowInterets(false);
      setInteretsList([]);
    } catch {
      toast.error('Erreur');
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Chargement...</div>;
  }
  if (!prospection) return null;

  const clientName = prospection.client
    ? (prospection.client.entreprise || `${prospection.client.nom} ${prospection.client.prenom || ''}`.trim())
    : 'Prospect';
  const messages = prospection.propositions || [];
  const isClosed = prospection.etat === 'cloture' || prospection.est_perdu;

  return (
    <div className="p-8 sm:p-10 max-w-9xl mx-auto">
      <button onClick={() => navigate('/prospections')} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft size={16} /> Retour aux prospections
      </button>

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-primary/10 via-card to-card p-4 sm:p-5 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold shadow-sm shrink-0">
              {clientName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight">{clientName}</h1>
                <span className="text-xs text-muted-foreground">N°{prospection.id_prospection}</span>
                {prospection.est_perdu ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-600">Perdu</span>
                ) : prospection.etat === 'cloture' ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-600">Clôturé</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-600">Non clôturé</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {prospection.produit_prospecte || prospection.offre?.denomination || '—'}
                {prospection.client?.telephone && ` · ${prospection.client.telephone}`}
              </p>
            </div>
          </div>

          {!isClosed && (
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setShowRdv(true)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">
                <CalendarDays size={13} /> RDV
              </button>
              <button onClick={() => {
                setClosingForm({ produit: prospection.produit_prospecte || '', objet: '', description: '', montant: '' });
                setShowClosing(true);
              }} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">
                <CheckCircle2 size={13} /> Closing
              </button>
              <button onClick={() => setShowRelance(true)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20">
                <RotateCcw size={13} /> Relancer
              </button>
              <button onClick={openInterets} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">
                <Star size={13} /> Intérêts
              </button>
              <button onClick={handlePerdu} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-600 hover:bg-red-500/20">
                <XCircle size={13} /> Perdu
              </button>
              <button onClick={() => setShowScore(true)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-violet-500/10 text-violet-600 hover:bg-violet-500/20">
                <History size={13} /> Score
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs messages */}
      <div className="flex rounded-xl border border-border overflow-hidden mb-3">
        <button
          onClick={() => setActiveTab(activeTab === 'sortant' ? null : 'sortant')}
          className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'sortant' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-accent'
          }`}
        >
          <Send size={14} /> Message sortant
        </button>
        <button
          onClick={() => setActiveTab(activeTab === 'entrant' ? null : 'entrant')}
          className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'entrant' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-accent'
          }`}
        >
          <MessageSquare size={14} /> Message entrant
        </button>
      </div>

      {/* Formulaire message (affiché seulement si tab actif) */}
      {activeTab && (
        <div className="bg-card border border-border rounded-xl p-4 mb-4">
          <h3 className="font-semibold text-sm mb-3">
            Ajouter un message {activeTab === 'sortant' ? 'sortant' : 'entrant'}
          </h3>
          <form onSubmit={handleAddMessage} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeTab === 'entrant' && (
                <div>
                  <label className="text-xs font-medium">Objet</label>
                  <input value={form.objet} onChange={(e) => setForm({ ...form, objet: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background text-sm" placeholder="Objet" />
                </div>
              )}
              <div>
                <label className="text-xs font-medium">Type</label>
                <select value={form.type_message} onChange={(e) => setForm({ ...form, type_message: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background text-sm">
                  <option value="Contact">Contact</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Email">Email</option>
                  <option value="Téléphone">Téléphone</option>
                  <option value="WhatsApp">WhatsApp</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium">{activeTab === 'sortant' ? 'Message' : 'Réponse du prospect'}</label>
              <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={3} className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background text-sm resize-none"
                placeholder="Écrire le message..." />
            </div>
            {activeTab === 'entrant' && (
              <div>
                <label className="text-xs font-medium mb-1 block">Note</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setForm({ ...form, note: n })} className="p-0.5">
                      <Star size={18} className={n <= form.note ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'} />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <button type="submit" disabled={saving}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 disabled:opacity-50">
                {saving ? '...' : '+ Ajouter'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Timeline messages */}
      <div className="space-y-2.5">
        {messages.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-xl text-sm">
            Aucun message
          </div>
        ) : (
          messages.map((msg: Proposition) => (
            <div key={msg.id_proposition}
              className={`border border-border rounded-xl p-3.5 ${msg.type === 'sortant' ? 'bg-primary/5' : 'bg-amber-500/5'}`}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    msg.type === 'sortant' ? 'bg-primary/20 text-primary' : 'bg-amber-500/20 text-amber-600'
                  }`}>
                    {msg.type === 'sortant' ? 'A' : clientName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{msg.type === 'sortant' ? 'Admin' : clientName}</p>
                    <p className="text-xs text-muted-foreground">
                      {msg.type_message || 'Message'} · {new Date(msg.date_proposition).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
                {msg.note != null && msg.note > 0 && (
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} size={12} className={n <= msg.note! ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'} />
                    ))}
                  </div>
                )}
              </div>
              {msg.objet && <p className="text-sm font-medium mb-0.5">Objet : {msg.objet}</p>}
              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
            </div>
          ))
        )}
      </div>

      {/* ===== MODALS ===== */}

      {/* Closing */}
      {showClosing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <h2 className="font-semibold">Clôture de la prospection</h2>
              <button onClick={() => setShowClosing(false)} className="p-1 rounded-lg hover:bg-accent">✕</button>
            </div>
            <form onSubmit={handleClosing} className="p-5 space-y-3">
              <div>
                <label className="text-sm font-medium">Nom du service ou produit *</label>
                <input required value={closingForm.produit} onChange={(e) => setClosingForm({ ...closingForm, produit: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Objet du service</label>
                <input value={closingForm.objet} onChange={(e) => setClosingForm({ ...closingForm, objet: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea value={closingForm.description} onChange={(e) => setClosingForm({ ...closingForm, description: e.target.value })}
                  rows={2} className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background text-sm resize-none" />
              </div>
              <div>
                <label className="text-sm font-medium">Tarif (Ar) *</label>
                <input required type="number" min="0" value={closingForm.montant}
                  onChange={(e) => setClosingForm({ ...closingForm, montant: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background text-sm" />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowClosing(false)} className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent">Fermer</button>
                <button type="submit" disabled={savingClosing} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm disabled:opacity-50">
                  {savingClosing ? '...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RDV */}
      {showRdv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border sticky top-0 bg-card">
              <h2 className="font-semibold">Fixer un rendez-vous</h2>
              <button onClick={() => setShowRdv(false)} className="p-1 rounded-lg hover:bg-accent">✕</button>
            </div>
            <form onSubmit={handleRdv} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Date *</label>
                  <input type="date" required value={rdvForm.date_rdv}
                    onChange={(e) => setRdvForm({ ...rdvForm, date_rdv: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium">Heure</label>
                  <input type="time" value={rdvForm.heure}
                    onChange={(e) => setRdvForm({ ...rdvForm, heure: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background text-sm" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Mode</label>
                <select value={rdvForm.type_rdv} onChange={(e) => setRdvForm({ ...rdvForm, type_rdv: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background text-sm">
                  <option value="Direct">Direct</option>
                  <option value="Téléphonique">Téléphonique</option>
                  <option value="Visio conférence">Visio conférence</option>
                  <option value="Livraison">Livraison</option>
                  <option value="Réunion">Réunion</option>
                </select>
              </div>
              {(rdvForm.type_rdv === 'Direct' || rdvForm.type_rdv === 'Livraison' || rdvForm.type_rdv === 'Réunion') && (
                <div>
                  <label className="text-sm font-medium">Lieu *</label>
                  <input required value={rdvForm.lieu} onChange={(e) => setRdvForm({ ...rdvForm, lieu: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background text-sm" />
                </div>
              )}
              {rdvForm.type_rdv === 'Visio conférence' && (
                <div>
                  <label className="text-sm font-medium">Lien *</label>
                  <input required value={rdvForm.lien_rdv} onChange={(e) => setRdvForm({ ...rdvForm, lien_rdv: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background text-sm" />
                </div>
              )}
              <div>
                <label className="text-sm font-medium">Commentaire</label>
                <textarea value={rdvForm.commentaire} onChange={(e) => setRdvForm({ ...rdvForm, commentaire: e.target.value })}
                  rows={2} className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background text-sm resize-none" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowRdv(false)} className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent">Annuler</button>
                <button type="submit" disabled={savingRdv} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm disabled:opacity-50">
                  {savingRdv ? '...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Relance */}
      {showRelance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm shadow-xl p-5">
            <h2 className="font-semibold text-center mb-1">Date de relance</h2>
            <p className="text-xs text-muted-foreground text-center mb-4">Choisissez la date à laquelle relancer ce prospect</p>
            <input type="date" value={relanceDate} onChange={(e) => setRelanceDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm mb-4" />
            <div className="flex justify-center gap-2">
              <button onClick={() => {
                if (!relanceDate) { toast.error('Choisissez une date'); return; }
                toast.success(`Relance planifiée pour le ${new Date(relanceDate).toLocaleDateString('fr-FR')}`);
                setShowRelance(false);
                setRelanceDate('');
              }} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">Enregistrer</button>
              <button onClick={() => setShowRelance(false)} className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Intérêts */}
      {showInterets && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <h2 className="font-semibold flex items-center gap-2"><Star size={16} /> Intérêts du prospect</h2>
              <button onClick={openInterets} className="p-1 rounded-lg hover:bg-accent">✕</button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex gap-2">
                <input value={interetInput} onChange={(e) => setInteretInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && interetInput.trim()) {
                      e.preventDefault();
                      setInteretsList([...interetsList, interetInput.trim()]);
                      setInteretInput('');
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-sm"
                  placeholder="Rechercher un service ou produit..." />
                <button type="button" onClick={() => {
                  if (interetInput.trim()) {
                    setInteretsList([...interetsList, interetInput.trim()]);
                    setInteretInput('');
                  }
                }} className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg">+</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {interetsList.map((item, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary">
                    {item}
                    <button onClick={() => setInteretsList(interetsList.filter((_, idx) => idx !== i))} className="hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setShowInterets(false)} className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent">Annuler</button>
                <button onClick={handleSaveInterets} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">Sauvegarder</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Score (simplifié) */}
      {showScore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Historique du score</h2>
              <button onClick={() => setShowScore(false)} className="p-1 rounded-lg hover:bg-accent">✕</button>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {clientName} · {messages.filter(m => m.type === 'entrant').length} message(s) entrant(s)
            </p>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <div className="text-2xl font-bold text-primary">
                {messages.filter(m => m.note).length > 0
                  ? Math.round((messages.filter(m => m.note).reduce((s, m) => s + (m.note || 0), 0) / messages.filter(m => m.note).length) * 20)
                  : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Score de message global</div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowScore(false)} className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}