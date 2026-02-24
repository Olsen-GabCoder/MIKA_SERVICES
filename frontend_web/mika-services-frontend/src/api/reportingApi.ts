import api from './axios'
import { API_ENDPOINTS } from '../constants/api'
import type { GlobalDashboard, ProjetReport } from '../types/reporting'
import { USE_MOCK, USE_MOCK_FALLBACK } from '@/config/mock'
import { mockGlobalDashboard, getMockProjetReport } from '@/mock/data/reporting'

export const reportingApi = {
  getGlobalDashboard: async (): Promise<GlobalDashboard> => {
    if (USE_MOCK) return Promise.resolve(mockGlobalDashboard)
    try {
      const response = await api.get(API_ENDPOINTS.REPORTING.DASHBOARD)
      return response.data
    } catch {
      if (USE_MOCK_FALLBACK) return Promise.resolve(mockGlobalDashboard)
      throw new Error('Erreur chargement dashboard')
    }
  },
  getProjetReport: async (projetId: number): Promise<ProjetReport> => {
    if (USE_MOCK) {
      const report = getMockProjetReport(projetId)
      if (report) return Promise.resolve(report)
    }
    try {
      const response = await api.get(API_ENDPOINTS.REPORTING.PROJET_REPORT(projetId))
      return response.data
    } catch {
      if (USE_MOCK_FALLBACK) {
        const report = getMockProjetReport(projetId)
        if (report) return Promise.resolve(report)
      }
      throw new Error('Erreur chargement rapport projet')
    }
  },
}
