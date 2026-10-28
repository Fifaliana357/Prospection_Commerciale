import api from './api';

export interface Proposition {
  id_proposition: number;
  id_prospection: number;
  date_proposition: string;
  objet?: string;
  type: 'sortant' | 'entrant';
  message: string;
  type_message?: string;
  note?: number;
  lu: boolean;
}

export interface Prospection {
  id_prospection: number;
  id_client: number;
  id_offre?: number;
  produit_prospecte?: string;
  etat: string;
  est_perdu: boolean;
  note_actuelle?: number;
  created_at: string;
  client?: {
    id_client: number;
    nom: string;
    prenom?: string;
    telephone?: string;
    email?: string;
    entreprise?: string;
  };
  commercial?: {
    id_commercial: number;
    nom: string;
    prenom: string;
  };
  offre?: {
    id_offre: number;
    denomination: string;
  };
  propositions?: Proposition[];
}

export const getProspections = async (params?: {
  search?: string;
  etat?: string;
  page?: number;
}) => {
  const response = await api.get('/prospections', { params });
  return response.data;
};

export const getProspection = async (id: number) => {
  const response = await api.get(`/prospections/${id}`);
  return response.data;
};

export const createProspection = async (data: any) => {
  const response = await api.post('/prospections', data);
  return response.data;
};

export const updateProspection = async (id: number, data: any) => {
  const response = await api.put(`/prospections/${id}`, data);
  return response.data;
};

export const deleteProspection = async (id: number) => {
  const response = await api.delete(`/prospections/${id}`);
  return response.data;
};

export const addMessage = async (id: number, data: any) => {
  const response = await api.post(`/prospections/${id}/messages`, data);
  return response.data;
};