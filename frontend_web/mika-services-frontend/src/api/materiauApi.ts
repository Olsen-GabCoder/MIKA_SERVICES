import apiClient from './axios'
import type { Materiau, MateriauSummary, MateriauCreateRequest, PageResponse } from '@/types/materiel'
import { USE_MOCK, USE_MOCK_FALLBACK } from '@/config/mock'
import { getMockMateriauxPage, getMockMateriauxSearchPage } from '@/mock/data/materiaux'

export const materiauApi = {
  create: async (data: MateriauCreateRequest): Promise<Materiau> => {
    const response = await apiClient.post<Materiau>('/materiaux', data)
    return response.data
  },
  findAll: async (page = 0, size = 20): Promise<PageResponse<MateriauSummary>> => {
    if (USE_MOCK) return Promise.resolve(getMockMateriauxPage(page, size))
    try {
      const response = await apiClient.get<PageResponse<MateriauSummary>>('/materiaux', { params: { page, size } })
      return response.data
    } catch {
      if (USE_MOCK_FALLBACK) return Promise.resolve(getMockMateriauxPage(page, size))
      throw new Error('Erreur chargement matériaux')
    }
  },
  findById: async (id: number): Promise<Materiau> => {
    const response = await apiClient.get<Materiau>(`/materiaux/${id}`)
    return response.data
  },
  search: async (q: string, page = 0, size = 20): Promise<PageResponse<MateriauSummary>> => {
    if (USE_MOCK) return Promise.resolve(getMockMateriauxSearchPage(q, page, size))
    try {
      const response = await apiClient.get<PageResponse<MateriauSummary>>('/materiaux/search', { params: { q, page, size } })
      return response.data
    } catch {
      if (USE_MOCK_FALLBACK) return Promise.resolve(getMockMateriauxSearchPage(q, page, size))
      throw new Error('Erreur recherche matériaux')
    }
  },
  findStockBas: async (): Promise<MateriauSummary[]> => {
    const response = await apiClient.get<MateriauSummary[]>('/materiaux/stock-bas')
    return response.data
  },
  update: async (id: number, data: Partial<Materiau>): Promise<Materiau> => {
    const response = await apiClient.put<Materiau>(`/materiaux/${id}`, data)
    return response.data
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/materiaux/${id}`)
  },
}
