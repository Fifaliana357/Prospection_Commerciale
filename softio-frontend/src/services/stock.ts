import api from './api';

export interface InventoryProduct {
  id_produit: number;
  reference: string | null;
  designation: string;
  prix_unitaire: number;
  quantite_approvisionnee: number;
  quantite_vendue: number;
  stock_disponible: number;
  valeur_stock: number;
  statut: 'rupture' | 'faible' | 'en_stock';
}

export interface StockMovement {
  id_mouvement: number;
  id_produit: number;
  type_mouvement: 'entree' | 'sortie';
  quantite: number;
  date_mouvement: string;
  reference?: string | null;
  commentaire?: string | null;
  quantite_vendue: number;
  quantite_sortie: number;
  quantite_restante: number;
  produit: Pick<InventoryProduct, 'id_produit' | 'reference' | 'designation'>;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface InventoryResponse extends PaginatedResponse<InventoryProduct> {
  summary: {
    total_value: number;
    products_count: number;
  };
}

export const getStockInventory = async (params?: {
  search?: string;
  page?: number;
  per_page?: number;
}) => {
  const response = await api.get<InventoryResponse>('/stock/inventaire', { params });
  return response.data;
};

export const getStockMovements = async (params?: {
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
}) => {
  const response = await api.get<PaginatedResponse<StockMovement>>('/stock/mouvements', { params });
  return response.data;
};

export const createStockMovement = async (data: {
  id_produit: number;
  type_mouvement: 'entree' | 'sortie';
  quantite: number;
  date_mouvement: string;
}) => {
  const response = await api.post('/stock/mouvements', data);
  return response.data;
};

export const updateStockMovement = async (id: number, data: { quantite: number }) => {
  const response = await api.put(`/stock/mouvements/${id}`, data);
  return response.data;
};

export const deleteStockMovement = async (id: number) => {
  const response = await api.delete(`/stock/mouvements/${id}`);
  return response.data;
};
