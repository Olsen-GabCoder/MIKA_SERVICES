import apiClient from './axios'
import type { AuthResponse, Login2FAPendingResponse } from '@/types'
import { API_ENDPOINTS } from '@/constants/api'
import { setTokenStorageMode, setAccessToken, getAccessToken, removeAccessToken } from '@/utils/tokenStorage'
import { storeOfflineCredentials, verifyOfflineCredentials, getOfflineToken, clearOfflineCredentials } from '@/utils/offlineAuth'
import { isNetworkError } from '@/utils/errorHandler'

export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
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
    try {
      const response = await apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials)
      const data = response.data
      if (!isLogin2FAPending(data) && data.accessToken) {
        setTokenStorageMode(data.user?.logoutOnBrowserClose ?? false)
        setAccessToken(data.accessToken)
        await storeOfflineCredentials(credentials.email, credentials.password, data.user)
      }
      return data
    } catch (err) {
      if (isNetworkError(err)) {
        const cachedUser = await verifyOfflineCredentials(credentials.email, credentials.password)
        if (cachedUser) {
          const offlineToken = getOfflineToken()
          setAccessToken(offlineToken)
          return {
            accessToken: offlineToken,
            refreshToken: offlineToken,
            tokenType: 'Bearer',
            expiresIn: 86400,
            sessionExpiresIn: 86400,
            user: cachedUser,
          } as AuthResponse
        }
      }
      throw err
    }
  },

  verify2FA: async (tempToken: string, code: string, rememberMe: boolean = false): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.VERIFY_2FA, { tempToken, code, rememberMe })
    if (response.data.accessToken) {
      setTokenStorageMode(response.data.user?.logoutOnBrowserClose ?? false)
      setAccessToken(response.data.accessToken)
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
    if (getAccessToken() === getOfflineToken()) {
      const raw = localStorage.getItem('mika-offline-auth')
      if (raw) {
        const stored = JSON.parse(raw)
        return {
          accessToken: getOfflineToken(),
          refreshToken: getOfflineToken(),
          tokenType: 'Bearer',
          expiresIn: 86400,
          sessionExpiresIn: 86400,
          user: stored.user,
        } as AuthResponse
      }
    }
    const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.REFRESH, {})
    if (response.data.accessToken) {
      setTokenStorageMode(response.data.user?.logoutOnBrowserClose ?? false)
      setAccessToken(response.data.accessToken)
    }
    return response.data
  },

  logout: async (): Promise<void> => {
    const token = getAccessToken()
    if (token && token !== getOfflineToken()) {
      try {
        await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, {}, {
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch { /* ignore en hors ligne */ }
    }
    removeAccessToken()
  },

  getMe: async (): Promise<AuthResponse['user']> => {
    const response = await apiClient.get<AuthResponse['user']>(API_ENDPOINTS.AUTH.ME)
    return response.data
  },

  /** Politique de verrouillage après échecs de connexion (lecture seule). */
  getLoginPolicy: async (): Promise<{ lockoutMaxAttempts: number; lockoutDurationMinutes: number }> => {
    const response = await apiClient.get<{ lockoutMaxAttempts: number; lockoutDurationMinutes: number }>(
      API_ENDPOINTS.AUTH.LOGIN_POLICY
    )
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
