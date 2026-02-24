export const StatutControleQualite = {
  PLANIFIE: 'PLANIFIE',
  EN_COURS: 'EN_COURS',
  CONFORME: 'CONFORME',
  NON_CONFORME: 'NON_CONFORME',
  ANNULE: 'ANNULE',
} as const

export type StatutControleQualite = (typeof StatutControleQualite)[keyof typeof StatutControleQualite]

export const TypeControle = {
  RECEPTION_MATERIAUX: 'RECEPTION_MATERIAUX',
  EN_COURS_EXECUTION: 'EN_COURS_EXECUTION',
  OUVRAGE_TERMINE: 'OUVRAGE_TERMINE',
  SECURITE: 'SECURITE',
  ENVIRONNEMENTAL: 'ENVIRONNEMENTAL',
  DOCUMENTAIRE: 'DOCUMENTAIRE',
  AUDIT_INTERNE: 'AUDIT_INTERNE',
  AUDIT_EXTERNE: 'AUDIT_EXTERNE',
} as const

export type TypeControle = (typeof TypeControle)[keyof typeof TypeControle]

export const GraviteNonConformite = {
  MINEURE: 'MINEURE',
  MAJEURE: 'MAJEURE',
  CRITIQUE: 'CRITIQUE',
  BLOQUANTE: 'BLOQUANTE',
} as const

export type GraviteNonConformite = (typeof GraviteNonConformite)[keyof typeof GraviteNonConformite]

export const StatutNonConformite = {
  OUVERTE: 'OUVERTE',
  EN_TRAITEMENT: 'EN_TRAITEMENT',
  ACTION_CORRECTIVE: 'ACTION_CORRECTIVE',
  VERIFIEE: 'VERIFIEE',
  CLOTUREE: 'CLOTUREE',
} as const

export type StatutNonConformite = (typeof StatutNonConformite)[keyof typeof StatutNonConformite]

export interface UserSummary {
  id: number
  nom: string
  prenom: string
  email: string
}

export interface ControleQualite {
  id: number
  projetId: number
  projetNom: string
  reference: string
  titre: string
  description: string | null
  typeControle: TypeControle
  statut: StatutControleQualite
  inspecteur: UserSummary | null
  datePlanifiee: string | null
  dateRealisation: string | null
  zoneControlee: string | null
  criteresVerification: string | null
  observations: string | null
  noteGlobale: number | null
  nbNonConformites: number
  createdAt: string
  updatedAt: string
}

export interface NonConformite {
  id: number
  controleQualiteId: number
  controleReference: string
  reference: string
  titre: string
  description: string | null
  gravite: GraviteNonConformite
  statut: StatutNonConformite
  responsableTraitement: UserSummary | null
  causeIdentifiee: string | null
  actionCorrective: string | null
  dateDetection: string | null
  dateEcheanceCorrection: string | null
  dateCloture: string | null
  preuveCorrection: string | null
  enRetard: boolean
  createdAt: string
  updatedAt: string
}

export interface QualiteSummary {
  totalControles: number
  controlesConformes: number
  controlesNonConformes: number
  controlesPlanifies: number
  controlesEnCours: number
  ncOuvertes: number
  ncParGravite: Record<string, number>
  tauxConformite: number
}

export interface ControleQualiteCreateRequest {
  projetId: number
  titre: string
  description?: string
  typeControle: TypeControle
  inspecteurId?: number
  datePlanifiee?: string
  zoneControlee?: string
  criteresVerification?: string
}

export interface ControleQualiteUpdateRequest {
  titre?: string
  description?: string
  statut?: StatutControleQualite
  inspecteurId?: number
  datePlanifiee?: string
  dateRealisation?: string
  zoneControlee?: string
  criteresVerification?: string
  observations?: string
  noteGlobale?: number
}

export interface NonConformiteCreateRequest {
  controleQualiteId: number
  titre: string
  description?: string
  gravite: GraviteNonConformite
  responsableTraitementId?: number
  dateDetection?: string
  dateEcheanceCorrection?: string
}

export interface NonConformiteUpdateRequest {
  titre?: string
  description?: string
  gravite?: GraviteNonConformite
  statut?: StatutNonConformite
  responsableTraitementId?: number
  causeIdentifiee?: string
  actionCorrective?: string
  dateEcheanceCorrection?: string
  preuveCorrection?: string
}

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
