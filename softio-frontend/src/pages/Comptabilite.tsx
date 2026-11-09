import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownCircle, ArrowUpCircle, CalendarDays, Download, FileSpreadsheet, FileText, Plus, Trash2, Wallet,
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import DatePicker from '../components/ui/DatePicker';
import DateTimePicker from '../components/ui/DateTimePicker';
import TablePagination from '../components/ui/TablePagination';
import PageHeader from '../components/ui/PageHeader';
import TableSummary from '../components/ui/TableSummary';
import { useToast } from '../contexts/ToastContext';
import {
  createAccountingOperation,
  deleteAccountingOperation,
  exportAccounting,
  getAccounting,
  type AccountingData,
  type AccountingOperation,
} from '../services/account';
import { createInvoiceFromSale } from '../services/ventes';
import { formatMGA } from '../lib/utils';

type Tab = 'recettes' | 'depenses' | 'versements';
const today = new Date();
const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}T${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
const fieldClass = 'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50';

function errorMessage(error: unknown, fallback: string) {
  return (error as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

function money(value: number | string | null | undefined) {
  return formatMGA(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

function clientLabel(client?: { nom: string; prenom: string | null; entreprise: string | null } | null) {
  if (!client) return 'Client non renseigné';
  return client.entreprise || [client.prenom, client.nom].filter(Boolean).join(' ');
}

export default function Comptabilite() {
  const toast = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('recettes');
  const [data, setData] = useState<AccountingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [appliedDates, setAppliedDates] = useState({ from: '', to: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [operationToDelete, setOperationToDelete] = useState<AccountingOperation | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [page, setPage] = useState(1);
  const [montant, setMontant] = useState('');
  const [motif, setMotif] = useState('');
  const [dateOperation, setDateOperation] = useState(defaultDate);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [invoiceLoadingId, setInvoiceLoadingId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      try {
        setLoading(true);
        const result = await getAccounting({
          date_from: appliedDates.from || undefined,
          date_to: appliedDates.to || undefined,
          type: tab === 'recettes' ? undefined : tab === 'depenses' ? 'depense' : 'versement',
          sales_page: tab === 'recettes' ? page : 1,
          operations_page: tab === 'recettes' ? 1 : page,
        });
        if (active) setData(result);
      } catch (error: unknown) {
        if (active) toast.error(errorMessage(error, 'Impossible de charger la comptabilité.'));
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => { active = false; };
  }, [tab, appliedDates, page, refresh]);

  const openOperationForm = () => {
    setMontant('');
    setMotif('');
    setDateOperation(defaultDate);
    setAttachment(null);
    setFormOpen(true);
  };

  const saveOperation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (tab === 'recettes') return;
    const formData = new FormData();
    formData.append('type', tab === 'depenses' ? 'depense' : 'versement');
    formData.append('montant', montant);
    formData.append('motif', motif);
    formData.append('date_operation', dateOperation.replace('T', ' '));
    if (attachment) formData.append('piece_jointe', attachment);

    try {
      setSaving(true);
      await createAccountingOperation(formData);
      toast.success(tab === 'depenses' ? 'Dépense enregistrée.' : 'Versement enregistré.');
      setFormOpen(false);
      setRefresh((value) => value + 1);
    } catch (error: unknown) {
      toast.error(errorMessage(error, 'Impossible d’enregistrer cette opération.'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!operationToDelete) return;
    try {
      setDeleting(true);
      await deleteAccountingOperation(operationToDelete.id_operation);
      setOperationToDelete(null);
      toast.success('Opération supprimée.');
      setRefresh((value) => value + 1);
    } catch (error: unknown) {
      toast.error(errorMessage(error, 'Impossible de supprimer cette opération.'));
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await exportAccounting({
        type: tab === 'recettes' ? 'recettes' : tab === 'depenses' ? 'depense' : 'versement',
        date_from: appliedDates.from || undefined,
        date_to: appliedDates.to || undefined,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `comptabilite-${tab}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error: unknown) {
      toast.error(errorMessage(error, 'Impossible d’exporter les données.'));
    } finally {
      setExporting(false);
    }
  };

  const showInvoice = async (sale: AccountingData['sales']['data'][number]) => {
    try {
      setInvoiceLoadingId(sale.id_vente);
      const invoice = sale.id_devis
        ? { id_devis: sale.id_devis }
        : await createInvoiceFromSale(sale.id_vente);
      navigate(`/facturation/${invoice.id_devis}/apercu`);
    } catch (error: unknown) {
      toast.error(errorMessage(error, 'Impossible d’afficher la facture.'));
    } finally {
      setInvoiceLoadingId(null);
    }
  };

  const summary = data?.summary;
  const operations = data?.operations.data || [];
  const sales = data?.sales.data || [];
  const currentPage = tab === 'recettes' ? data?.sales.current_page : data?.operations.current_page;
  const lastPage = tab === 'recettes' ? data?.sales.last_page : data?.operations.last_page;
  const operationTab = tab !== 'recettes';

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader title="Comptabilité" description="Recettes, versements, dépenses et solde." icon={<Wallet size={23} />} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="page-tabs" role="tablist" aria-label="Vues comptables">
          {([
            ['recettes', 'Recettes'],
            ['depenses', 'Dépenses'],
            ['versements', 'Versements'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => { setTab(key); setPage(1); }}
              className="page-tab"
            >
              {label}
            </button>
          ))}
        </div>
        {operationTab && (
          <button onClick={openOperationForm} className={`${buttonClass} bg-primary text-primary-foreground hover:opacity-90`}>
            <Plus size={16} /> Ajouter {tab === 'depenses' ? 'une dépense' : 'un versement'}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="block space-y-1 text-sm">
          <span className="text-muted-foreground">Du</span>
          <DatePicker value={dateFrom} onChange={setDateFrom} />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-muted-foreground">Au</span>
          <DatePicker value={dateTo} onChange={setDateTo} />
        </label>
        <button
          onClick={() => { setAppliedDates({ from: dateFrom, to: dateTo }); setPage(1); }}
          className={`${buttonClass} bg-primary text-primary-foreground hover:opacity-90`}
        >
          <CalendarDays size={15} /> Filtrer
        </button>
        <button
          onClick={() => { setDateFrom(''); setDateTo(''); setAppliedDates({ from: '', to: '' }); setPage(1); }}
          className={`${buttonClass} border border-border text-muted-foreground hover:bg-accent`}
        >
          Effacer
        </button>
        <button
          onClick={() => void handleExport()}
          disabled={exporting}
          className={`${buttonClass} border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10`}
        >
          <FileSpreadsheet size={16} /> {exporting ? 'Export...' : 'Exporter'}
        </button>
        <TableSummary
          total={tab === 'recettes' ? (data?.sales.total || 0) : (data?.operations.total || 0)}
          label={tab === 'recettes' ? 'recettes' : tab === 'depenses' ? 'dépenses' : 'versements'}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total des recettes', value: summary?.recettes, note: `${summary?.ventes || 0} vente(s) validée(s)`, color: 'text-primary' },
          { label: 'Total des versements', value: summary?.versements, note: `${summary?.nombre_versements || 0} versement(s)`, color: 'text-sky-600' },
          { label: 'Total des dépenses', value: summary?.depenses, note: `${summary?.nombre_depenses || 0} dépense(s)`, color: 'text-red-600' },
          { label: 'Solde', value: summary?.solde, note: 'Recettes + versements − dépenses', color: (summary?.solde || 0) >= 0 ? 'text-emerald-600' : 'text-red-600' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className={`mt-1 text-xl font-bold ${item.color}`}>{money(item.value)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {loading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Chargement...</p>
        ) : tab === 'recettes' ? (
          sales.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Aucune vente validée pour cette période.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-primary text-primary-foreground">
                  <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">N° vente</th><th className="px-4 py-3">Nom et prénom</th><th className="px-4 py-3 text-right">Montant</th><th className="px-4 py-3 text-center">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sales.map((sale) => (
                    <tr key={sale.id_vente} className="hover:bg-muted/30">
                      <td className="px-4 py-3">{formatDate(sale.date_vente || sale.created_at)}</td>
                      <td className="px-4 py-3">{sale.numero || `V-${sale.id_vente}`}</td>
                      <td className="px-4 py-3">{clientLabel(sale.client)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{money(sale.montant_ttc ?? sale.montant_total)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => void showInvoice(sale)}
                          disabled={invoiceLoadingId !== null}
                          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                          title="Afficher la facture"
                          aria-label={`Afficher la facture ${sale.numero}`}
                        >
                          <FileText size={14} className={invoiceLoadingId === sale.id_vente ? 'animate-pulse' : ''} />
                          {invoiceLoadingId === sale.id_vente ? 'Ouverture...' : 'Afficher la facture'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : operations.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Aucune {tab === 'depenses' ? 'dépense' : 'versement'} enregistrée.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-primary text-primary-foreground">
                <tr><th className="px-4 py-3">Date et heure</th><th className="px-4 py-3">Motif</th><th className="px-4 py-3 text-right">Montant</th><th className="px-4 py-3">Pièce jointe</th><th className="px-4 py-3 text-right">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {operations.map((operation) => (
                  <tr key={operation.id_operation} className="hover:bg-muted/30">
                    <td className="px-4 py-3">{formatDate(operation.date_operation)}</td>
                    <td className="px-4 py-3">{operation.motif}</td>
                    <td className="px-4 py-3 text-right font-semibold">{money(operation.montant)}</td>
                    <td className="px-4 py-3">
                      {operation.piece_jointe_url ? (
                        <a href={operation.piece_jointe_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                          <Download size={14} /> Ouvrir
                        </a>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setOperationToDelete(operation)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Supprimer l’opération"
                        title="Supprimer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && <TablePagination page={currentPage || 1} lastPage={lastPage || 1} onChange={setPage} />}
      </section>

      <Modal open={formOpen} onClose={() => !saving && setFormOpen(false)} title={tab === 'depenses' ? 'Ajouter une dépense' : 'Ajouter un versement'} size="sm">
        <form onSubmit={saveOperation} className="space-y-4">
          <label className="block space-y-1.5 text-sm font-medium">
            <span>Montant (MGA)</span>
            <input type="number" min="0.01" step="0.01" required value={montant} onChange={(event) => setMontant(event.target.value)} className={fieldClass} />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">
            <span>{tab === 'depenses' ? 'Raison' : 'Motif'}</span>
            <input required maxLength={191} value={motif} onChange={(event) => setMotif(event.target.value)} className={fieldClass} />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">
            <span>Date et heure</span>
            <DateTimePicker required value={dateOperation} onChange={setDateOperation} />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">
            <span>Pièce jointe (facultative)</span>
            <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(event) => setAttachment(event.target.files?.[0] || null)} className={fieldClass} />
            <span className="block text-xs font-normal text-muted-foreground">JPG, PNG ou PDF, 5 Mo maximum.</span>
          </label>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" onClick={() => setFormOpen(false)} disabled={saving} className={`${buttonClass} border border-border hover:bg-accent`}>Annuler</button>
            <button disabled={saving} className={`${buttonClass} bg-primary text-primary-foreground hover:opacity-90`}>
              {tab === 'depenses' ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={operationToDelete !== null} onClose={() => !deleting && setOperationToDelete(null)} title="Supprimer cette opération" size="sm">
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Confirmer la suppression de « <strong className="text-foreground">{operationToDelete?.motif}</strong> » ? Cette action est définitive.
          </p>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button onClick={() => setOperationToDelete(null)} disabled={deleting} className={`${buttonClass} border border-border hover:bg-accent`}>Annuler</button>
            <button onClick={() => void confirmDelete()} disabled={deleting} className={`${buttonClass} bg-destructive text-destructive-foreground hover:opacity-90`}>
              <Trash2 size={15} /> {deleting ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
