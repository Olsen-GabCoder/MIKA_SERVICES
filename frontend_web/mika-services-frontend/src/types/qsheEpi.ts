export const TypeEpi = {
  CASQUE: 'CASQUE', LUNETTES: 'LUNETTES', VISIERE: 'VISIERE', BOUCHONS_OREILLES: 'BOUCHONS_OREILLES',
  CASQUE_ANTIBRUIT: 'CASQUE_ANTIBRUIT', MASQUE_POUSSIERE: 'MASQUE_POUSSIERE', DEMI_MASQUE: 'DEMI_MASQUE',
  MASQUE_COMPLET: 'MASQUE_COMPLET', GANTS_MECANIQUES: 'GANTS_MECANIQUES', GANTS_CHIMIQUES: 'GANTS_CHIMIQUES',
  GANTS_THERMIQUES: 'GANTS_THERMIQUES', CHAUSSURES_SECURITE: 'CHAUSSURES_SECURITE',
  GILET_HAUTE_VISIBILITE: 'GILET_HAUTE_VISIBILITE', HARNAIS_ANTICHUTE: 'HARNAIS_ANTICHUTE',
  LONGE: 'LONGE', ENROULEUR: 'ENROULEUR', VETEMENT_TRAVAIL: 'VETEMENT_TRAVAIL',
  TABLIER_SOUDEUR: 'TABLIER_SOUDEUR', AUTRE: 'AUTRE',
} as const
export type TypeEpi = (typeof TypeEpi)[keyof typeof TypeEpi]

export const EtatEpi = { NEUF: 'NEUF', EN_SERVICE: 'EN_SERVICE', USE: 'USE', ENDOMMAGE: 'ENDOMMAGE', RETIRE: 'RETIRE' } as const
export type EtatEpi = (typeof EtatEpi)[keyof typeof EtatEpi]

export interface EpiResponse {
  id: number; code: string; typeEpi: TypeEpi; designation: string
  marque: string | null; modele: string | null; taille: string | null; normeReference: string | null
  etat: EtatEpi; dateAchat: string | null; datePremiereUtilisation: string | null
  dateExpiration: string | null; dateProchaineInspection: string | null
  prixUnitaire: number | null; affecteAId: number | null; affecteANom: string | null
  dateAffectation: string | null; quantiteStock: number; stockMinimum: number
  observations: string | null; expire: boolean; joursAvantExpiration: number | null; stockBas: boolean
  createdAt: string | null; updatedAt: string | null
}

export interface EpiCreateRequest {
  code: string; typeEpi: TypeEpi; designation: string
  marque?: string; modele?: string; taille?: string; normeReference?: string
  dateAchat?: string; dateExpiration?: string; prixUnitaire?: number
  affecteAId?: number; quantiteStock?: number; stockMinimum?: number; observations?: string
}

export interface EpiUpdateRequest {
  designation?: string; typeEpi?: TypeEpi; marque?: string; modele?: string; taille?: string
  normeReference?: string; etat?: EtatEpi; datePremiereUtilisation?: string; dateExpiration?: string
  dateProchaineInspection?: string; prixUnitaire?: number; affecteAId?: number; dateAffectation?: string
  quantiteStock?: number; stockMinimum?: number; observations?: string
}

export interface EpiSummaryResponse { totalEpi: number; enService: number; expires: number; stocksBas: number }
export interface PaginatedResponse<T> { content: T[]; totalElements: number; totalPages: number; number: number; size: number }
