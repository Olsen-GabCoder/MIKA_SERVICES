import axios from 'axios'
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { i18n } from '@/i18n'
import { getAccessToken, setAccessToken, removeAccessToken } from '@/utils/tokenStorage'

const MAX_RETRIES = 3
const RETRY_BASE_DELAY_MS = 1000

function isRetryable(error: AxiosError): boolean {
  if (error.response) return false
  const code = error.code ?? ''
  return ['ERR_NETWORK', 'ECONNABORTED', 'ETIMEDOUT'].includes(code) ||
    /network error/i.test(error.message)
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
  withCredentials: true,
})

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
  (error: AxiosError) => Promise.reject(error)
)

apiClient.interceptors.response.use((response) => {
  const data = response.data
  if (data && Array.isArray(data.content) && data.page && typeof data.page === 'object') {
    const { page, ...rest } = data
    response.data = { ...rest, ...page }
  }
  return response
})

// Retry automatique sur erreurs réseau (serveur injoignable, timeout)
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number }
    if (!config || !isRetryable(error)) return Promise.reject(error)

    config._retryCount = config._retryCount ?? 0
    if (config._retryCount >= MAX_RETRIES) return Promise.reject(error)

    config._retryCount += 1
    const waitMs = RETRY_BASE_DELAY_MS * Math.pow(2, config._retryCount - 1)
    await delay(waitMs)
    return apiClient(config)
  }
)

// Refresh token sur 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const status = error.response?.status

    if (status === 403) return Promise.reject(error)

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
        // Refresh échoué
      }
      removeAccessToken()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

export default apiClient
