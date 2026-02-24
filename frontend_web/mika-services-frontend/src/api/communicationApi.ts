import api from './axios'
import { API_ENDPOINTS } from '../constants/api'
import type { Message, MessageCreateRequest, Notification, PaginatedResponse } from '../types/communication'
import { USE_MOCK, USE_MOCK_FALLBACK } from '@/config/mock'
import { i18n } from '@/i18n'
import {
  getMockMessagesRecus,
  getMockMessagesEnvoyes,
  getMockMessagesNonLusCount,
  getMockNotifications,
  getMockNotificationsNonLuesCount,
} from '@/mock/data/communication'

export const messageApi = {
  envoyer: async (expediteurId: number, request: MessageCreateRequest): Promise<Message> => {
    const response = await api.post(API_ENDPOINTS.MESSAGES.ENVOYER(expediteurId), request)
    return response.data
  },
  getRecus: async (userId: number, page = 0, size = 20): Promise<PaginatedResponse<Message>> => {
    if (USE_MOCK) return Promise.resolve(getMockMessagesRecus(userId, page, size))
    try {
      const response = await api.get(API_ENDPOINTS.MESSAGES.RECUS(userId), { params: { page, size } })
      return response.data
    } catch {
      if (USE_MOCK_FALLBACK) return Promise.resolve(getMockMessagesRecus(userId, page, size))
      throw new Error(i18n.t('common:communication.errorLoadMessagesReceived'))
    }
  },
  getEnvoyes: async (userId: number, page = 0, size = 20): Promise<PaginatedResponse<Message>> => {
    if (USE_MOCK) return Promise.resolve(getMockMessagesEnvoyes(userId, page, size))
    try {
      const response = await api.get(API_ENDPOINTS.MESSAGES.ENVOYES(userId), { params: { page, size } })
      return response.data
    } catch {
      if (USE_MOCK_FALLBACK) return Promise.resolve(getMockMessagesEnvoyes(userId, page, size))
      throw new Error(i18n.t('common:communication.errorLoadMessagesSent'))
    }
  },
  getConversation: async (userId1: number, userId2: number, page = 0, size = 50): Promise<PaginatedResponse<Message>> => {
    const response = await api.get(API_ENDPOINTS.MESSAGES.CONVERSATION(userId1, userId2), { params: { page, size } })
    return response.data
  },
  marquerLu: async (messageId: number, userId: number): Promise<Message> => {
    const response = await api.put(API_ENDPOINTS.MESSAGES.MARQUER_LU(messageId, userId))
    return response.data
  },
  countNonLus: async (userId: number): Promise<number> => {
    if (USE_MOCK) return Promise.resolve(getMockMessagesNonLusCount(userId))
    try {
      const response = await api.get(API_ENDPOINTS.MESSAGES.NON_LUS(userId))
      return response.data.count
    } catch {
      if (USE_MOCK_FALLBACK) return Promise.resolve(getMockMessagesNonLusCount(userId))
      return 0
    }
  },
  delete: async (messageId: number): Promise<void> => {
    await api.delete(API_ENDPOINTS.MESSAGES.DELETE(messageId))
  },
}

export const notificationApi = {
  getMesNotifications: async (userId: number, page = 0, size = 30): Promise<PaginatedResponse<Notification>> => {
    if (USE_MOCK) return Promise.resolve(getMockNotifications(userId, page, size))
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.MES_NOTIFICATIONS(userId), { params: { page, size } })
      return response.data
    } catch {
      if (USE_MOCK_FALLBACK) return Promise.resolve(getMockNotifications(userId, page, size))
      throw new Error(i18n.t('common:communication.errorLoadNotifications'))
    }
  },
  getNonLues: async (userId: number): Promise<Notification[]> => {
    const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.NON_LUES(userId))
    return response.data
  },
  marquerLue: async (notifId: number, userId: number): Promise<Notification> => {
    const response = await api.put(API_ENDPOINTS.NOTIFICATIONS.MARQUER_LUE(notifId, userId))
    return response.data
  },
  marquerToutesLues: async (userId: number): Promise<number> => {
    const response = await api.put(API_ENDPOINTS.NOTIFICATIONS.TOUT_LU(userId))
    return response.data.count
  },
  countNonLues: async (userId: number): Promise<number> => {
    if (USE_MOCK) return Promise.resolve(getMockNotificationsNonLuesCount(userId))
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.COUNT(userId))
      return response.data.count
    } catch {
      if (USE_MOCK_FALLBACK) return Promise.resolve(getMockNotificationsNonLuesCount(userId))
      return 0
    }
  },
  delete: async (notifId: number): Promise<void> => {
    await api.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE(notifId))
  },
}
