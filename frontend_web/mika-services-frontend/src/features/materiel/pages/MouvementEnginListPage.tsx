import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useIsOnline } from '@/hooks/useConnectivity'
import { OfflineDisabledButton } from '@/components/pwa/OfflineDisabledButton'
import { PageContainer } from '@/components/layout/PageContainer'
import {
  fetchMouvements,
  confirmerDepartMouvement,
  confirmerReceptionMouvement,
  annulerMouvement,
} from '@/store/slices/mouvementEnginSlice'
import { MaterielEmptyState, MaterielPagination } from '../components/MaterielListChrome'
import { MaterielModuleTabs } from '../components/MaterielModuleTabs'
import { MouvementEnginCreateModal } from '../components/MouvementEnginCreateModal'
import { TransfertLiveMap } from '../map/TransfertLiveMap'
import { useCountUp } from '../hooks/useCountUp'
import type { StatutMouvementEngin, MouvementEnginSummary } from '@/types/materiel'

/* ═══════════════════════════════════════════════════════════════════
   STYLE MAPS
   ═══════════════════════════════════════════════════════════════════ */

const ALL_STATUTS: StatutMouvementEngin[] = ['EN_ATTENTE_DEPART', 'EN_TRANSIT', 'RECU', 'ANNULE']

const STATUT_CONFIG: Record<StatutMouvementEngin, { bg: string; text: string; dot: string; border: string; hex: string }> = {
  EN_ATTENTE_DEPART: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500', border: 'border-amber-200 dark:border-amber-700/40', hex: '#f59e0b' },
  EN_TRANSIT:        { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-400', dot: 'bg-indigo-500', border: 'border-indigo-200 dark:border-indigo-700/40', hex: '#6366f1' },
  RECU:              { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', border: 'border-emerald-200 dark:border-emerald-700/40', hex: '#10b981' },
  ANNULE:            { bg: 'bg-slate-100 dark:bg-slate-700/50', text: 'text-slate-600 dark:text-slate-300', dot: 'bg-slate-400', border: 'border-slate-200 dark:border-slate-600', hex: '#94a3b8' },
}

/* ═══════════════════════════════════════════════════════════════════
   METRIC PILL — KPI cliquable (même style que la liste DMA)
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
   FLOW PIPELINE — répartition des statuts (cliquable)
   ═══════════════════════════════════════════════════════════════════ */

function FlowPipeline({ mouvements, t, onFilter }: {
  mouvements: MouvementEnginSummary[]
  t: (key: string) => string
  onFilter: (s: StatutMouvementEngin | '') => void
}) {
  const total = mouvements.length
  const counts = useMemo(() => {
    const c: Partial<Record<StatutMouvementEngin, number>> = {}
    mouvements.forEach((m) => { c[m.statut] = (c[m.statut] || 0) + 1 })
    return c
  }, [mouvements])

  if (total === 0) return null

  const segments = ALL_STATUTS
    .filter((s) => (counts[s] || 0) > 0)
    .map((s) => ({
      statut: s,
      count: counts[s]!,
      pct: Math.round(((counts[s] || 0) / total) * 100),
      color: STATUT_CONFIG[s].hex,
    }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700/40">
        {segments.map((seg, i) => (
          <motion.div
            key={seg.statut}
            className="h-full cursor-pointer relative group"
            style={{ background: seg.color }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(seg.pct, 2)}%` }}
            transition={{ duration: 0.8, delay: 0.5 + i * 0.05, ease: 'easeOut' }}
            onClick={() => onFilter(seg.statut)}
            title={`${t(`mouvement.statut.${seg.statut}`)} — ${seg.count}`}
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

function MouvementSkeleton() {
  return (
    <PageContainer size="full" className="h-full flex flex-col min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto px-1 py-2">
        <div className="flex items-center justify-between mb-6">
          <div className="h-7 w-56 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-6">
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
   ACTION CONFIRM MODAL — inchangé fonctionnellement
   ═══════════════════════════════════════════════════════════════════ */

function ActionConfirmModal({
  title, message, confirmLabel, confirmClass, onConfirm, onCancel,
}: {
  title: string
  message: string
  confirmLabel: string
  confirmClass: string
  onConfirm: (commentaire: string) => void
  onCancel: () => void
}) {
  const { t } = useTranslation('materiel')
  const [commentaire, setCommentaire] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        className="relative z-10 w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <div className="px-6 py-4 space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{t('mouvement.commentaire')}</label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder={t('mouvement.commentairePlaceholder')}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            {t('form.cancel')}
          </button>
          <button type="button" onClick={() => onConfirm(commentaire)} className={`px-5 py-2 rounded-xl text-white text-sm font-bold transition-colors shadow-sm ${confirmClass}`}>
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   MOUVEMENT TABLE ROW
   ═══════════════════════════════════════════════════════════════════ */

function MouvementTableRow({ m, index, isActing, isOnline, locale, t, onAction, onOpenMap }: {
  m: MouvementEnginSummary
  index: number
  isActing: boolean
  isOnline: boolean
  locale: string
  t: (key: string) => string
  onAction: (type: 'depart' | 'reception' | 'annuler', label: string) => void
  onOpenMap: (id: number) => void
}) {
  const cfg = STATUT_CONFIG[m.statut]
  const fmt = (d: string) => new Date(d).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <motion.tr
      className="group border-b border-gray-50 dark:border-gray-700/30 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 * Math.min(index, 15) }}
    >
      {/* Engin */}
      <td className="px-5 py-3.5 align-middle">
        <div className="flex items-center gap-2.5">
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
          <div>
            <p className="font-mono text-[13px] font-bold text-gray-900 dark:text-white tracking-wide">{m.enginCode}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[11rem]">{m.enginNom}</p>
          </div>
        </div>
      </td>

      {/* Trajet : origine → destination */}
      <td className="px-5 py-3.5 align-middle">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 dark:text-gray-400 truncate max-w-[9rem]">
            {m.projetOrigineNom ?? <span className="italic text-gray-400 dark:text-gray-500">{t('detail.depot')}</span>}
          </span>
          <svg className="w-3.5 h-3.5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
          <span className="font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[9rem]">{m.projetDestinationNom}</span>
        </div>
      </td>

      {/* Statut */}
      <td className="px-5 py-3.5 align-middle">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-bold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {t(`mouvement.statut.${m.statut}`)}
        </span>
      </td>

      {/* Dates */}
      <td className="px-5 py-3.5 align-middle text-sm text-gray-500 dark:text-gray-400 tabular-nums whitespace-nowrap">
        {fmt(m.dateDemande)}
        {m.dateDepartConfirmee && (
          <p className="text-[10px] text-indigo-500 dark:text-indigo-400">{t('mouvement.depart')} {fmt(m.dateDepartConfirmee)}</p>
        )}
        {m.dateReceptionConfirmee && (
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400">{t('mouvement.reception')} {fmt(m.dateReceptionConfirmee)}</p>
        )}
      </td>

      {/* Initiateur */}
      <td className="px-5 py-3.5 align-middle">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300 flex-shrink-0">
            {m.initiateurNom?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[8rem]">{m.initiateurNom}</span>
        </div>
      </td>

      {/* Actions */}
      <td className="px-5 py-3.5 align-middle">
        <div className="flex items-center gap-1.5 flex-wrap">
          {m.statut === 'EN_ATTENTE_DEPART' && (
            <>
              <button
                type="button"
                disabled={isActing || !isOnline}
                title={!isOnline ? t('common:offline.actionUnavailable') : undefined}
                onClick={() => onAction('depart', t('mouvement.action.confirmDepart'))}
                className="px-2.5 py-1.5 rounded-md border border-indigo-200 dark:border-indigo-700/50 bg-indigo-50/80 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/35 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {t('mouvement.action.confirmDepart')}
              </button>
              <button
                type="button"
                disabled={isActing || !isOnline}
                title={!isOnline ? t('common:offline.actionUnavailable') : undefined}
                onClick={() => onAction('annuler', t('mouvement.action.annuler'))}
                className="px-2.5 py-1.5 rounded-md border border-rose-200 dark:border-rose-700/50 bg-rose-50/80 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-[11px] font-bold hover:bg-rose-100 dark:hover:bg-rose-900/35 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {t('mouvement.action.annuler')}
              </button>
            </>
          )}
          {m.statut === 'EN_TRANSIT' && (
            <>
              <button
                type="button"
                onClick={() => onOpenMap(m.id)}
                className="px-2.5 py-1.5 rounded-md border border-violet-200 dark:border-violet-700/50 bg-violet-50/80 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 text-[11px] font-bold hover:bg-violet-100 dark:hover:bg-violet-900/35 transition-all inline-flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                </svg>
                {t('mouvement.action.suivreCarte')}
              </button>
              <button
                type="button"
                disabled={isActing || !isOnline}
                title={!isOnline ? t('common:offline.actionUnavailable') : undefined}
                onClick={() => onAction('reception', t('mouvement.action.confirmReception'))}
                className="px-2.5 py-1.5 rounded-md border border-emerald-200 dark:border-emerald-700/50 bg-emerald-50/80 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/35 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isActing ? '…' : t('mouvement.action.confirmReception')}
              </button>
            </>
          )}
          {(m.statut === 'RECU' || m.statut === 'ANNULE') && (
            <span className="text-[11px] text-gray-400 dark:text-gray-500 italic">{t('mouvement.terminal')}</span>
          )}
        </div>
      </td>
    </motion.tr>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════ */

type PendingAction = { type: 'depart' | 'reception' | 'annuler'; mouvementId: number; label: string }

export function MouvementEnginListPage() {
  const { t, i18n } = useTranslation('materiel')
  const isOnline = useIsOnline()
  const dispatch = useAppDispatch()
  const { mouvements, totalElements, totalPages, currentPage, loading, actionLoading, error } = useAppSelector((s) => s.mouvementEngin)

  const [filterStatut, setFilterStatut] = useState<StatutMouvementEngin | ''>('')
  const [pageSize, setPageSize] = useState(20)
  const [showCreate, setShowCreate] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [mapTransfertId, setMapTransfertId] = useState<number | null>(null)

  const fetchPage = (page = 0) => {
    dispatch(fetchMouvements({ page, size: pageSize, statut: filterStatut || undefined }))
  }

  useEffect(() => { fetchPage(0) }, [filterStatut, pageSize]) // eslint-disable-line react-hooks/exhaustive-deps

  const hasActiveFilters = filterStatut !== ''
  const resetFilters = () => setFilterStatut('')

  const handleAction = async (commentaire: string) => {
    if (!pendingAction) return
    const { type, mouvementId } = pendingAction
    setPendingAction(null)
    const body = commentaire.trim() ? { commentaire: commentaire.trim() } : undefined
    if (type === 'depart') await dispatch(confirmerDepartMouvement({ id: mouvementId, body }))
    else if (type === 'reception') await dispatch(confirmerReceptionMouvement({ id: mouvementId, body }))
    else await dispatch(annulerMouvement({ id: mouvementId, body }))
  }

  const paginationRangeLabel = t('list.paginationRange', {
    from: totalElements === 0 ? 0 : currentPage * pageSize + 1,
    to: Math.min((currentPage + 1) * pageSize, totalElements),
    total: totalElements,
  })

  // KPIs
  const kpis = useMemo(() => ({
    total: totalElements,
    enAttente: mouvements.filter((m) => m.statut === 'EN_ATTENTE_DEPART').length,
    enTransit: mouvements.filter((m) => m.statut === 'EN_TRANSIT').length,
    recus: mouvements.filter((m) => m.statut === 'RECU').length,
    annules: mouvements.filter((m) => m.statut === 'ANNULE').length,
  }), [mouvements, totalElements])

  const toggleStatut = (s: StatutMouvementEngin) => setFilterStatut(filterStatut === s ? '' : s)

  if (loading && mouvements.length === 0 && !error) return <MouvementSkeleton />

  return (
    <PageContainer size="full" className="h-full flex flex-col min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto">

        {/* ═══════════ TOP SECTION — Header + Metrics + Pipeline ═══════════ */}
        <div className="bg-white dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700/50">
          <div className="px-4 sm:px-6 lg:px-8 py-4">

            {/* Row 1 — Title + Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-md">
                  <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 10-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 10-3 0m3 0h-9m-9-3h9m-9 3v-4.5m0 4.5h-.375a1.125 1.125 0 01-1.125-1.125V9.75m18 0v8.25m0 0h.375a1.125 1.125 0 001.125-1.125V9.75m-14.25 6.375h3m-3-4.5h9" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
                    {t('mouvement.title')}
                  </h1>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                    {t('mouvement.hero')}
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
                <OfflineDisabledButton>
                  <motion.button
                    type="button"
                    onClick={() => setShowCreate(true)}
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
                    {t('mouvement.create')}
                  </motion.button>
                </OfflineDisabledButton>
              </motion.div>
            </div>

            {/* Row 2 — Metrics row : KPIs cliquables qui filtrent */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-4">
              <MetricPill value={kpis.total} label="Total" color="bg-slate-400" delay={100}
                active={!hasActiveFilters} onClick={resetFilters} />
              <MetricPill value={kpis.enAttente} label={t('mouvement.statut.EN_ATTENTE_DEPART')} color="bg-amber-500" delay={200}
                active={filterStatut === 'EN_ATTENTE_DEPART'} onClick={() => toggleStatut('EN_ATTENTE_DEPART')} />
              <MetricPill value={kpis.enTransit} label={t('mouvement.statut.EN_TRANSIT')} color="bg-indigo-500" delay={300}
                active={filterStatut === 'EN_TRANSIT'} onClick={() => toggleStatut('EN_TRANSIT')} />
              <MetricPill value={kpis.recus} label={t('mouvement.statut.RECU')} color="bg-emerald-500" delay={400}
                active={filterStatut === 'RECU'} onClick={() => toggleStatut('RECU')} />
              <MetricPill value={kpis.annules} label={t('mouvement.statut.ANNULE')} color="bg-slate-400" delay={500}
                active={filterStatut === 'ANNULE'} onClick={() => toggleStatut('ANNULE')} />
            </div>

            {/* Row 3 — Pipeline bar */}
            <FlowPipeline mouvements={mouvements} t={t} onFilter={setFilterStatut} />
          </div>
        </div>

        {/* ═══════════ FILTER BAR — chips statut ═══════════ */}
        <div className="bg-gray-50/80 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700/40 sticky top-0 z-20">
          <div className="px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2 flex-1 min-w-[16rem]">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap">{t('mouvement.filterStatut')}</span>
              <div className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                <button
                  type="button"
                  onClick={resetFilters}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-bold whitespace-nowrap transition-all ${
                    filterStatut === ''
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-700/50'
                  }`}
                >
                  {t('engin.filterAll')} ({kpis.total})
                </button>
                {ALL_STATUTS.map((s) => {
                  const count = mouvements.filter((m) => m.statut === s).length
                  if (count === 0 && filterStatut !== s) return null
                  const cfg = STATUT_CONFIG[s]
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleStatut(s)}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-bold whitespace-nowrap transition-all border ${
                        filterStatut === s
                          ? `${cfg.bg} ${cfg.text} ${cfg.border}`
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      {t(`mouvement.statut.${s}`)} {count > 0 && <span className="ml-1 tabular-nums">{count}</span>}
                    </button>
                  )
                })}
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
                    {t('mouvement.tableTitle')}
                  </h2>
                  {!loading && (
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tabular-nums">
                      {mouvements.length} sur {totalElements}
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
                <table className="w-full min-w-[900px]" role="table">
                  <thead>
                    <tr className="bg-gray-50/60 dark:bg-gray-700/30">
                      {[
                        t('mouvement.col.engin'),
                        `${t('mouvement.col.origine')} → ${t('mouvement.col.destination')}`,
                        t('mouvement.col.statut'),
                        t('mouvement.col.date'),
                        t('mouvement.col.initiateur'),
                        t('engin.actions'),
                      ].map((label, i) => (
                        <th key={i} scope="col" className="px-5 py-2.5 text-left border-b border-gray-100 dark:border-gray-700/50">
                          <span className="text-[10px] font-black tracking-[0.08em] uppercase text-gray-400 dark:text-gray-500">
                            {label}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading && mouvements.length === 0 && Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-50 dark:border-gray-700/30">
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-5 py-4">
                            <div className="h-3 bg-gray-100 dark:bg-gray-700/40 rounded w-full max-w-[7rem] animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))}
                    {!loading && mouvements.map((m, i) => (
                      <MouvementTableRow
                        key={m.id}
                        m={m}
                        index={i}
                        isActing={actionLoading === m.id}
                        isOnline={isOnline}
                        locale={i18n.language}
                        t={t}
                        onAction={(type, label) => setPendingAction({ type, mouvementId: m.id, label })}
                        onOpenMap={(id) => setMapTransfertId(id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {!loading && mouvements.length === 0 && (
                <MaterielEmptyState
                  hasFilters={hasActiveFilters}
                  onReset={resetFilters}
                  labelNoData={t('mouvement.emptyNoData')}
                  labelNoResults={t('list.emptyNoResults')}
                  hintNoData={t('mouvement.emptyNoDataHint')}
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

      {/* Modal création */}
      {showCreate && (
        <MouvementEnginCreateModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); fetchPage(0) }}
        />
      )}

      {/* Modal action */}
      {pendingAction && (
        <ActionConfirmModal
          title={pendingAction.label}
          message={
            pendingAction.type === 'annuler'
              ? t('mouvement.confirmAnnuler')
              : pendingAction.type === 'depart'
              ? t('mouvement.confirmDepart')
              : t('mouvement.confirmReception')
          }
          confirmLabel={pendingAction.label}
          confirmClass={
            pendingAction.type === 'annuler'
              ? 'bg-rose-500 hover:bg-rose-600'
              : pendingAction.type === 'depart'
              ? 'bg-indigo-600 hover:bg-indigo-700'
              : 'bg-emerald-600 hover:bg-emerald-700'
          }
          onConfirm={handleAction}
          onCancel={() => setPendingAction(null)}
        />
      )}

      {/* Modal suivi carte temps réel */}
      {mapTransfertId != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMapTransfertId(null)} />
          <motion.div
            className="relative z-10 w-full max-w-4xl h-[70vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t('mouvement.action.suivreCarte')}</h3>
              <button
                type="button"
                onClick={() => setMapTransfertId(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <TransfertLiveMap transfertId={mapTransfertId} />
            </div>
          </motion.div>
        </div>
      )}
    </PageContainer>
  )
}
