import type { Middleware, UnknownAction } from '@reduxjs/toolkit'
import { addToQueue, QUEUEABLE_THUNK_TYPES } from '@/utils/offlineQueue'
import { isNetworkError } from '@/utils/errorHandler'

/**
 * Middleware Redux : intercepte les rejets réseau sur les thunks éligibles
 * et les enqueue dans la file offline pour replay ultérieur.
 *
 * Le replay est orchestré par useReconnectionFlow (6.4.b), plus par window.online.
 */
export const offlineQueueMiddleware: Middleware = (store) => (next) => (action: unknown) => {
  const result = next(action as UnknownAction)
  const type = (action as UnknownAction)?.type as string | undefined

  if (typeof type === 'string' && type.endsWith('/rejected')) {
    const state = store.getState() as { ui: { offlineQueueEnabled: boolean } }
    if (!state.ui.offlineQueueEnabled) return result

    const baseType = type.replace(/\/rejected$/, '')
    if (QUEUEABLE_THUNK_TYPES.includes(baseType)) {
      const act = action as { error?: unknown; payload?: unknown; meta?: { arg?: unknown } }
      const error = act.error ?? act.payload
      if (isNetworkError(error)) {
        const arg = act.meta?.arg
        if (arg !== undefined) addToQueue(baseType, arg)
      }
    }
  }

  return result
}
