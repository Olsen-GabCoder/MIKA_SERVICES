import { useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { parseBaremeCatalogSortField, type BaremeCatalogSortField } from '../baremeCatalogSort'

const PAGE_SIZE = 20
const DEBOUNCE_MS = 350

const DEFAULT_SORT_FIELD: BaremeCatalogSortField = 'reference'

export interface BaremeListParams {
  page: number
  size: number
  recherche: string
  article: string
  fournisseur: string
  unite: string
  famille: string
  categorie: string
  /** Tri catalogue (liste plate) — pas utilisé en mode comparaison. */
  sortField: BaremeCatalogSortField
  sortDir: 'asc' | 'desc'
}

const defaultParams: BaremeListParams = {
  page: 0,
  size: PAGE_SIZE,
  recherche: '',
  article: '',
  fournisseur: '',
  unite: '',
  famille: '',
  categorie: '',
  sortField: DEFAULT_SORT_FIELD,
  sortDir: 'asc',
}

function parseNumber(value: string | null): number | null {
  if (value == null || value === '') return null
  const n = parseInt(value, 10)
  return Number.isNaN(n) ? null : n
}

export function useBaremeListParams(): {
  params: BaremeListParams
  setPage: (page: number) => void
  setSize: (size: number) => void
  setRecherche: (q: string) => void
  setArticle: (value: string) => void
  setFournisseur: (value: string) => void
  setUnite: (value: string) => void
  setFamille: (value: string) => void
  setCategorie: (value: string) => void
  setCatalogSort: (field: BaremeCatalogSortField) => void
  resetFilters: () => void
} {
  const [searchParams, setSearchParams] = useSearchParams()

  const params = useMemo((): BaremeListParams => {
    const sortDir: 'asc' | 'desc' = searchParams.get('cdir') === 'desc' ? 'desc' : 'asc'
    return {
      page: Math.max(0, parseNumber(searchParams.get('page')) ?? 0),
      size: Math.min(100, Math.max(5, parseNumber(searchParams.get('size')) ?? PAGE_SIZE)),
      recherche: searchParams.get('recherche') ?? '',
      article: searchParams.get('article') ?? '',
      fournisseur: searchParams.get('fournisseur') ?? '',
      unite: searchParams.get('unite') ?? '',
      famille: searchParams.get('famille') ?? '',
      categorie: searchParams.get('categorie') ?? '',
      sortField: parseBaremeCatalogSortField(searchParams.get('csort')),
      sortDir,
    }
  }, [searchParams])

  const updateParams = useCallback((updates: Partial<BaremeListParams>, replaceHistory = true) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      const nextPage = updates.page ?? params.page
      const nextSize = updates.size ?? params.size
      const nextRecherche = updates.recherche !== undefined ? updates.recherche : params.recherche
      const nextArticle = updates.article !== undefined ? updates.article : params.article
      const nextFournisseur = updates.fournisseur !== undefined ? updates.fournisseur : params.fournisseur
      const nextUnite = updates.unite !== undefined ? updates.unite : params.unite
      const nextFamille = updates.famille !== undefined ? updates.famille : params.famille
      const nextCategorie = updates.categorie !== undefined ? updates.categorie : params.categorie
      const nextSortField = updates.sortField !== undefined ? updates.sortField : params.sortField
      const nextSortDir = updates.sortDir !== undefined ? updates.sortDir : params.sortDir

      if (nextPage === 0) next.delete('page')
      else next.set('page', String(nextPage))
      if (nextSize === PAGE_SIZE) next.delete('size')
      else next.set('size', String(nextSize))
      if (!nextRecherche.trim()) next.delete('recherche')
      else next.set('recherche', nextRecherche.trim())
      next.delete('corps')
      if (!nextArticle.trim()) next.delete('article')
      else next.set('article', nextArticle.trim())
      if (!nextFournisseur.trim()) next.delete('fournisseur')
      else next.set('fournisseur', nextFournisseur.trim())
      if (!nextUnite.trim()) next.delete('unite')
      else next.set('unite', nextUnite.trim())
      if (!nextFamille.trim()) next.delete('famille')
      else next.set('famille', nextFamille.trim())
      if (!nextCategorie.trim()) next.delete('categorie')
      else next.set('categorie', nextCategorie.trim())
      if (nextSortField === DEFAULT_SORT_FIELD) next.delete('csort')
      else next.set('csort', nextSortField)
      if (nextSortDir === 'asc') next.delete('cdir')
      else next.set('cdir', 'desc')
      return next
    }, { replace: replaceHistory })
  }, [params, setSearchParams])

  const setPage = useCallback((page: number) => updateParams({ page }, false), [updateParams])
  const setSize = useCallback((size: number) => updateParams({ size, page: 0 }), [updateParams])
  const setRecherche = useCallback((recherche: string) => updateParams({ recherche, page: 0 }), [updateParams])
  const setArticle = useCallback((article: string) => updateParams({ article, page: 0 }), [updateParams])
  const setFournisseur = useCallback((fournisseur: string) => updateParams({ fournisseur, page: 0 }), [updateParams])
  const setUnite = useCallback((unite: string) => updateParams({ unite, page: 0 }), [updateParams])
  const setFamille = useCallback((famille: string) => updateParams({ famille, page: 0 }), [updateParams])
  const setCategorie = useCallback((categorie: string) => updateParams({ categorie, page: 0 }), [updateParams])
  const setCatalogSort = useCallback(
    (field: BaremeCatalogSortField) => {
      if (params.sortField === field) {
        updateParams({ sortDir: params.sortDir === 'asc' ? 'desc' : 'asc', page: 0 })
      } else {
        updateParams({ sortField: field, sortDir: 'asc', page: 0 })
      }
    },
    [updateParams, params.sortField, params.sortDir]
  )
  const resetFilters = useCallback(() => updateParams({ ...defaultParams }), [updateParams])

  return {
    params,
    setPage,
    setSize,
    setRecherche,
    setArticle,
    setFournisseur,
    setUnite,
    setFamille,
    setCategorie,
    setCatalogSort,
    resetFilters,
  }
}

export { PAGE_SIZE, DEBOUNCE_MS }
