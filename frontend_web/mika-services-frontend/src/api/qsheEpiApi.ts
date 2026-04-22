import apiClient from './axios'
import { API_ENDPOINTS } from '@/constants/api'
import type { EpiResponse, EpiCreateRequest, EpiUpdateRequest, EpiSummaryResponse, PaginatedResponse } from '@/types/qsheEpi'

const E = API_ENDPOINTS.QSHE_EPI
export const qsheEpiApi = {
  create: async (req: EpiCreateRequest): Promise<EpiResponse> => { const { data } = await apiClient.post<EpiResponse>(E.BASE, req); return data },
  getAll: async (page = 0, size = 50): Promise<PaginatedResponse<EpiResponse>> => { const { data } = await apiClient.get<PaginatedResponse<EpiResponse>>(E.BASE, { params: { page, size } }); return data },
  getById: async (id: number): Promise<EpiResponse> => { const { data } = await apiClient.get<EpiResponse>(E.BY_ID(id)); return data },
  update: async (id: number, req: EpiUpdateRequest): Promise<EpiResponse> => { const { data } = await apiClient.put<EpiResponse>(E.BY_ID(id), req); return data },
  delete: async (id: number): Promise<void> => { await apiClient.delete(E.BY_ID(id)) },
  getExpires: async (): Promise<EpiResponse[]> => { const { data } = await apiClient.get<EpiResponse[]>(E.EXPIRES); return data },
  getStockBas: async (): Promise<EpiResponse[]> => { const { data } = await apiClient.get<EpiResponse[]>(E.STOCK_BAS); return data },
  getSummary: async (): Promise<EpiSummaryResponse> => { const { data } = await apiClient.get<EpiSummaryResponse>(E.SUMMARY); return data },
}
