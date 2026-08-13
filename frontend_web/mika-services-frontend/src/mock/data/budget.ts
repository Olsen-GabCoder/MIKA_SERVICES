import type { BudgetSummary } from '@/types/budget'

export function getMockBudgetSummary(projetId: number): BudgetSummary {
  const byProjet: Record<number, BudgetSummary> = {
    1: {
      projetId: 1,
      projetNom: 'Rehabilitation RN1 - Section Libreville / Owendo',
      montantHT: 120_000_000,
      montantRevise: 120_000_000,
      totalDepenses: 78_000_000,
      budgetRestant: 42_000_000,
      tauxConsommation: 65,
      depensesParType: { MAIN_OEUVRE: 25_000_000, MATERIAUX: 35_000_000, MATERIEL: 12_000_000, TRANSPORT: 4_000_000, AUTRE: 2_000_000 },
      nbDepenses: 24,
      nbDepensesEnAttente: 3,
      nbSituations: 4,
      evolutionMensuelle: [
        { annee: 2024, mois: 1, montant: 8_000_000 },
        { annee: 2024, mois: 2, montant: 15_000_000 },
        { annee: 2024, mois: 3, montant: 22_000_000 },
        { annee: 2024, mois: 4, montant: 18_000_000 },
        { annee: 2024, mois: 5, montant: 15_000_000 },
      ],
      seuilAlerte: 'NORMAL',
    },
    2: {
      projetId: 2,
      projetNom: 'Assainissement quartier Akebe',
      montantHT: 85_000_000,
      montantRevise: 85_000_000,
      totalDepenses: 62_500_000,
      budgetRestant: 22_500_000,
      tauxConsommation: 74,
      depensesParType: { MAIN_OEUVRE: 18_000_000, MATERIAUX: 28_000_000, SOUS_TRAITANCE: 12_000_000, TRANSPORT: 2_500_000, AUTRE: 2_000_000 },
      nbDepenses: 18,
      nbDepensesEnAttente: 1,
      nbSituations: 3,
      evolutionMensuelle: [
        { annee: 2024, mois: 2, montant: 12_000_000 },
        { annee: 2024, mois: 3, montant: 20_000_000 },
        { annee: 2024, mois: 4, montant: 18_000_000 },
        { annee: 2024, mois: 5, montant: 12_500_000 },
      ],
      seuilAlerte: 'ATTENTION',
    },
  }
  const def: BudgetSummary = {
    projetId, projetNom: 'Projet', montantHT: 0, totalDepenses: 0, budgetRestant: 0,
    tauxConsommation: 0, depensesParType: {}, nbDepenses: 0, nbDepensesEnAttente: 0,
    nbSituations: 0, evolutionMensuelle: [], seuilAlerte: 'NORMAL',
  }
  return byProjet[projetId] ?? def
}
