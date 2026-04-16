import { useEffect, useState, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { PageContainer } from '@/components/layout/PageContainer'
import { fetchDmas } from '@/store/slices/demandeMaterielSlice'
import { MaterielEmptyState, MaterielPagination } from '../components/MaterielListChrome'
import { MaterielModuleTabs } from '../components/MaterielModuleTabs'
import { useCountUp } from '../hooks/useCountUp'
import type { StatutDemandeMateriel, PrioriteDemandeMateriel, DemandeMateriel } from '@/types/materiel'

/* ═══════════════════════════════════════════════════════════════════
   STYLE MAPS
   ═══════════════════════════════════════════════════════════════════ */

const ALL_STATUTS: StatutDemandeMateriel[] = [
  'SOUMISE', 'EN_VALIDATION_CHANTIER', 'EN_VALIDATION_PROJET',
  'PRISE_EN_CHARGE', 'EN_ATTENTE_COMPLEMENT', 'EN_COMMANDE',
  'LIVRE', 'REJETEE', 'CLOTUREE',
]

const STATUT_CONFIG: Record<StatutDemandeMateriel, { bg: string; text: string; dot: string; border: string }> = {
  SOUMISE:                 { bg: 'bg-slate-100 dark:bg-slate-700/50', text: 'text-slate-600 dark:text-slate-300', dot: 'bg-slate-400', border: 'border-slate-200 dark:border-slate-600' },
  EN_VALIDATION_CHANTIER:  { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500', border: 'border-amber-200 dark:border-amber-700/40' },
  EN_VALIDATION_PROJET:    { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500', border: 'border-orange-200 dark:border-orange-700/40' },
  PRISE_EN_CHARGE:         { bg: 'bg-sky-50 dark:bg-sky-900/20', text: 'text-sky-700 dark:text-sky-400', dot: 'bg-sky-500', border: 'border-sky-200 dark:border-sky-700/40' },
  EN_ATTENTE_COMPLEMENT:   { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-400', dot: 'bg-violet-500', border: 'border-violet-200 dark:border-violet-700/40' },
  EN_COMMANDE:             { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-400', dot: 'bg-indigo-500', border: 'border-indigo-200 dark:border-indigo-700/40' },
  LIVRE:                   { bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-700 dark:text-teal-400', dot: 'bg-teal-500', border: 'border-teal-200 dark:border-teal-700/40' },
  REJETEE:                 { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500', border: 'border-rose-200 dark:border-rose-700/40' },
  CLOTUREE:                { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', border: 'border-emerald-200 dark:border-emerald-700/40' },
}

/* ═══════════════════════════════════════════════════════════════════
   ANIMATED METRIC PILL — Compact, elegant inline metric
   ═══════════════════════════════════════════════════════════════════ */

function MetricPill({ value, label, color, delay = 0 }: {
  value: number; label: string; color: string; delay?: number
}) {
  const animated = useCountUp(value, 1200, delay)
  return (
    <motion.div
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50 shadow-sm"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay / 1000, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={`w-2 h-8 rounded-full ${color}`} />
      <div>
        <p className="text-xl font-black text-gray-900 dark:text-white tabular-nums leading-none">{animated}</p>
        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-1">{label}</p>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   WORKFLOW PIPELINE — Horizontal statut distribution bar
   ═══════════════════════════════════════════════════════════════════ */

function WorkflowPipeline({ dmas, t, onFilter }: {
  dmas: DemandeMateriel[]
  t: (key: string) => string
  onFilter: (s: StatutDemandeMateriel | '') => void
}) {
  const total = dmas.length
  const counts = useMemo(() => {
    const c: Partial<Record<StatutDemandeMateriel, number>> = {}
    dmas.forEach((d) => { c[d.statut] = (c[d.statut] || 0) + 1 })
    return c
  }, [dmas])

  if (total === 0) return null

  const DONUT_COLORS: Record<StatutDemandeMateriel, string> = {
    SOUMISE: '#94a3b8',
    EN_VALIDATION_CHANTIER: '#f59e0b',
    EN_VALIDATION_PROJET: '#f97316',
    PRISE_EN_CHARGE: '#0ea5e9',
    EN_ATTENTE_COMPLEMENT: '#8b5cf6',
    EN_COMMANDE: '#6366f1',
    LIVRE: '#14b8a6',
    REJETEE: '#f43f5e',
    CLOTUREE: '#10b981',
  }

  const segments = ALL_STATUTS
    .filter((s) => (counts[s] || 0) > 0)
    .map((s) => ({
      statut: s,
      count: counts[s]!,
      pct: Math.round(((counts[s] || 0) / total) * 100),
      color: DONUT_COLORS[s],
    }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      {/* Bar */}
      <div className="flex h-3 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700/40 mb-3">
        {segments.map((seg, i) => (
          <motion.div
            key={seg.statut}
            className="h-full cursor-pointer relative group"
            style={{ background: seg.color }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(seg.pct, 2)}%` }}
            transition={{ duration: 0.8, delay: 0.5 + i * 0.05, ease: 'easeOut' }}
            onClick={() => onFilter(seg.statut)}
            title={`${t(`dma.statut.${seg.statut}`)} — ${seg.count}`}
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-colors" />
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1">
        {segments.map((seg) => (
          <button
            key={seg.statut}
            type="button"
            onClick={() => onFilter(seg.statut)}
            className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: seg.color }} />
            <span className="font-medium">{t(`dma.statut.${seg.statut}`)}</span>
            <span className="font-bold text-gray-700 dark:text-gray-300 tabular-nums">{seg.count}</span>
          </button>
        ))}
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   SKELETON
   ═══════════════════════════════════════════════════════════════════ */

function DmaSkeleton() {
  return (
    <PageContainer size="full" className="h-full flex flex-col min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto px-1 py-2">
        <div className="flex items-center justify-between mb-6">
          <div className="h-7 w-56 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-5 gap-3 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
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
   DMA TABLE ROW — Enterprise-grade row
   ═══════════════════════════════════════════════════════════════════ */

function DmaTableRow({ dma, index, onClick, t, locale }: {
  dma: DemandeMateriel; index: number; onClick: () => void
  t: (key: string) => string; locale: string
}) {
  const cfg = STATUT_CONFIG[dma.statut]

  return (
    <motion.tr
      onClick={onClick}
      className="group cursor-pointer border-b border-gray-50 dark:border-gray-700/30 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 * Math.min(index, 15) }}
    >
      {/* Reference */}
      <td className="px-5 py-3.5 align-middle">
        <div className="flex items-center gap-2.5">
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
          <span className="font-mono text-[13px] font-bold text-gray-900 dark:text-white tracking-wide">
            {dma.reference}
          </span>
        </div>
      </td>

      {/* Projet */}
      <td className="px-5 py-3.5 align-middle">
        <span className="text-sm text-gray-700 dark:text-gray-300 max-w-[14rem] truncate block">{dma.projetNom}</span>
      </td>

      {/* Priorité */}
      <td className="px-5 py-3.5 align-middle">
        {dma.priorite === 'URGENTE' ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[11px] font-black uppercase tracking-wider">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute h-full w-full rounded-full bg-rose-400 opacity-60" />
              <span className="relative rounded-full h-1.5 w-1.5 bg-rose-500" />
            </span>
            URGENT
          </span>
        ) : (
          <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Normale
          </span>
        )}
      </td>

      {/* Statut */}
      <td className="px-5 py-3.5 align-middle">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-bold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {t(`dma.statut.${dma.statut}`)}
        </span>
      </td>

      {/* Date */}
      <td className="px-5 py-3.5 align-middle text-sm text-gray-500 dark:text-gray-400 tabular-nums whitespace-nowrap">
        {dma.dateSouhaitee ? new Date(dma.dateSouhaitee).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
      </td>

      {/* Montant */}
      <td className="px-5 py-3.5 align-middle text-sm font-semibold text-gray-700 dark:text-gray-300 tabular-nums whitespace-nowrap text-right">
        {dma.montantEstime != null ? `${Number(dma.montantEstime).toLocaleString(locale)} F` : '—'}
      </td>

      {/* Créateur */}
      <td className="px-5 py-3.5 align-middle">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300 flex-shrink-0">
            {dma.createurNom?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[8rem]">{dma.createurNom}</span>
        </div>
      </td>

      {/* Arrow */}
      <td className="px-3 py-3.5 align-middle w-8">
        <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </td>
    </motion.tr>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════ */

export function DemandeMaterielListPage() {
  const { t, i18n } = useTranslation('materiel')
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { dmas, totalElements, totalPages, currentPage, loading, error } = useAppSelector((s) => s.demandeMateriel)

  const [filterStatut, setFilterStatut] = useState<StatutDemandeMateriel | ''>('')
  const [filterPriorite, setFilterPriorite] = useState<PrioriteDemandeMateriel | ''>('')
  const [pageSize, setPageSize] = useState(20)
  const scrollRef = useRef<HTMLDivElement>(null)

  const fetchPage = (page = 0) => {
    dispatch(fetchDmas({ page, size: pageSize, statut: filterStatut || undefined }))
  }

  useEffect(() => { fetchPage(0) }, [filterStatut, pageSize]) // eslint-disable-line react-hooks/exhaustive-deps

  const hasActiveFilters = filterStatut !== '' || filterPriorite !== ''
  const resetFilters = () => { setFilterStatut(''); setFilterPriorite('') }

  const displayedDmas = filterPriorite
    ? dmas.filter((d) => d.priorite === filterPriorite)
    : dmas

  const paginationRangeLabel = t('list.paginationRange', {
    from: totalElements === 0 ? 0 : currentPage * pageSize + 1,
    to: Math.min((currentPage + 1) * pageSize, totalElements),
    total: totalElements,
  })

  // KPIs
  const kpis = useMemo(() => ({
    total: totalElements,
    enCours: dmas.filter((d) => !['CLOTUREE', 'REJETEE', 'LIVRE'].includes(d.statut)).length,
    urgentes: dmas.filter((d) => d.priorite === 'URGENTE').length,
    livrees: dmas.filter((d) => d.statut === 'LIVRE').length,
    cloturees: dmas.filter((d) => d.statut === 'CLOTUREE').length,
  }), [dmas, totalElements])

  if (loading && dmas.length === 0) return <DmaSkeleton />

  return (
    <PageContainer size="full" className="h-full flex flex-col min-h-0">
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">

        {/* ═══════════ TOP SECTION — Header + Metrics + Pipeline ═══════════ */}
        <div className="bg-white dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700/50">
          <div className="px-6 lg:px-8 py-5">

            {/* Row 1 — Title + Actions */}
            <div className="flex items-center justify-between gap-4 mb-5">
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 flex items-center justify-center shadow-md">
                  <svg className="w-4.5 h-4.5 text-white dark:text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
                    Demandes de Matériel
                  </h1>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                    Workflow d'approvisionnement
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
                <motion.button
                  type="button"
                  onClick={() => navigate('/dma/new')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg
                             bg-gray-900 dark:bg-white text-white dark:text-gray-900
                             font-bold text-sm shadow-sm
                             hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  {t('dma.create')}
                </motion.button>
              </motion.div>
            </div>

            {/* Row 2 — Metrics row (full width) */}
            <div className="grid grid-cols-5 gap-3 mb-5">
              <MetricPill value={kpis.total} label="Total" color="bg-slate-400" delay={100} />
              <MetricPill value={kpis.enCours} label="En cours" color="bg-sky-500" delay={200} />
              <MetricPill value={kpis.urgentes} label="Urgentes" color="bg-rose-500" delay={300} />
              <MetricPill value={kpis.livrees} label="Livrées" color="bg-teal-500" delay={400} />
              <MetricPill value={kpis.cloturees} label="Clôturées" color="bg-emerald-500" delay={500} />
            </div>

            {/* Row 3 — Pipeline bar (full width) */}
            <WorkflowPipeline dmas={dmas} t={t} onFilter={setFilterStatut} />
          </div>
        </div>

        {/* ═══════════ FILTER BAR — Full width, single row ═══════════ */}
        <div className="bg-gray-50/80 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700/40 sticky top-0 z-20">
          <div className="px-6 lg:px-8 py-3 flex items-center gap-4">

            {/* Statut filter */}
            <div className="flex items-center gap-2 flex-1">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap">Statut</span>
              <div className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                <button
                  type="button"
                  onClick={() => setFilterStatut('')}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-bold whitespace-nowrap transition-all ${
                    filterStatut === ''
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-700/50'
                  }`}
                >
                  Tous ({kpis.total})
                </button>
                {ALL_STATUTS.map((s) => {
                  const count = dmas.filter((d) => d.statut === s).length
                  if (count === 0 && filterStatut !== s) return null
                  const cfg = STATUT_CONFIG[s]
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFilterStatut(s === filterStatut ? '' : s)}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-bold whitespace-nowrap transition-all border ${
                        filterStatut === s
                          ? `${cfg.bg} ${cfg.text} ${cfg.border}`
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      {t(`dma.statut.${s}`)} {count > 0 && <span className="ml-1 tabular-nums">{count}</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Separator */}
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 flex-shrink-0" />

            {/* Priorité filter */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap">Priorité</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilterPriorite('')}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${
                    filterPriorite === ''
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-700/50'
                  }`}
                >
                  Toutes
                </button>
                <button
                  type="button"
                  onClick={() => setFilterPriorite(filterPriorite === 'NORMALE' ? '' : 'NORMALE')}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${
                    filterPriorite === 'NORMALE'
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-700/50'
                  }`}
                >
                  Normale
                </button>
                <button
                  type="button"
                  onClick={() => setFilterPriorite(filterPriorite === 'URGENTE' ? '' : 'URGENTE')}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${
                    filterPriorite === 'URGENTE'
                      ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Urgente
                  </span>
                </button>
              </div>
            </div>

            {/* Separator */}
            {hasActiveFilters && (
              <>
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[11px] font-bold text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 transition-colors flex items-center gap-1 flex-shrink-0"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Réinitialiser
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
          <div className="px-6 lg:px-8 py-4">
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
                    Demandes
                  </h2>
                  {!loading && (
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tabular-nums">
                      {displayedDmas.length} sur {totalElements}
                    </span>
                  )}
                </div>
                {loading && (
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-400">
                    <div className="w-3.5 h-3.5 border-2 border-gray-300 dark:border-gray-600 border-t-primary rounded-full animate-spin" />
                    Chargement…
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]" role="table">
                  <thead>
                    <tr className="bg-gray-50/60 dark:bg-gray-700/30">
                      {[
                        { label: 'Référence', align: 'left' },
                        { label: 'Projet', align: 'left' },
                        { label: 'Priorité', align: 'left' },
                        { label: 'Statut', align: 'left' },
                        { label: 'Date souhaitée', align: 'left' },
                        { label: 'Montant est.', align: 'right' },
                        { label: 'Créateur', align: 'left' },
                        { label: '', align: 'left' },
                      ].map((col, i) => (
                        <th
                          key={i}
                          scope="col"
                          className={`px-5 py-2.5 border-b border-gray-100 dark:border-gray-700/50 text-${col.align}`}
                        >
                          <span className="text-[10px] font-black tracking-[0.08em] uppercase text-gray-400 dark:text-gray-500">
                            {col.label}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading && dmas.length === 0 && Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-50 dark:border-gray-700/30">
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="px-5 py-4">
                            <div className="h-3 bg-gray-100 dark:bg-gray-700/40 rounded w-full max-w-[7rem] animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))}
                    {!loading && displayedDmas.map((dma, i) => (
                      <DmaTableRow
                        key={dma.id}
                        dma={dma}
                        index={i}
                        onClick={() => navigate(`/dma/${dma.id}`)}
                        t={t}
                        locale={i18n.language}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {!loading && displayedDmas.length === 0 && (
                <MaterielEmptyState
                  hasFilters={hasActiveFilters}
                  onReset={resetFilters}
                  labelNoData={t('dma.empty') || 'Aucune demande'}
                  labelNoResults={t('list.emptyNoResults')}
                  hintNoData={t('dma.emptyHint') || 'Les demandes apparaîtront ici.'}
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
                  onPageChange={(p) => fetchPage(p)}
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
