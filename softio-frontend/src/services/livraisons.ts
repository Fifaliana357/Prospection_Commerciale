import api from "./api"

export type DeliveryStatus = "a_preparer" | "en_cours" | "livree" | "retournee" | "retardee"
export type EditableDeliveryStatus = Exclude<DeliveryStatus, "retardee">

export interface Delivery {
  id_livraison: number
  id_vente: number
  adresse: string | null
  statut: EditableDeliveryStatus
  statut_affiche: DeliveryStatus
  date_prevue: string | null
  date_livraison: string | null
  livreur: string | null
  commentaire: string | null
  vente: {
    id_vente: number
    numero: string | null
    date_vente: string | null
    montant_total: number | string
    client: {
      nom: string
      prenom: string | null
      entreprise: string | null
      telephone: string | null
    } | null
    commercial: { nom: string; prenom: string | null } | null
  }
}

export interface DeliveryHistoryEntry {
  id_historique: number
  ancien_statut: EditableDeliveryStatus | null
  nouveau_statut: EditableDeliveryStatus
  commentaire: string | null
  auteur: string
  created_at: string
}

export interface PaginatedDeliveries {
  summary: { en_retard: number; en_cours: number; livrees: number }
  deliveries: {
    data: Delivery[]
    current_page: number
    last_page: number
    total: number
  }
}

export interface DeliveryPayload {
  adresse: string
  statut: EditableDeliveryStatus
  date_prevue: string
  date_livraison: string
  livreur: string
  commentaire: string
}

export async function getDeliveries(params: { search?: string; statut?: string; page?: number }) {
  const response = await api.get<PaginatedDeliveries>("/sav/livraisons", { params })
  return response.data
}

export async function updateDelivery(id: number, data: DeliveryPayload) {
  const response = await api.put<{ message: string; delivery: Delivery }>(`/sav/livraisons/${id}`, data)
  return response.data
}

export async function getDeliveryHistory(id: number) {
  const response = await api.get<{ historique: DeliveryHistoryEntry[] }>(`/sav/livraisons/${id}/historique`)
  return response.data.historique
}
