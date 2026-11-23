import { useEffect, useRef, useState } from "react"
import axios from "axios"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import AuthPageLayout from "../components/auth/AuthPageLayout"
import api from "../services/api"

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || "Connexion impossible pour le moment."
  }

  return "Connexion impossible pour le moment."
}

export default function Sso() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const sent = useRef(false)
  const code = searchParams.get("code")

  useEffect(() => {
    if (sent.current || !code) return
    sent.current = true
    window.history.replaceState(null, "", "/sso")

    api.post("/sso", { code })
      .then(({ data }) => {
        sessionStorage.setItem("@Softio:token", data.token)
        sessionStorage.setItem("@Softio:user", JSON.stringify(data.user))
        sessionStorage.setItem("@Softio:type", data.type)
        sessionStorage.setItem("@Softio:fromSoftio", "1")
        navigate("/dashboard", { replace: true })
      })
      .catch((requestError: unknown) => setError(getErrorMessage(requestError)))
  }, [code, navigate])

  const message = code
    ? error
    : "Lien de connexion incomplet. Rouvrez le module depuis Softio."

  return (
    <AuthPageLayout title="Connexion depuis Softio" description="Vérification de votre abonnement en cours.">
      {message ? (
        <div className="mt-6 space-y-4">
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
            {message}
          </p>
          <p className="text-sm text-slate-600">
            Retournez dans Softio et cliquez à nouveau sur « Ouvrir le module ».
          </p>
          <Link to="/login" className="text-sm font-semibold text-slate-800 hover:underline">
            Se connecter avec un compte existant
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3 text-center" role="status">
          <div
            aria-hidden="true"
            className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700"
          />
          <p className="text-sm text-slate-600">Connexion à votre espace Prospection…</p>
        </div>
      )}
    </AuthPageLayout>
  )
}
