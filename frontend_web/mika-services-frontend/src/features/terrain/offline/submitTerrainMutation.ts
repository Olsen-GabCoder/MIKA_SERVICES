/**
 * Point d'entrée unique des mutations terrain (Phase 3 offline-first).
 * Génère un `clientRequestId` (idempotence backend), injecte-le dans le payload,
 * tente l'appel réseau, et bascule dans l'outbox si hors ligne ou serveur injoignable.
 *
 * - `{ queued: false, result }` : envoyé au serveur (comportement normal) ;
 * - `{ queued: true }` : enregistré sur l'appareil, sera synchronisé au retour du réseau ;
 * - erreur 4xx (validation/métier) : rejetée telle quelle, affichée à l'utilisateur.
 */
import { AxiosError } from 'axios'
import { isNetworkOrServerDown } from '@/api/axios'
import { enqueue } from './terrainOutbox'
import { runTerrainMutation, type TerrainAction } from './terrainMutations'

export type SubmitResult<T> = { queued: false; result: T } | { queued: true }

export async function submitTerrainMutation<T>(
  action: TerrainAction,
  payload: object,
  options?: { enginId?: number; contexte?: string },
): Promise<SubmitResult<T>> {
  const clientRequestId = crypto.randomUUID()
  const fullPayload = { ...payload, clientRequestId }

  const queue = (): SubmitResult<T> => {
    enqueue(action, clientRequestId, fullPayload, options?.enginId, options?.contexte)
    return { queued: true }
  }

  if (!navigator.onLine) return queue()

  try {
    const result = (await runTerrainMutation({ action, enginId: options?.enginId, payload: fullPayload })) as T
    return { queued: false, result }
  } catch (e) {
    if (e instanceof AxiosError && isNetworkOrServerDown(e)) return queue()
    throw e
  }
}
