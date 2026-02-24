import api from './axios'
import { API_ENDPOINTS } from '../constants/api'
import type {
  Incident, IncidentCreateRequest, IncidentUpdateRequest,
  Risque, RisqueCreateRequest, RisqueUpdateRequest,
  SecuriteSummary, PaginatedResponse,
} from '../types/securite'
import { USE_MOCK, USE_MOCK_FALLBACK } from '@/config/mock'
import { getMockIncidentsByProjet, getMockRisquesByProjet, getMockSecuriteSummary } from '@/mock/data/securite'

export const securiteApi = {
  // Incidents
  createIncident: async (request: IncidentCreateRequest): Promise<Incident> => {
    const response = await api.post(API_ENDPOINTS.SECURITE.INCIDENTS, request)
    return response.data
  },
  getIncidentsByProjet: async (projetId: number, page = 0, size = 20): Promise<PaginatedResponse<Incident>> => {
    if (USE_MOCK) return Promise.resolve(getMockIncidentsByProjet(projetId, page, size))
    try {
      const response = await api.get(API_ENDPOINTS.SECURITE.INCIDENTS_BY_PROJET(projetId), { params: { page, size } })
      return response.data
    } catch {
      if (USE_MOCK_FALLBACK) return Promise.resolve(getMockIncidentsByProjet(projetId, page, size))
      throw new Error('Erreur chargement incidents')
    }
  },
  getIncidentById: async (id: number): Promise<Incident> => {
    const response = await api.get(API_ENDPOINTS.SECURITE.INCIDENT_BY_ID(id))
    return response.data
  },
  updateIncident: async (id: number, request: IncidentUpdateRequest): Promise<Incident> => {
    const response = await api.put(API_ENDPOINTS.SECURITE.INCIDENT_BY_ID(id), request)
    return response.data
  },
  deleteIncident: async (id: number): Promise<void> => {
    await api.delete(API_ENDPOINTS.SECURITE.INCIDENT_BY_ID(id))
  },

  // Risques
  createRisque: async (request: RisqueCreateRequest): Promise<Risque> => {
    const response = await api.post(API_ENDPOINTS.SECURITE.RISQUES, request)
    return response.data
  },
  getRisquesByProjet: async (projetId: number, page = 0, size = 20): Promise<PaginatedResponse<Risque>> => {
    if (USE_MOCK) return Promise.resolve(getMockRisquesByProjet(projetId, page, size))
    try {
      const response = await api.get(API_ENDPOINTS.SECURITE.RISQUES_BY_PROJET(projetId), { params: { page, size } })
      return response.data
    } catch {
      if (USE_MOCK_FALLBACK) return Promise.resolve(getMockRisquesByProjet(projetId, page, size))
      throw new Error('Erreur chargement risques')
    }
  },
  getRisqueById: async (id: number): Promise<Risque> => {
    const response = await api.get(API_ENDPOINTS.SECURITE.RISQUE_BY_ID(id))
    return response.data
  },
  updateRisque: async (id: number, request: RisqueUpdateRequest): Promise<Risque> => {
    const response = await api.put(API_ENDPOINTS.SECURITE.RISQUE_BY_ID(id), request)
    return response.data
  },
  deleteRisque: async (id: number): Promise<void> => {
    await api.delete(API_ENDPOINTS.SECURITE.RISQUE_BY_ID(id))
  },

  // Summary
  getSecuriteSummary: async (projetId: number): Promise<SecuriteSummary> => {
    if (USE_MOCK) return Promise.resolve(getMockSecuriteSummary(projetId))
    try {
      const response = await api.get(API_ENDPOINTS.SECURITE.SUMMARY(projetId))
      return response.data
    } catch {
      if (USE_MOCK_FALLBACK) return Promise.resolve(getMockSecuriteSummary(projetId))
      throw new Error('Erreur chargement résumé sécurité')
    }
  },
}
