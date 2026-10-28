import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, EyeOff, Loader2, ShieldCheck, Briefcase } from "lucide-react"
import api from "../services/api"
import { cn } from "@/lib/utils"

const types = [
  { value: "admin", label: "Administrateur", icon: ShieldCheck },
  { value: "commercial", label: "Commercial", icon: Briefcase },
]

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [type, setType] = useState("admin")
  const [show, setShow] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const response = await api.post("/login", { email, password, type })
      localStorage.setItem("@Softio:token", response.data.token)
      localStorage.setItem("@Softio:user", JSON.stringify(response.data.user))
      localStorage.setItem("@Softio:type", response.data.type)
      navigate("/dashboard")
    } catch (err: any) {
      setError(err.response?.data?.message || "Connexion impossible. Vérifiez vos identifiants.")
    } finally {
      setLoading(false)
    }
  }

  const field =
    "w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"

  return (
    <div className="grid min-h-screen bg-background text-foreground lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-ink-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/25 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="relative flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary font-display font-bold text-primary-foreground">S</span>
          <span className="font-display text-xl font-semibold">Softio</span>
        </div>
        <div className="relative max-w-md">
          <h1 className="font-display text-5xl font-semibold leading-[1.05] text-white">
            Chaque prospect mérite un suivi.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-ink-foreground/70">
            Prospection, rendez-vous, closing, ventes et stock au même endroit, pour que votre équipe sache toujours qui relancer aujourd'hui.
          </p>
        </div>
        <p className="relative text-sm text-ink-foreground/40">Softio · Gestion commerciale</p>
      </aside>

      <main className="flex items-center justify-center px-6 py-12">
        <form onSubmit={handleLogin} className="w-full max-w-sm">
          <h2 className="font-display text-3xl font-semibold">Bon retour</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">Connectez-vous pour accéder à votre espace.</p>

          <div className="mt-8 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1" role="radiogroup" aria-label="Type de compte">
            {types.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={type === value}
                onClick={() => setType(value)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                  type === value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Adresse e-mail</span>
              <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} placeholder="vous@entreprise.mg" required />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Mot de passe</span>
              <div className="relative">
                <input type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={cn(field, "pr-11")} required />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:text-foreground" aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
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

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Se connecter
          </button>
        </form>
      </main>
    </div>
  )
}
