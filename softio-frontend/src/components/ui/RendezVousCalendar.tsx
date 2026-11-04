import { ChevronLeft, ChevronRight, Clock3, MapPin } from "lucide-react"
import type { RendezVous } from "@/services/rendezvous"
import { parseLocalDateTime } from "@/lib/date"

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" })

function parseDate(value: string) {
  return parseLocalDateTime(value)
}

function startOfWeek(value: Date) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  return date
}

function addDays(value: Date, count: number) {
  const date = new Date(value)
  date.setDate(date.getDate() + count)
  return date
}

function dayKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`
}

function timeLabel(value: string) {
  return parseDate(value).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
}

function clientLabel(rdv: RendezVous) {
  const client = rdv.client
  return client?.entreprise || [client?.prenom, client?.nom].filter(Boolean).join(" ") || "Client"
}

export default function RendezVousCalendar({
  items,
  loading,
  date,
  onDateChange,
  onSelect,
}: {
  items: RendezVous[]
  loading: boolean
  date: Date
  onDateChange: (date: Date) => void
  onSelect: (rdv: RendezVous) => void
}) {
  const weekStart = startOfWeek(date)
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
  const monthGridStart = startOfWeek(monthStart)
  const monthDays = Array.from({ length: 42 }, (_, index) => addDays(monthGridStart, index))
  const monthLabel = date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
  const weekLabel = `${dateFormatter.format(days[0])} – ${days[6].toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`
  const appointmentsByDay = new Map<string, RendezVous[]>()

  items.forEach((rdv) => {
    const key = dayKey(parseDate(rdv.date_rdv))
    appointmentsByDay.set(key, [...(appointmentsByDay.get(key) ?? []), rdv])
  })

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold capitalize">{weekLabel}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {loading ? "Chargement des rendez-vous…" : `${items.length} rendez-vous cette semaine`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onDateChange(new Date())} className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-accent">
            Aujourd’hui
          </button>
          <button type="button" onClick={() => onDateChange(addDays(date, -7))} aria-label="Semaine précédente" className="rounded-lg border border-border p-2 hover:bg-accent">
            <ChevronLeft size={17} />
          </button>
          <button type="button" onClick={() => onDateChange(addDays(date, 7))} aria-label="Semaine suivante" className="rounded-lg border border-border p-2 hover:bg-accent">
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-border bg-background p-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold capitalize">{monthLabel}</h3>
            <div className="flex gap-1">
              <button type="button" aria-label="Mois précédent" onClick={() => onDateChange(new Date(date.getFullYear(), date.getMonth() - 1, 1))} className="rounded-md p-1.5 hover:bg-accent"><ChevronLeft size={15} /></button>
              <button type="button" aria-label="Mois suivant" onClick={() => onDateChange(new Date(date.getFullYear(), date.getMonth() + 1, 1))} className="rounded-md p-1.5 hover:bg-accent"><ChevronRight size={15} /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {["L", "M", "M", "J", "V", "S", "D"].map((label, index) => (
              <span key={`${label}-${index}`} className="py-1 text-[10px] font-medium text-muted-foreground">{label}</span>
            ))}
            {monthDays.map((day) => {
              const isSelected = dayKey(day) === dayKey(date)
              const isCurrentMonth = day.getMonth() === date.getMonth()
              return (
                <button
                  type="button"
                  key={dayKey(day)}
                  onClick={() => onDateChange(day)}
                  aria-label={day.toLocaleDateString("fr-FR")}
                  aria-pressed={isSelected}
                  className={`mx-auto grid h-7 w-7 place-items-center rounded-full text-xs ${
                    isSelected ? "bg-primary font-semibold text-primary-foreground"
                      : isCurrentMonth ? "text-foreground hover:bg-accent" : "text-muted-foreground/50 hover:bg-accent"
                  }`}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>
          <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
            Sélectionnez une date pour afficher sa semaine.
          </div>
        </aside>

        <div className="overflow-x-auto">
          <div className="grid min-w-[840px] grid-cols-7 gap-2">
            {days.map((day) => {
              const key = dayKey(day)
              const dayItems = (appointmentsByDay.get(key) ?? []).sort(
                (left, right) => parseDate(left.date_rdv).getTime() - parseDate(right.date_rdv).getTime()
              )
              const today = key === dayKey(new Date())
              return (
                <div key={key} className="min-h-64 rounded-xl bg-muted/35 p-2">
                  <div className={`mb-2 flex items-center justify-between rounded-lg px-1 py-1 text-xs ${today ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                    <span>{day.toLocaleDateString("fr-FR", { weekday: "short" })}</span>
                    <span className={`grid h-7 w-7 place-items-center rounded-full ${today ? "bg-primary text-primary-foreground" : ""}`}>{day.getDate()}</span>
                  </div>
                  {loading ? (
                    <div className="h-14 animate-pulse rounded-lg bg-muted" />
                  ) : dayItems.length ? (
                    <div className="space-y-2">
                      {dayItems.map((rdv) => (
                        <button
                          type="button"
                          key={rdv.id_rendez_vous}
                          onClick={() => onSelect(rdv)}
                          className="w-full rounded-lg border border-primary/20 border-l-[3px] border-l-primary bg-card p-2 text-left shadow-sm transition hover:border-primary/45 hover:shadow-md"
                        >
                          <span className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-primary"><Clock3 size={12} />{timeLabel(rdv.date_rdv)}</span>
                          <span className="block truncate text-xs font-medium text-foreground">{clientLabel(rdv)}</span>
                          <span className="mt-1 block truncate text-[11px] text-muted-foreground">{rdv.type_rdv || "Direct"}</span>
                          {rdv.lieu && <span className="mt-1 flex items-center gap-1 truncate text-[10px] text-muted-foreground"><MapPin size={10} />{rdv.lieu}</span>}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="pt-4 text-center text-[11px] text-muted-foreground">Libre</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
