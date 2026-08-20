import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import apiClient from '@/api/axios'
import { PageContainer } from '@/components/layout/PageContainer'
import { MaterielModuleTabs } from '../components/MaterielModuleTabs'

/* ═══════════════════════════════════════════════════════════════════
   TYPES (alignés JournalAuditTerrainResponse backend)
   ═══════════════════════════════════════════════════════════════════ */

interface AuditEntry {
  id: number
  acteurId?: number | null
  acteurNom?: string | null
  action: string
  entiteType: string
  entiteId?: number | null
  projetId?: number | null
  latitude?: number | null
  longitude?: number | null
  payload?: string | null
  dateAction: string
}

interface AuditPage {
  content: AuditEntry[]
  totalElements: number
  totalPages: number
  number: number
}

const ENTITE_TYPES = ['ENGIN', 'DMA', 'TRANSFERT'] as const

const ACTIONS = [
  'SCAN_QR', 'INSPECTION', 'INCIDENT', 'RELEVE', 'RAVITAILLEMENT', 'POSITION_CONFIRMEE',
  'DMA_CREEE', 'DMA_TRANSITION',
  'TRANSFERT_DEMANDE', 'DEPART_CONFIRME', 'RECEPTION_CONFIRMEE', 'TRANSFERT_ANNULE',
] as const

const ACTION_COLOR: Record<string, string> = {
  SCAN_QR: 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600',
  INSPECTION: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700/40',
  INCIDENT: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-700/40',
  RELEVE: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-700/40',
  RAVITAILLEMENT: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-700/40',
  POSITION_CONFIRMEE: 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-700/40',
  DMA_CREEE: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700/40',
  DMA_TRANSITION: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700/40',
  TRANSFERT_DEMANDE: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700/40',
  DEPART_CONFIRME: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-700/40',
  RECEPTION_CONFIRMEE: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700/40',
  TRANSFERT_ANNULE: 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600',
}

const DEFAULT_ACTION_COLOR = 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE — journal d'audit append-only des actions terrain
   ═══════════════════════════════════════════════════════════════════ */

