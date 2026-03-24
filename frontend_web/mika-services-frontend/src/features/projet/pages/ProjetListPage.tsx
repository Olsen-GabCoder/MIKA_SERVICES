import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useConfirm } from '@/contexts/ConfirmContext'
import type * as XLSXType from 'xlsx'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { PageContainer } from '@/components/layout/PageContainer'
import { setItemsPerPage } from '@/store/slices/uiSlice'
import { fetchProjets, searchProjets, deleteProjet, fetchClients, clearError } from '@/store/slices/projetSlice'
import { getProjetTypes } from '@/types/projet'
import type { ProjetListFilters, ProjetSortKey, SortDirection } from '@/api/projetApi'
import type { ProjetSummary, StatutProjet, TypeProjet } from '@/types/projet'
import { userApi } from '@/api/userApi'
import type { UserSummary } from '@/types'
import { useFormatNumber } from '@/hooks/useFormatNumber'
import { getEffectiveConnectionQuality, AUTO_REFRESH_INTERVAL_MS } from '@/utils/connectionQualityPreferences'
import {
  canDeleteProjetEffective,
  canEditProjetEffective,
  hasGlobalAdminRoleEffective,
} from '@/utils/authRoles'

const STATUT_COLORS: Record<string, string> = {
  EN_ATTENTE: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
  PLANIFIE: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200',
  EN_COURS: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200',
  SUSPENDU: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200',
  TERMINE: 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200',
  ABANDONNE: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200',
  RECEPTION_PROVISOIRE: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200',
  RECEPTION_DEFINITIVE: 'bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200',
}

const SORTABLE_KEYS: { key: ProjetSortKey; align?: 'left' | 'center' | 'right' }[] = [
  { key: 'nom' },
  { key: 'type' },
  { key: 'client.nom' },
  { key: 'montantHT', align: 'left' },
  { key: 'avancementGlobal', align: 'center' },
  { key: 'statut' },
  { key: 'responsableProjet.nom' },
]

export interface ListStateToRestore {
  page: number
  size: number
  searchQuery: string
  filters: ProjetListFilters
  sortBy: ProjetSortKey | ''
  sortDir: SortDirection
}

