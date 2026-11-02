import api from "./api"
import type { Client } from "./clients"
import type { Offre, Produit } from "./catalogue"

export type SaleStatus = "brouillon" | "validee" | "payee" | "impayee" | "annulee"
export type SaleLineType = "produit" | "service"

export interface SaleLine {
  id_ligne_vente: number
  id_produit: number | null
  id_offre: number | null
  type_ligne: SaleLineType
  designation: string
  description?: string | null
  quantite: number
  prix_unitaire: number
  remise: number
  montant: number
  ordre: number
  produit?: { reference: string | null } | null
  offre?: { denomination: string } | null
}

export interface Sale {
  id_vente: number
  id_admin: number
  id_commercial: number | null
  id_client: number
  id_devis: number | null
  numero: string | null
  type_document: string
  date_vente: string | null
  intitule?: string | null
  remarque?: string | null
  montant_total: number
  montant_ht?: number | null
  montant_ttc?: number | null
  inclure_tva?: boolean
  taux_tva?: number
  statut: SaleStatus
  methode_paiement?: string | null
  modalites?: string | null
  created_at?: string | null
  lignes_count?: number
  client: Pick<Client, "id_client" | "nom" | "prenom" | "entreprise" | "email" | "telephone">
  commercial?: { id_commercial: number; nom: string; prenom?: string | null } | null
  lignes?: SaleLine[]
  devis?: { id_devis: number; numero: string; type: string; statut: string } | null
}

export interface SalePayload {
  id_client: number
  date_vente: string
  intitule?: string
  remarque?: string
  inclure_tva: boolean
  taux_tva: number
  methode_paiement?: string
  modalites?: string
  statut?: "brouillon" | "validee"
  lignes: Array<{
    id_produit: number | null
    id_offre: number | null
    type_ligne: SaleLineType
    quantite: number
    remise: number
  }>
}

export interface PaginatedSales {
  data: Sale[]
  current_page: number
  last_page: number
  total: number
}

export async function getSalesCatalog() {
  const response = await api.get<{
    clients: Client[]
    produits: Array<Produit & { stock_disponible: number }>
    services: Offre[]
  }>("/ventes/catalogue")
  return response.data
}

export async function getSales(params: {
  view: "liste" | "brouillons"
  search?: string
  type?: string
  date_from?: string
  date_to?: string
  page?: number
}) {
  const response = await api.get<PaginatedSales>("/ventes", { params })
  return response.data
}

export async function getSale(id: number) {
  const response = await api.get<Sale>(`/ventes/${id}`)
  return response.data
}

export async function createSale(data: SalePayload) {
  const response = await api.post<{ vente: Sale }>("/ventes", data)
  return response.data.vente
}

export async function updateSale(id: number, data: SalePayload) {
  const response = await api.put<{ vente: Sale }>(`/ventes/${id}`, data)
  return response.data.vente
}

export async function validateSale(id: number) {
  const response = await api.post<{ vente: Sale }>(`/ventes/${id}/valider`)
  return response.data.vente
}

export async function deleteSale(id: number) {
  await api.delete(`/ventes/${id}`)
}

export async function createInvoiceFromSale(id: number) {
  const response = await api.post<{ facture: { id_devis: number; numero: string } }>(`/ventes/${id}/facture`)
  return response.data.facture
}
