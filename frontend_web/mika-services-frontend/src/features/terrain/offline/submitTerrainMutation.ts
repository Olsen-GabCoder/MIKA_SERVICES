/**
 * Point d'entrée unique des mutations terrain (Phase 3 offline-first).
 * Génère un `clientRequestId` (idempotence backend), injecte-le dans le payload,
 * tente l'appel réseau, et bascule dans l'outbox si hors ligne ou serveur injoignable.
 *
 * - `{ queued: false, result }` : envoyé au serveur (comportement normal) ;
 * - `{ queued: true }` : enregistré sur l'appareil, sera synchronisé au retour du réseau ;
 * - erreur 4xx (validation/métier) : rejetée telle quelle, affichée à l'utilisateur.
 *
 * Photos offline (option a) : les blobs File sont stockés en IndexedDB sous une clé
 * `photos-{clientRequestId}`, et la clé est référencée dans le payload outbox.
 * Au replay, terrainMutations récupère les blobs, les upload, et injecte les URLs.
 */
import { AxiosError } from 'axios'
import { isNetworkOrServerDown } from '@/api/axios'
import { enqueue } from './terrainOutbox'
import { runTerrainMutation, type TerrainAction } from './terrainMutations'
import { storePhotoBlobs } from './indexedDbPhotos'

export type SubmitResult<T> = { queued: false; result: T } | { queued: true }

export async function submitTerrainMutation<T>(
  action: TerrainAction,
  payload: object,
  options?: { enginId?: number; contexte?: string; photos?: File[] },
): Promise<SubmitResult<T>> {
  const clientRequestId = crypto.randomUUID()
  const fullPayload = { ...payload, clientRequestId }

  const queue = async (): Promise<SubmitResult<T>> => {
    // Si des photos sont fournies, les stocker en IndexedDB pour le replay
    if (options?.photos && options.photos.length > 0) {
      const blobKey = `photos-${clientRequestId}`
      try {
        await storePhotoBlobs(blobKey, options.photos)
        ;(fullPayload as Record<string, unknown>).photoBlobKey = blobKey
      } catch {
        // IndexedDB indisponible : l'action part sans photos
      }
    }
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
