import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowRight, Building2, Eye, EyeOff, Loader2, LockKeyhole, Mail, Phone, UserRound } from "lucide-react"
import AuthPageLayout from "../components/auth/AuthPageLayout"
import api from "../services/api"

const fieldClass = "w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-4 focus:ring-slate-500/15"

function getErrorMessage(error: unknown) {
  const response = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response
  return response?.data?.errors
    ? Object.values(response.data.errors).flat()[0]
    : response?.data?.message || "La création du compte a échoué. Réessayez."
}

export default function Register() {
  const [form, setForm] = useState({ nom: "", prenom: "", entreprise: "", telephone: "", email: "", password: "", password_confirmation: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const navigate = useNavigate()

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const inputField = (
    key: keyof typeof form,
    label: string,
    placeholder: string,
    Icon: typeof UserRound,
    options: { type?: string; autoComplete?: string; minLength?: number; toggle?: boolean; visible?: boolean; onToggle?: () => void } = {},
  ) => (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-800">{label} <span className="text-red-500">*</span></span>
      <span className="relative block">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
        <input
          type={options.toggle ? (options.visible ? "text" : "password") : options.type || "text"}
          autoComplete={options.autoComplete}
          minLength={options.minLength}
          value={form[key]}
          onChange={(event) => update(key, event.target.value)}
          className={fieldClass}
          placeholder={placeholder}
          required
        />
        {options.toggle && (
          <button type="button" onClick={options.onToggle} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 hover:text-slate-800" aria-label={options.visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
            {options.visible ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </span>
    </label>
  )

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setLoading(true)
    try {
      const response = await api.post("/register", form)
      navigate("/login", { state: { email: form.email, notice: response.data.message } })
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthPageLayout title="Inscription" description="Créez votre compte administrateur en quelques instants.">
      <form onSubmit={(event) => void submit(event)} className="mt-5 space-y-3">
        {inputField("nom", "Nom", "Votre nom", UserRound, { autoComplete: "family-name" })}
        {inputField("prenom", "Prénom(s)", "Votre prénom", UserRound, { autoComplete: "given-name" })}
        {inputField("email", "Email", "Entrez votre adresse email", Mail, { type: "email", autoComplete: "email" })}
        {inputField("telephone", "Téléphone", "Entrez votre numéro de téléphone", Phone, { type: "tel", autoComplete: "tel" })}
        {inputField("entreprise", "Entreprise", "Nom de votre entreprise", Building2, { autoComplete: "organization" })}
        {inputField("password", "Mot de passe", "Au moins 8 caractères", LockKeyhole, {
          autoComplete: "new-password", minLength: 8, toggle: true, visible: showPassword,
          onToggle: () => setShowPassword((visible) => !visible),
        })}
        <p className="-mt-2 text-[10px] text-slate-500">8 caractères minimum</p>
        {inputField("password_confirmation", "Confirmer le mot de passe", "Saisir à nouveau le mot de passe", LockKeyhole, {
          autoComplete: "new-password", minLength: 8, toggle: true, visible: showConfirmation,
          onToggle: () => setShowConfirmation((visible) => !visible),
        })}
        {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-800 px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(31,41,55,0.2)] transition hover:bg-slate-700 disabled:opacity-60">
          {loading && <Loader2 size={16} className="animate-spin" />}S’inscrire <ArrowRight size={16} />
        </button>
        <p className="text-center text-xs text-slate-500">Vous avez déjà un compte ? <Link to="/login" className="font-semibold text-slate-800 hover:underline">Se connecter</Link></p>
      </form>
    </AuthPageLayout>
  )
}
