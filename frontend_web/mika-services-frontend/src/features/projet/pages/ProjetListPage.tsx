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

  const STATUT_DOT: Record<string, string> = {
    EN_ATTENTE:           'bg-gray-400',
    PLANIFIE:             'bg-blue-500',
    EN_COURS:             'bg-emerald-500',
    SUSPENDU:             'bg-amber-500',
    TERMINE:              'bg-violet-500',
    ABANDONNE:            'bg-red-500',
    RECEPTION_PROVISOIRE: 'bg-indigo-500',
    RECEPTION_DEFINITIVE: 'bg-teal-500',
  }

  const STATUT_BADGE: Record<string, string> = {
    EN_ATTENTE:           'bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300',
    PLANIFIE:             'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    EN_COURS:             'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    SUSPENDU:             'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    TERMINE:              'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
    ABANDONNE:            'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    RECEPTION_PROVISOIRE: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
    RECEPTION_DEFINITIVE: 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
  }

  const STATUT_BORDER: Record<string, string> = {
    EN_ATTENTE:           'border-l-gray-400',
    PLANIFIE:             'border-l-blue-500',
    EN_COURS:             'border-l-emerald-500',
    SUSPENDU:             'border-l-amber-500',
    TERMINE:              'border-l-violet-500',
    ABANDONNE:            'border-l-red-500',
    RECEPTION_PROVISOIRE: 'border-l-indigo-500',
    RECEPTION_DEFINITIVE: 'border-l-teal-500',
  }

  const AVATAR_COLORS = ['bg-blue-500','bg-emerald-500','bg-violet-500','bg-rose-500','bg-amber-500','bg-teal-500','bg-indigo-500','bg-pink-500']
  const getInitials = (nom?: string): string => {
    if (!nom?.trim()) return '?'
    const parts = nom.trim().split(/\s+/)
    return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : nom.substring(0, 2).toUpperCase()
  }
  const getAvatarColor = (nom?: string): string => !nom ? 'bg-gray-400' : AVATAR_COLORS[nom.charCodeAt(0) % AVATAR_COLORS.length]


  return (
    <PageContainer size="full" className="h-full flex flex-col min-h-0 bg-gray-50 dark:bg-[#0d0f14]">

      {/* ══════════ HERO HEADER ══════════ */}
      <div className="shrink-0 relative overflow-hidden">
        {/* Fond dégradé subtil */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-orange-50/40 to-amber-50/60 dark:from-gray-900 dark:via-gray-900 dark:to-orange-950/20" />
        {/* Cercle décoratif */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-primary/5 dark:bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-40 h-40 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />

        <div className="relative px-8 py-7 border-b border-orange-100/60 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

            {/* Titre */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 dark:bg-primary/20 border-2 border-primary/20 dark:border-primary/30 flex items-center justify-center shadow-sm">
                  <svg className="w-6 h-6 text-primary dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    {t('list.pageTitle')}
                  </h1>
                  {totalElements > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-orange-400 text-sm font-bold border border-primary/20 dark:border-orange-500/30">
                      {totalElements}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{listSubtitle}</p>
              </div>
            </div>

            {/* Actions header */}
            <div className="flex items-center gap-3">
              {projets.length > 0 && (
                <button
                  onClick={exportListToExcel}
                  title={t('list.exportExcelTitle')}
                  className="group flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium hover:border-emerald-400 hover:text-emerald-600 dark:hover:border-emerald-500 dark:hover:text-emerald-400 hover:shadow-md hover:shadow-emerald-100 dark:hover:shadow-emerald-900/20 transition-all duration-200"
                >
                  <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {t('list.exportExcel')}
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => navigate('/projets/nouveau')}
                  className="group relative flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-bold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
                  <svg className="w-4 h-4 relative" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span className="relative">{t('list.newProject')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ ZONE DÉFILABLE ══════════ */}
      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-6 space-y-5">

        {/* Erreur */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex justify-between items-center shadow-sm">
            <span>{error === 'offline_no_cache' ? t('common:error.offlineNoCache') : error}</span>
            <button type="button" onClick={() => dispatch(clearError())} className="ml-4 text-red-400 hover:text-red-600 transition-colors">✕</button>
          </div>
        )}

        {/* ══ RECHERCHE + FILTRES ══ */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-md focus-within:border-primary/50 dark:focus-within:border-primary/40 focus-within:shadow-lg focus-within:shadow-primary/10 transition-all duration-300 overflow-hidden">
          {/* Barre de recherche */}
          <div className="flex items-center gap-3 px-5 py-4 border-b-2 border-gray-200 dark:border-gray-700">
            <div className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder={t('list.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-transparent focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); dispatch(fetchProjets({ page: 0, size: pageSize, ...buildListQueryFilters(), ...sortParams() })) }}
                className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-xs transition-colors flex-shrink-0"
              >✕</button>
            )}
            <button
              onClick={handleSearch}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white text-xs font-bold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex-shrink-0"
            >
              {t('list.search')}
            </button>
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap items-center gap-2.5 px-5 py-3.5">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex-shrink-0">
              {t('list.filtersLabel')}
            </span>
            {[
              {
                value: filters.statut ?? '',
                onChange: (v: string) => setFilters((f) => ({ ...f, statut: (v || undefined) as StatutProjet | undefined })),
                placeholder: t('list.status'),
                options: STATUT_OPTIONS,
              },
              {
                value: filters.type ?? '',
                onChange: (v: string) => setFilters((f) => ({ ...f, type: (v || undefined) as TypeProjet | undefined })),
                placeholder: t('list.type'),
                options: TYPE_OPTIONS,
              },
              {
                value: String(filters.clientId ?? ''),
                onChange: (v: string) => setFilters((f) => ({ ...f, clientId: v ? Number(v) : undefined })),
                placeholder: t('list.client'),
                options: clients.map((c) => ({ value: String(c.id), label: c.nom })),
              },
              {
                value: String(filters.responsableId ?? ''),
                onChange: (v: string) => setFilters((f) => ({ ...f, responsableId: v ? Number(v) : undefined })),
                placeholder: t('list.manager'),
                options: chefUsers.map((u) => ({ value: String(u.id), label: `${u.nom} ${u.prenom ?? ''}` })),
              },
            ].map((f, i) => (
              <select
                key={i}
                value={f.value}
                onChange={(e) => f.onChange(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary/40 focus:border-primary/60 focus:bg-white dark:focus:bg-gray-700 transition-all cursor-pointer hover:border-primary/40"
              >
                <option value="">{f.placeholder} — {t('list.all')}</option>
                {f.options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            ))}
            <button
              onClick={applyFilters}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white text-xs font-bold shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
            >
              {t('list.applyFilters')}
            </button>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-4 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 transition-all duration-200"
              >
                {t('list.reset')}
              </button>
            )}
          </div>
        </div>

        {/* ══ TABLEAU / LOADING / VIDE ══ */}
        {loading ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-md overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b-2 border-gray-200 dark:border-gray-700 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded-full w-3/5" />
                  <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full w-2/5" />
                </div>
                <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded-full w-16" />
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full w-20" />
                <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded-xl w-20" />
              </div>
            ))}
          </div>
        ) : projets.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-md py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-orange-100 dark:from-primary/20 dark:to-orange-900/20 flex items-center justify-center mx-auto mb-5 shadow-sm">
              <svg className="w-8 h-8 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-base font-bold text-gray-900 dark:text-white">
              {hasActiveFilters ? t('list.emptyNoResults') : t('list.emptyNoProjects')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xs mx-auto leading-relaxed">
              {hasActiveFilters ? t('list.emptyNoResultsHint') : isAdmin ? t('list.emptyNoProjectsHintAdmin') : t('list.emptyNoProjectsHintUser')}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-md overflow-hidden">

            {/* ── Tableau desktop ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full" role="table">
                <thead>
                  <tr className="border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/40">
                    {SORTABLE_COLUMNS.map(({ key, label, align = 'left', title }) => (
                      <th
                        key={key}
                        scope="col"
                        title={title}
                        onClick={() => handleSort(key)}
                        aria-sort={sortBy === key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                        className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider cursor-pointer select-none transition-colors duration-150 group/th ${
                          sortBy === key
                            ? 'text-primary dark:text-orange-400'
                            : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        } ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'}`}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {label}
                          <span className={`transition-opacity ${sortBy === key ? 'opacity-100' : 'opacity-0 group-hover/th:opacity-50'}`}>
                            {sortBy === key ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                          </span>
                        </span>
                      </th>
                    ))}
                    <th scope="col" className="px-5 py-3.5 text-right text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      {t('list.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {projets.map((projet) => (
                    <tr
                      key={projet.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openProjetDetail(projet)}
                      onKeyDown={(e) => handleRowKeyDown(e, projet)}
                      aria-label={t('list.openDetail', { name: projet.nom })}
                      className="group hover:bg-gradient-to-r hover:from-orange-50/60 hover:to-amber-50/30 dark:hover:from-orange-950/20 dark:hover:to-amber-950/10 cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/50"
                    >
                      {/* Nom — barre colorée statut sur la première cellule */}
                      <td className={`px-5 py-4 border-l-4 ${STATUT_BORDER[projet.statut] ?? 'border-l-gray-300 dark:border-l-gray-600'}`}>
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-orange-100/80 dark:from-primary/20 dark:to-orange-900/30 flex items-center justify-center flex-shrink-0 group-hover:from-primary/20 group-hover:to-orange-200/80 dark:group-hover:from-primary/30 dark:group-hover:to-orange-900/50 transition-all duration-200 shadow-sm group-hover:shadow-md group-hover:shadow-primary/10">
                            <svg className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[200px] group-hover:text-primary dark:group-hover:text-orange-400 transition-colors duration-200">
                              {projet.nom}
                            </p>
                            {projet.codeProjet && (
                              <p className="text-[11px] font-mono text-gray-400 dark:text-gray-500 mt-0.5">{projet.codeProjet}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      {/* Type */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200/60 dark:border-gray-700/60">
                          {getTypeDisplay(projet)}
                        </span>
                      </td>
                      {/* Client */}
                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium truncate max-w-[150px] block">
                          {projet.clientNom || '—'}
                        </span>
                      </td>
                      {/* Montant */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums whitespace-nowrap">
                            {formatMontant(projet.montantHT)}
                          </span>
                        </div>
                      </td>
                      {/* Avancement */}
                      <td className="px-5 py-4 text-center" title={t('list.columns.avancementGlobalTitle')}>
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="w-24 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-primary to-orange-400 transition-all duration-700 shadow-sm"
                              style={{ width: `${Math.min(projet.avancementGlobal, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-400 tabular-nums">
                            {projet.avancementGlobal}%
                          </span>
                        </div>
                      </td>
                      {/* Statut */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border border-transparent ${STATUT_BADGE[projet.statut] ?? 'bg-gray-100 text-gray-600'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUT_DOT[projet.statut] ?? 'bg-gray-400'}`} />
                          {STATUT_LABELS[projet.statut]?.label || projet.statut}
                        </span>
                      </td>
                      {/* Responsable — avatar initiales */}
                      <td className="px-5 py-4">
                        {projet.responsableNom ? (
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full ${getAvatarColor(projet.responsableNom)} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 shadow-sm`}>
                              {getInitials(projet.responsableNom)}
                            </div>
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[110px]">{projet.responsableNom}</span>
                          </div>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600">—</span>
                        )}
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        {(canEditProjetEffective(currentUser, accessToken, projet.responsableProjetId) ||
                          canDeleteProjetEffective(currentUser, accessToken)) ? (
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {canEditProjetEffective(currentUser, accessToken, projet.responsableProjetId) && (
                              <button
                                onClick={() => navigate(`/projets/${projet.id}/edit`)}
                                title={t('list.edit')}
                                aria-label={t('list.editProject', { name: projet.nom })}
                                className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 transition-all duration-150 hover:scale-110"
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
                                className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-all duration-150 hover:scale-110"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-700">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Cartes mobile ── */}
            <div className="md:hidden divide-y-2 divide-gray-200 dark:divide-gray-700">
              {projets.map((projet) => (
                <article
                  key={projet.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openProjetDetail(projet)}
                  onKeyDown={(e) => handleRowKeyDown(e, projet)}
                  aria-label={t('list.openDetail', { name: projet.nom })}
                  className={`p-5 border-l-4 ${STATUT_BORDER[projet.statut] ?? 'border-l-gray-300'} hover:bg-orange-50/50 dark:hover:bg-orange-950/10 cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/50`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-orange-100 dark:from-primary/20 dark:to-orange-900/30 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{projet.nom}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{getTypeDisplay(projet)} · {projet.clientNom || '—'}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold ${STATUT_BADGE[projet.statut] ?? 'bg-gray-100 text-gray-600'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUT_DOT[projet.statut] ?? 'bg-gray-400'}`} />
                          {STATUT_LABELS[projet.statut]?.label || projet.statut}
                        </span>
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 tabular-nums">{projet.avancementGlobal}%</span>
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 tabular-nums">{formatMontant(projet.montantHT)}</span>
                      </div>
                      {/* Progress + responsable mobile */}
                      <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 mt-2.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-orange-400"
                          style={{ width: `${Math.min(projet.avancementGlobal, 100)}%` }}
                        />
                      </div>
                      {projet.responsableNom && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <div className={`w-5 h-5 rounded-full ${getAvatarColor(projet.responsableNom)} flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0`}>
                            {getInitials(projet.responsableNom)}
                          </div>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400">{projet.responsableNom}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {(canEditProjetEffective(currentUser, accessToken, projet.responsableProjetId) ||
                    canDeleteProjetEffective(currentUser, accessToken)) && (
                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      {canEditProjetEffective(currentUser, accessToken, projet.responsableProjetId) && (
                        <button type="button" onClick={() => navigate(`/projets/${projet.id}/edit`)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                          {t('list.edit')}
                        </button>
                      )}
                      {canDeleteProjetEffective(currentUser, accessToken) && (
                        <button type="button" onClick={() => handleDelete(projet.id, projet.nom)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          {t('list.delete')}
                        </button>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>

            {/* ── PAGINATION ── */}
            <div className="flex flex-wrap items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">{paginationRange}</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const newSize = Number(e.target.value)
                    dispatch(setItemsPerPage(newSize))
                    const params = { page: 0, size: newSize, ...buildListQueryFilters(), ...sortParams() }
                    if (searchQuery.trim()) dispatch(searchProjets({ q: searchQuery.trim(), ...params }))
                    else dispatch(fetchProjets(params))
                  }}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all cursor-pointer"
                >
                  {[10, 20, 25, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-800 hover:border-primary/40 hover:text-primary dark:hover:text-orange-400 hover:shadow-sm transition-all duration-200"
                >
                  {t('list.pagination.prev')}
                </button>
                <span className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary/10 to-orange-100/80 dark:from-primary/20 dark:to-orange-900/20 text-sm font-bold text-primary dark:text-orange-400 tabular-nums border border-primary/20 dark:border-orange-500/20">
                  {currentPage + 1} / {totalPages || 1}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= (totalPages || 1) - 1}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-800 hover:border-primary/40 hover:text-primary dark:hover:text-orange-400 hover:shadow-sm transition-all duration-200"
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