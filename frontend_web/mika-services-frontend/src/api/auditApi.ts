import apiClient from './axios'

export interface AuditLogEntry {
  id: number
  userId: number | null
  userName: string | null
  action: string
  module: string
  details: string | null
  ipAddress: string | null
  createdAt: string
}

export interface UserActivitySummary {
  userId: number
  userName: string
  firstLogin: string | null
  lastLogin: string | null
  lastPasswordChange: string | null
  totalLogins: number
  totalPageViews: number
  totalActions: number
  actionBreakdown: Record<string, number>
}

export interface AuditFilters {
  userId?: number
  module?: string
  action?: string
  startDate?: string
  endDate?: string
  page?: number
  size?: number
}

export interface PaginatedAuditLogs {
  content: AuditLogEntry[]
  totalElements: number
  totalPages: number
  number: number
}

export const auditApi = {
  trackPageView: async (page: string): Promise<void> => {
    await apiClient.post('/audit/page-view', { page })
  },

  getGlobalLogs: async (filters: AuditFilters = {}): Promise<PaginatedAuditLogs> => {
    const params: Record<string, string | number> = {}
    if (filters.userId) params.userId = filters.userId
    if (filters.module) params.module = filters.module
    if (filters.action) params.action = filters.action
    if (filters.startDate) params.startDate = filters.startDate
    if (filters.endDate) params.endDate = filters.endDate
    params.page = filters.page ?? 0
    params.size = filters.size ?? 30
    const response = await apiClient.get<PaginatedAuditLogs>('/audit/global', { params })
    return response.data
  },

  getUserActivitySummary: async (userId: number): Promise<UserActivitySummary> => {
    const response = await apiClient.get<UserActivitySummary>(`/audit/user/${userId}/summary`)
    return response.data
  },

  getFilterOptions: async (): Promise<{ modules: string[]; actions: string[] }> => {
    const response = await apiClient.get<{ modules: string[]; actions: string[] }>('/audit/filters')
    return response.data
  },
}
