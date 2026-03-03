import apiClient from './axios'
import { API_ENDPOINTS } from '@/constants/api'
import type { User } from '@/types'

export interface AuditLogEntry {
  id: number
  userId: number | null
  action: string
  module: string
  details: string | null
  ipAddress: string | null
  createdAt: string
}

export interface UserAffectation {
  id: number
  projetId: number
  projetNom: string
  equipeId: number
  equipeNom: string
  dateDebut: string
  dateFin: string | null
  statut: string
  observations: string | null
  createdAt: string | null
}

export interface UserCreateRequest {
  matricule: string
  nom: string
  prenom: string
  email: string
  /** Non envoyé : le mot de passe est généré côté serveur et envoyé par email de bienvenue. */
  password?: string
  telephone?: string
  dateNaissance?: string
  adresse?: string
  ville?: string
  quartier?: string
  province?: string
  numeroCNI?: string
  numeroPasseport?: string
  dateEmbauche?: string
  photo?: string
  salaireMensuel?: number
  typeContrat?: string
  niveauExperience?: string
  roleIds?: number[]
  departementIds?: number[]
  specialiteIds?: number[]
  superieurHierarchiqueId?: number
}

export interface UserUpdateRequest {
  nom: string
  prenom: string
  email: string
  telephone?: string
  dateNaissance?: string
  adresse?: string
  ville?: string
  quartier?: string
  province?: string
  numeroCNI?: string
  numeroPasseport?: string
  dateEmbauche?: string
  photo?: string
  ficheMission?: string
  salaireMensuel?: number
  typeContrat?: string
  niveauExperience?: string
  actif?: boolean
  roleIds?: number[]
  departementIds?: number[]
  specialiteIds?: number[]
  superieurHierarchiqueId?: number | null
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface NotificationPreferencesUpdatePayload {
  emailNotificationsEnabled?: boolean
  alertNewLoginEnabled?: boolean
  dailyDigestEnabled?: boolean
  weeklyDigestEnabled?: boolean
  digestTime?: string | null
  inAppNotificationsEnabled?: boolean
  notificationSoundEnabled?: boolean
}

export interface UserGetAllParams {
  search?: string
  actif?: boolean
  roleId?: number
  page?: number
  size?: number
  sort?: string
}

/** Réponse GET /users/me/peers : destinataires possibles pour la messagerie. */
export interface UserForMessaging {
  id: number
  nom: string
  prenom: string
  email: string
  roleLabel: string
}

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface LoginHistoryEntry {
  createdAt: string
  ipAddress: string | null
  deviceSummary: string | null
}

export interface Session {
  id: number
  ipAddress: string | null
  userAgent: string | null
  deviceName: string | null
  isCurrent: boolean
  dateDebut: string
  lastActivity: string | null
}

export const userApi = {
  getAll: async (params: UserGetAllParams = {}): Promise<PaginatedResponse<User>> => {
    const { search, actif, roleId, page = 0, size = 20, sort } = params
    const requestParams: Record<string, string | number | boolean | undefined> = { page, size }
    if (search !== undefined && search !== '') requestParams.search = search
    if (actif !== undefined) requestParams.actif = actif
    if (roleId !== undefined) requestParams.roleId = roleId
    if (sort !== undefined) requestParams.sort = sort
    const response = await apiClient.get<PaginatedResponse<User>>('/users', { params: requestParams })
    return response.data
  },

  getById: async (id: number): Promise<User> => {
    const response = await apiClient.get<User>(`/users/${id}`)
    return response.data
  },

  getByEmail: async (email: string): Promise<User> => {
    const response = await apiClient.get<User>(`/users/email/${email}`)
    return response.data
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/users/me')
    return response.data
  },

  /** Liste des autres utilisateurs (destinataires messagerie). Accessible à tout utilisateur connecté. */
  getPeersForMessaging: async (): Promise<UserForMessaging[]> => {
    const response = await apiClient.get<UserForMessaging[]>('/users/me/peers')
    return response.data
  },

  uploadPhoto: async (file: File): Promise<User> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post<User>('/users/me/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  getPhotoUrl: (): string => {
    return `${apiClient.defaults.baseURL ?? ''}/users/me/photo`
  },

  getPhotoUrlById: (userId: number): string => {
    const base = apiClient.defaults.baseURL ?? ''
    return `${base}${API_ENDPOINTS.USERS.PHOTO_BY_ID(userId)}`
  },

  getPhotoBlobById: async (userId: number): Promise<Blob | null> => {
    try {
      const response = await apiClient.get<Blob>(API_ENDPOINTS.USERS.PHOTO_BY_ID(userId), { responseType: 'blob' })
      if (response.status === 204 || !response.data) return null
      return response.data
    } catch {
      return null
    }
  },

  getAuditLogs: async (userId: number, page = 0, size = 20): Promise<{ content: AuditLogEntry[]; totalElements: number; totalPages: number; number: number }> => {
    const response = await apiClient.get(API_ENDPOINTS.USERS.AUDIT_LOGS(userId), {
      params: { page, size },
    })
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/users/${id}`)
  },

  getPhotoBlob: async (): Promise<Blob | null> => {
    try {
      const response = await apiClient.get<Blob>('/users/me/photo', { responseType: 'blob' })
      if (response.status === 204 || !response.data) return null
      return response.data
    } catch {
      return null
    }
  },

  create: async (data: UserCreateRequest): Promise<User> => {
    const response = await apiClient.post<User>('/users', data)
    return response.data
  },

  update: async (id: number, data: UserUpdateRequest): Promise<User> => {
    const response = await apiClient.put<User>(`/users/${id}`, data)
    return response.data
  },

  changePassword: async (id: number, data: ChangePasswordRequest): Promise<void> => {
    await apiClient.put(`/users/${id}/password`, data)
  },

  changeMyPassword: async (data: ChangePasswordRequest): Promise<void> => {
    await apiClient.put('/users/me/password', data)
  },

  updateNotificationPreferences: async (payload: NotificationPreferencesUpdatePayload): Promise<User> => {
    const response = await apiClient.patch<User>('/users/me/preferences/notifications', payload)
    return response.data
  },

  /** Préférences de session : durée par défaut et déconnexion à la fermeture du navigateur. */
  updateSessionPreferences: async (payload: {
    defaultSessionDuration?: 'SHORT' | 'LONG' | null
    logoutOnBrowserClose?: boolean
  }): Promise<User> => {
    const response = await apiClient.patch<User>('/users/me/preferences/session', payload)
    return response.data
  },

  adminResetPassword: async (userId: number, newPassword: string): Promise<void> => {
    await apiClient.put(`/users/${userId}/admin-reset-password`, { newPassword })
  },

  adminDisable2FA: async (userId: number): Promise<void> => {
    await apiClient.post(`/users/${userId}/admin-disable-2fa`)
  },

  getMyLoginHistory: async (): Promise<LoginHistoryEntry[]> => {
    const response = await apiClient.get<LoginHistoryEntry[]>('/users/me/login-history')
    return response.data
  },

  getMySessions: async (): Promise<Session[]> => {
    const response = await apiClient.get<Session[]>('/users/me/sessions')
    return response.data
  },

  revokeSession: async (sessionId: number): Promise<void> => {
    await apiClient.delete(`/users/me/sessions/${sessionId}`)
  },
}

export const equipeApi = {
  getAffectationsByUser: async (userId: number): Promise<UserAffectation[]> => {
    const response = await apiClient.get<UserAffectation[]>(API_ENDPOINTS.EQUIPES.AFFECTATIONS_BY_USER(userId))
    return response.data
  },
}
