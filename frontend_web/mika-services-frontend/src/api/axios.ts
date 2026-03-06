import axios from 'axios'
import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { i18n } from '@/i18n'
import { getAccessToken, setAccessToken, removeAllTokens, getRefreshToken, setRefreshToken } from '@/utils/tokenStorage'
import { cacheResponse, getCachedResponse } from '@/utils/responseCache'

const MAX_RETRIES = 2
const RETRY_BASE_DELAY_MS = 800

const NO_CACHE_PATHS = ['/auth/login', '/auth/refresh', '/auth/verify-2fa', '/auth/logout']

function isRetryable(error: AxiosError): boolean {
  if (error.response) return false
  const code = error.code ?? ''
  return ['ERR_NETWORK', 'ECONNABORTED', 'ETIMEDOUT'].includes(code) ||
    /network error/i.test(error.message)
}

function isNetworkOrServerDown(error: AxiosError): boolean {
  if (!error.response) {
    const code = error.code ?? ''
    return ['ERR_NETWORK', 'ECONNABORTED', 'ETIMEDOUT', 'ECONNREFUSED'].includes(code) ||
      /network error/i.test(error.message)
  }
  return error.response.status >= 502 && error.response.status <= 504
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function getRequestCacheKey(config: InternalAxiosRequestConfig): { url: string; params: string | undefined } | null {
  if (config.method?.toUpperCase() !== 'GET') return null
  const url = config.url ?? ''
  if (NO_CACHE_PATHS.some((p) => url.includes(p))) return null
  const params = config.params ? JSON.stringify(config.params) : undefined
  return { url, params }
}

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
  withCredentials: true,
})

// JWT + locale
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

// Normaliser paginated Spring Data
apiClient.interceptors.response.use((response) => {
  const data = response.data
  if (data && Array.isArray(data.content) && data.page && typeof data.page === 'object') {
    const { page, ...rest } = data
    response.data = { ...rest, ...page }
  }
  return response
})

// Auto-cache : stocker toutes les réponses GET réussies
apiClient.interceptors.response.use((response: AxiosResponse) => {
  const ck = response.config ? getRequestCacheKey(response.config as InternalAxiosRequestConfig) : null
  if (ck && response.data !== undefined) {
    cacheResponse(ck.url, ck.params, response.data)
  }
  return response
})

// Retry + fallback cache sur erreurs réseau
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number; _cacheChecked?: boolean }
    if (!config) return Promise.reject(error)

    // Retry sur erreurs réseau
    if (isRetryable(error)) {
      config._retryCount = config._retryCount ?? 0
      if (config._retryCount < MAX_RETRIES) {
        config._retryCount += 1
        const waitMs = RETRY_BASE_DELAY_MS * Math.pow(2, config._retryCount - 1)
        await delay(waitMs)
        return apiClient(config)
      }
    }

    // Après les retries (ou erreur serveur 502-504), fallback cache pour les GET
    if (!config._cacheChecked && isNetworkOrServerDown(error)) {
      config._cacheChecked = true
      const ck = getRequestCacheKey(config)
      if (ck) {
        const cached = getCachedResponse(ck.url, ck.params)
        if (cached !== null) {
          return { data: cached, status: 200, statusText: 'OK (cache)', headers: {}, config } as AxiosResponse
        }
      }
    }

    return Promise.reject(error)
  }
)

// Refresh token sur 401 — envoyer le refresh token dans le body (cookie cross-origin non fiable)
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const status = error.response?.status

    if (status === 403) return Promise.reject(error)

    if (!error.response && isNetworkOrServerDown(error)) {
      return Promise.reject(error)
    }

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const storedRefresh = getRefreshToken()
      if (!storedRefresh) {
        removeAllTokens()
        window.location.href = '/login'
        return Promise.reject(error)
      }
      try {
        const response = await apiClient.post('/auth/refresh', { refreshToken: storedRefresh })
        const { accessToken, refreshToken: newRefresh } = response.data
        if (accessToken) {
          setAccessToken(accessToken)
          if (newRefresh) setRefreshToken(newRefresh)
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
          }
          return apiClient(originalRequest)
        }
      } catch (refreshErr) {
        if (isNetworkOrServerDown(refreshErr as AxiosError)) {
          return Promise.reject(error)
        }
      }
      removeAllTokens()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

export default apiClient
