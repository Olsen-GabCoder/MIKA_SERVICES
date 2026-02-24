import apiClient from './axios'
import type { Engin, EnginSummary, EnginCreateRequest, PageResponse } from '@/types/materiel'
import { USE_MOCK, USE_MOCK_FALLBACK } from '@/config/mock'
import { getMockEnginsPage } from '@/mock/data/engins'

export const enginApi = {
  create: async (data: EnginCreateRequest): Promise<Engin> => {
    const response = await apiClient.post<Engin>('/engins', data)
    return response.data
  },
  findAll: async (page = 0, size = 20): Promise<PageResponse<EnginSummary>> => {
    if (USE_MOCK) return Promise.resolve(getMockEnginsPage(page, size))
    try {
      const response = await apiClient.get<PageResponse<EnginSummary>>('/engins', { params: { page, size } })
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
    const response = await apiClient.get<PageResponse<EnginSummary>>('/engins/search', { params: { q, page, size } })
    return response.data
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
}
