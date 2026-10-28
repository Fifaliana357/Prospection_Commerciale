import api from './api';

export interface Client {
  id_client: number;
  matricule: string;
  type: 'particulier' | 'entreprise' | 'autre';
  nom: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  facebook?: string;
  linkedin?: string;
  entreprise?: string;
  poste?: string;
  classification?: string;
  profession?: string;
  site_web?: string;
  pays?: string;
  domaine?: string;
  id_commercial?: number;
  commercial?: {
    id_commercial: number;
    nom: string;
    prenom: string;
  };
  created_at: string;
}

export interface ClientsResponse {
  data: Client[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export const getClients = async (params?: {
  search?: string;
  type?: string;
  page?: number;
}) => {
  const response = await api.get<ClientsResponse>('/clients', { params });
  return response.data;
};

export const getClient = async (id: number) => {
  const response = await api.get<Client>(`/clients/${id}`);
  return response.data;
};

export const createClient = async (data: Partial<Client>) => {
  const response = await api.post('/clients', data);
  return response.data;
};

export const updateClient = async (id: number, data: Partial<Client>) => {
  const response = await api.put(`/clients/${id}`, data);
  return response.data;
};

export const deleteClient = async (id: number) => {
  const response = await api.delete(`/clients/${id}`);
  return response.data;
};