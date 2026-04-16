import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { useConfirm } from '@/contexts/ConfirmContext'
import { PageContainer } from '@/components/layout/PageContainer'
import { reunionHebdoApi } from '@/api/reunionHebdoApi'
import type { ReunionHebdoSummary, StatutReunion } from '@/types/reunionHebdo'
import { useFormatDate } from '@/hooks/useFormatDate'

const PAGE_SIZE = 20

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatTime = (timeStr?: string) => {
  if (!timeStr) return '—'
  const [h, m] = timeStr.split(':')
  return `${h}h${m || '00'}`
}

const getWeekNumber = (dateStr: string): number => {
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
}

// ─── Statut config ────────────────────────────────────────────────────────────

const STATUT_CFG: Record<StatutReunion, {
  label: string
  badge: string
  dateBg: string
  dateText: string
  dot: string
  kpiText: string
  kpiBg: string
}> = {
  BROUILLON: {
    label: 'Brouillon',
    badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200',
    dateBg: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700/50',
    dateText: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-400',
    kpiText: 'text-amber-600 dark:text-amber-400',
    kpiBg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30',
  },
  VALIDE: {
    label: 'Validée',
    badge: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200',
    dateBg: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700/50',
    dateText: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-400',
    kpiText: 'text-emerald-600 dark:text-emerald-400',
    kpiBg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30',
  },
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard({ index }: { index: number }) {
  return (
    <motion.div
      className="bg-white dark:bg-gray-800/70 rounded-2xl border border-gray-100 dark:border-gray-700/50 p-5 flex gap-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: index * 0.08 }}
    >
      <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-gray-700/50 flex-shrink-0" />
      <div className="flex-1 space-y-3 pt-1">
        <div className="h-4 w-1/3 bg-gray-100 dark:bg-gray-700/50 rounded-lg" />
        <div className="h-3 w-1/2 bg-gray-100 dark:bg-gray-700/40 rounded" />
        <div className="h-3 w-2/5 bg-gray-100 dark:bg-gray-700/40 rounded" />
      </div>
      <div className="flex flex-col items-end gap-2 pt-1">
        <div className="h-6 w-20 bg-gray-100 dark:bg-gray-700/40 rounded-lg" />
        <div className="h-3 w-16 bg-gray-100 dark:bg-gray-700/30 rounded" />
      </div>
    </motion.div>
  )
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon,
  color,
  bgColor,
  borderColor,
  delay,
}: {
  label: string
  value: number
  icon: React.ReactNode
  color: string
  bgColor: string
  borderColor: string
  delay: number
}) {
  return (
    <motion.div
      className={`flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-sm ${bgColor} ${borderColor}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color} bg-white/60 dark:bg-black/20`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black text-gray-900 dark:text-white leading-none tabular-nums">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">{label}</p>
      </div>
    </motion.div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onCreate, labelNoData, hintNoData, labelCreate }: {
  onCreate: () => void
  labelNoData: string
  hintNoData: string
  labelCreate: string
}) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-24 px-6 text-center bg-white dark:bg-gray-800/70 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="w-20 h-20 rounded-2xl bg-primary/8 dark:bg-primary/15 border border-primary/15 flex items-center justify-center mb-5">
        <svg className="w-9 h-9 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
        </svg>
      </div>
      <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">{labelNoData}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">{hintNoData}</p>
      <motion.button
        type="button"
        onClick={onCreate}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors shadow-md shadow-primary/20"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
      >
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        {labelCreate}
      </motion.button>
    </motion.div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function ReunionPagination({
  currentPage, totalPages, onPageChange, labelRange, labelPrev, labelNext,
}: {
  currentPage: number; totalPages: number; onPageChange: (p: number) => void
  labelRange: string; labelPrev: string; labelNext: string
}) {
  const pages = useMemo(() => {
    const result: (number | '...')[] = []
    if (totalPages <= 0) return result
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) result.push(i)
    } else {
      result.push(0)
      if (currentPage > 2) result.push('...')
      for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages - 2, currentPage + 1); i++) result.push(i)
      if (currentPage < totalPages - 3) result.push('...')
      result.push(totalPages - 1)
    }
    return result
  }, [currentPage, totalPages])

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm">
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{labelRange}</p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          {labelPrev}
        </button>
        <div className="flex items-center gap-1 mx-1">
          {pages.map((p, idx) =>
            p === '...' ? (
              <span key={`e-${idx}`} className="px-2 text-gray-400 text-xs">…</span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p as number)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  p === currentPage ? 'bg-primary text-white shadow-sm shadow-primary/30' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {(p as number) + 1}
              </button>
            )
          )}
        </div>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {labelNext}
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ─── Meeting card ─────────────────────────────────────────────────────────────

