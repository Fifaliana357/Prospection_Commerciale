import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, XCircle, Trash2, Send, MessageSquare,
  Star, User
} from 'lucide-react';
import {
  getProspection,
  updateProspection,
  deleteProspection,
  addMessage,
  type Prospection,
  type Proposition
} from '../services/prospections';
import { useToast } from '../contexts/ToastContext';
import { createClosing } from '../services/closings';

export default function ProspectionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [prospection, setProspection] = useState<Prospection | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sortant' | 'entrant'>('sortant');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const [showClosingModal, setShowClosingModal] = useState(false);
  const [closingForm, setClosingForm] = useState({
    produit: '',
    objet: '',
    description: '',
    montant: '',
  });
  const [savingClosing, setSavingClosing] = useState(false);

  // Formulaire message
  const [form, setForm] = useState({
    objet: '',
    message: '',
    type_message: 'Facebook',
    note: 0,
  });

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

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleCloturer = async () => {
    if (!prospection) return;
    try {
      await updateProspection(prospection.id_prospection, { etat: 'cloture', est_perdu: false });
      toast.success('Prospection clôturée');
      fetchData();
    } catch {
      toast.error('Erreur');
    }
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

  const handleClosing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prospection || !closingForm.produit || !closingForm.montant) {
      toast.error('Produit et montant sont obligatoires');
      return;
    }

    try {
      setSavingClosing(true);
      await createClosing({
        id_prospection: prospection.id_prospection,
        id_client: prospection.id_client,
        produit: closingForm.produit,
        description: [closingForm.objet, closingForm.description]
          .filter(Boolean)
          .join(' — ') || null,
        montant: Number(closingForm.montant),
      });
      toast.success('Prospection clôturée avec succès');
      setShowClosingModal(false);
      setClosingForm({ produit: '', objet: '', description: '', montant: '' });
      fetchData();
    } catch {
      toast.error('Erreur lors de la clôture');
    } finally {
      setSavingClosing(false);
    }
  };

  const handleDelete = async () => {
    if (!prospection) return;
    try {
      await deleteProspection(prospection.id_prospection);
      toast.success('Prospection supprimée');
      navigate('/prospections');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

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
      setForm({ objet: '', message: '', type_message: 'Facebook', note: 0 });
      fetchData();
    } catch {
      toast.error('Erreur lors de l\'ajout du message');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px] text-muted-foreground">
        Chargement...
      </div>
    );
  }

  if (!prospection) return null;

  const clientName = prospection.client
    ? `${prospection.client.nom} ${prospection.client.prenom || ''}`.trim()
    : 'Prospect';

  const messages = prospection.propositions || [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Retour */}
      <button
        onClick={() => navigate('/prospections')}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft size={16} />
        Retour aux prospections
      </button>

      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
              {clientName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold">{clientName}</h1>
                <span className="text-sm text-muted-foreground">
                  Prospection N°{prospection.id_prospection}
                </span>
                {prospection.est_perdu ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-600">
                    Perdu
                  </span>
                ) : prospection.etat === 'cloture' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600">
                    Clôturé
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600">
                    Non clôturé
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {prospection.produit_prospecte || prospection.offre?.denomination || 'Aucun produit spécifié'}
              </p>
              {prospection.client?.telephone && (
                <p className="text-sm text-muted-foreground">{prospection.client.telephone}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
          {!prospection.est_perdu && prospection.etat !== 'cloture' && (
          <button
            type="button"
            onClick={() => {
              setClosingForm({
                produit: prospection.produit_prospecte || prospection.offre?.denomination || '',
                objet: '',
                description: '',
                montant: '',
              });
              setShowClosingModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
          >
            <CheckCircle2 size={15} />
            Closing
          </button>
          )}
            {!prospection.est_perdu && (
              <button
                onClick={handlePerdu}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
              >
                <XCircle size={15} />
                Marquer perdu
              </button>
            )}
            <button
              onClick={() => setDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-red-500/10 text-red-600 hover:bg-red-500/20"
            >
              <Trash2 size={15} />
              Supprimer
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Messages */}
      <div className="flex border-b border-border mb-4">
        <button
          onClick={() => setActiveTab('sortant')}
          className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
            activeTab === 'sortant'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Send size={15} className="inline mr-1.5 -mt-0.5" />
          Message sortant
        </button>
        <button
          onClick={() => setActiveTab('entrant')}
          className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
            activeTab === 'entrant'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageSquare size={15} className="inline mr-1.5 -mt-0.5" />
          Message entrant
        </button>
      </div>

      {/* Formulaire d'ajout */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h3 className="font-semibold mb-4">
          Ajouter un message {activeTab === 'sortant' ? 'sortant' : 'entrant'}
        </h3>
        <form onSubmit={handleAddMessage} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Objet</label>
              <input
                value={form.objet}
                onChange={(e) => setForm({ ...form, objet: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background"
                placeholder="Objet du message"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <select
                value={form.type_message}
                onChange={(e) => setForm({ ...form, type_message: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background"
              >
                <option value="Facebook">Facebook</option>
                <option value="Email">Email</option>
                <option value="Téléphone">Téléphone</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">
              {activeTab === 'sortant' ? 'Message' : 'Réponse du prospect'}
            </label>
            <textarea
              required
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={4}
              className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background resize-none"
              placeholder="Écrire le message..."
            />
          </div>

          {activeTab === 'entrant' && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Note</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForm({ ...form, note: n })}
                    className="p-1"
                  >
                    <Star
                      size={22}
                      className={n <= form.note ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Ajout...' : '+ Ajouter'}
            </button>
          </div>
        </form>
      </div>

      {/* Timeline des messages */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Historique des messages</h3>

        {messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
            Aucun message pour le moment
          </div>
        ) : (
          messages.map((msg: Proposition) => (
            <div
              key={msg.id_proposition}
              className={`border border-border rounded-xl p-4 ${
                msg.type === 'sortant' ? 'bg-primary/5' : 'bg-amber-500/5'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    msg.type === 'sortant'
                      ? 'bg-primary/20 text-primary'
                      : 'bg-amber-500/20 text-amber-600'
                  }`}>
                    {msg.type === 'sortant' ? 'A' : clientName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {msg.type === 'sortant' ? 'Admin / Commercial' : clientName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {msg.type_message || 'Message'} • {new Date(msg.date_proposition).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
                {msg.note !== null && msg.note !== undefined && msg.note > 0 && (
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={14}
                        className={n <= msg.note! ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}
                      />
                    ))}
                  </div>
                )}
              </div>

              {msg.objet && (
                <p className="text-sm font-medium mb-1">Objet : {msg.objet}</p>
              )}
              <p className="text-sm text-foreground whitespace-pre-wrap">{msg.message}</p>
            </div>
          ))
        )}
      </div>

      {showClosingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <CheckCircle2 size={16} />
                </div>
                <h2 className="font-semibold">Clôture de la prospection</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowClosingModal(false)}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleClosing} className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium">Nom du service ou produit</label>
                <input
                  required
                  value={closingForm.produit}
                  onChange={(e) => setClosingForm({ ...closingForm, produit: e.target.value })}
                  className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg bg-background"
                  placeholder="Rechercher un service ou produit..."
                />
              </div>

              <div>
                <label className="text-sm font-medium">Objet du service</label>
                <input
                  value={closingForm.objet}
                  onChange={(e) => setClosingForm({ ...closingForm, objet: e.target.value })}
                  className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg bg-background"
                  placeholder="Objet du service"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={closingForm.description}
                  onChange={(e) => setClosingForm({ ...closingForm, description: e.target.value })}
                  rows={3}
                  className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg bg-background resize-none"
                  placeholder="Description de l'offre"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Tarif de l'offre (Ar)</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={closingForm.montant}
                  onChange={(e) => setClosingForm({ ...closingForm, montant: e.target.value })}
                  className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg bg-background"
                  placeholder="Tarif"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClosingModal(false)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-accent"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  disabled={savingClosing}
                  className="px-5 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {savingClosing ? '...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal suppression */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 shadow-xl text-center">
            <div className="w-14 h-14 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              !
            </div>
            <h3 className="text-lg font-semibold mb-2">Êtes-vous sûr ?</h3>
            <p className="text-muted-foreground mb-6">
              Cette prospection et tous ses messages seront définitivement supprimés.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-5 py-2 border border-border rounded-lg hover:bg-accent"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
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