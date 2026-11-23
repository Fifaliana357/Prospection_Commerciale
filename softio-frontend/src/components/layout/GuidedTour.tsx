import { useCallback, useEffect, useMemo, useState } from "react"
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react"
import api from "@/services/api"
import { getSessionUser } from "@/lib/session"
import softioLogo from "@/assets/softio-fixed.png"

type TourStep = {
  target?: string
  title: string
  description: string
}

type TargetRect = {
  top: number
  right: number
  bottom: number
  left: number
  width: number
  height: number
}

const steps: TourStep[] = [
  {
    title: "Bienvenue sur Softio !",
    description: "Découvrez les fonctionnalités essentielles pour organiser votre prospection et développer votre activité.",
  },
  {
    target: "brand",
    title: "Menu",
    description: "Le menu latéral vous donne accès aux différentes rubriques de votre espace.",
  },
  {
    target: "themes",
    title: "Thème",
    description: "Personnalisez l’apparence de Softio et basculez entre le mode clair et le mode sombre.",
  },
  {
    target: "notifications",
    title: "Notifications",
    description: "Consultez vos notifications, notamment les rappels de rendez-vous et les nouveaux messages.",
  },
  {
    target: "account",
    title: "Votre compte",
    description: "Ouvrez votre profil pour gérer vos informations personnelles, votre entreprise et votre session.",
  },
  {
    target: "navigation-dashboard",
    title: "Tableau de bord",
    description: "Retrouvez ici une vue d’ensemble de votre activité et de vos actions à suivre.",
  },
  {
    target: "navigation-prospects",
    title: "Prospects",
    description: "Ajoutez des prospects et consultez les contacts enregistrés.",
  },
  {
    target: "navigation-prospections",
    title: "Prospections",
    description: "Suivez vos actions de prospection et les opportunités en cours.",
  },
  {
    target: "navigation-rendez-vous",
    title: "Rendez-vous",
    description: "Programmez vos rendez-vous et consultez ceux déjà planifiés.",
  },
  {
    target: "navigation-interets",
    title: "Intérêts",
    description: "Retrouvez les intérêts de vos prospects pour mieux préparer vos relances.",
  },
  {
    target: "navigation-closing",
    title: "Closing",
    description: "Suivez les ventes conclues et les étapes finales de vos opportunités.",
  },
  {
    target: "navigation-clients",
    title: "Clients",
    description: "Consultez et gérez les clients de votre entreprise.",
  },
  {
    target: "navigation-ventes",
    title: "Ventes",
    description: "Enregistrez et consultez les ventes réalisées.",
  },
  {
    target: "navigation-facturation",
    title: "Facturation",
    description: "Créez des factures et retrouvez celles déjà émises.",
  },
  {
    target: "navigation-sav",
    title: "Service après vente",
    description: "Suivez les demandes de service après-vente et les livraisons.",
  },
  {
    target: "navigation-catalogue",
    title: "Produits",
    description: "Gérez les produits et services proposés à vos clients.",
  },
  {
    target: "navigation-stock",
    title: "Stock",
    description: "Suivez l’approvisionnement et les mouvements de votre stock.",
  },
  {
    target: "navigation-commerciaux",
    title: "Équipe commerciale",
    description: "Retrouvez les membres de votre équipe commerciale.",
  },
  {
    target: "navigation-bibliotheque",
    title: "Bibliothèque",
    description: "Ajoutez et consultez les documents et ressources disponibles.",
  },
  {
    target: "navigation-tutoriels",
    title: "Tutoriels",
    description: "Consultez les tutoriels pour découvrir les fonctionnalités de Softio.",
  },
]

function getApiErrorMessage(error: unknown) {
  const response = (error as { response?: { data?: { message?: string } } })?.response
  return response?.data?.message || "Impossible d’enregistrer la fin de la visite. Vérifiez votre connexion puis réessayez."
}