function ReunionCard({
  r,
  index,
  onNavigatePV,
  onEdit,
  onDelete,
  t,
}: {
  r: ReunionHebdoSummary
  index: number
  onNavigatePV: () => void
  onEdit: () => void
  onDelete: () => void
  t: (k: string) => string
}) {
  const cfg = STATUT_CFG[r.statut] ?? STATUT_CFG.BROUILLON
  const weekNum = getWeekNumber(r.dateReunion)
  const dateObj = new Date(r.dateReunion)
  const dayName = dateObj.toLocaleDateString('fr-FR', { weekday: 'long' })
  const dayNum = dateObj.getDate()
  const monthName = dateObj.toLocaleDateString('fr-FR', { month: 'short' })
  const year = dateObj.getFullYear()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2, boxShadow: '0 8px 32px -8px rgba(0,0,0,0.12)' }}
      className="group relative bg-white dark:bg-gray-800/70 rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden cursor-pointer"
      onClick={onNavigatePV}
    >
      {/* Orange accent sur hover */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-orange-400 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-l-2xl" />

      {/* ── Haut : date + infos ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row">

        {/* Bloc date */}
        <div className={`flex flex-col items-center justify-center px-5 py-4 sm:py-5 sm:w-28 flex-shrink-0 border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-gray-700/40 ${cfg.dateBg}`}>
          <span className={`text-[10px] font-black uppercase tracking-widest ${cfg.dateText} mb-0.5`}>
            S{weekNum}
          </span>
          <span className={`text-4xl font-black leading-none ${cfg.dateText}`}>{dayNum}</span>
          <span className={`text-[11px] font-bold uppercase tracking-wide ${cfg.dateText} mt-0.5`}>
            {monthName} {year}
          </span>
          <span className={`text-[10px] font-medium capitalize mt-1 ${cfg.dateText} opacity-60`}>
            {dayName}
          </span>
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0 px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${cfg.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <span className="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-200 font-semibold">
              <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatTime(r.heureDebut)} – {formatTime(r.heureFin)}
            </span>
            {r.lieu && (
              <span className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {r.lieu}
              </span>
            )}
            {r.redacteurNom && (
              <span className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                {r.redacteurNom}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer : compteurs + actions ──────────────────────────────── */}
      <div
        className="flex items-center justify-between gap-3 px-5 py-2.5 border-t border-gray-100 dark:border-gray-700/40 bg-gray-50/50 dark:bg-gray-800/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compteurs */}
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <span className="font-bold text-gray-700 dark:text-gray-300">{r.nombreParticipants}</span> participants
          </span>
          <span className="w-px h-3.5 bg-gray-200 dark:bg-gray-600" />
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21" />
            </svg>
            <span className="font-bold text-gray-700 dark:text-gray-300">{r.nombrePointsProjet}</span> projets
          </span>
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center gap-1">
          <motion.button
            type="button"
            onClick={onNavigatePV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-primary dark:text-primary-light bg-primary/8 dark:bg-primary/15 hover:bg-primary/15 dark:hover:bg-primary/25 border border-primary/10 hover:border-primary/30 transition-all"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {t('list.viewPV')}
          </motion.button>

          <motion.button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
            {t('list.edit')}
          </motion.button>

          <motion.button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-danger hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-200 dark:hover:border-red-800 transition-all"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {t('list.delete')}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export const ReunionHebdoListPage = () => {
  const { t } = useTranslation('reunionHebdo')
  const formatDate = useFormatDate()
  const navigate = useNavigate()
  const confirm = useConfirm()

  const [reunions, setReunions] = useState<ReunionHebdoSummary[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    reunionHebdoApi
      .findAll(0, PAGE_SIZE)
      .then((res) => {
        setReunions(res.content)
        setTotalElements(res.totalElements)
        setTotalPages(res.totalPages)
        setCurrentPage(res.number)
      })
      .catch(() => setReunions([]))
      .finally(() => setLoading(false))
  }, [])

  const handlePageChange = (page: number) => {
    setLoading(true)
    reunionHebdoApi
      .findAll(page, PAGE_SIZE)
      .then((res) => {
        setReunions(res.content)
        setTotalElements(res.totalElements)
        setTotalPages(res.totalPages)
        setCurrentPage(res.number)
      })
      .finally(() => setLoading(false))
  }

  const handleDelete = async (id: number, dateStr: string) => {
    if (await confirm({ messageKey: 'confirm.deleteReunion', messageParams: { date: formatDate(dateStr, { weekday: 'short', monthStyle: 'short' }) } })) {
      await reunionHebdoApi.delete(id)
      setReunions((prev) => prev.filter((r) => r.id !== id))
      setTotalElements((prev) => Math.max(0, prev - 1))
    }
  }

  const kpis = useMemo(() => ({
    total: totalElements,
    brouillons: reunions.filter((r) => r.statut === 'BROUILLON').length,
    validees: reunions.filter((r) => r.statut === 'VALIDE').length,
  }), [reunions, totalElements])

  const isEmpty = !loading && reunions.length === 0

  const paginationRangeLabel = t('list.paginationRange', {
    from: totalElements === 0 ? 0 : currentPage * PAGE_SIZE + 1,
    to: Math.min((currentPage + 1) * PAGE_SIZE, totalElements),
    total: totalElements,
  })

  return (
    <PageContainer size="full" className="h-full flex flex-col min-h-0 bg-gray-50/80 dark:bg-gray-900/80">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="shrink-0 mb-6">
        <div className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm overflow-hidden">
          {/* Bande accent orange fine */}
          <div className="h-1 bg-gradient-to-r from-primary via-orange-400 to-amber-400" />

          <div className="px-6 py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

              {/* Titre */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/15 dark:border-primary/25 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-primary dark:text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    {t('list.title')}
                  </h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        loading ? 'bg-amber-400 animate-pulse' : totalElements > 0 ? 'bg-emerald-400' : 'bg-gray-300'
                      }`}
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {loading
                        ? t('list.loading')
                        : t('list.totalCount', { count: totalElements })}
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <motion.button
                type="button"
                onClick={() => navigate('/reunions-hebdo/nouveau')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-sm transition-colors shadow-md shadow-primary/20 self-start sm:self-auto"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {t('list.newMeeting')}
              </motion.button>
            </div>

            {/* ── KPI chips ───────────────────────────────────────────────── */}
            {!loading && totalElements > 0 && (
              <motion.div
                className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-gray-100 dark:border-gray-700/50"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <KpiCard
                  label={t('list.statReunions')}
                  value={kpis.total}
                  delay={0.1}
                  color="text-primary dark:text-primary-light"
                  bgColor="bg-primary/5 dark:bg-primary/10"
                  borderColor="border border-primary/10 dark:border-primary/20"
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
                    </svg>
                  }
                />
                {kpis.brouillons > 0 && (
                  <KpiCard
                    label="Brouillons"
                    value={kpis.brouillons}
                    delay={0.18}
                    color="text-amber-600 dark:text-amber-400"
                    bgColor="bg-amber-50 dark:bg-amber-900/20"
                    borderColor="border border-amber-100 dark:border-amber-800/30"
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                      </svg>
                    }
                  />
                )}
                {kpis.validees > 0 && (
                  <KpiCard
                    label="Validées"
                    value={kpis.validees}
                    delay={0.26}
                    color="text-emerald-600 dark:text-emerald-400"
                    bgColor="bg-emerald-50 dark:bg-emerald-900/20"
                    borderColor="border border-emerald-100 dark:border-emerald-800/30"
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                  />
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ── Corps ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4">
        {isEmpty ? (
          <EmptyState
            onCreate={() => navigate('/reunions-hebdo/nouveau')}
            labelNoData={t('list.emptyTitle')}
            hintNoData={t('list.emptyHint')}
            labelCreate={t('list.createButton')}
          />
        ) : (
          <>
            {/* Skeleton */}
            {loading && (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} index={i} />)}
              </div>
            )}

            {/* Cartes de réunions */}
            {!loading && (
              <AnimatePresence mode="popLayout">
                <div className="space-y-3">
                  {reunions.map((r, idx) => (
                    <ReunionCard
                      key={r.id}
                      r={r}
                      index={idx}
                      onNavigatePV={() => navigate(`/reunions-hebdo/${r.id}`)}
                      onEdit={() => navigate(`/reunions-hebdo/${r.id}/edit`)}
                      onDelete={() => handleDelete(r.id, r.dateReunion)}
                      t={t}
                    />
                  ))}
                </div>
              </AnimatePresence>
            )}

            {/* Pagination */}
            {totalElements > 0 && (
              <ReunionPagination
                currentPage={currentPage}
                totalPages={Math.max(1, totalPages)}
                onPageChange={handlePageChange}
                labelRange={paginationRangeLabel}
                labelPrev={t('list.prev')}
                labelNext={t('list.next')}
              />
            )}
          </>
        )}
      </div>
    </PageContainer>
  )
}
