/**
 * Types alignés sur les réponses API barème (backend Kotlin).
 */

export const TypeLigneBareme = {
  MATERIAU: 'MATERIAU',
  PRESTATION_ENTETE: 'PRESTATION_ENTETE',
  PRESTATION_LIGNE: 'PRESTATION_LIGNE',
  PRESTATION_TOTAL: 'PRESTATION_TOTAL',
} as const

export type TypeLigneBareme = (typeof TypeLigneBareme)[keyof typeof TypeLigneBareme]

export interface CoefficientEloignement {
  id: number
  nom: string
  pourcentage: number | null
  coefficient: number
  note: string | null
  ordreAffichage: number
}

export interface CorpsEtatBareme {
  id: number
  code: string
  libelle: string
  ordreAffichage: number
}

export interface BaremeArticleList {
  id: number
  type: TypeLigneBareme
  reference: string | null
  libelle: string | null
  unite: string | null
  corpsEtat: CorpsEtatBareme
  fournisseurNom: string | null
  fournisseurContact: string | null
  prixTtc: number | null
  datePrix: string | null
  debourse: number | null
  prixVente: number | null
  unitePrestation: string | null
  /** True = montant estimé (donnée de remplacement, pas réelle entreprise) → afficher en jaune */
  prixEstime?: boolean
}

export interface PrixFournisseur {
  fournisseurId: number | null
  fournisseurNom: string
  fournisseurContact: string | null
  prixTtc: number | null
  datePrix: string | null
  prixEstime?: boolean
}

export interface LignePrestation {
  libelle: string | null
  quantite: number | null
  prixUnitaire: number | null
  unite: string | null
  somme: number | null
  prixEstime?: boolean
}

export interface BaremeArticleDetail {
  id: number
  type: TypeLigneBareme
  reference: string | null
  libelle: string | null
  unite: string | null
  corpsEtat: CorpsEtatBareme
  prixParFournisseur: PrixFournisseur[]
  lignesPrestation: LignePrestation[]
  debourse: number | null
  prixVente: number | null
  coefficientPv: number | null
  unitePrestation: string | null
  /** True = déboursé / P.V sont des valeurs estimées → afficher en jaune */
  totauxEstimes?: boolean
}

export interface BaremeVersion {
  derniereMiseAJour: string | null
}

/** Réponse paginée (après normalisation axios : page fusionné dans la racine). */
export interface BaremeArticlesPage {
  content: BaremeArticleList[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

/** Article groupé pour comparaison des prix entre fournisseurs (réponse /articles/compare). */
export interface BaremeArticleCompare {
  id: number
  type: TypeLigneBareme
  reference: string | null
  libelle: string | null
  unite: string | null
  corpsEtat: CorpsEtatBareme
  prixParFournisseur: PrixFournisseur[]
  debourse: number | null
  prixVente: number | null
  unitePrestation: string | null
  prixEstime?: boolean
}

export interface BaremeArticlesComparePage {
  content: BaremeArticleCompare[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface BaremeArticlesParams {
  page?: number
  size?: number
  corpsEtatId?: number
  type?: TypeLigneBareme
  fournisseurId?: number
  recherche?: string
}
