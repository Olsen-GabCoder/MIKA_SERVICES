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
}

export async function runTerrainMutation(item: { action: TerrainAction; enginId?: number; payload: unknown }): Promise<unknown> {
  const { action, enginId, payload } = item
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
  }
}
