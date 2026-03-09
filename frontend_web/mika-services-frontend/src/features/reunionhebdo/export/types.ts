/**
 * Payload pour l'export PDF du procès-verbal.
 * Tous les projets avec les données utiles pour la semaine (prévisions, points bloquants)
 * — même structure que la section "Avancement des travaux" du document projet.
 */
import type { ReunionHebdo } from '@/types/reunionHebdo'
import type { Projet, Prevision, PointBloquant } from '@/types/projet'

/** Données d’un projet pour le PV : avancement de la semaine (tâches réalisées, prévisions, points bloquants, besoins). */
export interface ProjetDonneesSemaine {
  projet: Projet
  previsions: Prevision[]
  pointsBloquants: PointBloquant[]
}

export interface PVDocumentPayload {
  reunion: ReunionHebdo
  semaineReunion: number
  anneeReunion: number
  /** Tous les projets avec prévisions et points bloquants (ordre : par nom). */
  projetsData: ProjetDonneesSemaine[]
  formatDate: (d?: string) => string
  formatTime?: () => string
}
