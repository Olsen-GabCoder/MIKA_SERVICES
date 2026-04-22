export enum StatutAgrement {
  PREVU_AU_MARCHE = 'PREVU_AU_MARCHE',
  ETABLI = 'ETABLI',
  EN_ATTENTE_MDC = 'EN_ATTENTE_MDC',
  ACCORDE_SANS_RESERVE = 'ACCORDE_SANS_RESERVE',
  ACCORDE_AVEC_RESERVE = 'ACCORDE_AVEC_RESERVE',
  REJETE = 'REJETE',
}

export interface AgrementMarcheResponse {
  id: number
  reference: string
  objet: string
  titre: string
  statut: StatutAgrement
  description: string | null
  dateSoumission: string | null
  dateDecision: string | null
  projetId: number
  projetNom: string
  decideurId: number | null
  decideurNom: string | null
  observations: string | null
  moisReference: string
  createdAt: string | null
  updatedAt: string | null
}

export interface AgrementMarcheCreateRequest {
  projetId: number
  objet: string
  titre: string
  statut?: StatutAgrement
  description?: string
  dateSoumission?: string
  moisReference?: string
}

export interface AgrementMarcheUpdateRequest {
  objet?: string
  titre?: string
  description?: string
  statut?: StatutAgrement
  dateSoumission?: string
  dateDecision?: string
  decideurId?: number
  observations?: string
}

export interface AgrementSummaryResponse {
  total: number
  parStatut: Record<string, number>
}
