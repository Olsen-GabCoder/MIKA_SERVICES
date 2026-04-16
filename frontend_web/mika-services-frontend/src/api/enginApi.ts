import apiClient from './axios'
import type { Engin, EnginSummary, EnginCreateRequest, MouvementEnginSummary, AffectationEnginResponse, PageResponse } from '@/types/materiel'
import { USE_MOCK, USE_MOCK_FALLBACK } from '@/config/mock'
import { getMockEnginsPage, getMockEnginsSearchPage } from '@/mock/data/engins'

export const enginApi = {
  create: async (data: EnginCreateRequest): Promise<Engin> => {
    const response = await apiClient.post<Engin>('/engins', data)
    return response.data
  },
  findAll: async (page = 0, size = 20, statut?: string, type?: string): Promise<PageResponse<EnginSummary>> => {
    if (USE_MOCK) return Promise.resolve(getMockEnginsPage(page, size))
    try {
      const params: Record<string, unknown> = { page, size }
      if (statut) params.statut = statut
      if (type) params.type = type
      const response = await apiClient.get<PageResponse<EnginSummary>>('/engins', { params })
      return response.data
    } catch {
      if (USE_MOCK_FALLBACK) return Promise.resolve(getMockEnginsPage(page, size))
      throw new Error('Erreur chargement engins')
    }
  },
  findById: async (id: number): Promise<Engin> => {
    const response = await apiClient.get<Engin>(`/engins/${id}`)
    return response.data
  },
  search: async (q: string, page = 0, size = 20): Promise<PageResponse<EnginSummary>> => {
    if (USE_MOCK) return Promise.resolve(getMockEnginsSearchPage(q, page, size))
    try {
      const response = await apiClient.get<PageResponse<EnginSummary>>('/engins/search', { params: { q, page, size } })
      return response.data
    } catch {
      if (USE_MOCK_FALLBACK) return Promise.resolve(getMockEnginsSearchPage(q, page, size))
      throw new Error('Erreur recherche engins')
    }
  },
  findDisponibles: async (): Promise<EnginSummary[]> => {
    const response = await apiClient.get<EnginSummary[]>('/engins/disponibles')
    return response.data
  },
  update: async (id: number, data: Partial<Engin>): Promise<Engin> => {
    const response = await apiClient.put<Engin>(`/engins/${id}`, data)
    return response.data
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/engins/${id}`)
  },
  getMouvements: async (id: number): Promise<MouvementEnginSummary[]> => {
    const response = await apiClient.get<MouvementEnginSummary[]>(`/engins/${id}/mouvements`)
    return response.data
  },
  getAffectationsByProjet: async (projetId: number, page = 0, size = 200): Promise<PageResponse<AffectationEnginResponse>> => {
    const response = await apiClient.get<PageResponse<AffectationEnginResponse>>(`/engins/affectations/projet/${projetId}`, { params: { page, size } })
    return response.data
  },
  getAffectationsByEngin: async (enginId: number): Promise<AffectationEnginResponse[]> => {
    const response = await apiClient.get<AffectationEnginResponse[]>(`/engins/${enginId}/affectations`)
    return response.data
  },
}
