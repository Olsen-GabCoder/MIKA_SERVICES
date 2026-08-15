import api from './axios'
import { API_ENDPOINTS } from '../constants/api'
import type {
  Tache, TacheCreateRequest, TacheUpdateRequest, PaginatedResponse,
  DependanceResponse, DependanceCreateRequest, GanttData, ProjetPlanningStats
} from '../types/planning'
import { USE_MOCK, USE_MOCK_FALLBACK } from '@/config/mock'
import { getMockTachesByProjet, getMockTachesEnRetard } from '@/mock/data/planning'

export const planningApi = {
  createTache: async (request: TacheCreateRequest): Promise<Tache> => {
    const response = await api.post(API_ENDPOINTS.PLANNING.TACHES, request)
    return response.data
  },

  getTachesByProjet: async (projetId: number, page = 0, size = 20): Promise<PaginatedResponse<Tache>> => {
    if (USE_MOCK) return Promise.resolve(getMockTachesByProjet(projetId, page, size))
    try {
      const response = await api.get(API_ENDPOINTS.PLANNING.BY_PROJET(projetId), { params: { page, size } })
      return response.data
    } catch {
      if (USE_MOCK_FALLBACK) return Promise.resolve(getMockTachesByProjet(projetId, page, size))
      throw new Error('Erreur chargement tâches')
    }
  },

  getAllTachesByProjet: async (projetId: number): Promise<Tache[]> => {
    const response = await api.get(API_ENDPOINTS.PLANNING.ALL_BY_PROJET(projetId))
    return response.data
  },

  getTacheById: async (id: number): Promise<Tache> => {
    const response = await api.get(API_ENDPOINTS.PLANNING.TACHE_BY_ID(id))
    return response.data
  },

  getMesTaches: async (userId: number): Promise<Tache[]> => {
    const response = await api.get(API_ENDPOINTS.PLANNING.MES_TACHES(userId))
    return response.data
  },

  getTachesEnRetard: async (): Promise<Tache[]> => {
    if (USE_MOCK) return Promise.resolve(getMockTachesEnRetard())
    try {
      const response = await api.get(API_ENDPOINTS.PLANNING.EN_RETARD)
      return response.data
    } catch {
      if (USE_MOCK_FALLBACK) return Promise.resolve(getMockTachesEnRetard())
      throw new Error('Erreur chargement tâches en retard')
    }
  },

  updateTache: async (id: number, request: TacheUpdateRequest): Promise<Tache> => {
    const response = await api.put(API_ENDPOINTS.PLANNING.TACHE_BY_ID(id), request)
    return response.data
  },

  deleteTache: async (id: number): Promise<void> => {
    await api.delete(API_ENDPOINTS.PLANNING.TACHE_BY_ID(id))
  },

  getStatsMesProjets: async (): Promise<ProjetPlanningStats[]> => {
    const response = await api.get(API_ENDPOINTS.PLANNING.STATS_MES_PROJETS)
    return response.data
  },

  // Dependances
  createDependance: async (request: DependanceCreateRequest): Promise<DependanceResponse> => {
    const response = await api.post(API_ENDPOINTS.PLANNING.DEPENDANCES, request)
    return response.data
  },

  getDependancesByProjet: async (projetId: number): Promise<DependanceResponse[]> => {
    const response = await api.get(API_ENDPOINTS.PLANNING.DEPENDANCES_BY_PROJET(projetId))
    return response.data
  },

  getDependancesByTache: async (tacheId: number): Promise<DependanceResponse[]> => {
    const response = await api.get(API_ENDPOINTS.PLANNING.DEPENDANCES_BY_TACHE(tacheId))
    return response.data
  },

  deleteDependance: async (id: number): Promise<void> => {
    await api.delete(API_ENDPOINTS.PLANNING.DEPENDANCE_BY_ID(id))
  },

  // Gantt & Chemin critique
  getGanttData: async (projetId: number): Promise<GanttData> => {
    const response = await api.get(API_ENDPOINTS.PLANNING.GANTT(projetId))
    return response.data
  },

  getCheminCritique: async (projetId: number): Promise<Tache[]> => {
    const response = await api.get(API_ENDPOINTS.PLANNING.CHEMIN_CRITIQUE(projetId))
    return response.data
  },
}
