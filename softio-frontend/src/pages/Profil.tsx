import { useEffect, useState } from 'react';
import { Check, KeyRound, Mail, UserRound } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import PageHeader from '../components/ui/PageHeader';
import {
  getAccountProfile,
  updateAccountEmail,
  updateAccountPassword,
  updateAccountProfile,
  type AccountProfile,
} from '../services/account';
import { updateSessionProfile } from '../lib/session';

const fieldClass = 'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50';

function errorMessage(error: unknown, fallback: string) {
  const response = (error as { response?: { data?: { message?: string } } })?.response;
  return response?.data?.message || fallback;
}

export default function Profil() {
  const toast = useToast();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [email, setEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [saving, setSaving] = useState('');

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      try {
        const data = await getAccountProfile();
        if (active) {
          setProfile(data);
          setEmail(data.email);
        }
      } catch (error: unknown) {
        if (active) toast.error(errorMessage(error, 'Impossible de charger le profil.'));
      }
    });
    return () => { active = false; };
  }, []);

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) return;
    try {
      setSaving('profile');
      await updateAccountProfile({ nom: profile.nom, prenom: profile.prenom });
      updateSessionProfile({ nom: profile.nom, prenom: profile.prenom, email: profile.email });
      toast.success('Informations personnelles mises à jour.');
    } catch (error: unknown) {
      toast.error(errorMessage(error, 'Impossible de mettre à jour le profil.'));
    } finally {
      setSaving('');
    }
  };

  const saveEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSaving('email');
      await updateAccountEmail({ email, current_password: emailPassword });
      if (profile) {
        const updated = { ...profile, email };
        setProfile(updated);
        updateSessionProfile(updated);
      }
      setEmailPassword('');
      toast.success('Adresse e-mail mise à jour.');
    } catch (error: unknown) {
      toast.error(errorMessage(error, 'Impossible de modifier l’adresse e-mail.'));
    } finally {
      setSaving('');
    }
  };

  const savePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSaving('password');
      await updateAccountPassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: passwordConfirmation,
      });
      setCurrentPassword('');
      setNewPassword('');
      setPasswordConfirmation('');
      toast.success('Mot de passe mis à jour.');
    } catch (error: unknown) {
      toast.error(errorMessage(error, 'Impossible de modifier le mot de passe.'));
    } finally {
      setSaving('');
    }
  };

  if (!profile) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Chargement du profil...</p>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader title="Profil" description="Gérez vos informations personnelles et votre sécurité." icon={<UserRound size={23} />} />

      <div className="grid gap-5 lg:grid-cols-3">
        <form onSubmit={saveProfile} className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4 font-semibold">
            <UserRound size={18} className="text-primary" /> Informations personnelles
          </div>
          <div className="flex-1 space-y-4 p-5">
            <label className="block space-y-1.5 text-sm font-medium">
              <span>Nom</span>
              <input required value={profile.nom || ''} onChange={(event) => setProfile({ ...profile, nom: event.target.value })} className={fieldClass} />
            </label>
            <label className="block space-y-1.5 text-sm font-medium">
              <span>Prénom</span>
              <input required value={profile.prenom || ''} onChange={(event) => setProfile({ ...profile, prenom: event.target.value })} className={fieldClass} />
            </label>
          </div>
          <div className="flex justify-end border-t border-border bg-muted/20 p-4">
            <button disabled={saving !== ''} className={buttonClass}><Check size={16} /> {saving === 'profile' ? 'Enregistrement...' : 'Enregistrer'}</button>
          </div>
        </form>

        <form onSubmit={saveEmail} className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4 font-semibold">
            <Mail size={18} className="text-primary" /> Modifier l’adresse e-mail
          </div>
          <div className="flex-1 space-y-4 p-5">
            <label className="block space-y-1.5 text-sm font-medium">
              <span>Nouvelle adresse e-mail</span>
              <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className={fieldClass} />
            </label>
            <label className="block space-y-1.5 text-sm font-medium">
              <span>Votre mot de passe</span>
              <input type="password" required value={emailPassword} onChange={(event) => setEmailPassword(event.target.value)} className={fieldClass} autoComplete="current-password" />
            </label>
          </div>
          <div className="flex justify-end border-t border-border bg-muted/20 p-4">
            <button disabled={saving !== ''} className={buttonClass}><Check size={16} /> {saving === 'email' ? 'Modification...' : 'Modifier'}</button>
          </div>
        </form>

        <form onSubmit={savePassword} className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4 font-semibold">
            <KeyRound size={18} className="text-primary" /> Modifier le mot de passe
          </div>
          <div className="flex-1 space-y-4 p-5">
            <label className="block space-y-1.5 text-sm font-medium">
              <span>Ancien mot de passe</span>
              <input type="password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className={fieldClass} autoComplete="current-password" />
            </label>
            <label className="block space-y-1.5 text-sm font-medium">
              <span>Nouveau mot de passe</span>
              <input type="password" minLength={8} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={fieldClass} autoComplete="new-password" />
            </label>
            <label className="block space-y-1.5 text-sm font-medium">
              <span>Confirmer le nouveau mot de passe</span>
              <input type="password" minLength={8} required value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} className={fieldClass} autoComplete="new-password" />
            </label>
          </div>
          <div className="flex justify-end border-t border-border bg-muted/20 p-4">
            <button disabled={saving !== ''} className={buttonClass}><Check size={16} /> {saving === 'password' ? 'Modification...' : 'Modifier'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
