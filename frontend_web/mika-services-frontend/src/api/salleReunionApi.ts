import apiClient from './axios'
import { API_ENDPOINTS } from '@/constants/api'
import type { SalleReunion, JitsiConfig, JaaSToken } from '@/types/salleReunion'

export const salleReunionApi = {
  getSalle: async (): Promise<SalleReunion> => {
    const response = await apiClient.get<SalleReunion>(API_ENDPOINTS.SALLE_REUNION.BASE)
    return response.data
  },

  getJitsiConfig: async (): Promise<JitsiConfig> => {
    const response = await apiClient.get<JitsiConfig>(API_ENDPOINTS.SALLE_REUNION.JITSI_CONFIG)
    return response.data
  },

  ouvrir: async (): Promise<SalleReunion> => {
    const response = await apiClient.post<SalleReunion>(API_ENDPOINTS.SALLE_REUNION.OUVRIR)
    return response.data
  },

  fermer: async (): Promise<SalleReunion> => {
    const response = await apiClient.post<SalleReunion>(API_ENDPOINTS.SALLE_REUNION.FERMER)
    return response.data
  },

  getJaaSToken: async (): Promise<JaaSToken> => {
    const response = await apiClient.get<JaaSToken>(API_ENDPOINTS.SALLE_REUNION.JAAS_TOKEN)
    return response.data
  },
}
