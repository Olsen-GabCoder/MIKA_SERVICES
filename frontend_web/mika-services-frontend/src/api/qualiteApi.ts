import api from './axios'
import { API_ENDPOINTS } from '../constants/api'
import type {
  ControleQualite,
  ControleQualiteCreateRequest,
  ControleQualiteUpdateRequest,
  NonConformite,
  NonConformiteCreateRequest,
  NonConformiteUpdateRequest,
  QualiteSummary,
  PaginatedResponse,
} from '../types/qualite'
import { USE_MOCK, USE_MOCK_FALLBACK } from '@/config/mock'
import { getMockControlesByProjet, getMockQualiteSummary, getMockNcEnRetard } from '@/mock/data/qualite'

export const qualiteApi = {
  // Contrôles qualité
  createControle: async (request: ControleQualiteCreateRequest): Promise<ControleQualite> => {
    const response = await api.post(API_ENDPOINTS.QUALITE.CONTROLES, request)
    return response.data
  },
  getControlesByProjet: async (projetId: number, page = 0, size = 20): Promise<PaginatedResponse<ControleQualite>> => {
    if (USE_MOCK) return Promise.resolve(getMockControlesByProjet(projetId, page, size))
    try {
      const response = await api.get(API_ENDPOINTS.QUALITE.CONTROLES_BY_PROJET(projetId), { params: { page, size } })
      return response.data
    } catch {
      if (USE_MOCK_FALLBACK) return Promise.resolve(getMockControlesByProjet(projetId, page, size))
      throw new Error('Erreur chargement contrôles qualité')
    }
  },
  getControleById: async (id: number): Promise<ControleQualite> => {
    const response = await api.get(API_ENDPOINTS.QUALITE.CONTROLE_BY_ID(id))
    return response.data
  },
  updateControle: async (id: number, request: ControleQualiteUpdateRequest): Promise<ControleQualite> => {
    const response = await api.put(API_ENDPOINTS.QUALITE.CONTROLE_BY_ID(id), request)
    return response.data
  },
  deleteControle: async (id: number): Promise<void> => {
    await api.delete(API_ENDPOINTS.QUALITE.CONTROLE_BY_ID(id))
  },

  // Non-conformités
  createNonConformite: async (request: NonConformiteCreateRequest): Promise<NonConformite> => {
    const response = await api.post(API_ENDPOINTS.QUALITE.NON_CONFORMITES, request)
    return response.data
  },
  getNcByControle: async (controleId: number, page = 0, size = 20): Promise<PaginatedResponse<NonConformite>> => {
    const response = await api.get(API_ENDPOINTS.QUALITE.NC_BY_CONTROLE(controleId), { params: { page, size } })
    return response.data
  },
  getNcById: async (id: number): Promise<NonConformite> => {
    const response = await api.get(API_ENDPOINTS.QUALITE.NC_BY_ID(id))
    return response.data
  },
  getNcEnRetard: async (): Promise<NonConformite[]> => {
    if (USE_MOCK) return Promise.resolve(getMockNcEnRetard())
    try {
      const response = await api.get(API_ENDPOINTS.QUALITE.NC_EN_RETARD)
      return response.data
    } catch {
      if (USE_MOCK_FALLBACK) return Promise.resolve(getMockNcEnRetard())
      throw new Error('Erreur chargement NC en retard')
    }
  },
  updateNonConformite: async (id: number, request: NonConformiteUpdateRequest): Promise<NonConformite> => {
    const response = await api.put(API_ENDPOINTS.QUALITE.NC_BY_ID(id), request)
    return response.data
  },
  deleteNonConformite: async (id: number): Promise<void> => {
    await api.delete(API_ENDPOINTS.QUALITE.NC_BY_ID(id))
  },

  // Summary
  getQualiteSummary: async (projetId: number): Promise<QualiteSummary> => {
    if (USE_MOCK) return Promise.resolve(getMockQualiteSummary(projetId))
    try {
      const response = await api.get(API_ENDPOINTS.QUALITE.SUMMARY(projetId))
      return response.data
    } catch {
      if (USE_MOCK_FALLBACK) return Promise.resolve(getMockQualiteSummary(projetId))
      throw new Error('Erreur chargement résumé qualité')
    }
  },
}
