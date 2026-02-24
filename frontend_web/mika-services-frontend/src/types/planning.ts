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
  createdAt: string
  updatedAt: string
}

export interface TacheCreateRequest {
  projetId: number
  titre: string
  description?: string
  priorite?: Priorite
  assigneAId?: number
  dateDebut?: string
  dateFin?: string
  dateEcheance?: string
  tacheParentId?: number
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
}

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
