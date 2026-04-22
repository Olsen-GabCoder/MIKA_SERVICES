import apiClient from './axios'
import { API_ENDPOINTS } from '@/constants/api'
import type { CertificationResponse, CertificationCreateRequest, CertificationUpdateRequest, CertificationSummaryResponse, PaginatedResponse } from '@/types/qsheCertification'

const E = API_ENDPOINTS.QSHE_CERTIFICATIONS
export const qsheCertificationApi = {
  create: async (req: CertificationCreateRequest): Promise<CertificationResponse> => { const { data } = await apiClient.post<CertificationResponse>(E.BASE, req); return data },
  getByUser: async (userId: number, page = 0, size = 50): Promise<PaginatedResponse<CertificationResponse>> => { const { data } = await apiClient.get<PaginatedResponse<CertificationResponse>>(E.BY_USER(userId), { params: { page, size } }); return data },
  getById: async (id: number): Promise<CertificationResponse> => { const { data } = await apiClient.get<CertificationResponse>(E.BY_ID(id)); return data },
  update: async (id: number, req: CertificationUpdateRequest): Promise<CertificationResponse> => { const { data } = await apiClient.put<CertificationResponse>(E.BY_ID(id), req); return data },
  delete: async (id: number): Promise<void> => { await apiClient.delete(E.BY_ID(id)) },
  getExpirant: async (jours = 60): Promise<CertificationResponse[]> => { const { data } = await apiClient.get<CertificationResponse[]>(E.EXPIRANT, { params: { jours } }); return data },
  getExpirees: async (): Promise<CertificationResponse[]> => { const { data } = await apiClient.get<CertificationResponse[]>(E.EXPIREES); return data },
  getSummary: async (): Promise<CertificationSummaryResponse> => { const { data } = await apiClient.get<CertificationSummaryResponse>(E.SUMMARY); return data },
}
