import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { ArrowLeft, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react"
import AuthPageLayout from "../components/auth/AuthPageLayout"
import api from "../services/api"

const fieldClass = "w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-11 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#18777a] focus:ring-4 focus:ring-[#18777a]/15"

export default function ResetPassword() {
  const [params] = useSearchParams()
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const token = params.get("token") || ""
  const email = params.get("email") || ""

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setLoading(true)
    try {
      const response = await api.post("/reset-password", {
        token,
        email,
        password,
        password_confirmation: confirmation,
      })
      setMessage(response.data.message)
    } catch (requestError: unknown) {
      const response = (requestError as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response
      setError(response?.data?.errors ? Object.values(response.data.errors).flat()[0] : response?.data?.message || "Le lien est invalide ou expiré.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthPageLayout title="Nouveau mot de passe" description={email ? `Définissez un nouveau mot de passe pour ${email}.` : "Le lien de réinitialisation est incomplet."}>
      {message ? (
        <div className="mt-6 space-y-4">
          <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">{message}</p>
          <Link to="/login" className="block text-center text-sm font-medium text-primary hover:underline">Se connecter</Link>
        </div>
      ) : (
        <form onSubmit={(event) => void submit(event)} className="mt-7 space-y-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-[#174e53]">Nouveau mot de passe <span className="text-red-500">*</span></span>
            <span className="relative block">
              <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-[#52777a]" size={17} />
              <input type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className={fieldClass} placeholder="Au moins 8 caractères" required disabled={!token || !email} />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-500 hover:text-[#176d70]" aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-[#174e53]">Confirmer le mot de passe <span className="text-red-500">*</span></span>
            <span className="relative block">
              <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-[#52777a]" size={17} />
              <input type={showConfirmation ? "text" : "password"} autoComplete="new-password" minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className={fieldClass} placeholder="Saisir à nouveau le mot de passe" required disabled={!token || !email} />
              <button type="button" onClick={() => setShowConfirmation((visible) => !visible)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-500 hover:text-[#176d70]" aria-label={showConfirmation ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
                {showConfirmation ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </span>
          </label>
          {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <button type="submit" disabled={loading || !token || !email} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#176d70] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(23,109,112,0.2)] transition hover:bg-[#125e61] disabled:opacity-60">
            {loading && <Loader2 size={16} className="animate-spin" />}Réinitialiser le mot de passe
          </button>
          <p className="text-center text-sm"><Link to="/login" className="inline-flex items-center gap-2 font-semibold text-[#176d70] hover:underline"><ArrowLeft size={15} />Retour à la connexion</Link></p>
        </form>
      )}
    </AuthPageLayout>
  )
}
