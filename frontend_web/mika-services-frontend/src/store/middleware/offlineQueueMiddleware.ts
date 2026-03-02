import type { Middleware, UnknownAction } from '@reduxjs/toolkit'
import { createProjet, updateProjet, deleteProjet } from '@/store/slices/projetSlice'
import { createUser, updateUser, deleteUser } from '@/store/slices/userSlice'
import { getQueue, addToQueue, removeFromQueue, QUEUEABLE_THUNK_TYPES } from '@/utils/offlineQueue'
import { isNetworkError } from '@/utils/errorHandler'

const REPLAY_ACTION_TYPE = 'offlineQueue/replay'

type ThunkDispatcher = (arg: unknown) => unknown

const THUNK_MAP: Record<string, ThunkDispatcher> = {
  'projet/create': createProjet as ThunkDispatcher,
  'projet/update': updateProjet as ThunkDispatcher,
  'projet/delete': deleteProjet as ThunkDispatcher,
  'user/createUser': createUser as ThunkDispatcher,
  'user/updateUser': updateUser as ThunkDispatcher,
  'user/deleteUser': deleteUser as ThunkDispatcher,
}

interface StoreWithUi {
  getState: () => { ui: { offlineQueueEnabled: boolean } }
  dispatch: (action: unknown) => unknown
}

async function runReplay(store: StoreWithUi): Promise<void> {
  const state = store.getState()
  if (!state.ui.offlineQueueEnabled) return
  const queue = getQueue()
  if (queue.length === 0) return
  for (const item of queue) {
    const thunk = THUNK_MAP[item.thunkType]
    if (!thunk) continue
    try {
      const result = await store.dispatch(thunk(item.arg)) as { type?: string }
      const fulfilled = result?.type?.endsWith('/fulfilled')
      if (fulfilled) removeFromQueue(item.id)
      // Si rejet (ex. 400), on retire quand même pour ne pas boucler
      if (!fulfilled) removeFromQueue(item.id)
    } catch {
      removeFromQueue(item.id)
    }
  }
}

export const offlineQueueMiddleware: Middleware = (store) => (next) => (action: unknown) => {
  registerOnlineListener(store.dispatch as (action: unknown) => void)
  if ((action as { type?: string })?.type === REPLAY_ACTION_TYPE) {
    void runReplay(store as unknown as StoreWithUi)
    return next(action)
  }

  const result = next(action as UnknownAction)
  const type = (action as UnknownAction)?.type as string | undefined
  if (typeof type === 'string' && type.endsWith('/rejected')) {
    const state = store.getState() as { ui: { offlineQueueEnabled: boolean } }
    if (!state.ui.offlineQueueEnabled) return result
    const baseType = type.replace(/\/rejected$/, '')
    if (QUEUEABLE_THUNK_TYPES.includes(baseType as typeof QUEUEABLE_THUNK_TYPES[number])) {
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

/** À dispatcher (ou déclencher depuis l'événement online) pour rejouer la file. */
export function getReplayAction(): { type: string } {
  return { type: REPLAY_ACTION_TYPE }
}

let onlineListenerRegistered = false

function registerOnlineListener(dispatch: (action: unknown) => void): void {
  if (onlineListenerRegistered || typeof window === 'undefined') return
  onlineListenerRegistered = true
  window.addEventListener('online', () => dispatch(getReplayAction()))
}
