import apiClient from './axios'
import type { MikaAssistantRequest, MikaAssistantResponse } from '@/types/mikaAssistant'

export const mikaAssistantApi = {
  ask: async (request: MikaAssistantRequest): Promise<MikaAssistantResponse> => {
    const response = await apiClient.post<MikaAssistantResponse>(
      '/assistant/ask',
      request,
      { timeout: 60000 }
    )
    return response.data
  },
}
