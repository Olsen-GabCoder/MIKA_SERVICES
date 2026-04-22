import apiClient from './axios'
import { API_ENDPOINTS } from '@/constants/api'
import type { SuiviEnvResponse, SuiviEnvCreateRequest, DechetResponse, DechetCreateRequest, ProduitChimiqueResponse, ProduitChimiqueCreateRequest, EnvironnementSummaryResponse, PaginatedResponse } from '@/types/qsheEnvironnement'

const E = API_ENDPOINTS.QSHE_ENVIRONNEMENT
export const qsheEnvApi = {
  createMesure: async (req: SuiviEnvCreateRequest): Promise<SuiviEnvResponse> => { const { data } = await apiClient.post<SuiviEnvResponse>(E.MESURES, req); return data },
  getMesuresByProjet: async (projetId: number, page = 0, size = 20): Promise<PaginatedResponse<SuiviEnvResponse>> => { const { data } = await apiClient.get<PaginatedResponse<SuiviEnvResponse>>(E.MESURES_BY_PROJET(projetId), { params: { page, size, sort: 'dateMesure,desc' } }); return data },
  createDechet: async (req: DechetCreateRequest): Promise<DechetResponse> => { const { data } = await apiClient.post<DechetResponse>(E.DECHETS, req); return data },
  getDechetsByProjet: async (projetId: number, page = 0, size = 20): Promise<PaginatedResponse<DechetResponse>> => { const { data } = await apiClient.get<PaginatedResponse<DechetResponse>>(E.DECHETS_BY_PROJET(projetId), { params: { page, size, sort: 'dateEnlevement,desc' } }); return data },
  createProduit: async (req: ProduitChimiqueCreateRequest): Promise<ProduitChimiqueResponse> => { const { data } = await apiClient.post<ProduitChimiqueResponse>(E.PRODUITS, req); return data },
  getProduits: async (page = 0, size = 50): Promise<PaginatedResponse<ProduitChimiqueResponse>> => { const { data } = await apiClient.get<PaginatedResponse<ProduitChimiqueResponse>>(E.PRODUITS, { params: { page, size } }); return data },
  getProduitById: async (id: number): Promise<ProduitChimiqueResponse> => { const { data } = await apiClient.get<ProduitChimiqueResponse>(E.PRODUIT_BY_ID(id)); return data },
  getSummary: async (projetId: number): Promise<EnvironnementSummaryResponse> => { const { data } = await apiClient.get<EnvironnementSummaryResponse>(E.SUMMARY(projetId)); return data },
}
