import { useEffect, useRef, useState } from 'react';
import { Building2, Check, ImageUp, MapPin, Phone, Scale, Upload } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/ui/Modal';
import PageHeader from '../components/ui/PageHeader';
import {
  getCompanySettings,
  updateCompanySettings,
  type CompanySettings,
} from '../services/account';

type ImageField = 'logo' | 'cachet' | 'signature';

const emptyCompany: CompanySettings = {
  nom_entreprise: '',
  adresse: '',
  telephone: '',
  email: '',
  nif: '',
  stat: '',
  rcs: '',
  logo_url: null,
  cachet_url: null,
  signature_url: null,
};

const fieldClass = 'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50';
const imageLabels: Record<ImageField, string> = {
  logo: 'Logo',
  cachet: 'Cachet',
  signature: 'Ma signature',
};

function errorMessage(error: unknown, fallback: string) {
  return (error as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export default function Entreprise() {
  const toast = useToast();
  const [company, setCompany] = useState<CompanySettings>(emptyCompany);
  const [images, setImages] = useState<Partial<Record<ImageField, File>>>({});
  const [imagePreviews, setImagePreviews] = useState<Partial<Record<ImageField, string>>>({});
  const [saving, setSaving] = useState(false);
  const [imageToPreview, setImageToPreview] = useState<string | null>(null);
  const imageUrlsRef = useRef<Partial<Record<ImageField, string>>>({});

  useEffect(() => () => {
    Object.values(imageUrlsRef.current).forEach((url) => {
      if (url) URL.revokeObjectURL(url);
    });
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      try {
        const data = await getCompanySettings();
        if (active) setCompany({ ...emptyCompany, ...data });
      } catch (error: unknown) {
        if (active) toast.error(errorMessage(error, 'Impossible de charger les informations de l’entreprise.'));
      }
    });
    return () => { active = false; };
  }, []);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData();
    for (const field of ['nom_entreprise', 'adresse', 'telephone', 'email', 'nif', 'stat', 'rcs'] as const) {
      formData.append(field, company[field] || '');
    }
    for (const [key, file] of Object.entries(images)) {
      if (file) formData.append(key, file);
    }

    try {
      setSaving(true);
      const updated = await updateCompanySettings(formData);
      setCompany({ ...emptyCompany, ...updated });
      setImages({});
      Object.values(imageUrlsRef.current).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
      imageUrlsRef.current = {};
      setImagePreviews({});
      toast.success('Informations de l’entreprise enregistrées.');
    } catch (error: unknown) {
      toast.error(errorMessage(error, 'Impossible d’enregistrer les informations.'));
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof CompanySettings, value: string) => {
    setCompany((current) => ({ ...current, [field]: value }));
  };

  const displayImage = (field: ImageField) => {
    return imagePreviews[field] || company[`${field}_url`];
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader title="Mon entreprise" description="Informations reprises sur vos factures et devis." icon={<Building2 size={23} />} />

      <form onSubmit={save} className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-5">
          <section className="rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-semibold">Informations générales</h2>
              <p className="text-xs text-muted-foreground">Nom et coordonnées de votre entreprise</p>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <label className="block space-y-1.5 text-sm font-medium sm:col-span-2">
                <span>Nom de l’entreprise</span>
                <input required value={company.nom_entreprise} onChange={(event) => updateField('nom_entreprise', event.target.value)} className={fieldClass} />
              </label>
              <label className="block space-y-1.5 text-sm font-medium sm:col-span-2">
                <span className="flex items-center gap-1.5"><MapPin size={14} /> Adresse</span>
                <input value={company.adresse || ''} onChange={(event) => updateField('adresse', event.target.value)} className={fieldClass} />
              </label>
              <label className="block space-y-1.5 text-sm font-medium">
                <span className="flex items-center gap-1.5"><Phone size={14} /> Téléphone</span>
                <input value={company.telephone || ''} onChange={(event) => updateField('telephone', event.target.value)} className={fieldClass} />
              </label>
              <label className="block space-y-1.5 text-sm font-medium">
                <span>E-mail</span>
                <input type="email" value={company.email || ''} onChange={(event) => updateField('email', event.target.value)} className={fieldClass} />
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-5 py-4">
              <h2 className="flex items-center gap-2 font-semibold"><Scale size={17} className="text-primary" /> Informations légales</h2>
              <p className="text-xs text-muted-foreground">Mentions affichées sur vos documents</p>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {([
                ['nif', 'NIF'],
                ['stat', 'STAT'],
                ['rcs', 'RCS (optionnel)'],
              ] as const).map(([field, label]) => (
                <label key={field} className="block space-y-1.5 text-sm font-medium">
                  <span>{label}</span>
                  <input value={company[field] || ''} onChange={(event) => updateField(field, event.target.value)} className={fieldClass} />
                </label>
              ))}
            </div>
          </section>
        </div>

        <section className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <ImageUp size={18} className="text-primary" />
            <div>
              <h2 className="font-semibold">Identité visuelle</h2>
              <p className="text-xs text-muted-foreground">PNG ou JPG, 5 Mo maximum</p>
            </div>
          </div>
          <div className="space-y-4 p-5">
            {(['logo', 'cachet', 'signature'] as const).map((field) => {
              const preview = displayImage(field);
              return (
                <div key={field} className="grid gap-3 rounded-lg border border-dashed border-border p-3 sm:grid-cols-[1fr_1.2fr] sm:items-center">
                  <button
                    type="button"
                    onClick={() => preview && setImageToPreview(preview)}
                    className="flex h-24 items-center justify-center overflow-hidden rounded-lg bg-muted/40"
                    aria-label={`Aperçu ${imageLabels[field]}`}
                  >
                    {preview ? (
                      <img src={preview} alt={imageLabels[field]} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-sm text-muted-foreground">Aucun fichier</span>
                    )}
                  </button>
                  <label className="block space-y-2 text-sm font-medium">
                    <span>{imageLabels[field]}</span>
                    <span className={`${buttonClass} w-full cursor-pointer border border-border bg-muted/30 text-foreground hover:bg-accent`}>
                      <Upload size={15} /> Remplacer
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        className="sr-only"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            const previousUrl = imageUrlsRef.current[field];
                            if (previousUrl) URL.revokeObjectURL(previousUrl);
                            const previewUrl = URL.createObjectURL(file);
                            imageUrlsRef.current[field] = previewUrl;
                            setImagePreviews((current) => ({ ...current, [field]: previewUrl }));
                            setImages((current) => ({ ...current, [field]: file }));
                          }
                        }}
                      />
                    </span>
                    {images[field] && <span className="block truncate text-xs text-muted-foreground">{images[field]?.name}</span>}
                  </label>
                </div>
              );
            })}
          </div>
        </section>

        <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur sm:col-span-2">
          <span className="text-sm text-muted-foreground">Les informations seront enregistrées dans votre espace.</span>
          <button disabled={saving} className={`${buttonClass} bg-primary text-primary-foreground hover:opacity-90`}>
            <Check size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>

      <Modal open={imageToPreview !== null} onClose={() => setImageToPreview(null)} title="Aperçu de l’image" size="md">
        {imageToPreview && <img src={imageToPreview} alt="Aperçu" className="mx-auto max-h-[65vh] max-w-full object-contain" />}
      </Modal>
    </div>
  );
}
