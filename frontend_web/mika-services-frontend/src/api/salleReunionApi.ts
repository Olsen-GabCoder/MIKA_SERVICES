import apiClient from './axios'
import { API_ENDPOINTS } from '@/constants/api'
import type { SalleReunion, JitsiConfig, JaaSToken, SalleParticipant } from '@/types/salleReunion'

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

  participantsJoin: async (): Promise<SalleParticipant> => {
    const response = await apiClient.post<SalleParticipant>(API_ENDPOINTS.SALLE_REUNION.PARTICIPANTS_JOIN)
    return response.data
  },

  participantsLeave: async (): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.SALLE_REUNION.PARTICIPANTS_LEAVE)
  },

  participantsHeartbeat: async (): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.SALLE_REUNION.PARTICIPANTS_HEARTBEAT)
  },

  getOnlineParticipants: async (): Promise<SalleParticipant[]> => {
    const response = await apiClient.get<SalleParticipant[]>(API_ENDPOINTS.SALLE_REUNION.PARTICIPANTS_ONLINE)
    return response.data
  },

  countParticipantsSince: async (since: string): Promise<number> => {
    const response = await apiClient.get<{ count: number }>(API_ENDPOINTS.SALLE_REUNION.PARTICIPANTS_COUNT_SINCE, { params: { since } })
    return response.data.count
  },
}
