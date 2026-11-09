import api from './api';
import type { Client } from './clients';
import type { Offre, Produit } from './catalogue';

export type DocumentType = 'devis' | 'proforma' | 'facture';
export type LineType = 'produit' | 'service';
export type DocumentStatus = 'brouillon' | 'valide';

export interface FacturationLine {
  id_ligne_devis?: number;
  id_produit: number | null;
  id_offre: number | null;
  type_ligne: LineType;
  designation: string;
  description?: string | null;
  quantite: number;
  prix_unitaire: number;
  remise: number;
  montant: number;
  ordre: number;
  produit?: { reference: string | null } | null;
  offre?: { denomination: string } | null;
}

export interface FacturationDocument {
  id_devis: number;
  numero: string;
  type: DocumentType;
  date_devis: string;
  intitule?: string | null;
  montant_ht: number;
  montant_ttc: number;
  remise_globale: number;
  inclure_tva: boolean;
  taux_tva: number;
  statut: DocumentStatus;
  remarque?: string | null;
  editor_name?: string | null;
  lignes_count?: number;
  client: {
    id_client: number;
    nom: string;
    prenom?: string | null;
    entreprise?: string | null;
    email?: string | null;
    telephone?: string | null;
  };
  commercial?: {
    nom: string;
    prenom?: string | null;
  } | null;
  lignes?: FacturationLine[];
  vente?: { id_vente: number } | null;
}

export interface FacturationPayload {
  id_client: number;
  type: DocumentType;
  date_devis: string;
  intitule?: string;
  remarque?: string;
  remise_globale: number;
  inclure_tva: boolean;
  taux_tva: number;
  lignes: Array<{
    id_produit: number | null;
    id_offre: number | null;
    type_ligne: LineType;
    quantite: number;
    remise: number;
  }>;
}

export interface FacturationPdfLayout {
  stampWidth: number;
  stampX: number;
  stampY: number;
  stampRotation: number;
  signatureWidth: number;
  signatureX: number;
  signatureY: number;
  signatureRotation: number;
}

export interface PaginatedDocuments {
  data: FacturationDocument[];
  current_page: number;
  last_page: number;
  total: number;
}

export async function getFacturationCatalog() {
  const response = await api.get<{
    clients: Client[];
    produits: Produit[];
    services: Offre[];
  }>('/facturation/catalogue');
  return response.data;
}

export async function getFacturationDocuments(params: {
  view: 'liste' | 'brouillons';
  search?: string;
  type?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
}) {
  const response = await api.get<PaginatedDocuments>('/facturation', { params });
  return response.data;
}

export async function getFacturationDocument(id: number) {
  const response = await api.get<FacturationDocument>(`/facturation/${id}`);
  return response.data;
}

export async function createFacturationDocument(data: FacturationPayload) {
  const response = await api.post<{ document: FacturationDocument }>('/facturation', data);
  return response.data.document;
}

export async function updateFacturationDocument(id: number, data: FacturationPayload) {
  const response = await api.put<{ document: FacturationDocument }>(`/facturation/${id}`, data);
  return response.data.document;
}

export async function validateFacturationDocument(id: number) {
  const response = await api.post<{ document: FacturationDocument }>(`/facturation/${id}/valider`);
  return response.data.document;
}

export async function deleteFacturationDocument(id: number) {
  await api.delete(`/facturation/${id}`);
}

export async function downloadFacturationDocument(
  id: number,
  format: 'A4' | 'A5' | 'Ticket',
  barcodeSvg?: string,
  layout?: FacturationPdfLayout,
) {
  const response = await api.post<Blob>(
    `/facturation/${id}/telecharger`,
    { format, barcode_svg: barcodeSvg, ...layout },
    { responseType: 'blob' },
  );
  return response.data;
}

export async function emailFacturationDocument(
  id: number,
  format: 'A4' | 'A5' | 'Ticket',
  barcodeSvg?: string,
  layout?: FacturationPdfLayout,
) {
  const response = await api.post<{ message: string }>(`/facturation/${id}/envoyer`, {
    format,
    barcode_svg: barcodeSvg,
    ...layout,
  });
  return response.data.message;
}
