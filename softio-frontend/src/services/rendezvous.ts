import api from './api';

export interface RendezVous {
  id_rendez_vous: number;
  id_client: number;
  date_rdv: string;
  lieu?: string;
  type_rdv?: string;
  statut: string;
  numero_rdv?: string;
  lien_rdv?: string;
  commentaire?: string;
  client?: {
    id_client: number;
    nom: string;
    prenom?: string;
    telephone?: string;
    email?: string;
    entreprise?: string;   // ← ajouté
    type?: string;         // ← ajouté
    matricule?: string;
  };
  commercial?: {
    id_commercial: number;
    nom: string;
    prenom: string;
  };
}


export const getRendezVous = async (params?: {
  search?: string;
  filtre?: string;
  page?: number;
}) => {
  const response = await api.get('/rendez-vous', { params });
  return response.data;
};

export const createRendezVous = async (data: any) => {
  const response = await api.post('/rendez-vous', data);
  return response.data;
};

export const updateRendezVous = async (id: number, data: any) => {
  const response = await api.put(`/rendez-vous/${id}`, data);
  return response.data;
};

export const deleteRendezVous = async (id: number) => {
  const response = await api.delete(`/rendez-vous/${id}`);
  return response.data;
};