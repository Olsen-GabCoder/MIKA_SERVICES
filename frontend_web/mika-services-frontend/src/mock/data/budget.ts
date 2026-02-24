import type { BudgetSummary } from '@/types/budget'

export function getMockBudgetSummary(projetId: number): BudgetSummary {
  const byProjet: Record<number, BudgetSummary> = {
    1: {
      projetId: 1,
      projetNom: 'Réhabilitation RN1 - Section Libreville / Owendo',
      montantHT: 120_000_000,
      montantRevise: 120_000_000,
      totalDepenses: 78_000_000,
      budgetRestant: 42_000_000,
      tauxConsommation: 65,
      depensesParType: { MAIN_OEUVRE: 25_000_000, MATERIAUX: 35_000_000, MATERIEL: 12_000_000, TRANSPORT: 4_000_000, AUTRE: 2_000_000 },
    },
    2: {
      projetId: 2,
      projetNom: 'Assainissement quartier Akébé',
      montantHT: 85_000_000,
      montantRevise: 85_000_000,
      totalDepenses: 62_500_000,
      budgetRestant: 22_500_000,
      tauxConsommation: 74,
      depensesParType: { MAIN_OEUVRE: 18_000_000, MATERIAUX: 28_000_000, SOUS_TRAITANCE: 12_000_000, TRANSPORT: 2_500_000, AUTRE: 2_000_000 },
    },
  }
  const def: BudgetSummary = { projetId, projetNom: 'Projet', montantHT: 0, totalDepenses: 0, budgetRestant: 0, tauxConsommation: 0, depensesParType: {} }
  return byProjet[projetId] ?? def
}
