// Types Réunions hebdomadaires / PV - MIKA SERVICES

export type StatutReunion = 'BROUILLON' | 'VALIDE'

export interface ReunionUserSummary {
  id: number
  nom: string
  prenom: string
  email: string
}

export interface ParticipantReunion {
  id: number
  userId: number
  nom: string
  prenom: string
  email: string
  initiales?: string
  telephone?: string
  present: boolean
}

export interface PointProjetPV {
  id: number
  projetId: number
  projetCode: string
  projetNom: string
  chefProjetNom?: string
  avancementPhysiquePct?: number
  avancementFinancierPct?: number
  delaiConsommePct?: number
  resumeTravauxPrevisions?: string
  pointsBloquantsResume?: string
  besoinsMateriel?: string
  besoinsHumain?: string
  propositionsAmelioration?: string
  ordreAffichage: number
}

export interface ReunionHebdo {
  id: number
  dateReunion: string
  lieu?: string
  heureDebut?: string
  heureFin?: string
  ordreDuJour?: string
  statut: StatutReunion
  divers?: string
  redacteur?: ReunionUserSummary
  participants: ParticipantReunion[]
  pointsProjet: PointProjetPV[]
  createdAt?: string
  updatedAt?: string
}

export interface ReunionHebdoSummary {
  id: number
  dateReunion: string
  lieu?: string
  heureDebut?: string
  heureFin?: string
  statut: StatutReunion
  redacteurNom?: string
  nombreParticipants: number
  nombrePointsProjet: number
}

export interface ReunionHebdoCreateRequest {
  dateReunion: string
  lieu?: string
  heureDebut?: string
  heureFin?: string
  ordreDuJour?: string
  statut?: StatutReunion
  divers?: string
  redacteurId?: number
  participants: ParticipantReunionRequest[]
}

export interface ReunionHebdoUpdateRequest {
  dateReunion?: string
  lieu?: string
  heureDebut?: string
  heureFin?: string
  ordreDuJour?: string
  statut?: StatutReunion
  divers?: string
  redacteurId?: number
  participants?: ParticipantReunionRequest[]
}

export interface ParticipantReunionRequest {
  userId: number
  initiales?: string
  telephone?: string
  present?: boolean
}

export interface PointProjetPVRequest {
  projetId: number
  avancementPhysiquePct?: number
  avancementFinancierPct?: number
  delaiConsommePct?: number
  resumeTravauxPrevisions?: string
  pointsBloquantsResume?: string
  besoinsMateriel?: string
  besoinsHumain?: string
  propositionsAmelioration?: string
  ordreAffichage?: number
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}