export function AuditTerrainPage() {
  const { t, i18n } = useTranslation('materiel')
  const [data, setData] = useState<AuditPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [filterAction, setFilterAction] = useState('')
  const [filterEntite, setFilterEntite] = useState('')

  useEffect(() => {
    let alive = true
    setLoading(true)
    apiClient
      .get<AuditPage>('/audit-terrain', {
        params: {
          page,
          size: 50,
          action: filterAction || undefined,
          entiteType: filterEntite || undefined,
        },
      })
      .then((r) => { if (alive) { setData(r.data); setError(null) } })
      .catch((e) => { if (alive) setError(e?.response?.data?.message ?? t('audit.loadError')) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [page, filterAction, filterEntite]) // eslint-disable-line react-hooks/exhaustive-deps

  const entries = data?.content ?? []
  const fmtDate = useMemo(
    () => (iso: string) =>
      new Date(iso).toLocaleString(i18n.language, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    [i18n.language],
  )

  const hasFilters = filterAction !== '' || filterEntite !== ''
  const resetFilters = () => { setFilterAction(''); setFilterEntite(''); setPage(0) }

  return (
    <PageContainer size="full" className="h-full flex flex-col min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto">

        {/* ═══════════ HEADER ═══════════ */}
        <div className="bg-white dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700/50">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-md">
                  <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
                    {t('audit.title')}
                  </h1>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                    {t('audit.hero')}
                  </p>
                </div>
              </motion.div>
              <MaterielModuleTabs />
            </div>
          </div>
        </div>

        {/* ═══════════ FILTER BAR ═══════════ */}
        <div className="bg-gray-50/80 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700/40 sticky top-0 z-20">
          <div className="px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap">{t('audit.filterEntite')}</span>
              <div className="flex items-center gap-1.5">
                {ENTITE_TYPES.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => { setFilterEntite(filterEntite === e ? '' : e); setPage(0) }}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold whitespace-nowrap transition-all ${
                      filterEntite === e
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    {t(`audit.entite.${e}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap">{t('audit.filterAction')}</span>
              <select
                value={filterAction}
                onChange={(e) => { setFilterAction(e.target.value); setPage(0) }}
                className="px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-[12px] font-semibold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">{t('engin.filterAll')}</option>
                {ACTIONS.map((a) => (
                  <option key={a} value={a}>{t(`audit.action.${a}`)}</option>
                ))}
              </select>
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-[11px] font-bold text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 transition-colors flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                {t('list.resetFilters')}
              </button>
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
              <div className="rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700/50 px-4 py-3">
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
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                    {t('audit.tableTitle')}
                  </h2>
                  {!loading && data && (
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tabular-nums">
                      {entries.length} / {data.totalElements}
                    </span>
                  )}
                </div>
                {loading && (
                  <div className="w-3.5 h-3.5 border-2 border-gray-300 dark:border-gray-600 border-t-primary rounded-full animate-spin" />
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px]">
                  <thead>
                    <tr className="bg-gray-50/60 dark:bg-gray-700/30">
                      {[t('audit.col.date'), t('audit.col.acteur'), t('audit.col.action'), t('audit.col.entite'), t('audit.col.detail')].map((label, i) => (
                        <th key={i} scope="col" className="px-5 py-2.5 text-left border-b border-gray-100 dark:border-gray-700/50">
                          <span className="text-[10px] font-black tracking-[0.08em] uppercase text-gray-400 dark:text-gray-500">{label}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading && entries.length === 0 && Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-50 dark:border-gray-700/30">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <td key={j} className="px-5 py-4">
                            <div className="h-3 bg-gray-100 dark:bg-gray-700/40 rounded w-full max-w-[7rem] animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))}
                    {entries.map((e, i) => (
                      <motion.tr
                        key={e.id}
                        className="border-b border-gray-50 dark:border-gray-700/30 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.02 * Math.min(i, 20) }}
                      >
                        <td className="px-5 py-3 align-middle text-sm text-gray-500 dark:text-gray-400 tabular-nums whitespace-nowrap">
                          {fmtDate(e.dateAction)}
                        </td>
                        <td className="px-5 py-3 align-middle">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300 flex-shrink-0">
                              {e.acteurNom?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[10rem]">
                              {e.acteurNom || <span className="italic text-gray-400">{t('audit.anonyme')}</span>}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 align-middle">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md border text-[11px] font-bold ${ACTION_COLOR[e.action] ?? DEFAULT_ACTION_COLOR}`}>
                            {t(`audit.action.${e.action}`, e.action)}
                          </span>
                        </td>
                        <td className="px-5 py-3 align-middle text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {t(`audit.entite.${e.entiteType}`, e.entiteType)}
                          {e.entiteId != null && <span className="ml-1 font-mono text-xs text-gray-400">#{e.entiteId}</span>}
                        </td>
                        <td className="px-5 py-3 align-middle text-sm text-gray-500 dark:text-gray-400 max-w-[16rem]">
                          <span className="truncate block">{e.payload ?? '—'}</span>
                          {e.latitude != null && e.longitude != null && (
                            <span className="text-[10px] font-mono text-gray-400">{e.latitude.toFixed(5)}, {e.longitude.toFixed(5)}</span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!loading && entries.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t('audit.empty')}</p>
                  {hasFilters && (
                    <button type="button" onClick={resetFilters} className="mt-2 text-xs font-bold text-primary hover:underline">
                      {t('list.resetFilters')}
                    </button>
                  )}
                </div>
              )}
            </motion.div>

            {/* Pagination simple */}
            {data && data.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {t('list.paginationPrev')}
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">{page + 1} / {data.totalPages}</span>
                <button
                  type="button"
                  disabled={page >= data.totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {t('list.paginationNext')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
