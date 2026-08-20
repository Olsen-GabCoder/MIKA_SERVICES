import apiClient from './axios'
import type {
  InspectionEngin, InspectionEnginCreateRequest,
  PositionEngin, PositionEnginCreateRequest,
  IncidentEngin, IncidentEnginCreateRequest,
  ReleveCompteur, ReleveCompteurCreateRequest,
  ConsommationCarburant, ConsommationCarburantCreateRequest,
} from '@/types/materiel'

/** Vue engin pour l'application mobile terrain (aligné TerrainEnginResponse backend). */
export interface TerrainEngin {
  id: number
  code: string
  nom: string
  type: string
  statut: string
  marque?: string | null
  modele?: string | null
  heuresCompteur: number
  chantierNom?: string | null
  chantierDepuis?: string | null
  inspectionFaiteAujourdhui: boolean
  dernierPlein?: string | null
  photo?: string | null
}

// ── Demandes de matériel (DMA) ─────────────────────────────────

export type StatutDma =
  | 'SOUMISE' | 'EN_VALIDATION_CHANTIER' | 'EN_VALIDATION_PROJET' | 'PRISE_EN_CHARGE'
  | 'EN_ATTENTE_COMPLEMENT' | 'EN_COMMANDE' | 'LIVRE' | 'REJETEE' | 'CLOTUREE'

export type PrioriteDma = 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE'

export interface TerrainChantier { id: number; nom: string }

export interface DmaLigne {
  id: number
  designation: string
  materiauId?: number | null
  materiauCode?: string | null
  quantite: number
  unite: string
  prixUnitaireEst?: number | null
  fournisseurSuggere?: string | null
}

export interface DmaHistorique {
  id: number
  deStatut?: StatutDma | null
  versStatut: StatutDma
  userId: number
  userNom: string
  dateTransition: string
  commentaire?: string | null
}

export interface Dma {
  id: number
  reference: string
  projetId: number
  projetNom: string
  createurUserId: number
  createurNom: string
  statut: StatutDma
  priorite: PrioriteDma
  dateSouhaitee?: string | null
  commentaire?: string | null
  montantEstime?: number | null
  lignes: DmaLigne[]
  createdAt: string
  updatedAt: string
}

export interface DmaLignePayload {
  designation: string
  quantite: number
  unite: string
  prixUnitaireEst?: number
  fournisseurSuggere?: string
}

export interface DmaCreateRequest {
  projetId: number
  priorite?: PrioriteDma
  dateSouhaitee?: string
  commentaire?: string
  lignes: DmaLignePayload[]
  /** Idempotence offline (app terrain). */
  clientRequestId?: string
}

// ── Transferts d'engins (MouvementEngin) ───────────────────────

export type StatutTransfert = 'DEMANDE' | 'REJETE' | 'EN_ATTENTE_DEPART' | 'EN_TRANSIT' | 'RECU' | 'ANNULE'

export interface Transfert {
  id: number
  enginId: number
  enginCode: string
  enginNom: string
  projetOrigineId?: number | null
  projetOrigineNom?: string | null
  projetDestinationId: number
  projetDestinationNom: string
  initiateurUserId: number
  initiateurNom: string
  statut: StatutTransfert
  dateDemande: string
  dateDepartConfirmee?: string | null
  dateReceptionConfirmee?: string | null
  commentaire?: string | null
  validePar?: string | null
  dateValidation?: string | null
  motifRejet?: string | null
  receptionAvecReserves: boolean
  receptionParCodeManuel: boolean
  incidentReceptionId?: number | null
  createdAt: string
  updatedAt: string
}

/** Bon de transfert : QR token + code manuel (jamais exposés en liste). */
export interface TransfertBon {
  mouvementId: number
  qrToken: string
  codeReception: string
}

export interface ReceptionTransfertRequest {
  token?: string
  code?: string
  avecReserves: boolean
  commentaire?: string
  latitude?: number
  longitude?: number
  precisionMetres?: number
  photos?: string[]
}

export interface TransfertCreateRequest {
  enginId: number
  projetDestinationId: number
  commentaire?: string
  /** Idempotence offline (app terrain). */
  clientRequestId?: string
}

// ── Carnet engin (timeline fiche enrichie) ─────────────────────

