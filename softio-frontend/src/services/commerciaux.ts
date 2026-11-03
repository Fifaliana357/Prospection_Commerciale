import api from './api';

export interface Commercial {
  id_commercial: number;
  nom: string;
  prenom?: string | null;
  email: string;
  telephone?: string | null;
  actif: boolean;
  is_first_login?: boolean;
  created_at?: string;
  admin?: {
    id_admin: number;
    nom: string;
    prenom?: string | null;
  } | null;
}

export const getCommerciaux = async (params?: {
  search?: string;
  actif?: string;
  page?: number;
}) => {
  const res = await api.get('/commerciaux', { params });
  return res.data;
};

export const createCommercial = async (data: {
  nom: string;
  prenom?: string;
  email: string;
  telephone?: string;
  actif?: boolean;
}) => {
  const res = await api.post('/commerciaux', data);
  return res.data;
};

export const updateCommercial = async (
  id: number,
  data: Partial<{
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    password: string;
    actif: boolean;
  }>
) => {
  const res = await api.put(`/commerciaux/${id}`, data);
  return res.data;
};

export const deleteCommercial = async (id: number) => {
  const res = await api.delete(`/commerciaux/${id}`);
  return res.data;
};