import type { ProjetUserSummary, PageResponse } from './projet'

export type ConditionAcces = 'FACILE' | 'MOYEN' | 'DIFFICILE' | 'TRES_DIFFICILE'
export type ZoneClimatique = 'NORD' | 'SUD' | 'COTIER' | 'INTERIEUR' | 'ESTUAIRE'
export type TypeEquipe = 'TERRASSEMENT' | 'VOIRIE' | 'ASSAINISSEMENT' | 'GENIE_CIVIL' | 'BATIMENT' | 'PONT' | 'TOPOGRAPHIE' | 'LABORATOIRE' | 'MECANIQUE' | 'POLYVALENTE'
export type StatutAffectation = 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE' | 'SUSPENDUE'
export type RoleDansEquipe = 'CHEF_EQUIPE' | 'CHEF_EQUIPE_ADJOINT' | 'OUVRIER_QUALIFIE' | 'OUVRIER_SPECIALISE' | 'MANOEUVRE' | 'APPRENTI'

export interface Equipe {
  id: number
  code: string
  nom: string
  type: TypeEquipe
  chefEquipe?: ProjetUserSummary
  effectif: number
  actif: boolean
  createdAt?: string
  updatedAt?: string
}

export interface EquipeCreateRequest {
  code: string
  nom: string
  type: TypeEquipe
  chefEquipeId?: number
  effectif?: number
}

export interface EquipeUpdateRequest {
  nom?: string
  type?: TypeEquipe
  chefEquipeId?: number
  effectif?: number
}

export interface MembreEquipeResponse {
  id: number
  equipeId: number
  user: ProjetUserSummary
  role: RoleDansEquipe
  dateAffectation: string
  dateFin?: string
  actif: boolean
}

export interface MembreEquipeRequest {
  equipeId: number
  userId: number
  role: RoleDansEquipe
  dateAffectation?: string
}

export interface AffectationChantierResponse {
  id: number
  projetId: number
  projetNom: string
  equipeId: number
  equipeNom: string
  dateDebut: string
  dateFin?: string
  statut: StatutAffectation
  observations?: string
  createdAt?: string
}

export interface AffectationChantierRequest {
  projetId: number
  equipeId: number
  dateDebut: string
  dateFin?: string
  statut?: StatutAffectation
  observations?: string
}

export { type PageResponse }