export interface CarnetEntry {
  type: 'MAINTENANCE' | 'INCIDENT' | 'RELEVE_COMPTEUR' | 'CARBURANT' | 'MOUVEMENT' | string
  date: string
  titre: string
  detail?: string | null
  couleur: string
}

export interface CarnetEngin {
  enginId: number
  enginCode: string
  entries: CarnetEntry[]
}

// ── Notifications (écran Alertes) ──────────────────────────────

/** Aligné NotificationResponse backend. */
export interface TerrainNotification {
  id: number
  titre: string
  contenu?: string | null
  typeNotification: string
  lien?: string | null
  lu: boolean
  dateCreation: string
}

interface PageResponse<T> { content: T[] }

// ── Contexte utilisateur (rôles, permissions, chantiers) ───────

export interface TerrainMeChantier { id: number; nom: string; poste: string; depuis: string }

/** Aligné TerrainMeResponse backend. */
export interface TerrainMe {
  id: number
  nom: string
  prenom: string
  email: string
  roles: string[]
  permissions: string[]
  chantiers: TerrainMeChantier[]
}

export const terrainApi = {
  me: async (): Promise<TerrainMe> => {
    const response = await apiClient.get<TerrainMe>('/terrain/me')
    return response.data
  },
  chantiers: async (contexte?: 'transfert'): Promise<TerrainChantier[]> => {
    const response = await apiClient.get<TerrainChantier[]>('/terrain/chantiers',
      contexte ? { params: { contexte } } : undefined)
    return response.data
  },
  demandes: async (statut?: StatutDma): Promise<Dma[]> => {
    const response = await apiClient.get<PageResponse<Dma>>('/terrain/demandes', {
      params: { statut, sort: 'createdAt,desc', size: 50 },
    })
    return response.data.content
  },
  demande: async (id: number): Promise<Dma> => {
    const response = await apiClient.get<Dma>(`/terrain/demandes/${id}`)
    return response.data
  },
  /** PDF du bon de demande — blob authentifié (un <a href> n'enverrait pas le JWT). */
  demandePdf: async (id: number): Promise<Blob> => {
    const response = await apiClient.get<Blob>(`/terrain/demandes/${id}/pdf`, { responseType: 'blob', timeout: 30000 })
    return response.data
  },
  demandeHistorique: async (id: number): Promise<DmaHistorique[]> => {
    const response = await apiClient.get<DmaHistorique[]>(`/terrain/demandes/${id}/historique`)
    return response.data
  },
  creerDemande: async (data: DmaCreateRequest): Promise<Dma> => {
    const response = await apiClient.post<Dma>('/terrain/demandes', data)
    return response.data
  },
  /** Transitions simples avec commentaire optionnel. */
  demandeTransition: async (
    id: number,
    action: 'prendre-en-charge' | 'demander-complement' | 'completer' | 'livrer' | 'commander' | 'cloturer',
    commentaire?: string,
  ): Promise<Dma> => {
    const response = await apiClient.patch<Dma>(`/terrain/demandes/${id}/${action}`, { commentaire })
    return response.data
  },
  /** LEGACY (endpoints supprimés côté backend) — gardé pour le replay d'anciennes
   *  mutations outbox : le 404 renvoyé marque proprement l'entrée en 'error'. */
  demandeValider: async (
    id: number,
    etape: 'valider-chantier' | 'valider-projet',
    approuve: boolean,
    commentaire?: string,
  ): Promise<Dma> => {
    const response = await apiClient.patch<Dma>(`/terrain/demandes/${id}/${etape}`, { approuve, commentaire })
    return response.data
  },
  demandeRejeter: async (id: number, commentaire: string): Promise<Dma> => {
    const response = await apiClient.patch<Dma>(`/terrain/demandes/${id}/rejeter`, { commentaire })
    return response.data
  },
  transferts: async (statut?: StatutTransfert): Promise<Transfert[]> => {
    const response = await apiClient.get<PageResponse<Transfert>>('/terrain/transferts', {
      params: { statut, sort: 'dateDemande,desc', size: 50 },
    })
    return response.data.content
  },
  creerTransfert: async (data: TransfertCreateRequest): Promise<Transfert> => {
    const response = await apiClient.post<Transfert>('/terrain/transferts', data)
    return response.data
  },
  transfertAction: async (
    id: number,
    action: 'confirmer-depart' | 'annuler',
    commentaire?: string,
  ): Promise<Transfert> => {
    const response = await apiClient.patch<Transfert>(`/terrain/transferts/${id}/${action}`, { commentaire })
    return response.data
  },
  transfertValider: async (id: number, projetDestinationId?: number, commentaire?: string): Promise<Transfert> => {
    const response = await apiClient.patch<Transfert>(`/terrain/transferts/${id}/valider`, { projetDestinationId, commentaire })
    return response.data
  },
  transfertRejeter: async (id: number, motif: string): Promise<Transfert> => {
    const response = await apiClient.patch<Transfert>(`/terrain/transferts/${id}/rejeter`, { motif })
    return response.data
  },
  transfertBon: async (id: number): Promise<TransfertBon> => {
    const response = await apiClient.get<TransfertBon>(`/terrain/transferts/${id}/bon`)
    return response.data
  },
  transfertReceptionner: async (id: number, data: ReceptionTransfertRequest): Promise<Transfert> => {
    const response = await apiClient.patch<Transfert>(`/terrain/transferts/${id}/receptionner`, data)
    return response.data
  },
  transfertReceptionPhotos: async (id: number, files: File[]): Promise<string[]> => {
    const form = new FormData()
    files.slice(0, 3).forEach((f) => form.append('files', f))
    const response = await apiClient.post<{ urls: string[] }>(`/terrain/transferts/${id}/reception-photos`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    })
    return response.data.urls
  },
  mesEngins: async (): Promise<TerrainEngin[]> => {
    const response = await apiClient.get<TerrainEngin[]>('/terrain/mes-engins')
    return response.data
  },
  scan: async (q: string): Promise<TerrainEngin> => {
    const response = await apiClient.get<TerrainEngin>('/terrain/engins/scan', { params: { q } })
    return response.data
  },
  confirmerPosition: async (enginId: number, data: PositionEnginCreateRequest): Promise<PositionEngin> => {
    const response = await apiClient.post<PositionEngin>(`/terrain/engins/${enginId}/position`, data)
    return response.data
  },
  creerReleve: async (enginId: number, data: ReleveCompteurCreateRequest): Promise<ReleveCompteur> => {
    const response = await apiClient.post<ReleveCompteur>(`/terrain/engins/${enginId}/releve`, data)
    return response.data
  },
  creerRavitaillement: async (enginId: number, data: ConsommationCarburantCreateRequest): Promise<ConsommationCarburant> => {
    const response = await apiClient.post<ConsommationCarburant>(`/terrain/engins/${enginId}/ravitaillement`, data)
    return response.data
  },
  signalerIncident: async (enginId: number, data: IncidentEnginCreateRequest): Promise<IncidentEngin> => {
    const response = await apiClient.post<IncidentEngin>(`/terrain/engins/${enginId}/incident`, data)
    return response.data
  },
  creerInspection: async (enginId: number, data: InspectionEnginCreateRequest): Promise<InspectionEngin> => {
    const response = await apiClient.post<InspectionEngin>(`/terrain/engins/${enginId}/inspection`, data)
    return response.data
  },
  carnet: async (enginId: number): Promise<CarnetEngin> => {
    const response = await apiClient.get<CarnetEngin>(`/terrain/engins/${enginId}/carnet`)
    return response.data
  },
  notifications: async (): Promise<TerrainNotification[]> => {
    const response = await apiClient.get<PageResponse<TerrainNotification>>('/terrain/notifications', {
      params: { size: 50 },
    })
    return response.data.content
  },
  notificationsCount: async (): Promise<number> => {
    const response = await apiClient.get<{ count: number }>('/terrain/notifications/count')
    return response.data.count
  },
  marquerNotifLue: async (id: number): Promise<TerrainNotification> => {
    const response = await apiClient.patch<TerrainNotification>(`/terrain/notifications/${id}/lu`)
    return response.data
  },
  toutLu: async (): Promise<number> => {
    const response = await apiClient.patch<{ count: number }>('/terrain/notifications/tout-lu')
    return response.data.count
  },
}
