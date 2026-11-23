import { List } from "lucide-react"

interface TableSummaryProps {
  total: number
  label: string
}

export default function TableSummary({ total, label }: TableSummaryProps) {
  return (
    <span data-toolbar-total className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary">
      <List size={12} aria-hidden="true" />
      {new Intl.NumberFormat("fr-FR").format(total)} {label}
    </span>
  )
}
