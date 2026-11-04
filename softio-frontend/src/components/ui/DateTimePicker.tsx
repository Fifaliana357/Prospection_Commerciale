import { CalendarClock } from "lucide-react"
import DatePicker from "./DatePicker"
import TimePicker from "./TimePicker"

export default function DateTimePicker({
  value,
  onChange,
  required = false,
  disabled = false,
  className,
}: {
  value: string
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
  className?: string
}) {
  const date = value.slice(0, 10)
  const time = value.length >= 16 ? value.slice(11, 16) : ""

  const updateDate = (nextDate: string) => {
    if (!nextDate) {
      onChange("")
      return
    }
    onChange(`${nextDate}T${time || "00:00"}`)
  }

  const updateTime = (nextTime: string) => {
    if (!nextTime) {
      onChange("")
      return
    }
    const datePart = date || (() => {
      const now = new Date()
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    })()
    onChange(`${datePart}T${nextTime}`)
  }

  return (
    <div className={className}>
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <CalendarClock size={14} className="text-primary" />
        Sélectionnez une date et une heure
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <DatePicker value={date} onChange={updateDate} required={required} disabled={disabled} ariaLabel="Choisir la date" />
        <TimePicker value={time} onChange={updateTime} required={required} disabled={disabled} ariaLabel="Choisir l’heure" />
      </div>
    </div>
  )
}
