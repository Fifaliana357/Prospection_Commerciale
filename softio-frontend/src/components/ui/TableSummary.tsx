import { List } from "lucide-react"

interface TableSummaryProps {
  total: number
  label: string
}

export default function TableSummary({ total, label }: TableSummaryProps) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
      <List size={15} aria-hidden="true" />
      {new Intl.NumberFormat("fr-FR").format(total)} {label}
    </span>
  )
}
