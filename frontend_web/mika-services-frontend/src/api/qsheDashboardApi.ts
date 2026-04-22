import apiClient from './axios'
import { API_ENDPOINTS } from '@/constants/api'
import type { QsheDashboardResponse } from '@/types/qsheDashboard'

export const qsheDashboardApi = {
  getDashboard: async (projetId: number): Promise<QsheDashboardResponse> => {
    const { data } = await apiClient.get<QsheDashboardResponse>(
      API_ENDPOINTS.QSHE_DASHBOARD.BY_PROJET(projetId)
    )
    return data
  },
}
