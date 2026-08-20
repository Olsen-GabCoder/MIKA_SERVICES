/**
 * Workflow DMA — mapping statut → actions, MIROIR EXACT de DemandeMaterielService (backend).
 *
 * CIRCUIT À UNE SEULE PORTE (réforme 2026-08-20, aligné transferts, cf.
 * docs/matrice-roles-perimetres.md §2.2) : le chantier/projet soumet, la logistique
 * arbitre, le circuit s'exécute.
 *
 *   SOUMISE               → en attente logistique   (prendreEnCharge / rejeter)
 *   PRISE_EN_CHARGE       → en logistique           (commander / demanderComplement / rejeter)
 *   EN_ATTENTE_COMPLEMENT → renvoyée au terrain     (completer : créateur ou trio)
 *   EN_COMMANDE           → commandée               (livrer : créateur ou trio)
 *   LIVRE                 → livrée                  (cloturer : trio)
 *   REJETEE / CLOTUREE    → terminaux
 *   EN_VALIDATION_CHANTIER / EN_VALIDATION_PROJET → statuts LEGACY (ancien circuit à
 *   3 portes), plus jamais produits — lisibles dans l'historique, aucune action.
 *
 * Ce module est verrouillé par dmaWorkflow.test.ts : ne pas modifier la
 * correspondance statut → transition sans mettre à jour le backend ET le test.
 */
import type { StatutDma, TerrainMe } from '@/api/terrainApi'
import { canCompleterOuLivrer, isLogistiqueOuAdmin } from './me'

export type DmaTransitionAction =
  | 'prendre-en-charge' | 'demander-complement' | 'completer' | 'livrer' | 'commander' | 'cloturer'

export type DmaAction =
  /** Rejet logistique (endpoint /rejeter, motif obligatoire). */
  | { kind: 'rejeter' }
  | { kind: 'transition'; action: DmaTransitionAction; label: string }

/** Transition attendue par le backend pour chaque statut (exportée pour le test de non-régression). */
export const TRANSITION_PAR_STATUT: Record<StatutDma, string | null> = {
  SOUMISE: 'prendre-en-charge',
  PRISE_EN_CHARGE: 'commander',
  EN_ATTENTE_COMPLEMENT: 'completer',
  EN_COMMANDE: 'livrer',
  LIVRE: 'cloturer',
  REJETEE: null,
  CLOTUREE: null,
  // Legacy (ancien circuit) : plus aucune action possible.
  EN_VALIDATION_CHANTIER: null,
  EN_VALIDATION_PROJET: null,
}

/**
 * Actions affichables pour l'utilisateur courant sur une DMA.
 * Le backend reste le juge, mais on ne montre jamais un bouton dont on SAIT
 * qu'il finira en 400/403/404. Helpers permissifs quand `me` n'est pas chargé.
 */
export function actionsPour(
  statut: StatutDma,
  me: TerrainMe | null,
  dma: { projetId: number; createurUserId: number },
): DmaAction[] {
  const trio = isLogistiqueOuAdmin(me)

  switch (statut) {
    case 'SOUMISE':
      return trio
        ? [{ kind: 'transition', action: 'prendre-en-charge', label: 'Prendre en charge' }, { kind: 'rejeter' }]
        : []
    case 'PRISE_EN_CHARGE':
      return trio
        ? [
            { kind: 'transition', action: 'commander', label: 'Passer en commande' },
            { kind: 'transition', action: 'demander-complement', label: 'Demander un complément' },
            { kind: 'rejeter' },
          ]
        : []
    case 'EN_ATTENTE_COMPLEMENT':
      return canCompleterOuLivrer(me, dma.createurUserId)
        ? [{ kind: 'transition', action: 'completer', label: 'Renvoyer après complément' }]
        : []
    case 'EN_COMMANDE':
      return canCompleterOuLivrer(me, dma.createurUserId)
        ? [{ kind: 'transition', action: 'livrer', label: 'Confirmer la réception' }]
        : []
    case 'LIVRE':
      return trio
        ? [{ kind: 'transition', action: 'cloturer', label: 'Clôturer la demande' }]
        : []
    default:
      return []
  }
}
