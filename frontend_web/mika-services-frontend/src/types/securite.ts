export const TypeIncident = {
  ACCIDENT_TRAVAIL: 'ACCIDENT_TRAVAIL',
  PRESQU_ACCIDENT: 'PRESQU_ACCIDENT',
  INCIDENT_MATERIEL: 'INCIDENT_MATERIEL',
  INCIDENT_ENVIRONNEMENTAL: 'INCIDENT_ENVIRONNEMENTAL',
  CHUTE: 'CHUTE',
  ELECTROCUTION: 'ELECTROCUTION',
  EFFONDREMENT: 'EFFONDREMENT',
  INCENDIE: 'INCENDIE',
  AUTRE: 'AUTRE',
} as const

export type TypeIncident = (typeof TypeIncident)[keyof typeof TypeIncident]

export const GraviteIncident = {
  BENIN: 'BENIN',
  LEGER: 'LEGER',
  GRAVE: 'GRAVE',
  TRES_GRAVE: 'TRES_GRAVE',
  MORTEL: 'MORTEL',
} as const

export type GraviteIncident = (typeof GraviteIncident)[keyof typeof GraviteIncident]

export const StatutIncident = {
  DECLARE: 'DECLARE',
  EN_INVESTIGATION: 'EN_INVESTIGATION',
  ANALYSE: 'ANALYSE',
  ACTIONS_EN_COURS: 'ACTIONS_EN_COURS',
  CLOTURE: 'CLOTURE',
} as const

export type StatutIncident = (typeof StatutIncident)[keyof typeof StatutIncident]

export const NiveauRisque = {
  FAIBLE: 'FAIBLE',
  MOYEN: 'MOYEN',
  ELEVE: 'ELEVE',
  CRITIQUE: 'CRITIQUE',
} as const

export type NiveauRisque = (typeof NiveauRisque)[keyof typeof NiveauRisque]

export const StatutActionPrevention = {
  PLANIFIEE: 'PLANIFIEE',
  EN_COURS: 'EN_COURS',
  REALISEE: 'REALISEE',
  VERIFIEE: 'VERIFIEE',
  ANNULEE: 'ANNULEE',
} as const

export type StatutActionPrevention = (typeof StatutActionPrevention)[keyof typeof StatutActionPrevention]

export interface UserSummary {
  id: number
  nom: string
  prenom: string
  email: string
}

export interface Incident {
  id: number
  projetId: number
  projetNom: string
  reference: string
  titre: string
  description: string | null
  typeIncident: TypeIncident
  gravite: GraviteIncident
  statut: StatutIncident
  dateIncident: string
  heureIncident: string | null
  lieu: string | null
  declarePar: UserSummary | null
  nbBlesses: number
  arretTravail: boolean
  nbJoursArret: number
  causeIdentifiee: string | null
  mesuresImmediates: string | null
  analyseCause: string | null
  nbActionsPrevention: number
  createdAt: string
  updatedAt: string
}

export interface Risque {
  id: number
  projetId: number
  projetNom: string
  titre: string
  description: string | null
  niveau: NiveauRisque
  probabilite: number | null
  impact: number | null
  zoneConcernee: string | null
  mesuresPrevention: string | null
  actif: boolean
  createdAt: string
  updatedAt: string
}

export interface ActionPrevention {
  id: number
  incidentId: number | null
  incidentReference: string | null
  titre: string
  description: string | null
  statut: StatutActionPrevention
  responsable: UserSummary | null
  dateEcheance: string | null
  dateRealisation: string | null
  commentaireVerification: string | null
  enRetard: boolean
  createdAt: string
  updatedAt: string
}

export interface SecuriteSummary {
  totalIncidents: number
  incidentsGraves: number
  totalJoursArret: number
  incidentsParGravite: Record<string, number>
  risquesActifs: number
  risquesCritiques: number
  actionsEnRetard: number
}

export interface IncidentCreateRequest {
  projetId: number
  titre: string
  description?: string
  typeIncident: TypeIncident
  gravite: GraviteIncident
  dateIncident: string
  heureIncident?: string
  lieu?: string
  declareParId?: number
  nbBlesses?: number
  arretTravail?: boolean
  nbJoursArret?: number
  mesuresImmediates?: string
}

export interface IncidentUpdateRequest {
  titre?: string
  description?: string
  statut?: StatutIncident
  gravite?: GraviteIncident
  causeIdentifiee?: string
  mesuresImmediates?: string
  analyseCause?: string
  nbBlesses?: number
  arretTravail?: boolean
  nbJoursArret?: number
}

export interface RisqueCreateRequest {
  projetId: number
  titre: string
  description?: string
  niveau: NiveauRisque
  probabilite?: number
  impact?: number
  zoneConcernee?: string
  mesuresPrevention?: string
}

export interface RisqueUpdateRequest {
  titre?: string
  description?: string
  niveau?: NiveauRisque
  probabilite?: number
  impact?: number
  zoneConcernee?: string
  mesuresPrevention?: string
  actif?: boolean
}

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
