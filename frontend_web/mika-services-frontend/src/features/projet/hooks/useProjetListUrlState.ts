import { useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { ProjetListFilters, ProjetSortKey, SortDirection } from '@/api/projetApi'
import type { StatutProjet, TypeProjet } from '@/types/projet'

export interface ProjetListUrlState {
  page: number
  size: number
  searchQuery: string
  filters: ProjetListFilters
  sortBy: ProjetSortKey | ''
  sortDir: SortDirection
}

const DEFAULTS: ProjetListUrlState = {
  page: 0,
  size: 20,
  searchQuery: '',
  filters: {},
  sortBy: 'nom',
  sortDir: 'asc',
}

const VALID_SORT_KEYS: ProjetSortKey[] = [
  'nom', 'type', 'client.nom', 'montantHT', 'avancementGlobal', 'statut', 'responsableProjet.nom',
]

function parseUrlState(params: URLSearchParams): Partial<ProjetListUrlState> {
  const state: Partial<ProjetListUrlState> = {}
  const filters: ProjetListFilters = {}

  const q = params.get('q')
  if (q) state.searchQuery = q

  const page = params.get('page')
  if (page != null) {
    const n = Number(page)
    if (!Number.isNaN(n) && n >= 0) state.page = n
  }

  const size = params.get('size')
  if (size != null) {
    const n = Number(size)
    if ([10, 20, 25, 50, 100].includes(n)) state.size = n
  }

  const sort = params.get('sort')
  if (sort) {
    const [key, dir] = sort.split(',')
    if (VALID_SORT_KEYS.includes(key as ProjetSortKey)) {
      state.sortBy = key as ProjetSortKey
      state.sortDir = dir === 'desc' ? 'desc' : 'asc'
    }
  }

  const statut = params.get('statut')
  if (statut) filters.statut = statut as StatutProjet

  const type = params.get('type')
  if (type) filters.type = type as TypeProjet

  const clientId = params.get('clientId')
  if (clientId != null) {
    const n = Number(clientId)
    if (!Number.isNaN(n)) filters.clientId = n
  }

  const responsableId = params.get('responsableId')
  if (responsableId != null) {
    const n = Number(responsableId)
    if (!Number.isNaN(n)) filters.responsableId = n
  }

  if (Object.keys(filters).length > 0) state.filters = filters

  return state
}

export function useProjetListUrlState() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialRead = useRef(false)

  const readFromUrl = useCallback((): Partial<ProjetListUrlState> | null => {
    if (initialRead.current) return null
    initialRead.current = true
    const parsed = parseUrlState(searchParams)
    return Object.keys(parsed).length > 0 ? parsed : null
  }, [searchParams])

  const syncToUrl = useCallback((state: ProjetListUrlState) => {
    const params = new URLSearchParams()

    if (state.searchQuery) params.set('q', state.searchQuery)
    if (state.page !== DEFAULTS.page) params.set('page', String(state.page))
    if (state.size !== DEFAULTS.size) params.set('size', String(state.size))
    if (state.sortBy && !(state.sortBy === DEFAULTS.sortBy && state.sortDir === DEFAULTS.sortDir)) {
      params.set('sort', `${state.sortBy},${state.sortDir}`)
    }
    if (state.filters.statut) params.set('statut', state.filters.statut)
    if (state.filters.type) params.set('type', state.filters.type)
    if (state.filters.clientId != null) params.set('clientId', String(state.filters.clientId))
    if (state.filters.responsableId != null) params.set('responsableId', String(state.filters.responsableId))

    setSearchParams(params, { replace: true })
  }, [setSearchParams])

  return { readFromUrl, syncToUrl }
}
