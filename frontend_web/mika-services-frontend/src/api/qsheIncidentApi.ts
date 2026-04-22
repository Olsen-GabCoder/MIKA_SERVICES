import apiClient from './axios'
import { API_ENDPOINTS } from '@/constants/api'
import type {
  IncidentResponse,
  IncidentCreateRequest,
  IncidentUpdateRequest,
  IncidentSummaryResponse,
  PaginatedResponse,
  StatutIncident,
} from '@/types/qsheIncident'

const E = API_ENDPOINTS.QSHE_INCIDENTS

export const qsheIncidentApi = {
  create: async (request: IncidentCreateRequest): Promise<IncidentResponse> => {
    const { data } = await apiClient.post<IncidentResponse>(E.BASE, request)
    return data
  },

  getByProjet: async (projetId: number, page = 0, size = 20): Promise<PaginatedResponse<IncidentResponse>> => {
    const { data } = await apiClient.get<PaginatedResponse<IncidentResponse>>(E.BY_PROJET(projetId), {
      params: { page, size, sort: 'dateIncident,desc' },
    })
    return data
  },

  getById: async (id: number): Promise<IncidentResponse> => {
    const { data } = await apiClient.get<IncidentResponse>(E.BY_ID(id))
    return data
  },

  update: async (id: number, request: IncidentUpdateRequest): Promise<IncidentResponse> => {
    const { data } = await apiClient.put<IncidentResponse>(E.BY_ID(id), request)
    return data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(E.BY_ID(id))
  },

  changeStatut: async (id: number, statut: StatutIncident): Promise<IncidentResponse> => {
    const { data } = await apiClient.patch<IncidentResponse>(E.STATUT(id), null, {
      params: { statut },
    })
    return data
  },

  getSummary: async (projetId: number): Promise<IncidentSummaryResponse> => {
    const { data } = await apiClient.get<IncidentSummaryResponse>(E.SUMMARY(projetId))
    return data
  },

  getCnssEnRetard: async (): Promise<IncidentResponse[]> => {
    const { data } = await apiClient.get<IncidentResponse[]>(E.CNSS_EN_RETARD)
    return data
  },
}
