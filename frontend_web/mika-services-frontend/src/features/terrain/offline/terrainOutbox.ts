/**
 * Outbox terrain (Phase 3 offline-first) — file FIFO des mutations créées hors ligne,
 * persistée en localStorage et rejouée séquentiellement au retour du réseau.
 *
 * Règles de replay :
 * - succès -> l'élément est retiré ;
 * - erreur définitive (4xx hors 408/429) -> statut 'error', conservé pour affichage/réessai/suppression ;
 * - erreur transitoire (réseau, timeout, 5xx) -> reste 'pending', le replay s'arrête (sera retenté plus tard).
 *
 * L'idempotence est garantie côté backend par `clientRequestId` (colonne unique) :
 * rejouer plusieurs fois le même élément ne crée jamais de doublon.
 */
import { AxiosError } from 'axios'
import { runTerrainMutation, type TerrainAction } from './terrainMutations'

export interface TerrainOutboxItem {
  id: string
  clientRequestId: string
  action: TerrainAction
  enginId?: number
  /** Libellé contextuel pour l'écran de sync (ex. code engin). */
  contexte?: string
  payload: unknown
  createdAt: number
  status: 'pending' | 'sending' | 'error'
  lastError?: { status?: number; message: string; at: number }
  attempts: number
}

const KEY = 'mika-terrain-outbox'

type Listener = () => void
const listeners = new Set<Listener>()

function notify(): void {
  listeners.forEach((l) => { try { l() } catch { /* listener défaillant : ignorer */ } })
}

function load(): TerrainOutboxItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as TerrainOutboxItem[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function save(items: TerrainOutboxItem[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
  } catch { /* stockage plein : l'élément vit en mémoire jusqu'au replay */ }
  notify()
}

export function getOutbox(): TerrainOutboxItem[] {
  return load()
}

export function pendingCount(): number {
  return load().length
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function enqueue(action: TerrainAction, clientRequestId: string, payload: unknown, enginId?: number, contexte?: string): TerrainOutboxItem {
  const item: TerrainOutboxItem = {
    id: crypto.randomUUID(),
    clientRequestId,
    action,
    enginId,
    contexte,
    payload,
    createdAt: Date.now(),
    status: 'pending',
    attempts: 0,
  }
  save([...load(), item])
  return item
}

export function remove(id: string): void {
  save(load().filter((i) => i.id !== id))
}

/** Erreur définitive = réponse 4xx (hors 408/429) : rejouer ne changera rien, il faut une action utilisateur. */
function isDefinitiveError(e: unknown): { definitive: boolean; status?: number; message: string } {
  if (e instanceof AxiosError) {
    const status = e.response?.status
    const data = e.response?.data as { message?: string } | undefined
    const message = data?.message || e.message
    if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) {
      return { definitive: true, status, message }
    }
    return { definitive: false, status, message }
  }
  return { definitive: false, message: e instanceof Error ? e.message : String(e) }
}

function update(id: string, patch: Partial<TerrainOutboxItem>): void {
  save(load().map((i) => (i.id === id ? { ...i, ...patch } : i)))
}

let replaying = false

/**
 * Rejoue la file dans l'ordre (FIFO strict). Retourne le nombre d'éléments synchronisés.
 * S'arrête à la première erreur transitoire pour éviter une rafale hors ligne.
 */
export async function replayAll(): Promise<{ done: number; failed: number; stopped: boolean }> {
  if (replaying) return { done: 0, failed: 0, stopped: false }
  replaying = true
  let done = 0
  let failed = 0
  let stopped = false
  try {
    for (const item of load()) {
      if (item.status === 'error') continue
      update(item.id, { status: 'sending' })
      try {
        await runTerrainMutation(item)
        remove(item.id)
        done += 1
      } catch (e) {
        const { definitive, status, message } = isDefinitiveError(e)
        const lastError = { status, message, at: Date.now() }
        if (definitive) {
          update(item.id, { status: 'error', lastError, attempts: item.attempts + 1 })
          failed += 1
        } else {
          // Réseau/5xx : on garde 'pending' et on arrête le replay.
          update(item.id, { status: 'pending', lastError, attempts: item.attempts + 1 })
          stopped = true
          break
        }
      }
    }
  } finally {
    replaying = false
  }
  return { done, failed, stopped }
}

/** Repasse un élément en erreur à 'pending' puis relance un replay complet. */
export async function retryOne(id: string): Promise<void> {
  update(id, { status: 'pending', lastError: undefined })
  await replayAll()
}
