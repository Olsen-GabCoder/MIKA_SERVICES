import apiClient from './axios'
import { API_ENDPOINTS } from '@/constants/api'
import type {
  ReunionHebdo,
  ReunionHebdoSummary,
  ReunionHebdoCreateRequest,
  ReunionHebdoUpdateRequest,
  PointProjetPV,
  PointProjetPVRequest,
  PageResponse,
} from '@/types/reunionHebdo'

export const reunionHebdoApi = {
  create: async (data: ReunionHebdoCreateRequest): Promise<ReunionHebdo> => {
    const response = await apiClient.post<ReunionHebdo>(API_ENDPOINTS.REUNIONS_HEBDO.BASE, data)
    return response.data
  },

  findAll: async (page = 0, size = 20): Promise<PageResponse<ReunionHebdoSummary>> => {
    const response = await apiClient.get<PageResponse<ReunionHebdoSummary>>(API_ENDPOINTS.REUNIONS_HEBDO.BASE, {
      params: { page, size },
    })
    return response.data
  },

  findById: async (id: number): Promise<ReunionHebdo> => {
    const response = await apiClient.get<ReunionHebdo>(API_ENDPOINTS.REUNIONS_HEBDO.BY_ID(id))
    return response.data
  },

  findByStatut: async (statut: string): Promise<ReunionHebdoSummary[]> => {
    const response = await apiClient.get<ReunionHebdoSummary[]>(API_ENDPOINTS.REUNIONS_HEBDO.BY_STATUT(statut))
    return response.data
  },

  update: async (id: number, data: ReunionHebdoUpdateRequest): Promise<ReunionHebdo> => {
    const response = await apiClient.put<ReunionHebdo>(API_ENDPOINTS.REUNIONS_HEBDO.BY_ID(id), data)
    return response.data
  },

  savePointProjet: async (reunionId: number, data: PointProjetPVRequest): Promise<PointProjetPV> => {
    const response = await apiClient.post<PointProjetPV>(
      API_ENDPOINTS.REUNIONS_HEBDO.POINTS_PROJET(reunionId),
      data
    )
    return response.data
  },

  savePointsProjet: async (reunionId: number, points: PointProjetPVRequest[]): Promise<ReunionHebdo> => {
    const response = await apiClient.put<ReunionHebdo>(
      API_ENDPOINTS.REUNIONS_HEBDO.POINTS_PROJET(reunionId),
      points
    )
    return response.data
  },

  deletePointProjet: async (reunionId: number, pointId: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.REUNIONS_HEBDO.POINT_PROJET(reunionId, pointId))
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.REUNIONS_HEBDO.BY_ID(id))
  },
}
