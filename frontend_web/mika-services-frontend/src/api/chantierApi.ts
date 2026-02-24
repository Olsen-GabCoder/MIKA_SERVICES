import apiClient from './axios'
import type {
  Equipe,
  EquipeCreateRequest,
  EquipeUpdateRequest,
  MembreEquipeResponse,
  MembreEquipeRequest,
  AffectationChantierResponse,
  AffectationChantierRequest,
  PageResponse,
} from '@/types/chantier'
import { USE_MOCK, USE_MOCK_FALLBACK } from '@/config/mock'
import { getMockEquipesPage } from '@/mock/data/equipes'

export const equipeApi = {
  create: async (data: EquipeCreateRequest): Promise<Equipe> => {
    const response = await apiClient.post<Equipe>('/equipes', data)
    return response.data
  },
  findAll: async (page = 0, size = 20): Promise<PageResponse<Equipe>> => {
    if (USE_MOCK) return Promise.resolve(getMockEquipesPage(page, size))
    try {
      const response = await apiClient.get<PageResponse<Equipe>>('/equipes', { params: { page, size } })
      return response.data
    } catch {
      if (USE_MOCK_FALLBACK) return Promise.resolve(getMockEquipesPage(page, size))
      throw new Error('Erreur chargement équipes')
    }
  },
  findById: async (id: number): Promise<Equipe> => {
    const response = await apiClient.get<Equipe>(`/equipes/${id}`)
    return response.data
  },
  update: async (id: number, data: EquipeUpdateRequest): Promise<Equipe> => {
    const response = await apiClient.put<Equipe>(`/equipes/${id}`, data)
    return response.data
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/equipes/${id}`)
  },
  getMembres: async (equipeId: number): Promise<MembreEquipeResponse[]> => {
    const response = await apiClient.get<MembreEquipeResponse[]>(`/equipes/${equipeId}/membres`)
    return response.data
  },
  ajouterMembre: async (equipeId: number, data: Omit<MembreEquipeRequest, 'equipeId'>): Promise<MembreEquipeResponse> => {
    const response = await apiClient.post<MembreEquipeResponse>(`/equipes/${equipeId}/membres`, { ...data, equipeId })
    return response.data
  },
  affecterEquipe: async (data: AffectationChantierRequest): Promise<AffectationChantierResponse> => {
    const response = await apiClient.post<AffectationChantierResponse>('/equipes/affectations', data)
    return response.data
  },
  getAffectationsByProjet: async (
    projetId: number,
    page = 0,
    size = 20
  ): Promise<PageResponse<AffectationChantierResponse>> => {
    const response = await apiClient.get<PageResponse<AffectationChantierResponse>>(
      `/equipes/affectations/projet/${projetId}`,
      { params: { page, size } }
    )
    return response.data
  },
}
