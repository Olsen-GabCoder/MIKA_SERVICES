export enum NatureReception {
  TOPOGRAPHIE = 'TOPOGRAPHIE',
  GEOTECHNIQUE_LABORATOIRE = 'GEOTECHNIQUE_LABORATOIRE',
  OUVRAGE = 'OUVRAGE',
}

export enum SousTypeReception {
  TERRASSEMENT = 'TERRASSEMENT',
  GENIE_CIVIL = 'GENIE_CIVIL',
}

export enum StatutReception {
  ETABLIE = 'ETABLIE',
  EN_ATTENTE_MDC = 'EN_ATTENTE_MDC',
  ACCORDEE_SANS_RESERVE = 'ACCORDEE_SANS_RESERVE',
  ACCORDEE_AVEC_RESERVE = 'ACCORDEE_AVEC_RESERVE',
  REJETEE = 'REJETEE',
}

export interface DemandeReceptionResponse {
  id: number
  reference: string
  titre: string
  nature: NatureReception
  sousType: SousTypeReception
  statut: StatutReception
  description: string | null
  zoneOuvrage: string | null
  dateDemande: string | null
  dateDecision: string | null
  projetId: number
  projetNom: string
  demandeurId: number | null
  demandeurNom: string | null
  decideurId: number | null
  decideurNom: string | null
  observations: string | null
  moisReference: string
  createdAt: string | null
  updatedAt: string | null
}

export interface DemandeReceptionCreateRequest {
  projetId: number
  titre: string
  nature: NatureReception
  sousType: SousTypeReception
  description?: string
  zoneOuvrage?: string
  dateDemande?: string
  demandeurId?: number
  moisReference?: string
}

export interface DemandeReceptionUpdateRequest {
  titre?: string
  description?: string
  zoneOuvrage?: string
  statut?: StatutReception
  dateDemande?: string
  dateDecision?: string
  decideurId?: number
  observations?: string
}

export interface ReceptionSummaryResponse {
  nature: NatureReception
  sousType: SousTypeReception
  total: number
  parStatut: Record<string, number>
}
