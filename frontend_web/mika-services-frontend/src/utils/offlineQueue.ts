/**
 * File d'attente hors ligne : enregistrement des mutations qui échouent
 * par erreur réseau, pour les rejouer à la reconnexion.
 */

import { createProjet, updateProjet, deleteProjet } from '@/store/slices/projetSlice'
import { createUser, updateUser, deleteUser } from '@/store/slices/userSlice'

const QUEUE_STORAGE_KEY = 'mika-offline-queue'

export interface QueuedItem {
  id: string
  idempotencyKey: string
  thunkType: string
  arg: unknown
  createdAt: number
}

export interface ReplayResult {
  succeeded: number
  failed: number
  failedMutations: Array<{ idempotencyKey: string; thunkType: string; reason: string }>
}

type ThunkDispatcher = (arg: unknown) => unknown

export const THUNK_MAP: Record<string, ThunkDispatcher> = {
  'projet/create': createProjet as ThunkDispatcher,
  'projet/update': updateProjet as ThunkDispatcher,
  'projet/delete': deleteProjet as ThunkDispatcher,
  'user/createUser': createUser as ThunkDispatcher,
  'user/updateUser': updateUser as ThunkDispatcher,
  'user/deleteUser': deleteUser as ThunkDispatcher,
}

/** Types de thunks éligibles à la file (mutations rejouables). */
export const QUEUEABLE_THUNK_TYPES = Object.keys(THUNK_MAP)

function loadQueue(): QueuedItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as QueuedItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveQueue(items: QueuedItem[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(items))
  } catch {
    // quota or disabled
  }
}

export function getQueue(): QueuedItem[] {
  return loadQueue()
}

export function addToQueue(thunkType: string, arg: unknown): void {
  const queue = loadQueue()
  const id = `${thunkType}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const idempotencyKey = crypto.randomUUID()
  queue.push({ id, idempotencyKey, thunkType, arg, createdAt: Date.now() })
  saveQueue(queue)
}

export function removeFromQueue(id: string): void {
  const queue = loadQueue().filter((item) => item.id !== id)
  saveQueue(queue)
}

export function clearQueue(): void {
  saveQueue([])
}

/**
 * Rejoue les mutations de la file d'attente dans l'ordre FIFO.
 *
 * - Succès (fulfilled) → retire de la queue
 * - Échec métier 4xx (hors 401/408) → retire + ajoute à failedMutations (invalide, inutile de rejouer)
 * - Échec réseau / 5xx / 401 / 408 → conserve dans la queue pour retry ultérieur
 *
 * Bug fix : l'ancien mécanisme retirait les mutations queuées dans TOUS les cas,
 * y compris sur rejet réseau, causant une perte définitive de données.
 */
export async function replay(
  dispatch: (thunk: unknown) => Promise<{ type?: string; error?: { message?: string }; payload?: unknown }>,
  getState: () => { ui: { offlineQueueEnabled: boolean } },
): Promise<ReplayResult> {
  const state = getState()
  if (!state.ui.offlineQueueEnabled) {
    return { succeeded: 0, failed: 0, failedMutations: [] }
  }

  const queue = loadQueue()
  if (queue.length === 0) {
    return { succeeded: 0, failed: 0, failedMutations: [] }
  }

  const result: ReplayResult = { succeeded: 0, failed: 0, failedMutations: [] }

  for (const item of queue) {
    const thunk = THUNK_MAP[item.thunkType]
    if (!thunk) {
      removeFromQueue(item.id)
      result.failed++
      result.failedMutations.push({
        idempotencyKey: item.idempotencyKey || crypto.randomUUID(),
        thunkType: item.thunkType,
        reason: `Unknown thunk type: ${item.thunkType}`,
      })
      continue
    }

    // Mutations legacy sans idempotencyKey : en générer un à la volée
    if (!item.idempotencyKey) {
      item.idempotencyKey = crypto.randomUUID()
      saveQueue(loadQueue().map((q) => (q.id === item.id ? { ...q, idempotencyKey: item.idempotencyKey } : q)))
    }

    try {
      const dispatchResult = await dispatch(thunk(item.arg))
      const isFulfilled = dispatchResult?.type?.endsWith('/fulfilled')

      if (isFulfilled) {
        removeFromQueue(item.id)
        result.succeeded++
      } else {
        // Rejet : déterminer si c'est une erreur métier (4xx) ou réseau/serveur
        const errorPayload = dispatchResult?.payload as { status?: number } | undefined
        const status = errorPayload?.status

        if (status && status >= 400 && status < 500 && status !== 401 && status !== 408) {
          // Erreur métier non-rejouable → retirer définitivement
          removeFromQueue(item.id)
          result.failed++
          result.failedMutations.push({
            idempotencyKey: item.idempotencyKey,
            thunkType: item.thunkType,
            reason: `HTTP ${status}`,
          })
        }
        // Sinon (réseau, 5xx, 401, 408) → conserver pour retry ultérieur
      }
    } catch {
      // Exception inattendue → conserver pour retry (ne pas perdre la mutation)
    }
  }

  return result
}
