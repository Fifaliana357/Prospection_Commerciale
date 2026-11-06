import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { createProspection } from '../services/prospections';
import { getClients, type Client } from '../services/clients';
import { useToast } from '../contexts/ToastContext';
import PageHeader from '../components/ui/PageHeader';
import Select from '../components/ui/Select';
import { getFacturationCatalog } from '../services/facturation';

type CatalogueItem = {
  label: string;
  type: 'Produit' | 'Service';
};

export default function ProspectionCreate() {
  const navigate = useNavigate();
  const toast = useToast();
  const toastRef = useRef(toast);

  const [clients, setClients] = useState<Client[]>([]);
  const [catalogueItems, setCatalogueItems] = useState<CatalogueItem[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCatalogueSuggestions, setShowCatalogueSuggestions] = useState(false);

  const [form, setForm] = useState({
    id_client: '',
    produit_prospecte: '',
    objet: '',
    message: '',
    type_message: 'Facebook',
  });

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const res = await getClients({ page: 1 });
        // On récupère plus de clients si besoin
        setClients(res.data || []);
      } catch {
        toastRef.current.error('Erreur lors du chargement des prospects');
      } finally {
        setLoadingClients(false);
      }
    };
    loadClients();
  }, []);

  useEffect(() => {
    let active = true;

    getFacturationCatalog()
      .then((catalogue) => {
        if (!active) return;
        setCatalogueItems([
          ...catalogue.services.map((service) => ({
            label: service.denomination,
            type: 'Service' as const,
          })),
          ...catalogue.produits.map((product) => ({
            label: product.designation,
            type: 'Produit' as const,
          })),
        ]);
      })
      .catch(() => {
        if (active) toastRef.current.error('Erreur lors du chargement des produits et services');
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredCatalogueItems = catalogueItems.filter((item) =>
    item.label.toLocaleLowerCase('fr').includes(form.produit_prospecte.toLocaleLowerCase('fr').trim())
  );

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
    } catch (error: unknown) {
      const message = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-2 py-4 sm:px-4 sm:py-5">
      <button
        onClick={() => navigate('/prospections')}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft size={16} />
        Retour aux prospections
      </button>

      <PageHeader
        title="Nouvelle prospection"
        description="Enregistrez une nouvelle action de prospection."
        icon={<MessageSquare size={23} />}
      />

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-5">
        {/* Prospect */}
        <div>
          <label className="text-sm font-medium">Prospect *</label>
            <Select
            required
            value={form.id_client}
            onChange={(id_client) => setForm({ ...form, id_client })}
            className="mt-1"
            disabled={loadingClients}
            placeholder="Sélectionner un prospect"
            options={clients.map((client) => ({
              value: String(client.id_client),
              label: `${client.matricule} — ${client.nom} ${client.prenom || ''}`,
            }))}
            />
        </div>

        {/* Produit / Service */}
        <div>
          <label className="text-sm font-medium">Produit ou service prospecté</label>
          <div className="relative">
            <input
              value={form.produit_prospecte}
              onChange={(e) => {
                setForm({ ...form, produit_prospecte: e.target.value });
                setShowCatalogueSuggestions(true);
              }}
              onFocus={() => setShowCatalogueSuggestions(true)}
              onBlur={() => window.setTimeout(() => setShowCatalogueSuggestions(false), 120)}
              className="mt-1 w-full px-3 py-2.5 border border-border rounded-lg bg-background"
              placeholder="Rechercher ou saisir librement un service ou produit..."
              autoComplete="off"
              role="combobox"
              aria-expanded={showCatalogueSuggestions && filteredCatalogueItems.length > 0}
              aria-controls="prospection-catalogue-options"
            />
            {showCatalogueSuggestions && filteredCatalogueItems.length > 0 && (
              <ul
                id="prospection-catalogue-options"
                role="listbox"
                className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-border bg-card p-2 shadow-xl"
              >
                {filteredCatalogueItems.map((item, index) => (
                  <li key={`${item.type}-${item.label}-${index}`} role="option" aria-selected={form.produit_prospecte === item.label}>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setForm({ ...form, produit_prospecte: item.label });
                        setShowCatalogueSuggestions(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-accent"
                    >
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ${item.type === 'Produit' ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                        {item.type}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
            <Select
              value={form.type_message}
              onChange={(type_message) => setForm({ ...form, type_message })}
              className="mt-1"
              options={[
                { value: "Email", label: "Email" },
                { value: "Facebook", label: "Facebook" },
                { value: "LinkedIn", label: "LinkedIn" },
                { value: "Contact", label: "Contact" },
              ]}
            />
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