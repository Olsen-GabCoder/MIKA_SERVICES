import type { PhaseEtude, Priorite, TypePrevision } from './projet'

export interface RapportAnalyseResponse {
  suiviMensuel: SuiviMensuelExtrait[] | null
  previsions: PrevisionExtraite[] | null
  pointsBloquants: PointBloquantExtrait[] | null
  avancementEtudes: AvancementEtudeExtrait[] | null
  avancementPhysiquePct: number | null
  avancementFinancierPct: number | null
  delaiConsommePct: number | null
  besoinsMateriel: string | null
  besoinsHumain: string | null
  observations: string | null
  propositionsAmelioration: string | null
  avertissements: string[]
  champsExtraits: string[]
  doublons: DoublonsDetectes | null
}

export interface SuiviMensuelExtrait {
  mois: number
  annee: number
  caPrevisionnel: number | null
  caRealise: number | null
}

export interface PrevisionExtraite {
  description: string
  type: TypePrevision
  semaine: number
  annee: number
  avancementPct: number | null
}

export interface PointBloquantExtrait {
  titre: string
  description: string | null
  priorite: Priorite
  actionCorrective: string | null
}

export interface AvancementEtudeExtrait {
  phase: PhaseEtude
  avancementPct: number | null
  etatValidation: string | null
}

export interface DoublonsDetectes {
  suiviMensuel: DoublonCA[] | null
  previsions: DoublonPrevision[] | null
  pointsBloquants: DoublonPB[] | null
}

export interface DoublonCA {
  mois: number
  annee: number
  caReelExistant: number | null
  caPrevisionnelExistant: number | null
}

export interface DoublonPrevision {
  previsionExistanteId: number
  descriptionExistante: string
  descriptionNouvelle: string
  semaine: number
  annee: number
}

export interface DoublonPB {
  pointBloquantExistantId: number
  titreExistant: string
  titreNouveau: string
  statutExistant: string
}
