import type { Projet } from '@/types/projet'
import type { ProjetReport } from '@/types/reporting'
import type { PointBloquant, Prevision } from '@/types/projet'

export interface LigneChiffreAffaires {
  label: string
  caPrevisionnel: number
  caRealise: number
  ecart: number
  avancementCumule: number
}

export interface ProjetPdfData {
  projet: Projet
  rapport: ProjetReport | null
  lignesCA: LigneChiffreAffaires[]
  pointsBloquants: PointBloquant[]
  previsions: Prevision[]
  formatMontant: (n?: number) => string
  formatDate: (d?: string) => string
}

export type ProjetPdfTemplateId = 'fiche' | 'synthese' | 'rapport-complet'

export interface ProjetPdfTemplate {
  id: ProjetPdfTemplateId
  label: string
  description: string
}
