import api from './api';

export interface DashboardStats {
  prospects: number;
  prospections: number;
  en_cours: number;
  cloturees: number;
  perdues: number;
  closings: number;
  montant_closings: number;
  rdv_aujourdhui: number;
  rdv_semaine: number;
  taux_conversion: number;
}

export const getDashboard = async (): Promise<DashboardStats> => {
  const response = await api.get('/dashboard');
  return response.data;
};