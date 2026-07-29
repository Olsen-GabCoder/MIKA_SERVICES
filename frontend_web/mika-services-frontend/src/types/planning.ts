export const StatutTache = {
  A_FAIRE: 'A_FAIRE',
  EN_COURS: 'EN_COURS',
  EN_ATTENTE: 'EN_ATTENTE',
  TERMINEE: 'TERMINEE',
  ANNULEE: 'ANNULEE',
} as const

export type StatutTache = (typeof StatutTache)[keyof typeof StatutTache]

export const Priorite = {
  BASSE: 'BASSE',
  NORMALE: 'NORMALE',
  HAUTE: 'HAUTE',
  URGENTE: 'URGENTE',
  CRITIQUE: 'CRITIQUE',
} as const

export type Priorite = (typeof Priorite)[keyof typeof Priorite]

export interface UserSummary {
  id: number
  nom: string
  prenom: string
  email: string
}

export const TypePrevision = {
  HEBDOMADAIRE: 'HEBDOMADAIRE',
  MENSUELLE: 'MENSUELLE',
  TRIMESTRIELLE: 'TRIMESTRIELLE',
  PRODUCTION: 'PRODUCTION',
  APPROVISIONNEMENT: 'APPROVISIONNEMENT',
  RESSOURCES_HUMAINES: 'RESSOURCES_HUMAINES',
  MATERIEL: 'MATERIEL',
} as const

export type TypePrevision = (typeof TypePrevision)[keyof typeof TypePrevision]

export interface Tache {
  id: number
  projetId: number
  projetNom: string
  titre: string
  description: string | null
  statut: StatutTache
  priorite: Priorite
  assigneA: UserSummary | null
  dateDebut: string | null
  dateFin: string | null
  dateEcheance: string | null
  pourcentageAvancement: number
  enRetard: boolean
  tacheParentId: number | null
  semaine: number | null
  annee: number | null
  typePrevision: TypePrevision | null
  createdAt: string
  updatedAt: string
}

export interface TacheCreateRequest {
  projetId: number
  titre: string
  description?: string
  statut?: StatutTache
  priorite?: Priorite
  assigneAId?: number
  dateDebut?: string
  dateFin?: string
  dateEcheance?: string
  tacheParentId?: number
  semaine?: number
  annee?: number
  typePrevision?: TypePrevision
  pourcentageAvancement?: number
}

export interface TacheUpdateRequest {
  titre?: string
  description?: string
  statut?: StatutTache
  priorite?: Priorite
  assigneAId?: number
  dateDebut?: string
  dateFin?: string
  dateEcheance?: string
  pourcentageAvancement?: number
  semaine?: number
  annee?: number
  typePrevision?: TypePrevision
}

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
