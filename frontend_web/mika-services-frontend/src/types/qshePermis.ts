export const TypePermis = {
  PERMIS_FEU: 'PERMIS_FEU', ESPACE_CONFINE: 'ESPACE_CONFINE', TRAVAIL_HAUTEUR: 'TRAVAIL_HAUTEUR',
  FOUILLE: 'FOUILLE', ELECTRIQUE: 'ELECTRIQUE', LOTO: 'LOTO', LEVAGE: 'LEVAGE', AUTRE: 'AUTRE',
} as const
export type TypePermis = (typeof TypePermis)[keyof typeof TypePermis]

export const StatutPermis = {
  DEMANDE: 'DEMANDE', APPROUVE: 'APPROUVE', ACTIF: 'ACTIF', EXPIRE: 'EXPIRE', ANNULE: 'ANNULE', CLOTURE: 'CLOTURE',
} as const
export type StatutPermis = (typeof StatutPermis)[keyof typeof StatutPermis]

export interface PermisTravailResponse {
  id: number; reference: string; typePermis: TypePermis; descriptionTravaux: string; statut: StatutPermis
  zoneTravail: string | null; dateDebutValidite: string | null; heureDebut: string | null
  dateFinValidite: string | null; heureFin: string | null
  mesuresSecurite: string | null; conditionsParticulieres: string | null
  projetId: number; projetNom: string
  demandeurId: number | null; demandeurNom: string | null
  autorisateurId: number | null; autorisateurNom: string | null
  dateApprobation: string | null; dateCloture: string | null; observationsCloture: string | null
  estExpire: boolean; estActif: boolean
  createdAt: string | null; updatedAt: string | null
}

export interface PermisTravailCreateRequest {
  projetId: number; typePermis: TypePermis; descriptionTravaux: string
  zoneTravail?: string; dateDebutValidite?: string; heureDebut?: string
  dateFinValidite?: string; heureFin?: string; mesuresSecurite?: string
  conditionsParticulieres?: string; demandeurId?: number
}

export interface PermisTravailUpdateRequest {
  typePermis?: TypePermis; descriptionTravaux?: string; statut?: StatutPermis
  zoneTravail?: string; dateDebutValidite?: string; heureDebut?: string
  dateFinValidite?: string; heureFin?: string; mesuresSecurite?: string
  conditionsParticulieres?: string; autorisateurId?: number; observationsCloture?: string
}

export interface PermisTravailSummaryResponse { totalPermis: number; actifs: number; expires: number }
export interface PaginatedResponse<T> { content: T[]; totalElements: number; totalPages: number; number: number; size: number }
