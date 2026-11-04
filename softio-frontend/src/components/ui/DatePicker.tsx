import { useEffect, useRef, useState } from "react"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const weekDays = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"]

function parseDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return date.getFullYear() === Number(match[1])
    && date.getMonth() === Number(match[2]) - 1
    && date.getDate() === Number(match[3])
    ? date
    : null
}

function dateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function shiftMonth(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

export default function DatePicker({
  value,
  onChange,
  min,
  max,
  required = false,
  disabled = false,
  className,
  calendarClassName,
  placeholder = "jj/mm/aaaa",
  ariaLabel = "Choisir une date",
}: {
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
  required?: boolean
  disabled?: boolean
  className?: string
  calendarClassName?: string
  placeholder?: string
  ariaLabel?: string
}) {
  const initialDate = parseDate(value) ?? new Date()
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1))
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  const selectedDate = parseDate(value)
  const minDate = parseDate(min ?? "")
  const maxDate = parseDate(max ?? "")
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayUnavailable = (minDate && today < minDate) || (maxDate && today > maxDate)
  const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1)
  const gridStart = new Date(monthStart)
  gridStart.setDate(monthStart.getDate() - ((monthStart.getDay() + 6) % 7))
  const days = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart)
    day.setDate(gridStart.getDate() + index)
    return day
  })

  const displayValue = selectedDate
    ? selectedDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
    : ""

  const selectDate = (date: Date) => {
    onChange(dateValue(date))
    setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1))
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative min-w-0">
      {required && !disabled && (
        <input
          type="text"
          value={value}
          required
          tabIndex={-1}
          aria-hidden="true"
          aria-label={ariaLabel}
          onChange={() => undefined}
          onInvalid={(event) => {
            event.preventDefault()
            inputRef.current?.focus()
            setOpen(true)
          }}
          className="sr-only"
        />
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          placeholder={placeholder}
          readOnly
          disabled={disabled}
          aria-label={ariaLabel}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => {
            if (!disabled) {
              const date = parseDate(value)
              if (date) setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1))
              setOpen((current) => !current)
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              if (!disabled) setOpen((current) => !current)
            }
          }}
          className={cn(
            "h-11 w-full cursor-pointer rounded-xl border border-border bg-background px-3.5 pr-11 text-sm text-foreground shadow-sm transition hover:border-primary/35 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50",
            !displayValue && "text-muted-foreground",
            className,
          )}
        />
        <button
          type="button"
          disabled={disabled}
          aria-label={open ? "Fermer le calendrier" : ariaLabel}
          aria-expanded={open}
          onClick={() => {
            const date = parseDate(value)
            if (date) setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1))
            setOpen((current) => !current)
          }}
          className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg bg-primary/10 text-primary transition hover:bg-primary/15 disabled:opacity-50"
        >
          <CalendarDays size={16} />
        </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-label="Calendrier"
          className={cn(
            "animate-modal-dialog-enter absolute left-0 top-[calc(100%+8px)] z-[120] w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-primary/15 bg-card p-4 text-foreground shadow-[0_20px_55px_rgba(15,35,40,0.2)]",
            calendarClassName,
          )}
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setVisibleMonth((month) => shiftMonth(month, -1))}
              aria-label="Mois précédent"
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft size={17} />
            </button>
            <h3 className="text-sm font-semibold capitalize">
              {visibleMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
            </h3>
            <button
              type="button"
              onClick={() => setVisibleMonth((month) => shiftMonth(month, 1))}
              aria-label="Mois suivant"
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <ChevronRight size={17} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1 text-center">
            {weekDays.map((day) => (
              <span key={day} className="py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{day}</span>
            ))}
            {days.map((day) => {
              const key = dateValue(day)
              const isSelected = key === value
              const isToday = key === dateValue(new Date())
              const outsideMonth = day.getMonth() !== visibleMonth.getMonth()
              const unavailable = (minDate && day < minDate) || (maxDate && day > maxDate)
              return (
                <button
                  type="button"
                  key={key}
                  disabled={Boolean(unavailable)}
                  aria-pressed={isSelected}
                  aria-label={day.toLocaleDateString("fr-FR", { dateStyle: "full" })}
                  onClick={() => selectDate(day)}
                  className={cn(
                    "mx-auto grid h-9 w-9 place-items-center rounded-full text-xs transition",
                    isSelected
                      ? "bg-primary font-semibold text-primary-foreground shadow-sm"
                      : isToday
                        ? "border border-primary/35 font-semibold text-primary hover:bg-primary/10"
                        : "text-foreground hover:bg-primary/10",
                    outsideMonth && !isSelected && "text-muted-foreground/45",
                    unavailable && "cursor-not-allowed opacity-30 hover:bg-transparent",
                  )}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false) }}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              Effacer
            </button>
            <button
              type="button"
              onClick={() => selectDate(new Date())}
              disabled={Boolean(todayUnavailable)}
              className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-primary/5"
            >
              Aujourd’hui
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
