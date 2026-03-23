import { useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

const PAGE_SIZE = 20
const DEBOUNCE_MS = 350

export interface BaremeListParams {
  page: number
  size: number
  recherche: string
  article: string
  fournisseur: string
  unite: string
  famille: string
  categorie: string
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
  resetFilters: () => void
} {
  const [searchParams, setSearchParams] = useSearchParams()

  const params = useMemo((): BaremeListParams => {
    return {
      page: Math.max(0, parseNumber(searchParams.get('page')) ?? 0),
      size: Math.min(100, Math.max(5, parseNumber(searchParams.get('size')) ?? PAGE_SIZE)),
      recherche: searchParams.get('recherche') ?? '',
      article: searchParams.get('article') ?? '',
      fournisseur: searchParams.get('fournisseur') ?? '',
      unite: searchParams.get('unite') ?? '',
      famille: searchParams.get('famille') ?? '',
      categorie: searchParams.get('categorie') ?? '',
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

      if (nextPage === 0) next.delete('page')
      else next.set('page', String(nextPage))
      if (nextSize === PAGE_SIZE) next.delete('size')
      else next.set('size', String(nextSize))
      if (!nextRecherche.trim()) next.delete('recherche')
      else next.set('recherche', nextRecherche.trim())
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
    resetFilters,
  }
}

export { PAGE_SIZE, DEBOUNCE_MS }
