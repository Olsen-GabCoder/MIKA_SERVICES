/** Clés de tri UI / URL pour la liste catalogue barème (liste plate Excel). */
export const BAREME_CATALOG_SORT_FIELDS = [
  'reference',
  'fournisseur',
  'categorie',
  'famille',
  'libelle',
  'unite',
  'prixTtc',
] as const

export type BaremeCatalogSortField = (typeof BAREME_CATALOG_SORT_FIELDS)[number]

const DEFAULT_SORT: BaremeCatalogSortField = 'reference'

export function isBaremeCatalogSortField(v: string | null | undefined): v is BaremeCatalogSortField {
  return v != null && (BAREME_CATALOG_SORT_FIELDS as readonly string[]).includes(v)
}

export function parseBaremeCatalogSortField(v: string | null | undefined): BaremeCatalogSortField {
  return isBaremeCatalogSortField(v) ? v : DEFAULT_SORT
}

/** Propriété(s) JPA pour Spring Data `sort=` sur `LignePrixBareme`. */
export function toSpringSortProperty(field: BaremeCatalogSortField): string {
  switch (field) {
    case 'fournisseur':
      return 'fournisseurBareme.nom'
    default:
      return field
  }
}

export function buildCatalogSortParam(field: BaremeCatalogSortField, dir: 'asc' | 'desc'): string {
  return `${toSpringSortProperty(field)},${dir}`
}
