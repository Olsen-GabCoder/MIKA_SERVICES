import type { PageResponse, ProjetUserSummary } from './projet'

export type TypeDepense = 'MAIN_OEUVRE' | 'MATERIEL' | 'MATERIAUX' | 'SOUS_TRAITANCE' | 'TRANSPORT' | 'CARBURANT' | 'LOCATION_ENGIN' | 'FRAIS_GENERAUX' | 'ASSURANCE' | 'ETUDES' | 'AUTRE'
export type StatutDepense = 'BROUILLON' | 'SOUMISE' | 'VALIDEE' | 'REJETEE' | 'PAYEE'

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

export interface BudgetSummary {
  projetId: number
  projetNom: string
  montantHT?: number
  montantRevise?: number
  totalDepenses: number
  budgetRestant: number
  tauxConsommation: number
  depensesParType: Record<string, number>
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

export { type PageResponse }
