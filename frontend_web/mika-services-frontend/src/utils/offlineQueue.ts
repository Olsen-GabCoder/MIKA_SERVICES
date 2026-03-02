/**
 * File d'attente hors ligne : enregistrement des actions (mutations) qui échouent
 * par erreur réseau, pour les rejouer à la reconnexion.
 */

const QUEUE_STORAGE_KEY = 'mika-offline-queue'

export interface QueuedItem {
  id: string
  thunkType: string
  arg: unknown
  createdAt: number
}

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
  queue.push({ id, thunkType, arg, createdAt: Date.now() })
  saveQueue(queue)
}

export function removeFromQueue(id: string): void {
  const queue = loadQueue().filter((item) => item.id !== id)
  saveQueue(queue)
}

export function clearQueue(): void {
  saveQueue([])
}

/** Types de thunks éligibles à la file (mutations rejouables). */
export const QUEUEABLE_THUNK_TYPES = [
  'projet/create',
  'projet/update',
  'projet/delete',
  'user/createUser',
  'user/updateUser',
  'user/deleteUser',
] as const
