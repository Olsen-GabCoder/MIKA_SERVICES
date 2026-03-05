import { AxiosError } from 'axios'
import { i18n } from '@/i18n'

/** Indique si l'erreur est due à l'absence de réseau, un timeout, ou un serveur injoignable. */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    if (!error.response) {
      const code = error.code ?? ''
      return ['ERR_NETWORK', 'ECONNABORTED', 'ETIMEDOUT', 'ECONNREFUSED'].includes(code) ||
        /network error/i.test(error.message)
    }
    return error.response.status >= 502 && error.response.status <= 504
  }
  return false
}

export interface ApiError {
  timestamp?: string
  status: number
  error: string
  message: string
  path?: string
  details?: Record<string, any>
}

export const handleApiError = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const apiError = error.response?.data as ApiError
    if (apiError?.message) {
      return apiError.message
    }
    return error.message || i18n.t('common:error.generic')
  }

  if (error instanceof Error) {
    return error.message
  }

  return i18n.t('common:error.unexpected')
}

export const getValidationErrors = (error: unknown): Record<string, string> => {
  if (error instanceof AxiosError) {
    const apiError = error.response?.data as ApiError
    if (apiError?.details) {
      return apiError.details as Record<string, string>
    }
  }
  return {}
}
