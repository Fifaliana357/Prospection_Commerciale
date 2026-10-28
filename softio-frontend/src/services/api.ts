import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// Ajoute le token automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@Softio:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Gestion globale des erreurs (surtout 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('@Softio:token');
      localStorage.removeItem('@Softio:user');
      localStorage.removeItem('@Softio:type');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;