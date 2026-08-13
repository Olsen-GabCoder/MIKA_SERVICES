import type { PageResponse, ProjetUserSummary } from './projet'

export type TypeDepense = 'MAIN_OEUVRE' | 'MATERIEL' | 'MATERIAUX' | 'SOUS_TRAITANCE' | 'TRANSPORT' | 'CARBURANT' | 'LOCATION_ENGIN' | 'FRAIS_GENERAUX' | 'ASSURANCE' | 'ETUDES' | 'AUTRE'
export type StatutDepense = 'BROUILLON' | 'SOUMISE' | 'VALIDEE' | 'REJETEE' | 'PAYEE'
export type StatutSituation = 'BROUILLON' | 'SOUMISE' | 'VALIDEE' | 'REJETEE' | 'FACTUREE' | 'PAYEE'

export interface Depense {
  id: number
  projetId: number
  projetNom: string
  reference: string
  libelle: string
  type: TypeDepense
  montant: number
  dateDepense: string
  statut: StatutDepense
  fournisseur?: string
  numeroFacture?: string
  observations?: string
  validePar?: ProjetUserSummary
  dateValidation?: string
  createdAt?: string
}

export interface EvolutionMensuelle {
  annee: number
  mois: number
  montant: number
}

export interface BudgetSummary {
  projetId: number
  projetNom: string
  montantHT?: number
  montantRevise?: number
  totalDepenses: number
  budgetRestant: number
  tauxConsommation: number
  depensesParType: Record<string, number>
  nbDepenses: number
  nbDepensesEnAttente: number
  nbSituations: number
  evolutionMensuelle: EvolutionMensuelle[]
  seuilAlerte: 'NORMAL' | 'ATTENTION' | 'CRITIQUE'
}

export interface DepenseCreateRequest {
  projetId: number
  reference: string
  libelle: string
  type: TypeDepense
  montant: number
  dateDepense: string
  fournisseur?: string
  numeroFacture?: string
  observations?: string
}

export interface SituationTravaux {
  id: number
  projetId: number
  projetNom: string
  numero: number
  periodeDebut: string
  periodeFin: string
  montantTravauxCumule: number
  montantTravauxMois: number
  avancementPhysiquePct?: number
  retenueGarantiePct: number
  montantRetenueGarantie?: number
  montantNet?: number
  statut: StatutSituation
  observations?: string
  validePar?: ProjetUserSummary
  dateValidation?: string
  createdAt?: string
}

export interface SituationCreateRequest {
  projetId: number
  periodeDebut: string
  periodeFin: string
  montantTravauxCumule: number
  montantTravauxMois: number
  avancementPhysiquePct?: number
  retenueGarantiePct?: number
  observations?: string
}

export { type PageResponse }
