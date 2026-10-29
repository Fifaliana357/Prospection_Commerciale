import api from './api';

export interface Closing {
  id_closing: number;
  id_prospection?: number;
  id_client: number;
  produit: string;
  description?: string;
  montant: number;
  created_at: string;
  client?: {
    id_client: number;
    nom: string;
    prenom?: string;
    email?: string;
    entreprise?: string;
  };
  commercial?: {
    id_commercial: number;
    nom: string;
    prenom: string;
  };
  admin?: {
    id_admin: number;
    nom: string;
    prenom: string;
  };
}

export const getClosings = async (params?: {
  search?: string;
  page?: number;
}) => {
  const response = await api.get('/closings', { params });
  return response.data;
};

export const createClosing = async (data: any) => {
  const response = await api.post('/closings', data);
  return response.data;
};

export const deleteClosing = async (id: number) => {
  const response = await api.delete(`/closings/${id}`);
  return response.data;
};