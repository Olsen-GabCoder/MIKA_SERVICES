import apiClient from './axios'
import type { Depense, BudgetSummary, DepenseCreateRequest, PageResponse, SituationTravaux, SituationCreateRequest } from '@/types/budget'
import { USE_MOCK, USE_MOCK_FALLBACK } from '@/config/mock'
import { getMockBudgetSummary } from '@/mock/data/budget'

export const budgetApi = {
  createDepense: async (data: DepenseCreateRequest): Promise<Depense> => {
    const response = await apiClient.post<Depense>('/budget/depenses', data)
    return response.data
  },
  findDepensesByProjet: async (projetId: number, page = 0, size = 20): Promise<PageResponse<Depense>> => {
    const response = await apiClient.get<PageResponse<Depense>>(`/budget/depenses/projet/${projetId}`, { params: { page, size } })
    return response.data
  },
  findDepenseById: async (id: number): Promise<Depense> => {
    const response = await apiClient.get<Depense>(`/budget/depenses/${id}`)
    return response.data
  },
  updateDepense: async (id: number, data: Partial<Depense>): Promise<Depense> => {
    const response = await apiClient.put<Depense>(`/budget/depenses/${id}`, data)
    return response.data
  },
  deleteDepense: async (id: number): Promise<void> => {
    await apiClient.delete(`/budget/depenses/${id}`)
  },
  getBudgetSummary: async (projetId: number): Promise<BudgetSummary> => {
    if (USE_MOCK) return Promise.resolve(getMockBudgetSummary(projetId))
    try {
      const response = await apiClient.get<BudgetSummary>(`/budget/summary/projet/${projetId}`)
      return response.data
    } catch {
      if (USE_MOCK_FALLBACK) return Promise.resolve(getMockBudgetSummary(projetId))
      throw new Error('Erreur chargement budget')
    }
  },

  // Situations de travaux
  createSituation: async (data: SituationCreateRequest): Promise<SituationTravaux> => {
    const response = await apiClient.post<SituationTravaux>('/budget/situations', data)
    return response.data
  },
  findSituationsByProjet: async (projetId: number, page = 0, size = 20): Promise<PageResponse<SituationTravaux>> => {
    const response = await apiClient.get<PageResponse<SituationTravaux>>(`/budget/situations/projet/${projetId}`, { params: { page, size } })
    return response.data
  },
  findSituationById: async (id: number): Promise<SituationTravaux> => {
    const response = await apiClient.get<SituationTravaux>(`/budget/situations/${id}`)
    return response.data
  },
  updateSituation: async (id: number, data: Partial<SituationTravaux>): Promise<SituationTravaux> => {
    const response = await apiClient.put<SituationTravaux>(`/budget/situations/${id}`, data)
    return response.data
  },
  deleteSituation: async (id: number): Promise<void> => {
    await apiClient.delete(`/budget/situations/${id}`)
  },
}
