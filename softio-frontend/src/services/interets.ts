import api from './api';

export interface Interet {
  id_interet: number;
  id_client: number;
  produit_concerne: string;
  niveau: number;
}

export interface ClientWithInterets {
  id_client: number;
  matricule?: string;
  nom: string;
  prenom?: string;
  telephone?: string;
  email?: string;
  facebook?: string;
  linkedin?: string;
  interets: Interet[];
}

export const getInterets = async (params?: {
  search?: string;
  produit?: string;
  page?: number;
}) => {
  const response = await api.get('/interets', { params });
  return response.data;
};

export const createInteret = async (data: {
  id_client: number;
  produit_concerne: string;
  niveau?: number;
}) => {
  const response = await api.post('/interets', data);
  return response.data;
};

export const deleteInteret = async (id: number) => {
  const response = await api.delete(`/interets/${id}`);
  return response.data;
};