export default function GuidedTour({
  onTargetChange,
}: {
  onTargetChange: (target: string | null) => void
}) {
  const user = getSessionUser()
  const [open, setOpen] = useState(() => user.isFirstLogin && Boolean(user.email))
  const [stepIndex, setStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null)
  const [targetMissing, setTargetMissing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const currentStep = steps[stepIndex]

  useEffect(() => {
    const startTour = () => {
      setStepIndex(0)
      setError("")
      setOpen(true)
    }

    window.addEventListener("softio:start-guided-tour", startTour)
    return () => window.removeEventListener("softio:start-guided-tour", startTour)
  }, [])

  useEffect(() => {
    onTargetChange(open ? currentStep.target ?? null : null)
  }, [currentStep.target, onTargetChange, open])

  useEffect(() => {
    if (!open || !currentStep.target) return

    let measureFrame = 0
    const scrollFrame = window.requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>(`[data-tour="${currentStep.target}"]`)
      if (!target) {
        setTargetMissing(true)
        setTargetRect(null)
        return
      }

      target.scrollIntoView({ block: "nearest", inline: "nearest" })
      measureFrame = window.requestAnimationFrame(() => {
        const rect = target.getBoundingClientRect()
        setTargetRect({
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        })
        setTargetMissing(false)
      })
    })

    return () => {
      window.cancelAnimationFrame(scrollFrame)
      window.cancelAnimationFrame(measureFrame)
    }
  }, [currentStep.target, open])

  const completeTour = useCallback(async () => {
    if (saving) return
    setSaving(true)
    setError("")

    try {
      await api.post("/onboarding/complete")
      const storedUser = JSON.parse(sessionStorage.getItem("@Softio:user") || "{}") as Record<string, unknown>
      sessionStorage.setItem("@Softio:user", JSON.stringify({ ...storedUser, is_first_login: false }))
      setOpen(false)
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }, [saving])

  const tooltipStyle = useMemo(() => {
    if (!targetRect) return undefined

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const width = Math.min(360, viewportWidth - 32)
    if (viewportWidth < 640) {
      return { left: 16, bottom: 16, width }
    }

    const gap = 16
    const preferredLeft = targetRect.left < viewportWidth / 2
      ? targetRect.right + gap
      : targetRect.left - width - gap
    const left = Math.min(Math.max(16, preferredLeft), viewportWidth - width - 16)
    const top = Math.min(Math.max(16, targetRect.top), viewportHeight - 250)

    return { left, top, width }
  }, [targetRect])

  if (!open) return null

  const nextStep = () => {
    setError("")
    setStepIndex((index) => Math.min(index + 1, steps.length - 1))
  }

  const previousStep = () => {
    setError("")
    setStepIndex((index) => Math.max(index - 1, 0))
  }

  const progress = ((stepIndex + 1) / steps.length) * 100
  const activeTargetRect = currentStep.target ? targetRect : null
  const activeTargetMissing = currentStep.target && targetMissing

  return (
    <div className="fixed inset-0 z-[60]" role="presentation">
      {activeTargetRect ? (
        <>
          <div className="fixed left-0 top-0 bg-black/55" style={{ width: "100vw", height: activeTargetRect.top }} />
          <div className="fixed left-0 bg-black/55" style={{ top: activeTargetRect.top, width: activeTargetRect.left, height: activeTargetRect.height }} />
          <div className="fixed bg-black/55" style={{ top: activeTargetRect.top, left: activeTargetRect.right, right: 0, height: activeTargetRect.height }} />
          <div className="fixed bottom-0 left-0 bg-black/55" style={{ top: activeTargetRect.bottom, width: "100vw" }} />
          <div
            aria-hidden="true"
            className="pointer-events-none fixed z-[61] rounded-xl border-2 border-white shadow-[0_0_0_2px_rgba(15,118,110,0.7)]"
            style={{
              top: activeTargetRect.top - 2,
              left: activeTargetRect.left - 2,
              width: activeTargetRect.width + 4,
              height: activeTargetRect.height + 4,
            }}
          />
        </>
      ) : (
        <div className="fixed inset-0 bg-black/55" />
      )}

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="guided-tour-title"
        className={`fixed z-[62] overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl ${
          activeTargetRect ? "bottom-4 left-4 w-[min(360px,calc(100vw-2rem))] sm:bottom-auto sm:left-auto" : "left-1/2 top-1/2 w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2"
        }`}
        style={activeTargetRect && tooltipStyle ? tooltipStyle : undefined}
      >
        {stepIndex === 0 && (
          <div className="bg-primary px-6 py-5 text-center">
            <img src={softioLogo} alt="Softio" className="mx-auto h-10 w-auto object-contain" />
            <span className="mt-2 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs">Visite guidée</span>
          </div>
        )}
        <div className="relative px-5 pb-4 pt-5 text-center">
          <button
            type="button"
            onClick={() => void completeTour()}
            disabled={saving}
            className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-accent disabled:opacity-50"
            aria-label="Fermer la visite guidée"
          >
            <X size={17} />
          </button>
          <h2 id="guided-tour-title" className="px-5 text-base font-semibold">{currentStep.title}</h2>
          <span className="mx-auto mt-2 block h-1 w-8 rounded-full bg-amber-400" />
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{currentStep.description}</p>
          {activeTargetMissing && (
            <p role="status" className="mt-3 text-xs text-muted-foreground">
              Cette rubrique n’est pas disponible dans cette vue. Vous pouvez continuer la visite.
            </p>
          )}
          {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
        </div>
        <div className="h-1 bg-muted">
          <div className="h-full bg-gradient-to-r from-primary to-amber-400 transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={previousStep}
              disabled={saving}
              className="inline-flex items-center gap-1 rounded-full border border-border px-3.5 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
            >
              <ChevronLeft size={16} /> Précédent
            </button>
          ) : <span />}
          {stepIndex < steps.length - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Suivant <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void completeTour()}
              disabled={saving}
              className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Check size={16} /> Terminer
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
