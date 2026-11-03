import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Check, CheckCheck, Trash2 } from 'lucide-react';
import {
  getNotifications, markRead, markAllRead, deleteNotification, type Notif,
} from '../services/notifications';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/ui/Modal';

type Filtre = 'toutes' | 'non_lues' | 'message' | 'rdv';

function initials(name?: string | null) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function timeLabel(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function Notifications() {
  const toast = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notif[]>([]);
  const [counts, setCounts] = useState({ non_lues: 0, message: 0, rdv: 0 });
  const [search, setSearch] = useState('');
  const [filtre, setFiltre] = useState<Filtre>('toutes');
  const [loading, setLoading] = useState(true);
  const [notificationToDelete, setNotificationToDelete] = useState<Notif | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getNotifications({
        search: search || undefined,
        filtre,
      });
      setItems(res.data || []);
      setCounts(res.counts || { non_lues: 0, message: 0, rdv: 0 });
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, filtre]);

  const onMarkRead = async (n: Notif) => {
    if (n.lu) return;
    try {
      await markRead(n.id_notification);
      fetchData();
    } catch {
      toast.error('Erreur');
    }
  };

  const onMarkAll = async () => {
    try {
      await markAllRead();
      toast.success('Toutes marquées comme lues');
      fetchData();
    } catch {
      toast.error('Erreur');
    }
  };

  const onDelete = async (n: Notif) => {
    try {
      setDeleting(true);
      await deleteNotification(n.id_notification);
      toast.success('Notification supprimée');
      setNotificationToDelete(null);
      fetchData();
    } catch {
      toast.error('Impossible de supprimer la notification');
    } finally {
      setDeleting(false);
    }
  };

  const openNotif = (n: Notif) => {
    onMarkRead(n);
    if (n.type === 'message' && n.id_prospection) {
      const params = new URLSearchParams();
      if (n.sous_titre) params.set('messageSubject', n.sous_titre);
      if (n.contenu) params.set('messageBody', n.contenu.slice(0, 200));
      navigate(`/prospections/${n.id_prospection}${params.size ? `?${params}` : ''}`);
    } else if (n.type === 'rdv') {
      if (!n.id_rdv) {
        toast.error('Cette notification ne contient pas la référence du rendez-vous.');
        return;
      }
      navigate(`/rendez-vous?rdv=${n.id_rdv}`);
    }
  };

  const tabs: { key: Filtre; label: string; badge?: number }[] = [
    { key: 'toutes', label: 'Toutes' },
    { key: 'non_lues', label: 'Non lues', badge: counts.non_lues },
    { key: 'message', label: 'Messages', badge: counts.message },
    { key: 'rdv', label: 'Rendez-vous', badge: counts.rdv },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Bell size={20} />
            {counts.non_lues > 0 && (
              <span className="absolute -top-2 -right-2 min-w-6 h-6 px-1 rounded-full border-2 border-background bg-red-600 text-white text-xs flex items-center justify-center font-bold shadow-sm">
                {counts.non_lues}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              Suivez les messages de vos prospects et vos rendez-vous
            </p>
          </div>
        </div>
        <button
          onClick={onMarkAll}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
        >
          <Check size={16} /> Tout marquer comme lu
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par: prospect, objet ou numéro de prospection"
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFiltre(t.key)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filtre === t.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-card shadow-sm text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
            {!!t.badge && t.badge > 0 && (
              <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] flex items-center justify-center font-bold ${
                filtre === t.key ? 'bg-white/20' : 'bg-red-500 text-white'
              }`}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="rounded-xl bg-card shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-center text-muted-foreground py-12">Chargement...</p>
        ) : items.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Aucune notification</p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((n) => (
              <li
                key={n.id_notification}
                className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-accent/40 ${
                  !n.lu ? 'bg-primary/5' : ''
                }`}
                onClick={() => openNotif(n)}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                  {initials(n.nom_client)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{n.titre}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      n.type === 'rdv'
                        ? 'bg-violet-500/15 text-violet-600'
                        : 'bg-sky-500/15 text-sky-600'
                    }`}>
                      {n.type === 'rdv' ? 'Rendez-vous' : 'Message'}
                    </span>
                    {n.id_prospection && (
                      <span className="text-xs text-muted-foreground">
                        Prosp [{n.id_prospection}]
                      </span>
                    )}
                  </div>
                  {n.sous_titre && (
                    <p className="text-sm font-medium mt-0.5">« {n.sous_titre} »</p>
                  )}
                  {n.contenu && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{n.contenu}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">{timeLabel(n.created_at)}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkRead(n);
                      }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center ${
                        n.lu
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : 'bg-muted text-muted-foreground hover:bg-emerald-500/15 hover:text-emerald-600'
                      }`}
                      title={n.lu ? 'Notification lue' : 'Marquer comme lu'}
                      aria-label={n.lu ? 'Notification lue' : 'Marquer comme lu'}
                    >
                      {n.lu ? <CheckCheck size={14} /> : <Check size={14} />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setNotificationToDelete(n);
                      }}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title="Supprimer la notification"
                      aria-label="Supprimer la notification"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={notificationToDelete !== null}
        onClose={() => {
          if (!deleting) setNotificationToDelete(null);
        }}
        title="Supprimer la notification"
        size="sm"
      >
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Voulez-vous vraiment supprimer cette notification ? Cette action est définitive.
          </p>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setNotificationToDelete(null)}
              disabled={deleting}
              className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => notificationToDelete && void onDelete(notificationToDelete)}
              disabled={deleting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Trash2 size={15} /> {deleting ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}