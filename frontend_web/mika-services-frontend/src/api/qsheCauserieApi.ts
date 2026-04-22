import apiClient from './axios'
import { API_ENDPOINTS } from '@/constants/api'
import type { CauserieResponse, CauserieCreateRequest, CauserieUpdateRequest, CauserieSummaryResponse, PaginatedResponse } from '@/types/qsheCauserie'

const E = API_ENDPOINTS.QSHE_CAUSERIES
export const qsheCauserieApi = {
  create: async (req: CauserieCreateRequest): Promise<CauserieResponse> => { const { data } = await apiClient.post<CauserieResponse>(E.BASE, req); return data },
  getByProjet: async (projetId: number, page = 0, size = 20): Promise<PaginatedResponse<CauserieResponse>> => { const { data } = await apiClient.get<PaginatedResponse<CauserieResponse>>(E.BY_PROJET(projetId), { params: { page, size, sort: 'dateCauserie,desc' } }); return data },
  getById: async (id: number): Promise<CauserieResponse> => { const { data } = await apiClient.get<CauserieResponse>(E.BY_ID(id)); return data },
  update: async (id: number, req: CauserieUpdateRequest): Promise<CauserieResponse> => { const { data } = await apiClient.put<CauserieResponse>(E.BY_ID(id), req); return data },
  delete: async (id: number): Promise<void> => { await apiClient.delete(E.BY_ID(id)) },
  getSummary: async (projetId: number): Promise<CauserieSummaryResponse> => { const { data } = await apiClient.get<CauserieSummaryResponse>(E.SUMMARY(projetId)); return data },
}
