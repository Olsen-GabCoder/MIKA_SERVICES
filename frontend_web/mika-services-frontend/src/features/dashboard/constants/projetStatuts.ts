import type { StatutProjet } from '@/types/projet'

export const STATUT_LABELS: Record<StatutProjet, string> = {
  INITIALISATION: 'Initialisation',
  EN_COURS_EXECUTION: "En cours d'exéc.",
  SUSPENSION: 'Suspension',
  RECEPTION_PROVISOIRE: 'Réc. provisoire',
  RECEPTION_DEFINITIVE: 'Réc. définitive',
  EN_AVANCE: 'En avance',
}

/** Index dans useChartColors().series pour chaque statut */
export const STATUT_COLOR_INDEX: Record<StatutProjet, number> = {
  EN_COURS_EXECUTION: 0,
  RECEPTION_DEFINITIVE: 1,
  EN_AVANCE: 2,
  INITIALISATION: 3,
  SUSPENSION: 5,
  RECEPTION_PROVISOIRE: 6,
}
