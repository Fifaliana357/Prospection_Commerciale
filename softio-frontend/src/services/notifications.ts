import api from './api';

export interface Notif {
  id_notification: number;
  type: 'message' | 'rdv' | string;
  titre: string;
  sous_titre?: string | null;
  contenu?: string | null;
  id_prospection?: number | null;
  nom_client?: string | null;
  id_rdv?: number | null;
  lu: boolean;
  created_at?: string;
}

export const getNotifications = async (params?: {
  search?: string;
  filtre?: string;
  page?: number;
}) => {
  const res = await api.get('/notifications', { params });
  return res.data;
};

export const getUnreadCount = async () => {
  const res = await api.get('/notifications/unread-count');
  return res.data.count as number;
};

export const markRead = async (id: number) => {
  const res = await api.post(`/notifications/${id}/read`);
  return res.data;
};

export const markAllRead = async () => {
  const res = await api.post('/notifications/read-all');
  return res.data;
};

export const deleteNotification = async (id: number) => {
  const res = await api.delete(`/notifications/${id}`);
  return res.data;
};