import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Target, Trophy, CalendarDays, TrendingUp, UserX, CheckCircle2
} from 'lucide-react';
import { getDashboard, type DashboardStats } from '../services/dashboard';
import { useToast } from '../contexts/ToastContext';
import { getSessionUser } from '../lib/session';

export default function Dashboard() {
  const toast = useToast();
  const navigate = useNavigate();
  const user = getSessionUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(setStats)
      .catch(() => toast.error('Erreur de chargement du dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const formatMoney = (n: number) =>
    new Intl.NumberFormat('fr-FR').format(n) + ' Ar';

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const cards = stats
    ? [
        {
          label: 'Prospects',
          value: stats.prospects,
          icon: Users,
          color: 'text-blue-600 bg-blue-500/10',
          path: '/prospects',
        },
        {
          label: 'Prospections en cours',
          value: stats.en_cours,
          icon: Target,
          color: 'text-amber-600 bg-amber-500/10',
          path: '/prospections',
        },
        {
          label: 'Clôturées',
          value: stats.cloturees,
          icon: CheckCircle2,
          color: 'text-emerald-600 bg-emerald-500/10',
          path: '/prospections',
        },
        {
          label: 'Perdues',
          value: stats.perdues,
          icon: UserX,
          color: 'text-red-600 bg-red-500/10',
          path: '/prospections',
        },
        {
          label: 'Closings',
          value: stats.closings,
          icon: Trophy,
          color: 'text-primary bg-primary/10',
          path: '/closing',
        },
        {
          label: 'RDV aujourd\'hui',
          value: stats.rdv_aujourdhui,
          icon: CalendarDays,
          color: 'text-cyan-600 bg-cyan-500/10',
          path: '/rendez-vous',
        },
      ]
    : [];

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground capitalize">{today}</p>
        <h1 className="text-2xl font-bold mt-0.5">
          Bonjour {user?.nom?.split(' ')[0] || ''}
        </h1>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Chargement...</div>
      ) : (
        <>
          {/* Cartes stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
            {cards.map((c) => (
              <button
                key={c.label}
                onClick={() => navigate(c.path)}
                className="text-left rounded-xl bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{c.label}</p>
                    <p className="text-2xl font-bold mt-1">{c.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.color}`}>
                    <c.icon size={18} />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Conversion + montant */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-xl bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={18} className="text-primary" />
                <h2 className="font-semibold">Taux de conversion</h2>
              </div>
              <p className="text-3xl font-bold">{stats?.taux_conversion ?? 0}%</p>
              <p className="text-sm text-muted-foreground mt-1">
                {stats?.cloturees ?? 0} gagnée(s) sur {stats?.prospections ?? 0} prospection(s)
              </p>
            </div>

            <div className="rounded-xl bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={18} className="text-primary" />
                <h2 className="font-semibold">Montant des closings</h2>
              </div>
              <p className="text-3xl font-bold">
                {formatMoney(stats?.montant_closings ?? 0)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {stats?.closings ?? 0} closing(s) · {stats?.rdv_semaine ?? 0} RDV cette semaine
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}