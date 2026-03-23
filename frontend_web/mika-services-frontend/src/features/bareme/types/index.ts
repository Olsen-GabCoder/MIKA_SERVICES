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
  famille: string | null
  categorie: string | null
  refReception: string | null
  codeFournisseur: string | null
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
  famille: string | null
  categorie: string | null
  refReception: string | null
  codeFournisseur: string | null
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
  famille: string | null
  categorie: string | null
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
  fournisseurNom?: string
  article?: string
  famille?: string
  categorie?: string
  unite?: string
  recherche?: string
}

export interface BaremePrestationLigneCreateRequest {
  libelle: string
  quantite?: number | null
  prixUnitaire?: number | null
  unite?: string | null
  somme?: number | null
  prixEstime?: boolean
}

export interface BaremeArticleCreateRequest {
  corpsEtatId: number
  type: TypeLigneBareme
  reference?: string | null
  libelle: string
  unite?: string | null
  famille?: string | null
  categorie?: string | null
  fournisseurId?: number | null
  fournisseurNom?: string | null
  fournisseurContact?: string | null
  prixTtc?: number | null
  datePrix?: string | null
  refReception?: string | null
  codeFournisseur?: string | null
  prixEstime?: boolean
  debourse?: number | null
  prixVente?: number | null
  coefficientPv?: number | null
  unitePrestation?: string | null
  totauxEstimes?: boolean
  lignesPrestation?: BaremePrestationLigneCreateRequest[]
}

/** Réponse GET /bareme/facets — listes distinctes sur toute la base (filtres croisés). */
export interface BaremeFilterFacets {
  categories: string[]
  familles: string[]
  unites: string[]
  fournisseurs: string[]
  articles: string[]
}

export type {
  RawSupplierPriceRow,
  CanonicalSupplierPriceRow,
  CataloguePriceStats,
  CanonicalArticleGroup,
} from './catalogue'

export {
  normalizeSupplierName,
  normalizeUnit,
  normalizeArticle,
  buildCanonicalSupplierPriceRow,
  computePriceStats,
  groupRowsByCanonicalArticle,
} from './catalogue'
