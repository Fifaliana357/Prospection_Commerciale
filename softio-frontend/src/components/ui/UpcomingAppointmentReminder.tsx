import { useEffect, useRef, useState } from "react"
import { AlertCircle, X } from "lucide-react"
import Modal from "@/components/ui/Modal"
import { useToast } from "@/contexts/ToastContext"
import { getLocalDateInputValue, parseLocalDateTime } from "@/lib/date"
import { getRendezVous, type RendezVous } from "@/services/rendezvous"

function isPlanned(appointment: RendezVous) {
  return appointment.statut?.trim().toLocaleLowerCase("fr") === "prevu"
}

function getDateLabel(date: Date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.toDateString() === today.toDateString()) return "aujourd’hui"
  if (date.toDateString() === tomorrow.toDateString()) return "demain"

  return `le ${date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })}`
}

export default function UpcomingAppointmentReminder() {
  const toast = useToast()
  const toastRef = useRef(toast)
  const [appointment, setAppointment] = useState<RendezVous | null>(null)
  const [sameDayCount, setSameDayCount] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    toastRef.current = toast
  }, [toast])

  useEffect(() => {
    let active = true
    const now = new Date()

    getRendezVous({ date_debut: getLocalDateInputValue(now), per_page: 100 })
      .then((response) => {
        if (!active) return

        const upcoming = (response.data as RendezVous[])
          .filter(isPlanned)
          .map((item) => ({ item, date: parseLocalDateTime(item.date_rdv) }))
          .filter(({ date }) => !Number.isNaN(date.getTime()) && date >= now)
          .sort((left, right) => left.date.getTime() - right.date.getTime())

        const closest = upcoming[0]
        if (!closest) return

        const dayCount = upcoming.filter(({ date }) =>
          date.getFullYear() === closest.date.getFullYear()
          && date.getMonth() === closest.date.getMonth()
          && date.getDate() === closest.date.getDate()
        ).length

        setAppointment(closest.item)
        setSameDayCount(dayCount)
        setOpen(true)
      })
      .catch(() => {
        if (active) toastRef.current.error("Impossible de charger le prochain rendez-vous")
      })

    return () => {
      active = false
    }
  }, [])

  if (!appointment) return null

  const date = parseLocalDateTime(appointment.date_rdv)
  const time = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title="Rappel de vos rendez-vous"
      size="sm"
      hideHeader
      ariaLabel="Rappel de vos rendez-vous"
      contentClassName="px-6 pb-5 pt-7 sm:px-7"
    >
      <div className="relative text-center">
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fermer le rappel"
          className="absolute -right-2 -top-3 rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X size={21} />
        </button>

        <div className="mx-auto mb-4 grid h-[76px] w-[76px] place-items-center rounded-full border-[4px] border-amber-500 text-amber-500">
          <span aria-hidden="true" className="text-5xl font-light leading-none">!</span>
        </div>
        <h2 className="mb-2 text-xl font-semibold">Rappel de vos rendez-vous</h2>
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-rose-300 bg-rose-100 px-4 py-4 text-left text-sm leading-relaxed text-rose-900">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>
            Vous avez un rendez-vous {getDateLabel(date)} à partir de {time}
            {sameDayCount > 1 ? ` (Total : ${sameDayCount})` : ""}.
          </span>
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-5 min-w-32 rounded-full bg-slate-800 px-8 py-3 text-sm font-semibold text-white shadow-[0_0_0_3px_rgba(31,41,55,0.2)] hover:bg-slate-700"
        >
          OK
        </button>
      </div>
    </Modal>
  )
}
