import { ChevronLeft, ChevronRight } from "lucide-react"

interface TablePaginationProps {
  page: number
  lastPage: number
  onChange: (page: number) => void
}

export default function TablePagination({ page, lastPage, onChange }: TablePaginationProps) {
  if (lastPage <= 1) return null

  const visiblePageCount = Math.min(3, lastPage)
  const firstPage = Math.min(Math.max(1, page - 1), lastPage - visiblePageCount + 1)
  const pages = Array.from({ length: visiblePageCount }, (_, index) => firstPage + index)

  return (
    <nav className="flex items-center justify-end gap-1 border-t border-border px-4 py-3" aria-label="Pagination du tableau">
      {page > 1 && (
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-accent"
          aria-label="Page précédente"
        >
          <ChevronLeft size={16} />
        </button>
      )}
      {pages.map((pageNumber) => (
        <button
          key={pageNumber}
          type="button"
          onClick={() => onChange(pageNumber)}
          aria-current={pageNumber === page ? "page" : undefined}
          aria-label={`Page ${pageNumber}`}
          className={`grid h-8 min-w-8 place-items-center rounded-lg border px-2 text-sm font-medium transition-colors ${
            pageNumber === page
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground hover:bg-accent"
          }`}
        >
          {pageNumber}
        </button>
      ))}
      {page < lastPage && (
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-accent"
          aria-label="Page suivante"
        >
          <ChevronRight size={16} />
        </button>
      )}
    </nav>
  )
}
