import apiClient from './axios'
import { API_ENDPOINTS } from '@/constants/api'
import type { PermisTravailResponse, PermisTravailCreateRequest, PermisTravailUpdateRequest, PermisTravailSummaryResponse, PaginatedResponse } from '@/types/qshePermis'

const E = API_ENDPOINTS.QSHE_PERMIS
export const qshePermisApi = {
  create: async (req: PermisTravailCreateRequest): Promise<PermisTravailResponse> => { const { data } = await apiClient.post<PermisTravailResponse>(E.BASE, req); return data },
  getByProjet: async (projetId: number, page = 0, size = 20): Promise<PaginatedResponse<PermisTravailResponse>> => { const { data } = await apiClient.get<PaginatedResponse<PermisTravailResponse>>(E.BY_PROJET(projetId), { params: { page, size, sort: 'dateDebutValidite,desc' } }); return data },
  getById: async (id: number): Promise<PermisTravailResponse> => { const { data } = await apiClient.get<PermisTravailResponse>(E.BY_ID(id)); return data },
  update: async (id: number, req: PermisTravailUpdateRequest): Promise<PermisTravailResponse> => { const { data } = await apiClient.put<PermisTravailResponse>(E.BY_ID(id), req); return data },
  delete: async (id: number): Promise<void> => { await apiClient.delete(E.BY_ID(id)) },
  getSummary: async (projetId: number): Promise<PermisTravailSummaryResponse> => { const { data } = await apiClient.get<PermisTravailSummaryResponse>(E.SUMMARY(projetId)); return data },
}
