import apiClient from './axios'
import { API_ENDPOINTS } from '@/constants/api'
import type { RisqueResponse, RisqueCreateRequest, RisqueUpdateRequest, RisqueSummaryResponse, PaginatedResponse } from '@/types/qsheRisque'

const E = API_ENDPOINTS.QSHE_RISQUES
export const qsheRisqueApi = {
  create: async (req: RisqueCreateRequest): Promise<RisqueResponse> => { const { data } = await apiClient.post<RisqueResponse>(E.BASE, req); return data },
  getByProjet: async (projetId: number, page = 0, size = 20): Promise<PaginatedResponse<RisqueResponse>> => { const { data } = await apiClient.get<PaginatedResponse<RisqueResponse>>(E.BY_PROJET(projetId), { params: { page, size } }); return data },
  getById: async (id: number): Promise<RisqueResponse> => { const { data } = await apiClient.get<RisqueResponse>(E.BY_ID(id)); return data },
  update: async (id: number, req: RisqueUpdateRequest): Promise<RisqueResponse> => { const { data } = await apiClient.put<RisqueResponse>(E.BY_ID(id), req); return data },
  delete: async (id: number): Promise<void> => { await apiClient.delete(E.BY_ID(id)) },
  getSummary: async (projetId: number): Promise<RisqueSummaryResponse> => { const { data } = await apiClient.get<RisqueSummaryResponse>(E.SUMMARY(projetId)); return data },
}
