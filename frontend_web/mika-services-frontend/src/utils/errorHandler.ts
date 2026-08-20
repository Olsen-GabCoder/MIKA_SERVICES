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

/**
 * Patterns that indicate a message is technical / not user-friendly.
 * When detected, we return a generic i18n message instead of the raw text.
 */
const TECHNICAL_PATTERN = /^(java\.|org\.|com\.|net\.|io\.)|sql|exception|stacktrace|econnrefused|econnaborted|etimedout|err_network|localhost|127\.0\.0\.1|:\d{4,5}|status\s*code\s*\d{3}|request\s*failed|network\s*error|timeout|undefined|null|\[object/i

function isTechnicalMessage(msg: string): boolean {
  return TECHNICAL_PATTERN.test(msg)
}

/** Maps HTTP status codes to i18n keys for user-friendly messages. */
function messageForStatus(status: number | undefined): string | null {
  if (!status) return null
  if (status === 400) return i18n.t('common:error.badRequest')
  if (status === 403) return i18n.t('common:error.forbidden')
  if (status === 404) return i18n.t('common:error.notFound')
  if (status === 409) return i18n.t('common:error.conflict')
  if (status >= 500) return i18n.t('common:error.server')
  return null
}

export const handleApiError = (error: unknown): string => {
  // Message déjà extrait (ex. rejectWithValue d'un thunk Redux) : le restituer tel quel
  if (typeof error === 'string' && error.trim() !== '' && !isTechnicalMessage(error)) {
    return error
  }
  if (error instanceof AxiosError) {
    const status = error.response?.status
    const apiError = error.response?.data as ApiError | undefined

    // If the backend sent a human-readable message that is NOT technical, use it
    if (apiError?.message && !isTechnicalMessage(apiError.message)) {
      return apiError.message
    }

    // Map by HTTP status code
    const statusMsg = messageForStatus(status)
    if (statusMsg) return statusMsg

    return i18n.t('common:error.generic')
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
