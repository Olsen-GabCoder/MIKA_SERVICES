import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useIsOnline } from '@/hooks/useConnectivity'
import { useConfirm } from '@/contexts/ConfirmContext'
import { PageContainer } from '@/components/layout/PageContainer'
import { fetchMateriaux, deleteMateriau } from '@/store/slices/materiauSlice'
import { DEBOUNCE_MS, MaterielEmptyState, MaterielPagination } from '../components/MaterielListChrome'
import { MaterielModuleTabs } from '../components/MaterielModuleTabs'
import { useCountUp } from '../hooks/useCountUp'
import type { MateriauSummary } from '@/types/materiel'

type StockFilter = '' | 'BAS' | 'OK'

/* ═══════════════════════════════════════════════════════════════════
   METRIC PILL — KPI cliquable (même style que les listes DMA/Mouvements)
   ═══════════════════════════════════════════════════════════════════ */

function MetricPill({ value, label, color, delay = 0, active = false, onClick }: {
  value: number; label: string; color: string; delay?: number
  active?: boolean; onClick?: () => void
}) {
  const animated = useCountUp(value, 1200, delay)
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border shadow-sm text-left transition-all
        ${active
          ? 'bg-primary/5 dark:bg-primary/10 border-primary/40 dark:border-primary/40 ring-1 ring-primary/30'
          : 'bg-white dark:bg-gray-800/60 border-gray-100 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow'}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay / 1000, ease: [0.16, 1, 0.3, 1] }}
      whileTap={{ scale: 0.97 }}
    >
      <div className={`w-1.5 h-7 rounded-full ${color}`} />
      <div className="min-w-0">
        <p className="text-lg font-black text-gray-900 dark:text-white tabular-nums leading-none">{animated}</p>
        <p className={`text-[10px] font-semibold uppercase tracking-wider mt-1 truncate ${active ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}>{label}</p>
      </div>
    </motion.button>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   STOCK BAR — répartition stock OK / stock bas (cliquable)
   ═══════════════════════════════════════════════════════════════════ */

function StockBar({ materiaux, t, onFilter }: {
  materiaux: MateriauSummary[]
  t: (key: string) => string
  onFilter: (f: StockFilter) => void
}) {
  const total = materiaux.length
  if (total === 0) return null
  const bas = materiaux.filter((m) => m.stockBas).length
  const ok = total - bas
  const segments = [
    { key: 'OK' as const, count: ok, color: '#10b981', label: t('materiau.alertOk') },
    { key: 'BAS' as const, count: bas, color: '#f43f5e', label: t('materiau.alertStockBas') },
  ].filter((s) => s.count > 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700/40">
        {segments.map((seg, i) => (
          <motion.div
            key={seg.key}
            className="h-full cursor-pointer relative group"
            style={{ background: seg.color }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(Math.round((seg.count / total) * 100), 2)}%` }}
            transition={{ duration: 0.8, delay: 0.5 + i * 0.05, ease: 'easeOut' }}
            onClick={() => onFilter(seg.key)}
            title={`${seg.label} — ${seg.count}`}
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-colors" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   SKELETON
   ═══════════════════════════════════════════════════════════════════ */

function MateriauSkeleton() {
  return (
    <PageContainer size="full" className="h-full flex flex-col min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto px-1 py-2">
        <div className="flex items-center justify-between mb-6">
          <div className="h-7 w-56 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200/60 dark:bg-gray-700/40 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full mb-6 animate-pulse" />
        <div className="h-12 w-full bg-gray-200/60 dark:bg-gray-700/40 rounded-xl mb-3 animate-pulse" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 w-full bg-gray-100/80 dark:bg-gray-800/40 rounded-lg mb-2 animate-pulse" />
        ))}
      </div>
    </PageContainer>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   MATERIAU TABLE ROW
   ═══════════════════════════════════════════════════════════════════ */

