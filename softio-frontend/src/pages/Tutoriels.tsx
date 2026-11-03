import { useEffect, useState } from 'react';
import { GraduationCap, Plus, Trash2 } from 'lucide-react';
import { getTutoriels, createTutoriel, deleteTutoriel, type Tutoriel } from '../services/tutoriels';
import { useToast } from '../contexts/ToastContext';

function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('/')[0];
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
    return null;
  } catch {
    return null;
  }
}

export default function Tutoriels() {
  const toast = useToast();
  const [items, setItems] = useState<Tutoriel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ titre: '', lien: '' });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getTutoriels();
      setItems(res.data || []);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre || !form.lien) {
      toast.error('Titre et lien obligatoires');
      return;
    }
    try {
      setSaving(true);
      await createTutoriel(form);
      toast.success('Tutoriel ajouté');
      setForm({ titre: '', lien: '' });
      fetchData();
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTutoriel(deleteId);
      toast.success('Tutoriel supprimé');
      setDeleteId(null);
      fetchData();
    } catch {
      toast.error('Erreur suppression');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <GraduationCap size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold">Tutoriels</h1>
          <p className="text-sm text-muted-foreground">Gérez vos vidéos de formation</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl bg-card shadow-sm p-4 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-sm font-medium">Titre de la vidéo</label>
            <input
              value={form.titre}
              onChange={(e) => setForm({ ...form, titre: e.target.value })}
              className="mt-1 w-full px-3 py-2.5 rounded-lg bg-background shadow-sm text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Lien de la vidéo</label>
            <input
              value={form.lien}
              onChange={(e) => setForm({ ...form, lien: e.target.value })}
              className="mt-1 w-full px-3 py-2.5 rounded-lg bg-background shadow-sm text-sm"
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm disabled:opacity-50"
          >
            <Plus size={16} />
            {saving ? '...' : 'Valider'}
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-center text-muted-foreground py-16">Chargement...</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
          Aucune vidéo pour le moment
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((t) => {
            const id = youtubeId(t.lien);
            const thumb = id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
            return (
              <div key={t.id_tutoriel} className="rounded-xl bg-card shadow-sm overflow-hidden">
                <a href={t.lien} target="_blank" rel="noreferrer" className="block relative aspect-video bg-black">
                  {thumb ? (
                    <img src={thumb} alt={t.titre} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">Vidéo</div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                      <span className="text-white text-lg ml-0.5">▶</span>
                    </div>
                  </div>
                </a>
                <div className="flex items-center justify-between px-3 py-2">
                  <p className="text-sm font-medium truncate">{t.titre}</p>
                  <button
                    onClick={() => setDeleteId(t.id_tutoriel)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-xl w-full max-w-sm p-6 shadow-xl text-center">
            <h3 className="font-semibold mb-2">Supprimer ce tutoriel ?</h3>
            <div className="flex justify-center gap-2 mt-4">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-lg shadow-sm text-sm hover:bg-accent">Annuler</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}