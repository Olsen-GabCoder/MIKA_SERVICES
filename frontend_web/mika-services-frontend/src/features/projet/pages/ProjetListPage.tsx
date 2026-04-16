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

  // Statuts dot colors pour le nouveau design
  const STATUT_DOT: Record<string, string> = {
    EN_ATTENTE: 'bg-gray-400',
    PLANIFIE: 'bg-blue-500',
    EN_COURS: 'bg-emerald-500',
    SUSPENDU: 'bg-amber-500',
    TERMINE: 'bg-violet-500',
    ABANDONNE: 'bg-red-500',
    RECEPTION_PROVISOIRE: 'bg-indigo-500',
    RECEPTION_DEFINITIVE: 'bg-teal-500',
  }

  return (
    <PageContainer size="full" className="h-full flex flex-col min-h-0 bg-gray-50 dark:bg-gray-950">

      {/* ── HEADER SLIM ── */}
      <div className="shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-white flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white dark:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white leading-none">{t('list.pageTitle')}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{listSubtitle}</p>
            </div>
            {totalElements > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-semibold tabular-nums">
                {totalElements}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {projets.length > 0 && (
              <button
                onClick={exportListToExcel}
                title={t('list.exportExcelTitle')}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => navigate('/projets/nouveau')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {t('list.newProject')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── ZONE DÉFILABLE ── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-3">

        {/* Erreur */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex justify-between items-center">
            <span>{error === 'offline_no_cache' ? t('common:error.offlineNoCache') : error}</span>
            <button type="button" onClick={() => dispatch(clearError())} className="text-red-500 hover:text-red-700 ml-4 flex-shrink-0">✕</button>
          </div>
        )}

        {/* ── BARRE RECHERCHE + FILTRES ── */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Ligne recherche */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 dark:border-gray-800">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={t('list.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); dispatch(fetchProjets({ page: 0, size: pageSize, ...buildListQueryFilters(), ...sortParams() })) }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0 text-xs"
              >✕</button>
            )}
            <button
              onClick={handleSearch}
              className="px-3 py-1 rounded-md bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              {t('list.search')}
            </button>
          </div>

          {/* Filtres inline */}
          <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mr-1">{t('list.filtersLabel')}</span>
            <select
              value={filters.statut ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, statut: (e.target.value || undefined) as StatutProjet | undefined }))}
              className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-xs text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent dark:bg-gray-800 cursor-pointer"
            >
              <option value="">{t('list.status')} — {t('list.all')}</option>
              {STATUT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <select
              value={filters.type ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, type: (e.target.value || undefined) as TypeProjet | undefined }))}
              className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-xs text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent dark:bg-gray-800 cursor-pointer"
            >
              <option value="">{t('list.type')} — {t('list.all')}</option>
              {TYPE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <select
              value={filters.clientId ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, clientId: e.target.value ? Number(e.target.value) : undefined }))}
              className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-xs text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent dark:bg-gray-800 cursor-pointer"
            >
              <option value="">{t('list.client')} — {t('list.all')}</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
            <select
              value={filters.responsableId ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, responsableId: e.target.value ? Number(e.target.value) : undefined }))}
              className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-xs text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent dark:bg-gray-800 cursor-pointer"
            >
              <option value="">{t('list.manager')} — {t('list.all')}</option>
              {chefUsers.map((u) => <option key={u.id} value={u.id}>{u.nom} {u.prenom ?? ''}</option>)}
            </select>
            <button
              onClick={applyFilters}
              className="px-3 py-1 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
            >
              {t('list.applyFilters')}
            </button>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {t('list.reset')}
              </button>
            )}
          </div>
        </div>

        {/* ── CONTENU : loading / vide / tableau ── */}
        {loading ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <table className="w-full">
              <tbody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-800 animate-pulse">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800" />
                        <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded-full w-52" />
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><div className="h-5 bg-gray-100 dark:bg-gray-800 rounded-full w-16" /></td>
                    <td className="px-4 py-3.5"><div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full w-28" /></td>
                    <td className="px-4 py-3.5"><div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full w-20" /></td>
                    <td className="px-4 py-3.5"><div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full w-24" /></td>
                    <td className="px-4 py-3.5"><div className="h-5 bg-gray-100 dark:bg-gray-800 rounded-full w-20" /></td>
                    <td className="px-4 py-3.5"><div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full w-24" /></td>
                    <td className="px-4 py-3.5"><div className="h-6 bg-gray-100 dark:bg-gray-800 rounded-lg w-16 ml-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : projets.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 py-20 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {hasActiveFilters ? t('list.emptyNoResults') : t('list.emptyNoProjects')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 max-w-xs mx-auto">
              {hasActiveFilters ? t('list.emptyNoResultsHint') : isAdmin ? t('list.emptyNoProjectsHintAdmin') : t('list.emptyNoProjectsHintUser')}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">

            {/* Tableau desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full" role="table">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {SORTABLE_COLUMNS.map(({ key, label, align = 'left', title }) => (
                      <th
                        key={key}
                        scope="col"
                        title={title}
                        onClick={() => handleSort(key)}
                        aria-sort={sortBy === key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                        className={`px-4 py-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300 transition-colors ${
                          align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
                        }`}
                      >
                        <span className="inline-flex items-center gap-1">
                          {label}
                          {sortBy === key ? (
                            <span className="text-gray-700 dark:text-gray-300">{sortDir === 'asc' ? '↑' : '↓'}</span>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600">↕</span>
                          )}
                        </span>
                      </th>
                    ))}
                    <th scope="col" className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      {t('list.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {projets.map((projet) => (
                    <tr
                      key={projet.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openProjetDetail(projet)}
                      onKeyDown={(e) => handleRowKeyDown(e, projet)}
                      aria-label={t('list.openDetail', { name: projet.nom })}
                      className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer transition-colors duration-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-900 dark:focus:ring-white group"
                    >
                      {/* Nom */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[220px]">
                            {projet.nom}
                          </span>
                        </div>
                      </td>
                      {/* Type */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                          {getTypeDisplay(projet)}
                        </span>
                      </td>
                      {/* Client */}
                      <td className="px-4 py-3.5 text-sm text-gray-600 dark:text-gray-400 truncate max-w-[160px]">
                        {projet.clientNom || '—'}
                      </td>
                      {/* Montant */}
                      <td className="px-4 py-3.5 text-sm font-mono font-medium text-gray-900 dark:text-gray-100 tabular-nums whitespace-nowrap">
                        {formatMontant(projet.montantHT)}
                      </td>
                      {/* Avancement */}
                      <td className="px-4 py-3.5 text-center" title={t('list.columns.avancementGlobalTitle')}>
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-20 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gray-800 dark:bg-gray-200 transition-all duration-500"
                              style={{ width: `${Math.min(projet.avancementGlobal, 100)}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 tabular-nums">
                            {projet.avancementGlobal}%
                          </span>
                        </div>
                      </td>
                      {/* Statut */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUT_DOT[projet.statut] ?? 'bg-gray-400'}`} />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {STATUT_LABELS[projet.statut]?.label || projet.statut}
                          </span>
                        </span>
                      </td>
                      {/* Responsable */}
                      <td className="px-4 py-3.5 text-sm text-gray-500 dark:text-gray-400 truncate max-w-[140px]">
                        {projet.responsableNom || '—'}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        {(canEditProjetEffective(currentUser, accessToken, projet.responsableProjetId) ||
                          canDeleteProjetEffective(currentUser, accessToken)) ? (
                          <div className="flex items-center justify-end gap-1">
                            {canEditProjetEffective(currentUser, accessToken, projet.responsableProjetId) && (
                              <button
                                onClick={() => navigate(`/projets/${projet.id}/edit`)}
                                title={t('list.edit')}
                                aria-label={t('list.editProject', { name: projet.nom })}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            )}
                            {canDeleteProjetEffective(currentUser, accessToken) && (
                              <button
                                onClick={() => handleDelete(projet.id, projet.nom)}
                                title={t('list.delete')}
                                aria-label={t('list.deleteProject', { name: projet.nom })}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600 text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cartes mobile */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
              {projets.map((projet) => (
                <article
                  key={projet.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openProjetDetail(projet)}
                  onKeyDown={(e) => handleRowKeyDown(e, projet)}
                  aria-label={t('list.openDetail', { name: projet.nom })}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-900"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{projet.nom}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{getTypeDisplay(projet)} · {projet.clientNom || '—'}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUT_DOT[projet.statut] ?? 'bg-gray-400'}`} />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{STATUT_LABELS[projet.statut]?.label || projet.statut}</span>
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">{projet.avancementGlobal}%</span>
                        <span className="text-xs font-mono text-gray-600 dark:text-gray-400 tabular-nums">{formatMontant(projet.montantHT)}</span>
                      </div>
                    </div>
                  </div>
                  {(canEditProjetEffective(currentUser, accessToken, projet.responsableProjetId) ||
                    canDeleteProjetEffective(currentUser, accessToken)) && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                      {canEditProjetEffective(currentUser, accessToken, projet.responsableProjetId) && (
                        <button type="button" onClick={() => navigate(`/projets/${projet.id}/edit`)} className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          {t('list.edit')}
                        </button>
                      )}
                      {canDeleteProjetEffective(currentUser, accessToken) && (
                        <button type="button" onClick={() => handleDelete(projet.id, projet.nom)} className="text-xs font-medium text-red-600 dark:text-red-400">
                          {t('list.delete')}
                        </button>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>

            {/* ── PAGINATION ── */}
            <div className="flex flex-wrap items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800 gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">{paginationRange}</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const newSize = Number(e.target.value)
                    dispatch(setItemsPerPage(newSize))
                    const params = { page: 0, size: newSize, ...buildListQueryFilters(), ...sortParams() }
                    if (searchQuery.trim()) dispatch(searchProjets({ q: searchQuery.trim(), ...params }))
                    else dispatch(fetchProjets(params))
                  }}
                  className="px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 bg-transparent dark:bg-gray-800 focus:ring-2 focus:ring-gray-900 focus:border-transparent cursor-pointer"
                >
                  {[10, 20, 25, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
                </select>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {t('list.pagination.prev')}
                </button>
                <span className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                  {currentPage + 1} / {totalPages || 1}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= (totalPages || 1) - 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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