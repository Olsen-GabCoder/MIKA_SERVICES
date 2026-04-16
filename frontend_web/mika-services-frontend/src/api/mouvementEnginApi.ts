import apiClient from './axios'
import type {
  MouvementEnginSummary,
  MouvementEnginCreateRequest,
  MouvementEnginActionRequest,
  StatutMouvementEngin,
  PageResponse,
} from '@/types/materiel'

export const mouvementEnginApi = {
  findAll: async (params: {
    page?: number
    size?: number
    statut?: StatutMouvementEngin
    enginId?: number
    projetId?: number
    dateFrom?: string
    dateTo?: string
  } = {}): Promise<PageResponse<MouvementEnginSummary>> => {
    const { page = 0, size = 20, ...filters } = params
    const query: Record<string, unknown> = { page, size }
    if (filters.statut) query.statut = filters.statut
    if (filters.enginId) query.enginId = filters.enginId
    if (filters.projetId) query.projetId = filters.projetId
    if (filters.dateFrom) query.dateFrom = filters.dateFrom
    if (filters.dateTo) query.dateTo = filters.dateTo
    const response = await apiClient.get<PageResponse<MouvementEnginSummary>>('/mouvements', { params: query })
    return response.data
  },

  findById: async (id: number): Promise<MouvementEnginSummary> => {
    const response = await apiClient.get<MouvementEnginSummary>(`/mouvements/${id}`)
    return response.data
  },

  create: async (data: MouvementEnginCreateRequest): Promise<MouvementEnginSummary> => {
    const response = await apiClient.post<MouvementEnginSummary>('/mouvements', data)
    return response.data
  },

  confirmerDepart: async (id: number, body?: MouvementEnginActionRequest): Promise<MouvementEnginSummary> => {
    const response = await apiClient.patch<MouvementEnginSummary>(`/mouvements/${id}/confirmer-depart`, body ?? {})
    return response.data
  },

  confirmerReception: async (id: number, body?: MouvementEnginActionRequest): Promise<MouvementEnginSummary> => {
    const response = await apiClient.patch<MouvementEnginSummary>(`/mouvements/${id}/confirmer-reception`, body ?? {})
    return response.data
  },

  annuler: async (id: number, body?: MouvementEnginActionRequest): Promise<MouvementEnginSummary> => {
    const response = await apiClient.patch<MouvementEnginSummary>(`/mouvements/${id}/annuler`, body ?? {})
    return response.data
  },
}
