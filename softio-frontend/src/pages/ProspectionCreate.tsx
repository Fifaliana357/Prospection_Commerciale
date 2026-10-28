import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { createProspection } from '../services/prospections';
import { getClients, type Client } from '../services/clients';
import { useToast } from '../contexts/ToastContext';

export default function ProspectionCreate() {
  const navigate = useNavigate();
  const toast = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    id_client: '',
    produit_prospecte: '',
    objet: '',
    message: '',
    type_message: 'Facebook',
  });

  useEffect(() => {
    const loadClients = async () => {
      try {
        const res = await getClients({ page: 1 });
        // On récupère plus de clients si besoin
        setClients(res.data || []);
      } catch {
        toast.error('Erreur lors du chargement des prospects');
      } finally {
        setLoadingClients(false);
      }
    };
    loadClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.id_client) {
      toast.error('Veuillez sélectionner un prospect');
      return;
    }

    try {
      setSaving(true);
      const res = await createProspection({
        id_client: Number(form.id_client),
        produit_prospecte: form.produit_prospecte || null,
        objet: form.objet || null,
        message: form.message || null,
        type_message: form.type_message,
      });

      toast.success('Prospection créée avec succès');
      navigate(`/prospections/${res.prospection.id_prospection}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/prospections')}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft size={16} />
        Retour aux prospections
      </button>

      <div className="mb-6">
        <h1 className="text-xl font-bold">Nouvelle prospection</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enregistrez une nouvelle action de prospection
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-5">
        {/* Prospect */}
        <div>
          <label className="text-sm font-medium">Prospect *</label>
            <select
            required
            value={form.id_client}
            onChange={(e) => setForm({ ...form, id_client: e.target.value })}
            className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg bg-background"
            disabled={loadingClients}
            >
            <option value="">Sélectionner un prospect</option>
            {clients.map((c) => (
                <option key={c.id_client} value={c.id_client}>
                {c.matricule} — {c.nom} {c.prenom || ''}
                </option>
            ))}
            </select>
        </div>

        {/* Produit / Service */}
        <div>
          <label className="text-sm font-medium">Produit ou service prospecté</label>
          <input
            value={form.produit_prospecte}
            onChange={(e) => setForm({ ...form, produit_prospecte: e.target.value })}
            className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg bg-background"
            placeholder="Ex: Power Station 1000wh, Formation Softio..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Objet</label>
            <input
              value={form.objet}
              onChange={(e) => setForm({ ...form, objet: e.target.value })}
              className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg bg-background"
              placeholder="Objet du premier message"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Type de message</label>
            <select
              value={form.type_message}
              onChange={(e) => setForm({ ...form, type_message: e.target.value })}
              className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg bg-background"
            >
              <option value="Facebook">Facebook</option>
              <option value="Email">Email</option>
              <option value="Téléphone">Téléphone</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="text-sm font-medium">Message initial</label>
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            rows={5}
            className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg bg-background resize-none"
            placeholder="Écrivez le premier message envoyé au prospect..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/prospections')}
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
            {saving ? 'Création...' : 'Créer la prospection'}
          </button>
        </div>
      </form>
    </div>
  );
}