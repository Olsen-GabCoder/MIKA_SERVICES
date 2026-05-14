import apiClient from './axios'
import { API_ENDPOINTS } from '@/constants/api'

const E = API_ENDPOINTS.QSHE_ACTIONS

export const qsheActionApi = {
  getEnRetard: async (): Promise<unknown[]> => {
    const { data } = await apiClient.get<unknown[]>(E.EN_RETARD)
    return data
  },
}
