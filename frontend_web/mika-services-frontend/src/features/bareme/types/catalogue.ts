export interface RawSupplierPriceRow {
  refReception: string | null
  codeFournisseur: string | null
  nomFournisseur: string | null
  article: string | null
  unite: string | null
  prixUnitaire: number | null
  famille: string | null
  categorie: string | null
}

export interface CanonicalSupplierPriceRow {
  refReception: string | null
  codeFournisseur: string | null
  fournisseurNom: string
  fournisseurKey: string
  articleBrut: string
  articleCanonique: string
  articleCanonicalKey: string
  uniteBrute: string | null
  uniteCanonique: string
  prixUnitaire: number | null
  famille: string
  categorie: string
}

export interface CataloguePriceStats {
  min: number | null
  mediane: number | null
  max: number | null
  nombrePrix: number
}

export interface CanonicalArticleGroup {
  articleCanonicalKey: string
  articleCanonique: string
  famille: string
  categorie: string
  uniteCanonique: string
  aliases: string[]
  stats: CataloguePriceStats
  fournisseurs: string[]
}

const DEFAULT_TEXT = 'N/A'
const UNKNOWN_SUPPLIER = 'FOURNISSEUR INCONNU'

const ARTICLE_ALIAS_MAP: Record<string, string> = {
  'LATTERITE': 'LATERITE',
  'LATERITES': 'LATERITE',
  'POLIANE': 'POLYANE',
  'TRELLIS': 'TREILLIS',
  'POINTRE': 'POINTE',
}

const UNIT_ALIAS_MAP: Record<string, string> = {
  TONNE: 'T',
  TON: 'T',
}

function compactSpaces(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function normalizeUpper(value: string | null | undefined, fallback = DEFAULT_TEXT): string {
  if (!value) return fallback
  const cleaned = compactSpaces(value)
  if (!cleaned) return fallback
  return cleaned.toUpperCase()
}

function normalizeForKey(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function applyAliases(value: string, aliasMap: Record<string, string>): string {
  let current = value
  for (const [alias, target] of Object.entries(aliasMap)) {
    const pattern = new RegExp(`\\b${alias}\\b`, 'g')
    current = current.replace(pattern, target)
  }
  return current
}

export function normalizeSupplierName(value: string | null | undefined): string {
  const upper = normalizeUpper(value, UNKNOWN_SUPPLIER)
  return compactSpaces(upper)
}

export function normalizeUnit(value: string | null | undefined): string {
  const upper = normalizeUpper(value, DEFAULT_TEXT)
  if (upper === DEFAULT_TEXT) return DEFAULT_TEXT
  return UNIT_ALIAS_MAP[upper] ?? upper
}

export function normalizeArticle(value: string | null | undefined): string {
  const upper = normalizeUpper(value, DEFAULT_TEXT)
  if (upper === DEFAULT_TEXT) return DEFAULT_TEXT
  return applyAliases(upper, ARTICLE_ALIAS_MAP)
}

export function buildCanonicalSupplierPriceRow(row: RawSupplierPriceRow): CanonicalSupplierPriceRow {
  const fournisseurNom = normalizeSupplierName(row.nomFournisseur)
  const fournisseurKey = normalizeForKey(fournisseurNom)
  const articleBrut = normalizeUpper(row.article, DEFAULT_TEXT)
  const articleCanonique = normalizeArticle(row.article)
  const uniteCanonique = normalizeUnit(row.unite)
  const famille = normalizeUpper(row.famille, DEFAULT_TEXT)
  const categorie = normalizeUpper(row.categorie, DEFAULT_TEXT)

  return {
    refReception: row.refReception ?? null,
    codeFournisseur: row.codeFournisseur ?? null,
    fournisseurNom,
    fournisseurKey,
    articleBrut,
    articleCanonique,
    articleCanonicalKey: normalizeForKey(articleCanonique),
    uniteBrute: row.unite ?? null,
    uniteCanonique,
    prixUnitaire: row.prixUnitaire ?? null,
    famille,
    categorie,
  }
}

export function computePriceStats(prices: Array<number | null | undefined>): CataloguePriceStats {
  const values = prices
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b)

  if (values.length === 0) {
    return { min: null, mediane: null, max: null, nombrePrix: 0 }
  }

  const middle = Math.floor(values.length / 2)
  const mediane =
    values.length % 2 === 0
      ? (values[middle - 1] + values[middle]) / 2
      : values[middle]

  return {
    min: values[0],
    mediane,
    max: values[values.length - 1],
    nombrePrix: values.length,
  }
}

export function groupRowsByCanonicalArticle(
  rows: CanonicalSupplierPriceRow[]
): CanonicalArticleGroup[] {
  const byKey = new Map<string, CanonicalSupplierPriceRow[]>()

  for (const row of rows) {
    const key = row.articleCanonicalKey
    const list = byKey.get(key)
    if (list) {
      list.push(row)
    } else {
      byKey.set(key, [row])
    }
  }

  return Array.from(byKey.values()).map((group) => {
    const first = group[0]
    const aliases = Array.from(new Set(group.map((r) => r.articleBrut))).sort()
    const fournisseurs = Array.from(new Set(group.map((r) => r.fournisseurNom))).sort()
    const stats = computePriceStats(group.map((r) => r.prixUnitaire))

    return {
      articleCanonicalKey: first.articleCanonicalKey,
      articleCanonique: first.articleCanonique,
      famille: first.famille,
      categorie: first.categorie,
      uniteCanonique: first.uniteCanonique,
      aliases,
      stats,
      fournisseurs,
    }
  })
}
