import api from './api';

export interface Produit {
  id_produit: number;
  reference: string;
  designation: string;
  description?: string | null;
  prix_unitaire: number;
  photo?: string | null;
  actif?: boolean;
}

export interface Offre {
  id_offre: number;
  denomination: string;
  description?: string | null;
  tarif: number;
  actif?: boolean;
}

// Produits
export const getProduits = async (params?: { search?: string; page?: number }) => {
  const res = await api.get('/produits', { params });
  return res.data;
};

export const createProduit = async (data: FormData) => {
  const res = await api.post('/produits', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const updateProduit = async (id: number, data: FormData) => {
  data.append('_method', 'PUT');
  const res = await api.post(`/produits/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const deleteProduit = async (id: number) => {
  const res = await api.delete(`/produits/${id}`);
  return res.data;
};

// Offres (services)
export const getOffres = async (params?: { search?: string; page?: number }) => {
  const res = await api.get('/offres', { params });
  return res.data;
};

export const createOffre = async (data: Partial<Offre>) => {
  const res = await api.post('/offres', data);
  return res.data;
};

export const updateOffre = async (id: number, data: Partial<Offre>) => {
  const res = await api.put(`/offres/${id}`, data);
  return res.data;
};

export const deleteOffre = async (id: number) => {
  const res = await api.delete(`/offres/${id}`);
  return res.data;
};