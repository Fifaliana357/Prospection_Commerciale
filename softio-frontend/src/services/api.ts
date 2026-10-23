// API Client pour communiquer avec le backend Laravel

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api"

export class ApiError extends Error {
  status: number
  data: unknown
  constructor(status: number, message: string, data?: unknown) {
    super(message)
    this.status = status
    this.data = data
  }
}

let authToken: string | null = localStorage.getItem("softio_token")

export function setToken(token: string | null) {
  authToken = token
  if (token) {
    localStorage.setItem("softio_token", token)
  } else {
    localStorage.removeItem("softio_token")
  }
}

export function getToken(): string | null {
  return authToken
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  }

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`
  }

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (response.status === 204) {
    return {} as T
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const errorMsg = data?.message || `Erreur ${response.status}: ${response.statusText}`
    throw new ApiError(response.status, errorMsg, data)
  }

  return data as T
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: "GET" }),
  post: <T>(endpoint: string, body?: unknown) => request<T>(endpoint, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body?: unknown) => request<T>(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(endpoint: string, body?: unknown) => request<T>(endpoint, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),
}

// ----------------- SERVICES PAR DOMAINE -----------------

// Authentification
export const authApi = {
  login: (credentials: { email: string; mot_de_passe: string }) =>
    api.post<{ token: string; user: { id: number; nom: string; email: string; role?: string } }>("/auth/login", credentials),
  register: (payload: { nom: string; email: string; mot_de_passe: string; role?: string }) =>
    api.post<{ token: string; user: { id: number; nom: string; email: string } }>("/auth/register", payload),
  me: () => api.get<{ user: { id: number; nom: string; email: string; role?: string } }>("/auth/me"),
  logout: () => api.post<{ message: string }>("/auth/logout"),
}

// Prospects
export interface ProspectModel {
  id: number
  matricule: string
  nom: string
  prenom: string
  type: "particulier" | "entreprise"
  email: string
  contact: string
  entreprise: string
  poste?: string
  classification: string
  pays: string
  domaine: string
  profession?: string
  linkedin?: string
  facebook?: string
  siteweb?: string
  interets?: string
  created_at?: string
  updated_at?: string
}

export const prospectsApi = {
  getAll: (params?: { search?: string; type?: string; classification?: string }) => {
    const q = new URLSearchParams()
    if (params?.search) q.append("search", params.search)
    if (params?.type && params.type !== "Tous") q.append("type", params.type)
    if (params?.classification && params.classification !== "Tous") q.append("classification", params.classification)
    const qs = q.toString() ? `?${q.toString()}` : ""
    return api.get<ProspectModel[]>(`/prospects${qs}`)
  },
  getOne: (id: number) => api.get<ProspectModel>(`/prospects/${id}`),
  create: (data: Omit<ProspectModel, "id" | "matricule" | "created_at" | "updated_at"> & { matricule?: string }) =>
    api.post<ProspectModel>("/prospects", data),
  update: (id: number, data: Partial<ProspectModel>) => api.put<ProspectModel>(`/prospects/${id}`, data),
  delete: (id: number) => api.delete<{ message: string }>(`/prospects/${id}`),
}

// Prospections
export interface ProspectionModel {
  id: number
  matricule?: string
  date: string
  objet: string
  contact: string
  nom: string
  entreprise: string
  fonction: string
  produit?: string
  type?: string
  message?: string
  etat: string
  editeur: string
  score: number | null
}

export const prospectionsApi = {
  getAll: (params?: { search?: string }) => {
    const q = new URLSearchParams()
    if (params?.search) q.append("search", params.search)
    const qs = q.toString() ? `?${q.toString()}` : ""
    return api.get<ProspectionModel[]>(`/prospections${qs}`)
  },
  create: (data: Omit<ProspectionModel, "id">) => api.post<ProspectionModel>("/prospections", data),
  update: (id: number, data: Partial<ProspectionModel>) => api.put<ProspectionModel>(`/prospections/${id}`, data),
  delete: (id: number) => api.delete<{ message: string }>(`/prospections/${id}`),
}

// Rendez-vous
export interface RendezVousModel {
  id: number
  date: string
  heure: string
  prospect: string
  contact: string
  mode: string
  lieu: string
  commentaire: string
  statut: string
}

export const rendezVousApi = {
  getAll: () => api.get<RendezVousModel[]>("/rendez-vous"),
  create: (data: Omit<RendezVousModel, "id">) => api.post<RendezVousModel>("/rendez-vous", data),
  update: (id: number, data: Partial<RendezVousModel>) => api.put<RendezVousModel>(`/rendez-vous/${id}`, data),
  delete: (id: number) => api.delete<{ message: string }>(`/rendez-vous/${id}`),
}

// Ventes
export interface VenteModel {
  id: number
  num: string
  type: string
  montant: string
  date: string
  totalHT: string
  tva: string
  statut: string
}

export const ventesApi = {
  getAll: () => api.get<VenteModel[]>("/ventes"),
  create: (data: Omit<VenteModel, "id">) => api.post<VenteModel>("/ventes", data),
  update: (id: number, data: Partial<VenteModel>) => api.put<VenteModel>(`/ventes/${id}`, data),
  delete: (id: number) => api.delete<{ message: string }>(`/ventes/${id}`),
}

// Facturation
export interface FactureModel {
  id: number
  num: string
  type: string
  montant: string
  date: string
  totalHT: string
  tva: string
  statut: string
}

export const facturationApi = {
  getAll: () => api.get<FactureModel[]>("/factures"),
  create: (data: Omit<FactureModel, "id">) => api.post<FactureModel>("/factures", data),
  update: (id: number, data: Partial<FactureModel>) => api.put<FactureModel>(`/factures/${id}`, data),
  delete: (id: number) => api.delete<{ message: string }>(`/factures/${id}`),
}

// Catalogue
export interface CatalogueModel {
  id: number
  ref: string
  designation: string
  type: string
  prix: string
  stock: number | null
}

export const catalogueApi = {
  getAll: () => api.get<CatalogueModel[]>("/catalogue"),
  create: (data: Omit<CatalogueModel, "id">) => api.post<CatalogueModel>("/catalogue", data),
  update: (id: number, data: Partial<CatalogueModel>) => api.put<CatalogueModel>(`/catalogue/${id}`, data),
  delete: (id: number) => api.delete<{ message: string }>(`/catalogue/${id}`),
}

// Stock
export interface StockMouvementModel {
  id: number
  ref: string
  designation: string
  quantite: number
  date: string
  type: "Entrée" | "Sortie"
}

export interface StockInventaireModel {
  ref: string
  designation: string
  stock: number
  statut: string
}

export const stockApi = {
  getMouvements: () => api.get<StockMouvementModel[]>("/stock/mouvements"),
  getInventaire: () => api.get<StockInventaireModel[]>("/stock/inventaire"),
  createMouvement: (data: Omit<StockMouvementModel, "id">) => api.post<StockMouvementModel>("/stock/mouvements", data),
}

// SAV
export interface SavTicketModel {
  id: number
  num: string
  client: string
  sujet: string
  priorite: "Haute" | "Moyenne" | "Basse"
  statut: "Ouvert" | "En cours" | "Résolu"
  date: string
}

export const savApi = {
  getAll: () => api.get<SavTicketModel[]>("/sav-tickets"),
  create: (data: Omit<SavTicketModel, "id">) => api.post<SavTicketModel>("/sav-tickets", data),
  update: (id: number, data: Partial<SavTicketModel>) => api.put<SavTicketModel>(`/sav-tickets/${id}`, data),
  delete: (id: number) => api.delete<{ message: string }>(`/sav-tickets/${id}`),
}

// Commerciaux
export interface CommercialModel {
  id: number
  nom: string
  prenom: string
  email: string
  contact: string
  prospects: number
  ventes: number
}

export const commerciauxApi = {
  getAll: () => api.get<CommercialModel[]>("/commerciaux"),
  create: (data: Omit<CommercialModel, "id" | "prospects" | "ventes">) => api.post<CommercialModel>("/commerciaux", data),
  update: (id: number, data: Partial<CommercialModel>) => api.put<CommercialModel>(`/commerciaux/${id}`, data),
  delete: (id: number) => api.delete<{ message: string }>(`/commerciaux/${id}`),
}

// Intérêts
export interface InteretModel {
  id: number
  prospect: string
  type: "particulier" | "entreprise"
  produit: string
  typeOffre: "Produit" | "Service"
  date: string
  niveau: "Élevé" | "Moyen" | "Faible"
  commentaire: string
}

export const interetsApi = {
  getAll: () => api.get<InteretModel[]>("/interets"),
  create: (data: Omit<InteretModel, "id">) => api.post<InteretModel>("/interets", data),
  update: (id: number, data: Partial<InteretModel>) => api.put<InteretModel>(`/interets/${id}`, data),
  delete: (id: number) => api.delete<{ message: string }>(`/interets/${id}`),
}

// Closings
export interface ClosingModel {
  id: number
  offre: string
  description: string
  montant: string
  client: string
  email: string
  editeur: string
}

export const closingsApi = {
  getAll: () => api.get<ClosingModel[]>("/closings"),
  create: (data: Omit<ClosingModel, "id">) => api.post<ClosingModel>("/closings", data),
  update: (id: number, data: Partial<ClosingModel>) => api.put<ClosingModel>(`/closings/${id}`, data),
  delete: (id: number) => api.delete<{ message: string }>(`/closings/${id}`),
}

// Bibliothèque
export interface BibliothequeModel {
  id: number
  nom: string
  type: string
  taille: string
  date: string
}

export const bibliothequeApi = {
  getAll: () => api.get<BibliothequeModel[]>("/bibliotheque"),
  create: (data: Omit<BibliothequeModel, "id">) => api.post<BibliothequeModel>("/bibliotheque", data),
  delete: (id: number) => api.delete<{ message: string }>(`/bibliotheque/${id}`),
}

// Dashboard & Statistiques
export interface DashboardStats {
  prospectsCount: number
  prospectionsCount: number
  rdvDuJourCount: number
  ventesMoisMontant: string
  activities: Array<{ name: string; action: string; time: string; type: string }>
}

export const dashboardApi = {
  getStats: () => api.get<DashboardStats>("/dashboard/stats"),
}
