import type { ReactNode } from "react"

export type FilterPillOption = {
  value: string
  label: string
  icon?: ReactNode
}

export default function FilterPills({
  value,
  options,
  onChange,
  className = "",
}: {
  value: string
  options: FilterPillOption[]
  onChange: (value: string) => void
  className?: string
}) {
  return (
    <div className={`filter-pills ${className}`.trim()}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className="filter-pill"
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  )
}
