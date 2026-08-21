/**
 * Registre des mutations terrain rejouables par l'outbox : action -> appel terrainApi.
 * Chaque payload contient déjà `clientRequestId` (injecté par submitTerrainMutation).
 */
import { terrainApi, type DmaCreateRequest, type TransfertCreateRequest } from '@/api/terrainApi'
import type {
  InspectionEnginCreateRequest,
  ReleveCompteurCreateRequest,
  ConsommationCarburantCreateRequest,
  IncidentEnginCreateRequest,
  PositionEnginCreateRequest,
} from '@/types/materiel'
import { getPhotoBlobs, deletePhotoBlobs } from './indexedDbPhotos'

export type TerrainAction =
  | 'inspection'
  | 'releve'
  | 'ravitaillement'
  | 'incident'
  | 'position'
  | 'dma'
  /** LEGACY (circuit à 3 portes supprimé le 2026-08-20) : conservé uniquement pour rejouer
   *  proprement une vieille mutation en file — le backend répond 404, l'outbox marque 'error'. */
  | 'dma-valider'
  | 'dma-transition'
  | 'dma-rejeter'
  | 'transfert'
  | 'transfert-action'
  | 'transfert-valider'
  | 'transfert-rejeter'
  | 'transfert-receptionner'

/** Payloads des transitions de workflow (l'id de la ressource voyage dans le payload). */
/** LEGACY — voir TerrainAction 'dma-valider'. Aucun nouveau producteur. */
export interface DmaValiderPayload {
  id: number
  etape: 'valider-chantier' | 'valider-projet'
  approuve: boolean
  commentaire?: string
}
export interface DmaTransitionPayload {
  id: number
  action: 'prendre-en-charge' | 'demander-complement' | 'completer' | 'livrer' | 'commander' | 'cloturer'
  commentaire?: string
}
export interface DmaRejeterPayload {
  id: number
  /** Motif obligatoire (endpoint /rejeter). */
  commentaire: string
}
export interface TransfertActionPayload {
  id: number
  action: 'confirmer-depart' | 'annuler'
  commentaire?: string
}
export interface TransfertValiderPayload {
  id: number
  projetDestinationId?: number
  commentaire?: string
}
export interface TransfertRejeterPayload {
  id: number
  motif: string
}
export interface TransfertReceptionnerPayload {
  id: number
  token?: string
  code?: string
  avecReserves: boolean
  commentaire?: string
  latitude?: number
  longitude?: number
  precisionMetres?: number
  photos?: string[]
  signatureDataUrl?: string
  dateReceptionTerrain?: number
}

/** Libellés FR pour l'écran de synchronisation. */
export const ACTION_LABELS: Record<TerrainAction, string> = {
  inspection: 'Inspection quotidienne',
  releve: 'Relevé compteur',
  ravitaillement: 'Ravitaillement',
  incident: 'Signalement incident',
  position: 'Confirmation de position',
  dma: 'Demande de matériel',
  'dma-valider': 'Validation de demande',
  'dma-transition': 'Suivi de demande',
  'dma-rejeter': 'Rejet de demande',
  transfert: 'Transfert d\u2019engin',
  'transfert-action': 'Suivi de transfert',
  'transfert-valider': 'Validation de transfert',
  'transfert-rejeter': 'Rejet de transfert',
  'transfert-receptionner': 'Réception de transfert',
}

/**
 * Si le payload contient un photoBlobKey (stocké offline en IndexedDB),
 * récupérer les blobs, les uploader vers Cloudinary, et injecter les URLs.
 */
async function resolveOfflinePhotos(enginId: number | undefined, payload: Record<string, unknown>): Promise<void> {
  const blobKey = payload.photoBlobKey as string | undefined
  if (!blobKey || !enginId) return

  try {
    const files = await getPhotoBlobs(blobKey)
    if (files.length > 0) {
      const urls = await terrainApi.uploadOperationPhotos(enginId, files)
      // Injecter selon le nombre : photoUrls (multi) ou photoUrl (single)
      if (urls.length === 1) {
        payload.photoUrl = urls[0]
        payload.photoUrls = urls
      } else {
        payload.photoUrls = urls
      }
    }
    await deletePhotoBlobs(blobKey)
  } catch {
    // Upload échoue : l'action part sans photos plutôt que de bloquer l'outbox.
    // Nettoyer les blobs orphelins pour éviter la fuite IndexedDB.
    try { await deletePhotoBlobs(blobKey) } catch { /* best effort */ }
  }
  delete payload.photoBlobKey
}

export async function runTerrainMutation(item: { action: TerrainAction; enginId?: number; payload: unknown }): Promise<unknown> {
  const { action, enginId, payload } = item

  // Résoudre les photos offline avant l'appel API
  const p = payload as Record<string, unknown>
  if (p.photoBlobKey) {
    await resolveOfflinePhotos(enginId, p)
  }

  switch (action) {
    case 'inspection':
      return terrainApi.creerInspection(enginId!, payload as InspectionEnginCreateRequest)
    case 'releve':
      return terrainApi.creerReleve(enginId!, payload as ReleveCompteurCreateRequest)
    case 'ravitaillement':
      return terrainApi.creerRavitaillement(enginId!, payload as ConsommationCarburantCreateRequest)
    case 'incident':
      return terrainApi.signalerIncident(enginId!, payload as IncidentEnginCreateRequest)
    case 'position':
      return terrainApi.confirmerPosition(enginId!, payload as PositionEnginCreateRequest)
    case 'dma':
      return terrainApi.creerDemande(payload as DmaCreateRequest)
    case 'dma-valider': {
      const p = payload as DmaValiderPayload
      return terrainApi.demandeValider(p.id, p.etape, p.approuve, p.commentaire)
    }
    case 'dma-transition': {
      const p = payload as DmaTransitionPayload
      return terrainApi.demandeTransition(p.id, p.action, p.commentaire)
    }
    case 'dma-rejeter': {
      const p = payload as DmaRejeterPayload
      return terrainApi.demandeRejeter(p.id, p.commentaire)
    }
    case 'transfert':
      return terrainApi.creerTransfert(payload as TransfertCreateRequest)
    case 'transfert-action': {
      const p = payload as TransfertActionPayload
      return terrainApi.transfertAction(p.id, p.action, p.commentaire)
    }
    case 'transfert-valider': {
      const p = payload as TransfertValiderPayload
      return terrainApi.transfertValider(p.id, p.projetDestinationId, p.commentaire)
    }
    case 'transfert-rejeter': {
      const p = payload as TransfertRejeterPayload
      return terrainApi.transfertRejeter(p.id, p.motif)
    }
    case 'transfert-receptionner': {
      const p = payload as TransfertReceptionnerPayload
      // Photos : résoudre depuis IndexedDB si photoBlobKey présent (fait plus haut via resolveOfflinePhotos)
      // Upload photos réserves si présentes et pas encore uploadées
      if (p.avecReserves && (payload as Record<string, unknown>).photoFiles) {
        // Les photos ont été résolues par resolveOfflinePhotos → p.photos contient les URLs
      }
      return terrainApi.transfertReceptionner(p.id, {
        token: p.token,
        code: p.code,
        avecReserves: p.avecReserves,
        commentaire: p.commentaire,
        latitude: p.latitude,
        longitude: p.longitude,
        precisionMetres: p.precisionMetres,
        photos: p.photos,
        signatureDataUrl: p.signatureDataUrl,
        dateReceptionTerrain: p.dateReceptionTerrain,
      })
    }
  }
}
