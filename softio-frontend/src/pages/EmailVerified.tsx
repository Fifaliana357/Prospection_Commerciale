import { Link, useSearchParams } from "react-router-dom"
import AuthPageLayout from "../components/auth/AuthPageLayout"

export default function EmailVerified() {
  const [params] = useSearchParams()
  const verified = params.get("status") === "success"

  return (
    <AuthPageLayout
      title={verified ? "Adresse vérifiée" : "Lien invalide"}
      description={verified
        ? "Votre adresse e-mail est confirmée. Vous pouvez maintenant vous connecter."
        : "Ce lien de vérification est invalide ou expiré. Demandez-en un nouveau depuis la page de connexion."}
    >
      <Link to="/login" className="mt-6 flex w-full items-center justify-center rounded-full bg-[#176d70] px-4 py-3 text-sm font-semibold text-white hover:bg-[#125e61]">
        Aller à la connexion
      </Link>
    </AuthPageLayout>
  )
}
