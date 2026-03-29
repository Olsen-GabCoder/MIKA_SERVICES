import type { CorpsEtatBareme } from './types'

/**
 * Corps d'état technique (FK) pour les articles créés en UI : préfère un code catalogue si présent,
 * sinon le premier selon ordre d'affichage.
 */
export function defaultBaremeCatalogueCorpsEtatId(corps: CorpsEtatBareme[]): number | null {
  if (corps.length === 0) return null
  const byCatalogue = corps.find((c) => /CATALOGUE/i.test(c.code))
  if (byCatalogue) return byCatalogue.id
  const sorted = [...corps].sort((a, b) => a.ordreAffichage - b.ordreAffichage || a.id - b.id)
  return sorted[0]?.id ?? null
}
