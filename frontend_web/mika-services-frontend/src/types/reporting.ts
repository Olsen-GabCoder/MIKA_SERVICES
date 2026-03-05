export interface ProjetStats {
  total: number
  enCours: number
  termines: number
  enRetard: number
  montantTotal: number
  avancementMoyen: number
  parStatut: Record<string, number>
}

export interface ChantierStats {
  total: number
  actifs: number
  termines: number
}

export interface BudgetStats {
  budgetTotalPrevu: number
  depensesTotales: number
  ecart: number
  tauxConsommation: number
}

export interface PlanningStats {
  tachesTotal: number
  tachesTerminees: number
  tachesEnCours: number
  tachesEnRetard: number
  tauxAvancement: number
}

export interface QualiteStats {
  controlesTotal: number
  tauxConformite: number
  ncOuvertes: number
}

export interface SecuriteStats {
  incidentsTotal: number
  incidentsGraves: number
  joursArretTotal: number
  risquesCritiques: number
}

export interface MaterielStats {
  enginsTotal: number
  enginsDisponibles: number
  materiauxStockBas: number
}

export interface GlobalDashboard {
  projets: ProjetStats
  chantiers: ChantierStats
  budget: BudgetStats
  planning: PlanningStats
  qualite: QualiteStats
  securite: SecuriteStats
  materiel: MaterielStats
  weeklyProgress: WeeklyProgressStats
}

export interface WeeklyProgressStats {
  semaineActuelle: number
  anneeActuelle: number
  weeks: WeekSummary[]
}

export interface WeekSummary {
  semaine: number
  annee: number
  label: string
  total: number
  terminees: number
  enCours: number
  nonCommencees: number
  avancementMoyen: number
  isCurrent: boolean
}

export interface ProjetReport {
  projetId: number
  projetNom: string
  statut: string
  budget: BudgetStats
  planning: PlanningStats
  qualite: QualiteStats
  securite: SecuriteStats
  nbChantiers: number
  nbSousProjets: number
}

/** Point de données pour graphiques d'évolution temporelle */
export interface EvolutionPoint {
  mois: string
  label: string
  depenses: number
  tachesTerminees: number
  incidents: number
  controlesRealises: number
}

/** Données d'évolution mensuelle pour graphiques de tendance */
export interface EvolutionMensuelle {
  mois: string
  depenses: number
  incidents: number
  tachesTerminees: number
  tauxConformite?: number
}
