import axios from 'axios'
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { i18n } from '@/i18n'
import { getAccessToken, setAccessToken, removeAccessToken } from '@/utils/tokenStorage'

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true, // Envoie les cookies (ex. refresh token httpOnly)
})

// Intercepteur pour ajouter le token JWT et la locale
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    const locale = i18n.language || 'fr'
    if (config.headers) {
      config.headers['Accept-Language'] = locale
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Intercepteur pour gérer les erreurs globales et le refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const status = error.response?.status

    // 403 = authentifié mais non autorisé : ne pas déconnecter, laisser l'app afficher l'erreur
    if (status === 403) {
      return Promise.reject(error)
    }

    // 401 = token invalide ou expiré : tenter le refresh (cookie httpOnly) puis rediriger vers login si échec
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const response = await apiClient.post('/auth/refresh', {})
        const { accessToken } = response.data
        if (accessToken) {
          setAccessToken(accessToken)
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
          }
          return apiClient(originalRequest)
        }
      } catch {
        // Refresh échoué : déconnecter et rediriger
      }
      removeAccessToken()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

export default apiClient
