import { useEffect, useRef, useState } from "react"
import { Search, UserRoundCheck } from "lucide-react"
import TablePagination from "@/components/ui/TablePagination"
import TableSummary from "@/components/ui/TableSummary"
import PageHeader from "@/components/ui/PageHeader"
import { useToast } from "@/contexts/ToastContext"
import { getBuyerClients, type BuyerClient } from "@/services/clients"
import { formatMGA } from "@/lib/utils"

const inputClass = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object"
    && error !== null
    && "response" in error
    && typeof error.response === "object"
    && error.response !== null
    && "data" in error.response
    && typeof error.response.data === "object"
    && error.response.data !== null
    && "message" in error.response.data
    && typeof error.response.data.message === "string"
  ) {
    return error.response.data.message
  }
  return fallback
}

function formatAmount(value: number | null) {
  return formatMGA(value)
}

function formatDate(value: string | null) {
  if (!value) return "—"
  const [year, month, day] = value.slice(0, 10).split("-")
  return `${day}/${month}/${year}`
}

export default function Clients() {
  const toast = useToast()
  const toastRef = useRef(toast)
  const [clients, setClients] = useState<BuyerClient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [totalClients, setTotalClients] = useState(0)

  useEffect(() => {
    toastRef.current = toast
  }, [toast])

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      setLoading(true)
      getBuyerClients({ search: search.trim() || undefined, page })
        .then((response) => {
          if (!active) return
          setClients(response.data)
          setLastPage(response.last_page)
          setTotalClients(response.total)
        })
        .catch((error: unknown) => {
          if (active) toastRef.current.error(getErrorMessage(error, "Impossible de charger la liste des clients"))
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }, 300)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [search, page])

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <PageHeader title="Clients" description="Les personnes qui ont déjà acheté un produit ou un service." icon={<UserRoundCheck size={23} />} />

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Rechercher..."
            aria-label="Rechercher un client"
            className={`${inputClass} pl-10`}
          />
        </label>
        <TableSummary total={totalClients} label="clients" />
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-sm [&_tbody_tr:last-child_td]:border-b-0">
            <thead className="bg-primary text-primary-foreground">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase">Matricule</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase">Type</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase">Nom</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase">Prénoms</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase">Contact</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase">Email</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase">Entreprise</th>
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase">Nb d’achats</th>
                <th className="px-3 py-3 text-right text-xs font-semibold uppercase">Total acheté (MGA)</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase">Dernier achat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">Chargement des clients...</td></tr>
              ) : clients.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">Aucun client ayant effectué un achat trouvé.</td></tr>
              ) : clients.map((client) => (
                <tr key={client.id_client} className="odd:bg-card even:bg-muted/20 hover:bg-primary/5">
                  <td className="whitespace-nowrap px-3 py-3 font-medium">{client.matricule || "—"}</td>
                  <td className="px-3 py-3">{client.type || "—"}</td>
                  <td className="px-3 py-3">{client.nom || "—"}</td>
                  <td className="px-3 py-3">{client.prenom || "—"}</td>
                  <td className="whitespace-nowrap px-3 py-3">{client.telephone || "—"}</td>
                  <td className="px-3 py-3">{client.email || "—"}</td>
                  <td className="px-3 py-3">{client.entreprise || "—"}</td>
                  <td className="px-3 py-3 text-center">{client.nombre_achats}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-right font-medium">{formatAmount(client.total_achete)}</td>
                  <td className="whitespace-nowrap px-3 py-3">{formatDate(client.dernier_achat)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground">
          <TablePagination page={page} lastPage={lastPage} onChange={setPage} />
        </div>
      </section>
    </div>
  )
}
