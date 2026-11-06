import { useState } from "react"
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { ArrowRight, Briefcase, Eye, EyeOff, Loader2, LockKeyhole, Mail, ShieldCheck } from "lucide-react"
import api from "../services/api"
import { cn } from "@/lib/utils"
import AuthPageLayout from "../components/auth/AuthPageLayout"

const types = [
  { value: "admin", label: "Administrateur", icon: ShieldCheck },
  { value: "commercial", label: "Commercial", icon: Briefcase },
]

function getApiError(error: unknown, fallback: string) {
  const response = (error as { response?: { data?: { message?: string; code?: string } } })?.response
  return {
    message: response?.data?.message || fallback,
    code: response?.data?.code,
  }
}

export default function Login() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const locationState = location.state as { email?: string; notice?: string } | null
  const emailVerified = searchParams.get("status") === "email-verified"
  const [email, setEmail] = useState(locationState?.email || "")
  const [password, setPassword] = useState("")
  const [type, setType] = useState("admin")
  const [show, setShow] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState("")
  const [resendMessage, setResendMessage] = useState("")
  const [notice, setNotice] = useState(locationState?.notice || "")
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setNotice("")
    setVerificationEmail("")
    setResendMessage("")
    setLoading(true)
    try {
      const response = await api.post("/login", { email, password, type })
      sessionStorage.setItem("@Softio:token", response.data.token)
      sessionStorage.setItem("@Softio:user", JSON.stringify(response.data.user))
      sessionStorage.setItem("@Softio:type", response.data.type)
      navigate("/dashboard")
    } catch (err: unknown) {
      const requestError = getApiError(err, "Connexion impossible. Vérifiez vos identifiants.")
      setError(requestError.message)
      if (requestError.code === "email_not_verified") setVerificationEmail(email)
    } finally {
      setLoading(false)
    }
  }

  const resendVerification = async () => {
    setLoading(true)
    setResendMessage("")
    try {
      const response = await api.post("/email/verification-notification", { email: verificationEmail })
      setResendMessage(response.data.message)
    } catch (err: unknown) {
      setError(getApiError(err, "Impossible de renvoyer le lien pour le moment.").message)
    } finally {
      setLoading(false)
    }
  }

  const field =
    "w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-11 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-4 focus:ring-slate-500/15"

  return (
      <AuthPageLayout title="Connexion" description="Heureux de vous revoir. Connectez-vous pour accéder à votre espace.">
        <form onSubmit={handleLogin} className="mt-6">
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1" role="radiogroup" aria-label="Type de compte">
            {types.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={type === value}
                onClick={() => setType(value)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                  type === value ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                )}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {(emailVerified || notice) && (
              <p role="status" className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 text-sm leading-relaxed text-slate-700">
                {emailVerified
                  ? "Votre adresse e-mail est vérifiée. Vous pouvez maintenant vous connecter."
                  : notice}
              </p>
            )}
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-800">Email <span className="text-red-500">*</span></span>
              <span className="relative block">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} placeholder="Entrez votre adresse email" required />
              </span>
            </label>
            <label className="block">
              <span className="mb-1.5 flex items-center justify-between gap-2 text-sm font-semibold text-slate-800">
                <span>Mot de passe <span className="text-red-500">*</span></span>
                <Link to="/forgot-password" className="font-medium text-slate-700 hover:underline">Mot de passe oublié ?</Link>
              </span>
              <div className="relative">
                <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                <input type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} required />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-500 hover:text-slate-800" aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
          </div>

          {error && (
            <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {verificationEmail && (
            <button type="button" onClick={() => void resendVerification()} disabled={loading} className="mt-3 text-left text-sm font-medium text-primary hover:underline disabled:opacity-50">
              Renvoyer l’e-mail de vérification
            </button>
          )}
          {resendMessage && <p role="status" className="mt-3 text-sm text-muted-foreground">{resendMessage}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-slate-800 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(31,41,55,0.2)] transition hover:bg-slate-700 disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Se connecter <ArrowRight size={17} />
          </button>
          <div className="my-5 flex items-center gap-3 text-xs text-slate-500">
            <span className="h-px flex-1 bg-slate-200" /><span>OU</span><span className="h-px flex-1 bg-slate-200" />
          </div>
          <p className="text-center text-sm text-slate-500">
              Vous n’avez pas de compte ? <Link to="/register" className="font-semibold text-slate-800 hover:underline">Créer un compte</Link>
            </p>
        </form>
      </AuthPageLayout>
  )
}
