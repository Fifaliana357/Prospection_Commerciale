import { useState } from "react"
import { CalendarDays } from "lucide-react"
import DatePicker from "@/components/ui/DatePicker"
import Modal from "@/components/ui/Modal"

interface DateRangeModalProps {
  open: boolean
  onClose: () => void
  initialFrom: string
  initialTo: string
  onApply: (from: string, to: string) => void
  onClear: () => void
}

export default function DateRangeModal({
  open,
  onClose,
  initialFrom,
  initialTo,
  onApply,
  onClear,
}: DateRangeModalProps) {
  const [from, setFrom] = useState(initialFrom)
  const [to, setTo] = useState(initialTo)

  const invalidRange = Boolean(from && to && from > to)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Filtrer par dates"
      titleIcon={<CalendarDays size={17} />}
      size="sm"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (!invalidRange) onApply(from, to)
        }}
        className="space-y-5"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block min-w-0 space-y-1.5 text-sm font-medium">
            <span>Du</span>
            <DatePicker value={from} max={to || undefined} onChange={setFrom} ariaLabel="Date de début" />
          </label>
          <label className="block min-w-0 space-y-1.5 text-sm font-medium">
            <span>Au</span>
            <DatePicker value={to} min={from || undefined} onChange={setTo} ariaLabel="Date de fin" />
          </label>
        </div>
        {invalidRange && (
          <p role="alert" className="text-sm text-destructive">
            La date de début doit précéder la date de fin.
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onClear}
            className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Effacer
          </button>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={invalidRange}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Appliquer
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
