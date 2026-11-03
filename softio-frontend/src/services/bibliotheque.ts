    import api from './api';

export interface Fichier {
  id_fichier: number;
  nom: string;
  type: string;
  chemin: string;
  taille: number;
  extension?: string;
  created_at?: string;
}

export const getFichiers = async (params?: { search?: string; type?: string; page?: number }) => {
  const res = await api.get('/bibliotheque', { params });
  return res.data;
};

export const uploadFichier = async (file: File) => {
  const fd = new FormData();
  fd.append('fichier', file);
  const res = await api.post('/bibliotheque', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const deleteFichier = async (id: number) => {
  const res = await api.delete(`/bibliotheque/${id}`);
  return res.data;
};