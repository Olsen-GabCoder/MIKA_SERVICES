/**
 * Données complètes de la page détail projet pour l'export document (Word, Excel, PDF).
 * Toutes les sections visibles sur la page doivent être incluses sans omission.
 */
import type { Projet } from '@/types/projet'
import type { ProjetReport } from '@/types/reporting'
import type { PointBloquant, Prevision, AvancementEtudeProjet } from '@/types/projet'

export interface LigneChiffreAffaires {
  label: string
  caPrevisionnel: number
  caRealise: number
  ecart: number
  /** Avancement cumulé en % ; null si aucun CA enregistré pour ce mois */
  avancementCumule: number | null
}

export type DocumentExportFormat = 'word' | 'excel' | 'pdf'

export interface ProjetDocumentPayload {
  projet: Projet
  rapport: ProjetReport | null
  /** Tableau de suivi mensuel (CA prévisionnel / réalisé par mois) */
  lignesCA: LigneChiffreAffaires[]
  pointsBloquants: PointBloquant[]
  previsions: Prevision[]
  /** Budget total prévu, dépenses totales (pour synthèse) */
  budgetPrevu: number
  depensesTotales: number
  /** Semaine et année calendaires en cours */
  semaineCalendaire: number
  anneeCalendaire: number
  /** Délai en mois (calculé ou projet.delaiMois) */
  delaiMois: number | null
  formatMontant: (n?: number) => string
  formatDate: (d?: string) => string
  /** Heure courante formatée selon la préférence utilisateur (12h/24h). Utilisé dans en-têtes/pieds de page. */
  formatTime?: () => string
}

/** Labels pour phases d'études (affichage) */
export const PHASE_ETUDE_LABELS: Record<string, string> = {
  APS: 'APS',
  APD: 'APD',
  EXE: 'EXe',
  GEOTECHNIQUE: 'Géotechnique',
  HYDRAULIQUE: 'Hydrologique / Hydraulique',
  EIES: 'EIES / Notice EIES',
  PAES: 'PAES',
}

/** Avancement études (avec label phase) pour export */
export function getAvancementEtudesWithLabels(
  etudes: AvancementEtudeProjet[] | undefined
): { phase: string; avancementPct: number | null; dateDepot: string; etatValidation: string }[] {
  const phases = ['APS', 'APD', 'EXE', 'GEOTECHNIQUE', 'HYDRAULIQUE', 'EIES', 'PAES'] as const
  return phases.map((phase) => {
    const e = etudes?.find((x) => x.phase === phase)
    return {
      phase: PHASE_ETUDE_LABELS[phase] ?? phase,
      avancementPct: e?.avancementPct ?? null,
      dateDepot: e?.dateDepot ?? '—',
      etatValidation: e?.etatValidation ?? '—',
    }
  })
}