function MateriauTableRow({ m, index, isOnline, t, onDelete }: {
  m: MateriauSummary
  index: number
  isOnline: boolean
  t: (key: string) => string
  onDelete: () => void
}) {
  return (
    <motion.tr
      className="group border-b border-gray-50 dark:border-gray-700/30 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 * Math.min(index, 15) }}
    >
      {/* Code */}
      <td className="px-5 py-3.5 align-middle">
        <div className="flex items-center gap-2.5">
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${m.stockBas ? 'bg-rose-500' : 'bg-emerald-500'}`} />
          <span className="font-mono text-[13px] font-bold text-gray-900 dark:text-white tracking-wide">{m.code}</span>
        </div>
      </td>

      {/* Nom */}
      <td className="px-5 py-3.5 align-middle">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 max-w-[14rem] truncate block">{m.nom}</span>
      </td>

      {/* Type */}
      <td className="px-5 py-3.5 align-middle text-sm text-gray-600 dark:text-gray-400">{m.type}</td>

      {/* Unité */}
      <td className="px-5 py-3.5 align-middle">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-400 text-[11px] font-bold font-mono">
          {m.unite}
        </span>
      </td>

      {/* Stock actuel */}
      <td className="px-5 py-3.5 align-middle text-sm text-right font-semibold text-gray-900 dark:text-gray-100 tabular-nums whitespace-nowrap">
        {m.stockActuel}
      </td>

      {/* Stock min */}
      <td className="px-5 py-3.5 align-middle text-sm text-right text-gray-500 dark:text-gray-400 tabular-nums whitespace-nowrap">
        {m.stockMinimum}
      </td>

      {/* Alerte */}
      <td className="px-5 py-3.5 align-middle">
        {m.stockBas ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-bold bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700/40 text-rose-600 dark:text-rose-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute h-full w-full rounded-full bg-rose-400 opacity-60" />
              <span className="relative rounded-full h-1.5 w-1.5 bg-rose-500" />
            </span>
            {t('materiau.alertStockBas')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-bold bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/40 text-emerald-700 dark:text-emerald-400">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            {t('materiau.alertOk')}
          </span>
        )}
      </td>

      {/* Fournisseur */}
      <td className="px-5 py-3.5 align-middle text-sm text-gray-600 dark:text-gray-400 max-w-[14rem] truncate" title={m.fournisseur ?? undefined}>
        {m.fournisseur || '—'}
      </td>

      {/* Actions */}
      <td className="px-5 py-3.5 align-middle text-center w-28">
        <button
          type="button"
          onClick={onDelete}
          disabled={!isOnline}
          title={!isOnline ? t('common:offline.actionUnavailable') : undefined}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-rose-200 dark:border-rose-700/50 bg-rose-50/80 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-[11px] font-bold hover:bg-rose-100 dark:hover:bg-rose-900/35 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {t('materiau.delete')}
        </button>
      </td>
    </motion.tr>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════ */

export const MateriauListPage = () => {
  const { t } = useTranslation('materiel')
  const isOnline = useIsOnline()
  const dispatch = useAppDispatch()
  const confirm = useConfirm()
  const { materiaux, totalElements, totalPages, currentPage, loading, error } = useAppSelector((state) => state.materiau)

  const [searchInput, setSearchInput] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [stockFilter, setStockFilter] = useState<StockFilter>('')
  const [pageSize, setPageSize] = useState(20)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedQ(searchInput), DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchInput])

  useEffect(() => {
    dispatch(fetchMateriaux({ page: 0, size: pageSize, q: debouncedQ.trim() || undefined }))
  }, [dispatch, debouncedQ, pageSize])

  const hasActiveFilters = debouncedQ.trim() !== '' || stockFilter !== ''

  const handlePageChange = (page: number) => {
    dispatch(fetchMateriaux({ page, size: pageSize, q: debouncedQ.trim() || undefined }))
  }

  const resetFilters = () => {
    setSearchInput('')
    setDebouncedQ('')
    setStockFilter('')
  }

  const handleDelete = async (id: number, nom: string) => {
    if (await confirm({ messageKey: 'confirm.deactivateMateriau', messageParams: { name: nom } })) {
      await dispatch(deleteMateriau(id))
      dispatch(fetchMateriaux({ page: currentPage, size: pageSize, q: debouncedQ.trim() || undefined }))
    }
  }

  const paginationRangeLabel = t('list.paginationRange', {
    from: totalElements === 0 ? 0 : currentPage * pageSize + 1,
    to: Math.min((currentPage + 1) * pageSize, totalElements),
    total: totalElements,
  })

  // Filtre stock appliqué côté client (comme la priorité sur les DMA)
  const displayedMateriaux = useMemo(() => {
    if (stockFilter === 'BAS') return materiaux.filter((m) => m.stockBas)
    if (stockFilter === 'OK') return materiaux.filter((m) => !m.stockBas)
    return materiaux
  }, [materiaux, stockFilter])

  // KPIs
  const kpis = useMemo(() => ({
    total: totalElements,
    stockBas: materiaux.filter((m) => m.stockBas).length,
    stockOk: materiaux.filter((m) => !m.stockBas).length,
  }), [materiaux, totalElements])

  const toggleStock = (f: StockFilter) => setStockFilter(stockFilter === f ? '' : f)

  if (loading && materiaux.length === 0 && !error) return <MateriauSkeleton />

  return (
    <PageContainer size="full" className="h-full flex flex-col min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto">

        {/* ═══════════ TOP SECTION — Header + Metrics + Stock bar ═══════════ */}
        <div className="bg-white dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700/50">
          <div className="px-4 sm:px-6 lg:px-8 py-4">

            {/* Row 1 — Title + Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-md">
                  <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
                    {t('materiau.title')}
                  </h1>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                    {t('list.heroMateriau')}
                  </p>
                </div>
              </motion.div>

              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <MaterielModuleTabs />
              </motion.div>
            </div>

            {/* Row 2 — Metrics row : KPIs cliquables qui filtrent */}
            <div className="grid grid-cols-3 gap-2.5 mb-4">
              <MetricPill value={kpis.total} label="Total" color="bg-slate-400" delay={100}
                active={stockFilter === ''} onClick={() => setStockFilter('')} />
              <MetricPill value={kpis.stockBas} label={t('materiau.alertStockBas')} color="bg-rose-500" delay={200}
                active={stockFilter === 'BAS'} onClick={() => toggleStock('BAS')} />
              <MetricPill value={kpis.stockOk} label={t('materiau.alertOk')} color="bg-emerald-500" delay={300}
                active={stockFilter === 'OK'} onClick={() => toggleStock('OK')} />
            </div>

            {/* Row 3 — Stock bar */}
            <StockBar materiaux={materiaux} t={t} onFilter={setStockFilter} />
          </div>
        </div>

        {/* ═══════════ FILTER BAR — recherche + filtre stock ═══════════ */}
        <div className="bg-gray-50/80 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700/40 sticky top-0 z-20">
          <div className="px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">

            {/* Recherche */}
            <div className="flex items-center gap-2 flex-1 min-w-[16rem]">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap">{t('list.searchLabel')}</span>
              <div className="relative flex-1 max-w-md">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={t('list.searchPlaceholderMateriau')}
                  className="w-full pl-9 pr-4 py-1.5 border border-gray-200 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary/40 focus:border-transparent"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Separator */}
            <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-gray-700 flex-shrink-0" />

            {/* Filtre stock */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap">Stock</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setStockFilter('')}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${
                    stockFilter === ''
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-700/50'
                  }`}
                >
                  {t('engin.filterAll')}
                </button>
                <button
                  type="button"
                  onClick={() => toggleStock('BAS')}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${
                    stockFilter === 'BAS'
                      ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    {t('materiau.alertStockBas')}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleStock('OK')}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${
                    stockFilter === 'OK'
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {t('materiau.alertOk')}
                  </span>
                </button>
              </div>
            </div>

            {hasActiveFilters && (
              <>
                <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[11px] font-bold text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 transition-colors flex items-center gap-1 flex-shrink-0"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {t('list.resetFilters')}
                </button>
              </>
            )}
          </div>
        </div>

        {/* ═══════════ ERROR ═══════════ */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-6 lg:px-8 pt-4"
            >
              <div className="rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700/50 px-4 py-3 flex items-center gap-3">
                <svg className="w-4 h-4 text-rose-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-sm text-rose-700 dark:text-rose-300 font-medium">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════ TABLE ═══════════ */}
        {!error && (
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <motion.div
              className="bg-white dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {/* Table header bar */}
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                    {t('list.tableTitleMateriau')}
                  </h2>
                  {!loading && (
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tabular-nums">
                      {displayedMateriaux.length} sur {totalElements}
                    </span>
                  )}
                </div>
                {loading && (
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-400">
                    <div className="w-3.5 h-3.5 border-2 border-gray-300 dark:border-gray-600 border-t-primary rounded-full animate-spin" />
                    {t('materiau.loading')}
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px]" role="table">
                  <thead>
                    <tr className="bg-gray-50/60 dark:bg-gray-700/30">
                      {[
                        { label: t('materiau.columns.code'), align: 'text-left' },
                        { label: t('materiau.columns.nom'), align: 'text-left' },
                        { label: t('materiau.columns.type'), align: 'text-left' },
                        { label: t('materiau.columns.unite'), align: 'text-left' },
                        { label: t('materiau.columns.stockActuel'), align: 'text-right' },
                        { label: t('materiau.columns.stockMin'), align: 'text-right' },
                        { label: t('materiau.columns.alerte'), align: 'text-left' },
                        { label: t('materiau.columns.fournisseur'), align: 'text-left' },
                        { label: t('materiau.actions'), align: 'text-center' },
                      ].map((col, i) => (
                        <th key={i} scope="col" className={`px-5 py-2.5 border-b border-gray-100 dark:border-gray-700/50 ${col.align} whitespace-nowrap`}>
                          <span className="text-[10px] font-black tracking-[0.08em] uppercase text-gray-400 dark:text-gray-500">
                            {col.label}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading && materiaux.length === 0 && Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-50 dark:border-gray-700/30">
                        {Array.from({ length: 9 }).map((_, j) => (
                          <td key={j} className="px-5 py-4">
                            <div className="h-3 bg-gray-100 dark:bg-gray-700/40 rounded w-full max-w-[7rem] animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))}
                    {!loading && displayedMateriaux.map((m, i) => (
                      <MateriauTableRow
                        key={m.id}
                        m={m}
                        index={i}
                        isOnline={isOnline}
                        t={t}
                        onDelete={() => handleDelete(m.id, m.nom)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {!loading && displayedMateriaux.length === 0 && (
                <MaterielEmptyState
                  hasFilters={hasActiveFilters}
                  onReset={resetFilters}
                  labelNoData={t('list.emptyNoDataMateriau')}
                  labelNoResults={t('list.emptyNoResults')}
                  hintNoData={t('list.emptyNoDataHintMateriau')}
                  hintNoResults={t('list.emptyNoResultsHint')}
                  labelReset={t('list.resetFilters')}
                />
              )}
            </motion.div>

            {/* Pagination */}
            {!loading && !error && totalPages > 1 && (
              <div className="mt-4">
                <MaterielPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  size={pageSize}
                  onPageChange={handlePageChange}
                  onSizeChange={(s) => setPageSize(s)}
                  labelRange={paginationRangeLabel}
                  labelPrev={t('list.paginationPrev')}
                  labelNext={t('list.paginationNext')}
                  labelPerPage={t('list.perPage')}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
