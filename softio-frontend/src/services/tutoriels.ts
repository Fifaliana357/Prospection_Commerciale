import api from './api';

export interface Tutoriel {
  id_tutoriel: number;
  titre: string;
  lien: string;
  created_at?: string;
}

export const getTutoriels = async (params?: { search?: string; page?: number }) => {
  const res = await api.get('/tutoriels', { params });
  return res.data;
};

export const createTutoriel = async (data: { titre: string; lien: string }) => {
  const res = await api.post('/tutoriels', data);
  return res.data;
};

export const updateTutoriel = async (id: number, data: Partial<Tutoriel>) => {
  const res = await api.put(`/tutoriels/${id}`, data);
  return res.data;
};

export const deleteTutoriel = async (id: number) => {
  const res = await api.delete(`/tutoriels/${id}`);
  return res.data;
};