export const ProjetListPage = () => {
  const { t } = useTranslation('projet')
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const confirm = useConfirm()
  const { projets, totalElements, totalPages, currentPage, loading, error, clients } = useAppSelector((state) => state.projet)
  const currentUser = useAppSelector((state) => state.auth.user)
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const pageSize = useAppSelector((state) => state.ui.itemsPerPage)
  const { autoRefreshListsEnabled, connectionQuality } = useAppSelector((state) => state.ui)
  const isAdmin = hasGlobalAdminRoleEffective(currentUser, accessToken)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<ProjetListFilters>({})
  const [chefUsers, setChefUsers] = useState<UserSummary[]>([])
  const [sortBy, setSortBy] = useState<ProjetSortKey | ''>('nom')
  const [sortDir, setSortDir] = useState<SortDirection>('asc')

  const { formatMontant } = useFormatNumber()

  const STATUT_LABELS = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(STATUT_COLORS).map((statut) => [
          statut,
          { label: t(`enums.statut.${statut}`), color: STATUT_COLORS[statut] },
        ])
      ) as Record<string, { label: string; color: string }>,
    [t]
  )
  const STATUT_OPTIONS = useMemo(
    () =>
      Object.keys(STATUT_COLORS).map((value) => ({
        value: value as StatutProjet,
        label: t(`enums.statut.${value}`),
      })),
    [t]
  )
  const TYPE_OPTIONS = useMemo(
    () =>
      (['VOIRIE', 'ROUTE', 'CHAUSSEE', 'PONT', 'OUVRAGE_ART', 'BATIMENT', 'ASSAINISSEMENT', 'TERRASSEMENT', 'MIXTE', 'GENIE_CIVIL', 'REHABILITATION', 'AMENAGEMENT', 'AUTRE'] as TypeProjet[]).map(
        (value) => ({ value, label: t(`enums.type.${value}`) })
      ),
    [t]
  )
  const SORTABLE_COLUMNS = useMemo(
    () =>
      SORTABLE_KEYS.map(({ key, align }) => ({
        key,
        align: align ?? 'left',
        label: t(`list.columns.${key === 'client.nom' ? 'client' : key === 'responsableProjet.nom' ? 'responsableProjet' : key}`),
        title: key === 'avancementGlobal' ? t('list.columns.avancementGlobalTitle') : undefined,
      })),
    [t]
  )

  const getTypeDisplay = useCallback(
    (projet: ProjetSummary) => {
      const types = getProjetTypes(projet)
      if (!types.length) return '—'
      return types
        .map((typ) => (typ === 'AUTRE' && projet.typePersonnalise?.trim() ? projet.typePersonnalise.trim() : t(`enums.type.${typ}`)))
        .join(', ')
    },
    [t]
  )

  /** Filtres API : liste complète pour tous ; filtre chef optionnel. */
  const buildListQueryFilters = useCallback((): ProjetListFilters => {
    const out: ProjetListFilters = {
      ...(filters.statut && { statut: filters.statut }),
      ...(filters.type && { type: filters.type }),
      ...(filters.clientId != null && { clientId: filters.clientId }),
      ...(filters.responsableId != null && { responsableId: filters.responsableId }),
    }
    return out
  }, [filters.statut, filters.type, filters.clientId, filters.responsableId])

  const sortParams = () =>
    sortBy ? { sortBy: sortBy as ProjetSortKey, sortDir } : {}

  const refetchListRef = useRef<() => void>(() => {})
  refetchListRef.current = () => {
    const params = { page: currentPage, size: pageSize, ...buildListQueryFilters(), ...sortParams() }
    if (searchQuery.trim()) dispatch(searchProjets({ q: searchQuery.trim(), ...params }))
    else dispatch(fetchProjets(params))
  }
  useEffect(() => {
    if (!autoRefreshListsEnabled) return
    const effective = getEffectiveConnectionQuality(connectionQuality)
    const ms = AUTO_REFRESH_INTERVAL_MS[effective]
    const interval = setInterval(() => refetchListRef.current(), ms)
    return () => clearInterval(interval)
  }, [autoRefreshListsEnabled, connectionQuality])

  const handleSort = (column: ProjetSortKey) => {
    const nextDir: SortDirection = sortBy === column && sortDir === 'asc' ? 'desc' : 'asc'
    setSortBy(column)
    setSortDir(nextDir)
    const params = { page: 0, size: pageSize, ...buildListQueryFilters(), sortBy: column, sortDir: nextDir }
    if (searchQuery.trim()) dispatch(searchProjets({ q: searchQuery.trim(), ...params }))
    else dispatch(fetchProjets(params))
  }

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    !!filters.statut ||
    !!filters.type ||
    filters.clientId != null ||
    filters.responsableId != null

  const paginationRange =
    totalElements > 0
      ? t('list.pagination.range', {
          from: currentPage * pageSize + 1,
          to: Math.min((currentPage + 1) * pageSize, totalElements),
          total: totalElements,
        })
      : t('list.pagination.rangeEmpty')

  // Restauration de l'état liste au retour du détail (étape 6)
  useEffect(() => {
    const fromListState = (location.state as { fromListState?: ListStateToRestore } | null)?.fromListState
    if (fromListState) {
      setSearchQuery(fromListState.searchQuery ?? '')
      setFilters(fromListState.filters ?? {})
      setSortBy((fromListState.sortBy as ProjetSortKey) ?? '')
      setSortDir(fromListState.sortDir ?? 'asc')
      dispatch(setItemsPerPage(fromListState.size ?? 20))
      const restored = fromListState.filters ?? {}
      const params = {
        page: fromListState.page ?? 0,
        size: fromListState.size ?? 20,
        ...(restored.statut && { statut: restored.statut }),
        ...(restored.type && { type: restored.type }),
        ...(restored.clientId != null && { clientId: restored.clientId }),
        ...(restored.responsableId != null && { responsableId: restored.responsableId }),
        ...(fromListState.sortBy && fromListState.sortDir && { sortBy: fromListState.sortBy, sortDir: fromListState.sortDir }),
      }
      if (fromListState.searchQuery?.trim()) {
        dispatch(searchProjets({ q: fromListState.searchQuery.trim(), ...params }))
      } else {
        dispatch(fetchProjets(params))
      }
      navigate('.', { replace: true, state: {} })
    }
  }, [location.state, dispatch, navigate])

  useEffect(() => {
    const fromListState = (location.state as { fromListState?: ListStateToRestore } | null)?.fromListState
    if (fromListState) return
    dispatch(fetchProjets({ page: 0, size: pageSize, ...sortParams() }))
    dispatch(fetchClients({ page: 0, size: 200 }))
    userApi
      .getChefsProjet()
      .then((r) => setChefUsers(r ?? []))
      .catch(() => setChefUsers([]))
  }, [dispatch, pageSize, sortBy, sortDir, location.state])

  const applyFilters = useCallback(() => {
    const params = { page: 0, size: pageSize, ...buildListQueryFilters(), ...sortParams() }
    if (searchQuery.trim()) {
      dispatch(searchProjets({ q: searchQuery.trim(), ...params }))
    } else {
      dispatch(fetchProjets(params))
    }
  }, [dispatch, searchQuery, buildListQueryFilters, sortBy, sortDir, pageSize])

  const resetFilters = useCallback(() => {
    setFilters({})
    setSearchQuery('')
    setSortBy('nom')
    setSortDir('asc')
    dispatch(fetchProjets({ page: 0, size: pageSize, sortBy: 'nom', sortDir: 'asc' }))
  }, [dispatch, pageSize])

  const handleSearch = () => {
    const params = { page: 0, size: pageSize, ...buildListQueryFilters(), ...sortParams() }
    if (searchQuery.trim()) {
      dispatch(searchProjets({ q: searchQuery.trim(), ...params }))
    } else {
      dispatch(fetchProjets(params))
    }
  }

  const handlePageChange = (page: number) => {
    if (page < 0 || (totalPages > 0 && page >= totalPages)) return
    const params = { page, size: pageSize, ...buildListQueryFilters(), ...sortParams() }
    if (searchQuery.trim()) {
      dispatch(searchProjets({ q: searchQuery.trim(), ...params }))
    } else {
      dispatch(fetchProjets(params))
    }
  }

  const handleDelete = async (id: number, nom: string) => {
    if (await confirm({ messageKey: 'confirm.deactivateProject', messageParams: { name: nom } })) {
      await dispatch(deleteProjet(id))
      const params = { page: currentPage, size: pageSize, ...buildListQueryFilters(), ...sortParams() }
      if (searchQuery.trim()) dispatch(searchProjets({ q: searchQuery, ...params }))
      else dispatch(fetchProjets(params))
    }
  }

  const openProjetDetail = useCallback(
    (projet: { id: number; nom: string }) => {
      navigate(`/projets/${projet.id}`, {
        state: {
          fromListState: {
            page: currentPage,
            size: pageSize,
            searchQuery,
            filters,
            sortBy,
            sortDir,
          } satisfies ListStateToRestore,
        },
      })
    },
    [navigate, currentPage, pageSize, searchQuery, filters, sortBy, sortDir]
  )

  const handleRowKeyDown = useCallback(
    (e: React.KeyboardEvent, projet: { id: number; nom: string }) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        openProjetDetail(projet)
      }
    },
    [openProjetDetail]
  )

  const exportListToExcel = useCallback(async () => {
    const XLSX: typeof XLSXType = await import('xlsx')
    const headers = [
      t('list.export.headers.nom'),
      t('list.export.headers.type'),
      t('list.export.headers.client'),
      t('list.export.headers.montantHT'),
      t('list.export.headers.avancement'),
      t('list.export.headers.statut'),
      t('list.export.headers.manager'),
    ]
    const rows: (string | number)[][] = [
      headers,
      ...projets.map((p: ProjetSummary) => [
        p.nom ?? '',
        getTypeDisplay(p),
        p.clientNom ?? '—',
        p.montantHT ?? '',
        p.avancementGlobal ?? 0,
        STATUT_LABELS[p.statut]?.label ?? p.statut,
        p.responsableNom ?? '—',
      ]),
    ]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, t('list.export.sheetName'))
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `liste-projets-${new Date().toISOString().slice(0, 10)}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }, [projets, t, STATUT_LABELS, getTypeDisplay])

  const listSubtitle = t('list.subtitleAll')

  return (
    <PageContainer size="full" className="h-full flex flex-col min-h-0 bg-gray-50/80 dark:bg-gray-900/80">
      {/* Zone fixe : première carte (header) + carte portefeuille (KPIs) — ne défilent pas */}
      <div className="shrink-0 space-y-6">
        {/* Première carte : header avec gradient */}
        <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg overflow-hidden">
          <div className="px-6 py-6 md:py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{t('list.pageTitle')}</h1>
                <p className="text-white/90 text-sm mt-1 font-medium">{listSubtitle}</p>
                <p className="text-white/80 text-sm mt-1">
                  {t('list.projectsTotal', { count: totalElements })} · {t('list.pageInfo', { current: currentPage + 1, total: totalPages || 1 })}
                </p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => navigate('/projets/nouveau')}
                  className="bg-white dark:bg-gray-100 text-primary hover:bg-white/90 dark:hover:bg-gray-200 font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t('list.newProject')}
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Zone défilable : filtres + liste + pagination — scroll sur toute la page */}
      <div className="flex-1 min-h-0 overflow-y-auto">
      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 flex justify-between items-center">
          <span>{error === 'offline_no_cache' ? t('common:error.offlineNoCache') : error}</span>
          <button type="button" onClick={() => dispatch(clearError())} className="text-red-600 dark:text-red-400 hover:underline text-sm">
            {t('common:close')}
          </button>
        </div>
      )}
      {/* Barre de recherche et filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={t('list.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 transition-all"
            />
          </div>
          <button
            onClick={handleSearch}
            className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-2.5 rounded-lg font-medium transition-all hover:shadow-md flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {t('list.search')}
          </button>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('')
                dispatch(fetchProjets({ page: 0, size: pageSize, ...buildListQueryFilters(), ...sortParams() }))
              }}
              className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-6 py-2.5 rounded-lg font-medium transition-all"
            >
              {t('list.clear')}
            </button>
          )}
        </div>

        {/* Filtres par critères */}
        <div className="border-t border-gray-100 dark:border-gray-600 pt-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{t('list.filtersLabel')}</p>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-end gap-3">
            <div className="min-w-0">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{t('list.status')}</label>
              <select
                value={filters.statut ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, statut: (e.target.value || undefined) as StatutProjet | undefined }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">{t('list.all')}</option>
                {STATUT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="min-w-0">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{t('list.type')}</label>
              <select
                value={filters.type ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, type: (e.target.value || undefined) as TypeProjet | undefined }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">{t('list.all')}</option>
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="min-w-0">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{t('list.client')}</label>
              <select
                value={filters.clientId ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, clientId: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">{t('list.all')}</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
            </div>
            <div className="min-w-0">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{t('list.manager')}</label>
              <select
                value={filters.responsableId ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, responsableId: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">{t('list.all')}</option>
                {chefUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nom} {u.prenom ?? ''}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={applyFilters}
              className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-lg font-medium text-sm transition-all"
            >
              {t('list.applyFilters')}
            </button>
            <button
              onClick={resetFilters}
              className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-5 py-2 rounded-lg font-medium text-sm transition-all"
            >
              {t('list.reset')}
            </button>
            {projets.length > 0 && (
              <button
                onClick={exportListToExcel}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2"
                title={t('list.exportExcelTitle')}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t('list.exportExcel')}
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  {SORTABLE_COLUMNS.map(({ label }) => (
                    <th key={label} className="px-6 py-4 text-left text-xs font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-wider">
                      {label}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">
                    {t('list.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-600">
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-600" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-48" />
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-20" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16 mx-auto" /></td>
                    <td className="px-6 py-4"><div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-20" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-28" /></td>
                    <td className="px-6 py-4"><div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-20 mx-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="px-6 py-3 text-sm text-gray-400 dark:text-gray-500">{t('list.loading')}</p>
        </div>
      ) : projets.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 p-12">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {hasActiveFilters ? t('list.emptyNoResults') : t('list.emptyNoProjects')}
            </p>
            <p className="text-sm mt-2 dark:text-gray-300">
              {hasActiveFilters
                ? t('list.emptyNoResultsHint')
                : isAdmin
                  ? t('list.emptyNoProjectsHintAdmin')
                  : t('list.emptyNoProjectsHintUser')}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 overflow-hidden">
          {/* Tableau : visible à partir de md */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full" role="table">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  {SORTABLE_COLUMNS.map(({ key, label, align = 'left', title }) => (
                    <th
                      key={key}
                      scope="col"
                      title={title}
                      className={`px-6 py-4 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                        align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
                      }`}
                      onClick={() => handleSort(key)}
                      aria-sort={sortBy === key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                    >
                      <span className="inline-flex items-center gap-1">
                        {label}
                        {sortBy === key && (
                          <span className="text-primary" aria-hidden>
                            {sortDir === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </span>
                    </th>
                  ))}
                  <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t('list.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-600">
                {projets.map((projet) => (
                  <tr
                    key={projet.id}
                    role="button"
                    tabIndex={0}
                    className="mika-tile hover:bg-gray-50 dark:hover:bg-gray-700/70 cursor-pointer transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
                    aria-label={t('list.openDetail', { name: projet.nom })}
                    onClick={() => openProjetDetail(projet)}
                    onKeyDown={(e) => handleRowKeyDown(e, projet)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{projet.nom}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200">
                        {getTypeDisplay(projet)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-medium">{projet.clientNom || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-semibold tabular-nums">{formatMontant(projet.montantHT)}</td>
                    <td className="px-6 py-4" title={t('list.columns.avancementGlobalTitle')}>
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-full max-w-[120px] bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-primary to-primary-dark rounded-full h-2 transition-all duration-500" 
                            style={{ width: `${Math.min(projet.avancementGlobal, 100)}%` }} 
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 tabular-nums" aria-hidden>{projet.avancementGlobal} %</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${STATUT_LABELS[projet.statut]?.color || 'bg-gray-100 text-gray-800'}`}>
                        {STATUT_LABELS[projet.statut]?.label || projet.statut}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{projet.responsableNom || '—'}</td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      {canEditProjetEffective(currentUser, accessToken, projet.responsableProjetId) ||
                      canDeleteProjetEffective(currentUser, accessToken) ? (
                        <div className="flex items-center justify-center gap-2">
                          {canEditProjetEffective(currentUser, accessToken, projet.responsableProjetId) && (
                            <button
                              onClick={() => navigate(`/projets/${projet.id}/edit`)}
                              className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium transition-colors"
                              title={t('list.edit')}
                              aria-label={t('list.editProject', { name: projet.nom })}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              {t('list.edit')}
                            </button>
                          )}
                          {canDeleteProjetEffective(currentUser, accessToken) && (
                            <button
                              onClick={() => handleDelete(projet.id, projet.nom)}
                              className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium transition-colors"
                              title={t('list.delete')}
                              aria-label={t('list.deleteProject', { name: projet.nom })}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              {t('list.delete')}
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-sm text-center block">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cartes : visible sur petits écrans (responsive, étape 8) */}
          <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-600">
            {projets.map((projet) => (
              <article
                key={projet.id}
                role="button"
                tabIndex={0}
                className="mika-tile p-4 hover:bg-gray-50 dark:hover:bg-gray-700/70 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset cursor-pointer transition-colors"
                aria-label={t('list.openDetail', { name: projet.nom })}
                onClick={() => openProjetDetail(projet)}
                onKeyDown={(e) => handleRowKeyDown(e, projet)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{projet.nom}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      {getTypeDisplay(projet)} · {projet.clientNom || '—'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${STATUT_LABELS[projet.statut]?.color || 'bg-gray-100 text-gray-800'}`}>
                        {STATUT_LABELS[projet.statut]?.label || projet.statut}
                      </span>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 tabular-nums">{projet.avancementGlobal} %</span>
                      <span className="text-xs text-gray-600 dark:text-gray-400 tabular-nums">{formatMontant(projet.montantHT)}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('list.managerShort')} : {projet.responsableNom || '—'}</p>
                  </div>
                </div>
                {(canEditProjetEffective(currentUser, accessToken, projet.responsableProjetId) ||
                  canDeleteProjetEffective(currentUser, accessToken)) && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-600 flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    {canEditProjetEffective(currentUser, accessToken, projet.responsableProjetId) && (
                      <button
                        type="button"
                        onClick={() => navigate(`/projets/${projet.id}/edit`)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                        aria-label={t('list.editProject', { name: projet.nom })}
                      >
                        {t('list.edit')}
                      </button>
                    )}
                    {canDeleteProjetEffective(currentUser, accessToken) && (
                      <button
                        type="button"
                        onClick={() => handleDelete(projet.id, projet.nom)}
                        className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
                        aria-label={t('list.deleteProject', { name: projet.nom })}
                      >
                        {t('list.delete')}
                      </button>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>

          <p className="px-6 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/50">
            {t('list.avancementHint')}
          </p>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600 gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {paginationRange}
              </span>
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>{t('list.pagination.show')}</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const newSize = Number(e.target.value)
                    dispatch(setItemsPerPage(newSize))
                    const params = { page: 0, size: newSize, ...buildListQueryFilters(), ...sortParams() }
                    if (searchQuery.trim()) dispatch(searchProjets({ q: searchQuery.trim(), ...params }))
                    else dispatch(fetchProjets(params))
                  }}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>{t('list.pagination.perPage')}</span>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors dark:bg-gray-700 dark:text-gray-100"
              >
                {t('list.pagination.prev')}
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300 px-2">
                {t('list.pageInfo', { current: currentPage + 1, total: totalPages || 1 })}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= (totalPages || 1) - 1}
                className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors dark:bg-gray-700 dark:text-gray-100"
              >
                {t('list.pagination.next')}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </PageContainer>
  )
}