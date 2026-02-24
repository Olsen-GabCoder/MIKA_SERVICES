import apiClient from './axios'
import type { AuthResponse, Login2FAPendingResponse } from '@/types'
import { API_ENDPOINTS } from '@/constants/api'

export interface LoginRequest {
  email: string
  password: string
}

export type LoginResponse = AuthResponse | Login2FAPendingResponse

export function isLogin2FAPending(data: LoginResponse): data is Login2FAPendingResponse {
  return 'requires2FA' in data && data.requires2FA === true && 'tempToken' in data
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface Verify2FARequest {
  tempToken: string
  code: string
}

export interface Setup2FAResponse {
  secret: string
  qrImageBase64: string
}

export interface Verify2FASetupRequest {
  code: string
}

export interface Disable2FARequest {
  password: string
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials)
    const data = response.data
    // Si succès direct (sans 2FA), stocker l'access token
    if (!isLogin2FAPending(data) && data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken)
    }
    return data
  },

  verify2FA: async (tempToken: string, code: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.VERIFY_2FA, { tempToken, code })
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken)
    }
    return response.data
  },

  setup2FA: async (): Promise<Setup2FAResponse> => {
    const response = await apiClient.get<Setup2FAResponse>(API_ENDPOINTS.AUTH['2FA_SETUP'])
    return response.data
  },

  /** Envoie le code OTP et retourne l'utilisateur mis à jour (totpEnabled: true). */
  verifySetup2FA: async (code: string): Promise<AuthResponse['user']> => {
    const response = await apiClient.post<AuthResponse['user']>(API_ENDPOINTS.AUTH['2FA_VERIFY_SETUP'], { code })
    return response.data
  },

  disable2FA: async (password: string): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.AUTH['2FA_DISABLE'], { password })
  },

  refreshToken: async (): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.REFRESH, {})
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken)
    }
    return response.data
  },

  logout: async (): Promise<void> => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      try {
        await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, {}, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error)
      }
    }
    localStorage.removeItem('accessToken')
  },

  getMe: async (): Promise<AuthResponse['user']> => {
    const response = await apiClient.get<AuthResponse['user']>(API_ENDPOINTS.AUTH.ME)
    return response.data
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email })
    return response.data
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
      token,
      newPassword,
    })
    return response.data
  },
}
