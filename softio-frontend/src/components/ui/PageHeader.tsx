import type { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  description?: string
  icon: ReactNode
  action?: ReactNode
}

export default function PageHeader({ title, description, icon, action }: PageHeaderProps) {
  return (
    <header className="mb-4 flex flex-col gap-4 rounded-2xl border border-border bg-gradient-to-r from-muted/65 via-card to-muted/65 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex min-w-0 items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-muted text-foreground shadow-sm">
          {icon}
        </span>
        <span className="min-w-0">
          <h1 className="block text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h1>
          {description && <span className="mt-1 block text-sm text-muted-foreground">{description}</span>}
        </span>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  )
}
