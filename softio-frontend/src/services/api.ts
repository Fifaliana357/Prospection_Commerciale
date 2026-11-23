import axios from 'axios';
import { logout } from '@/lib/session';

const api = axios.create({
  //baseURL: 'http://127.0.0.1:8000/api',
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// Ajoute le token automatiquement
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('@Softio:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Gestion globale des erreurs (surtout 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 403 &&
      error.response?.data?.code === 'softio_access_inactive'
    ) {
      logout();
    }

    if (error.response?.status === 401) {
      // Token expiré ou invalide
      logout();
    }
    return Promise.reject(error);
  }
);

export default api;