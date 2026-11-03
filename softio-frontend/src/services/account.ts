import api from './api';

export interface AccountProfile {
  nom: string;
  prenom: string;
  email: string;
  role: 'admin' | 'commercial';
}

export interface CompanySettings {
  id_entreprise?: number;
  nom_entreprise: string;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  nif: string | null;
  stat: string | null;
  rcs: string | null;
  logo_url: string | null;
  cachet_url: string | null;
  signature_url: string | null;
}

export interface AccountingOperation {
  id_operation: number;
  type: 'depense' | 'versement';
  montant: number | string;
  motif: string;
  date_operation: string;
  piece_jointe_url: string | null;
}

export interface AccountingSale {
  id_vente: number;
  id_devis: number | null;
  numero: string;
  intitule: string | null;
  date_vente: string | null;
  created_at: string;
  montant_ttc: number | string | null;
  montant_total: number | string;
  client: { nom: string; prenom: string | null; entreprise: string | null } | null;
}

export interface AccountingData {
  summary: {
    recettes: number;
    ventes: number;
    versements: number;
    nombre_versements: number;
    depenses: number;
    nombre_depenses: number;
    solde: number;
  };
  sales: { data: AccountingSale[]; current_page: number; last_page: number; total: number };
  operations: { data: AccountingOperation[]; current_page: number; last_page: number; total: number };
}

export const getAccountProfile = async () => {
  const response = await api.get<{ user: AccountProfile }>('/account/profile');
  return response.data.user;
};

export const updateAccountProfile = async (data: Pick<AccountProfile, 'nom' | 'prenom'>) =>
  api.put('/account/profile', data);

export const updateAccountEmail = async (data: { email: string; current_password: string }) =>
  api.put('/account/email', data);

export const updateAccountPassword = async (data: {
  current_password: string;
  password: string;
  password_confirmation: string;
}) => api.put('/account/password', data);

export const getCompanySettings = async () => {
  const response = await api.get<{ entreprise: CompanySettings }>('/entreprise');
  return response.data.entreprise;
};

export const updateCompanySettings = async (data: FormData) => {
  const response = await api.post<{ entreprise: CompanySettings }>('/entreprise', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.entreprise;
};

export const getAccounting = async (params: {
  date_from?: string;
  date_to?: string;
  type?: 'depense' | 'versement';
  sales_page?: number;
  operations_page?: number;
}) => {
  const response = await api.get<AccountingData>('/comptabilite', { params });
  return response.data;
};

export const exportAccounting = async (params: {
  type: 'recettes' | 'depense' | 'versement';
  date_from?: string;
  date_to?: string;
}) => {
  const response = await api.get('/comptabilite/export', { params, responseType: 'blob' });
  return response.data as Blob;
};

export const createAccountingOperation = async (data: FormData) => {
  const response = await api.post('/comptabilite/operations', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteAccountingOperation = async (id: number) =>
  api.delete(`/comptabilite/operations/${id}`);
