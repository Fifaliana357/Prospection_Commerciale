import { useEffect, useId, useRef, useState } from "react"
import { Check, Clock3 } from "lucide-react"
import { cn } from "@/lib/utils"

function parseTime(value: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value)
  return match ? { hour: match[1], minute: match[2] } : null
}

export default function TimePicker({
  value,
  onChange,
  required = false,
  disabled = false,
  className,
  ariaLabel = "Choisir une heure",
}: {
  value: string
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
  className?: string
  ariaLabel?: string
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const current = parseTime(value)
  const [open, setOpen] = useState(false)
  const [hour, setHour] = useState(current?.hour ?? "09")
  const [minute, setMinute] = useState(current?.minute ?? "00")
  const parsedHour = Number(hour)
  const parsedMinute = Number(minute)
  const validTime = hour !== "" && minute !== ""
    && Number.isInteger(parsedHour) && parsedHour >= 0 && parsedHour <= 23
    && Number.isInteger(parsedMinute) && parsedMinute >= 0 && parsedMinute <= 59

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

  const openPicker = () => {
    if (disabled) return
    const parsed = parseTime(value)
    setHour(parsed?.hour ?? "09")
    setMinute(parsed?.minute ?? "00")
    setOpen((currentOpen) => !currentOpen)
  }

  const confirm = () => {
    if (!validTime) return
    onChange(`${String(parsedHour).padStart(2, "0")}:${String(parsedMinute).padStart(2, "0")}`)
    setOpen(false)
  }

  const updateTimePart = (
    value: string,
    setPart: (value: string) => void,
  ) => {
    if (/^\d{0,2}$/.test(value)) setPart(value)
  }

  const normalizeTimePart = (
    value: string,
    setPart: (value: string) => void,
    max: number,
  ) => {
    const parsed = Number(value)
    if (value !== "" && Number.isInteger(parsed) && parsed <= max) {
      setPart(String(parsed).padStart(2, "0"))
    }
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
          value={current ? `${current.hour}:${current.minute}` : ""}
          placeholder="hh:mm"
          readOnly
          disabled={disabled}
          aria-label={ariaLabel}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={openPicker}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              openPicker()
            }
          }}
          className={cn(
            "h-11 w-full cursor-pointer rounded-xl border border-border bg-background px-3.5 pr-11 text-sm text-foreground shadow-sm transition hover:border-primary/35 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50",
            !current && "text-muted-foreground",
            className,
          )}
        />
        <button
          type="button"
          disabled={disabled}
          aria-label={open ? "Fermer le sélecteur d’heure" : ariaLabel}
          aria-expanded={open}
          onClick={openPicker}
          className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg bg-primary/10 text-primary transition hover:bg-primary/15 disabled:opacity-50"
        >
          <Clock3 size={16} />
        </button>
      </div>
      {open && (
        <div
          role="dialog"
          aria-label="Sélecteur d’heure"
          className="animate-modal-dialog-enter absolute left-0 top-[calc(100%+8px)] z-[120] w-[min(14rem,calc(100vw-2rem))] rounded-2xl border border-primary/15 bg-card p-2.5 text-foreground shadow-[0_20px_55px_rgba(15,35,40,0.2)]"
        >
          <div className="mb-2.5 flex items-center justify-center gap-1.5">
            <label className="sr-only" htmlFor={`${inputId}-hour`}>Heure</label>
            <input
              id={`${inputId}-hour`}
              type="number"
              min="0"
              max="23"
              inputMode="numeric"
              step="1"
              value={hour}
              onChange={(event) => {
                if (event.target.value.length <= 2) updateTimePart(event.target.value, setHour)
              }}
              onBlur={() => normalizeTimePart(hour, setHour, 23)}
              className="h-10 w-[3.25rem] rounded-xl border-0 bg-primary/10 px-1 text-center text-lg font-semibold tabular-nums text-foreground focus:ring-2 focus:ring-primary/40"
            />
            <span className="text-lg font-semibold text-primary">:</span>
            <label className="sr-only" htmlFor={`${inputId}-minute`}>Minute</label>
            <input
              id={`${inputId}-minute`}
              type="number"
              min="0"
              max="59"
              inputMode="numeric"
              step="1"
              value={minute}
              onChange={(event) => {
                if (event.target.value.length <= 2) updateTimePart(event.target.value, setMinute)
              }}
              onBlur={() => normalizeTimePart(minute, setMinute, 59)}
              className="h-10 w-[3.25rem] rounded-xl border-0 bg-primary/10 px-1 text-center text-lg font-semibold tabular-nums text-foreground focus:ring-2 focus:ring-primary/40"
            />
          </div>
          {!validTime && (
            <p role="alert" className="mb-3 text-center text-xs text-destructive">
              Saisissez une heure entre 00:00 et 23:59.
            </p>
          )}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={confirm}
              disabled={!validTime}
              className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2 text-sm font-semibold text-primary transition hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check size={16} /> Valider
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
