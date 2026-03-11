import { useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { TypeLigneBareme } from '@/features/bareme/types'

const PAGE_SIZE = 20
const DEBOUNCE_MS = 350

export interface BaremeListParams {
  page: number
  size: number
  corpsEtatId: number | null
  type: TypeLigneBareme | null
  recherche: string
}

const defaultParams: BaremeListParams = {
  page: 0,
  size: PAGE_SIZE,
  corpsEtatId: null,
  type: null,
  recherche: '',
}

function parseNumber(value: string | null): number | null {
  if (value == null || value === '') return null
  const n = parseInt(value, 10)
  return Number.isNaN(n) ? null : n
}

function parseType(value: string | null): TypeLigneBareme | null {
  if (value === 'MATERIAU' || value === 'PRESTATION_ENTETE') return value
  return null
}

export function useBaremeListParams(): {
  params: BaremeListParams
  setPage: (page: number) => void
  setSize: (size: number) => void
  setCorpsEtatId: (id: number | null) => void
  setType: (type: TypeLigneBareme | null) => void
  setRecherche: (q: string) => void
  resetFilters: () => void
} {
  const [searchParams, setSearchParams] = useSearchParams()

  const params = useMemo((): BaremeListParams => {
    return {
      page: Math.max(0, parseNumber(searchParams.get('page')) ?? 0),
      size: Math.min(100, Math.max(5, parseNumber(searchParams.get('size')) ?? PAGE_SIZE)),
      corpsEtatId: parseNumber(searchParams.get('corpsEtatId')),
      type: parseType(searchParams.get('type')),
      recherche: searchParams.get('recherche') ?? '',
    }
  }, [searchParams])

  const updateParams = useCallback((updates: Partial<BaremeListParams>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      const nextPage = updates.page ?? params.page
      const nextSize = updates.size ?? params.size
      const nextCorps = updates.corpsEtatId !== undefined ? updates.corpsEtatId : params.corpsEtatId
      const nextType = updates.type !== undefined ? updates.type : params.type
      const nextRecherche = updates.recherche !== undefined ? updates.recherche : params.recherche

      if (nextPage === 0) next.delete('page')
      else next.set('page', String(nextPage))
      if (nextSize === PAGE_SIZE) next.delete('size')
      else next.set('size', String(nextSize))
      if (nextCorps == null) next.delete('corpsEtatId')
      else next.set('corpsEtatId', String(nextCorps))
      if (nextType == null) next.delete('type')
      else next.set('type', nextType)
      if (!nextRecherche.trim()) next.delete('recherche')
      else next.set('recherche', nextRecherche.trim())
      return next
    })
  }, [params, setSearchParams])

  const setPage = useCallback((page: number) => updateParams({ page }), [updateParams])
  const setSize = useCallback((size: number) => updateParams({ size, page: 0 }), [updateParams])
  const setCorpsEtatId = useCallback((corpsEtatId: number | null) => updateParams({ corpsEtatId, page: 0 }), [updateParams])
  const setType = useCallback((type: TypeLigneBareme | null) => updateParams({ type, page: 0 }), [updateParams])
  const setRecherche = useCallback((recherche: string) => updateParams({ recherche, page: 0 }), [updateParams])
  const resetFilters = useCallback(() => updateParams({ ...defaultParams }), [updateParams])

  return {
    params,
    setPage,
    setSize,
    setCorpsEtatId,
    setType,
    setRecherche,
    resetFilters,
  }
}

export { PAGE_SIZE, DEBOUNCE_MS }
