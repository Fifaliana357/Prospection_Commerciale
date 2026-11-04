import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Loader2, Mail, Send } from "lucide-react"
import AuthPageLayout from "../components/auth/AuthPageLayout"
import api from "../services/api"

const fieldClass = "w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#18777a] focus:ring-4 focus:ring-[#18777a]/15"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setLoading(true)
    try {
      const response = await api.post("/forgot-password", { email })
      setMessage(response.data.message)
    } catch (requestError: unknown) {
      const response = (requestError as { response?: { data?: { message?: string } } })?.response
      setError(response?.data?.message || "Impossible d’envoyer le lien pour le moment.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthPageLayout title="Mot de passe oublié" description="Recevez un lien pour choisir un nouveau mot de passe.">
      <form onSubmit={(event) => void submit(event)} className="mt-7 space-y-5">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-[#174e53]">Email <span className="text-red-500">*</span></span>
          <span className="relative block">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#52777a]" size={17} />
            <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={fieldClass} placeholder="Entrez votre adresse email" required />
          </span>
        </label>
        {message && <p role="status" className="rounded-lg border border-emerald-600/25 bg-emerald-50 px-4 py-3 text-sm leading-relaxed text-emerald-800">{message}</p>}
        {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#176d70] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(23,109,112,0.2)] transition hover:bg-[#125e61] disabled:opacity-60">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}Envoyer le lien
        </button>
        <p className="text-center text-sm"><Link to="/login" className="inline-flex items-center gap-2 font-semibold text-[#176d70] hover:underline"><ArrowLeft size={15} />Retour à la connexion</Link></p>
      </form>
    </AuthPageLayout>
  )
}
