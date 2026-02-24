import type { GlobalDashboard, ProjetReport, EvolutionPoint } from '@/types/reporting'

export const mockGlobalDashboard: GlobalDashboard = {
  projets: {
    total: 5,
    enCours: 3,
    termines: 2,
    enRetard: 1,
  },
  chantiers: {
    total: 12,
    actifs: 8,
    termines: 4,
  },
  budget: {
    budgetTotalPrevu: 450_000_000,
    depensesTotales: 287_500_000,
    ecart: -162_500_000,
    tauxConsommation: 64,
  },
  planning: {
    tachesTotal: 86,
    tachesTerminees: 52,
    tachesEnCours: 24,
    tachesEnRetard: 3,
    tauxAvancement: 60,
  },
  qualite: {
    controlesTotal: 28,
    tauxConformite: 89,
    ncOuvertes: 2,
  },
  securite: {
    incidentsTotal: 4,
    incidentsGraves: 1,
    joursArretTotal: 5,
    risquesCritiques: 2,
  },
  materiel: {
    enginsTotal: 18,
    enginsDisponibles: 12,
    materiauxStockBas: 3,
  },
}

export const mockProjetReport1: ProjetReport = {
  projetId: 1,
  projetNom: 'Réhabilitation RN1 - Section Libreville / Owendo',
  statut: 'EN_COURS',
  nbChantiers: 4,
  nbSousProjets: 2,
  budget: {
    budgetTotalPrevu: 120_000_000,
    depensesTotales: 78_000_000,
    ecart: -42_000_000,
    tauxConsommation: 65,
  },
  planning: {
    tachesTotal: 24,
    tachesTerminees: 14,
    tachesEnCours: 8,
    tachesEnRetard: 1,
    tauxAvancement: 58,
  },
  qualite: {
    controlesTotal: 10,
    tauxConformite: 92,
    ncOuvertes: 1,
  },
  securite: {
    incidentsTotal: 2,
    incidentsGraves: 0,
    joursArretTotal: 2,
    risquesCritiques: 1,
  },
}

export const mockProjetReport2: ProjetReport = {
  projetId: 2,
  projetNom: 'Assainissement quartier Akébé',
  statut: 'EN_COURS',
  nbChantiers: 3,
  nbSousProjets: 1,
  budget: {
    budgetTotalPrevu: 85_000_000,
    depensesTotales: 62_500_000,
    ecart: -22_500_000,
    tauxConsommation: 74,
  },
  planning: {
    tachesTotal: 18,
    tachesTerminees: 12,
    tachesEnCours: 5,
    tachesEnRetard: 0,
    tauxAvancement: 67,
  },
  qualite: {
    controlesTotal: 8,
    tauxConformite: 88,
    ncOuvertes: 0,
  },
  securite: {
    incidentsTotal: 1,
    incidentsGraves: 0,
    joursArretTotal: 0,
    risquesCritiques: 0,
  },
}

export function getMockProjetReport(projetId: number): ProjetReport | null {
  if (projetId === 1) return mockProjetReport1
  if (projetId === 2) return mockProjetReport2
  return mockProjetReport1 // fallback pour tout autre id
}

/** Données d'évolution mensuelle pour graphiques de tendance (6 derniers mois) */
export const mockEvolutionMensuelle: EvolutionPoint[] = [
  { mois: '2024-09', label: 'Sept.', depenses: 42_000_000, tachesTerminees: 8, incidents: 0, controlesRealises: 4 },
  { mois: '2024-10', label: 'Oct.', depenses: 48_500_000, tachesTerminees: 12, incidents: 1, controlesRealises: 5 },
  { mois: '2024-11', label: 'Nov.', depenses: 52_000_000, tachesTerminees: 10, incidents: 0, controlesRealises: 6 },
  { mois: '2024-12', label: 'Déc.', depenses: 61_000_000, tachesTerminees: 14, incidents: 2, controlesRealises: 4 },
  { mois: '2025-01', label: 'Janv.', depenses: 44_000_000, tachesTerminees: 11, incidents: 1, controlesRealises: 5 },
  { mois: '2025-02', label: 'Févr.', depenses: 40_000_000, tachesTerminees: 15, incidents: 0, controlesRealises: 4 },
]
