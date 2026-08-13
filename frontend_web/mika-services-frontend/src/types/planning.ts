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

export const TypeDependance = {
  FIN_DEBUT: 'FIN_DEBUT',
  DEBUT_DEBUT: 'DEBUT_DEBUT',
  FIN_FIN: 'FIN_FIN',
  DEBUT_FIN: 'DEBUT_FIN',
} as const

export type TypeDependance = (typeof TypeDependance)[keyof typeof TypeDependance]

export interface DependanceLegere {
  tacheId: number
  tacheTitre: string
  typeDependance: TypeDependance
  delaiJours: number
  direction: 'predecesseur' | 'successeur'
}

export interface DependanceResponse {
  id: number
  tacheSourceId: number
  tacheSourceTitre: string
  tacheCibleId: number
  tacheCibleTitre: string
  typeDependance: TypeDependance
  delaiJours: number
}

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
  estJalon: boolean
  couleur: string | null
  ordreAffichage: number | null
  dependances: DependanceLegere[]
  createdAt: string
  updatedAt: string
}

export interface GanttData {
  taches: Tache[]
  dependances: DependanceResponse[]
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
  estJalon?: boolean
  couleur?: string
  ordreAffichage?: number
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
  tacheParentId?: number
  estJalon?: boolean
  couleur?: string
  ordreAffichage?: number
}

export interface DependanceCreateRequest {
  tacheSourceId: number
  tacheCibleId: number
  typeDependance?: TypeDependance
  delaiJours?: number
}

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
