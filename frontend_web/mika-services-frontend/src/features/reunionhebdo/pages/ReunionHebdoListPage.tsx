import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useConfirm } from '@/contexts/ConfirmContext'
import { PageContainer } from '@/components/layout/PageContainer'
import { reunionHebdoApi } from '@/api/reunionHebdoApi'
import type { ReunionHebdoSummary, StatutReunion } from '@/types/reunionHebdo'
import { useFormatDate } from '@/hooks/useFormatDate'

const PAGE_SIZE = 20

const STATUT_COLORS: Record<StatutReunion, string> = {
  BROUILLON: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200',
  VALIDE: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200',
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100 dark:border-gray-700/60">
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3.5 bg-gray-200 dark:bg-gray-600/60 rounded-full w-full max-w-[7rem] animate-pulse" />
        </td>
      ))}
    </tr>
  )
}

function StatPill({ label, value, icon }: { label: string; value: string | number; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm">
      <span className="text-white/70 text-sm">{icon}</span>
      <div>
        <p className="text-[10px] text-white/60 font-medium leading-none">{label}</p>
        <p className="text-sm font-bold text-white leading-tight">{value}</p>
      </div>
    </div>
  )
}

function EmptyState({
  onCreate,
  labelNoData,
  hintNoData,
  labelCreate,
}: {
  onCreate: () => void
  labelNoData: string
  hintNoData: string
  labelCreate: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm">
      <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-700/60 flex items-center justify-center mb-5">
        <svg className="w-9 h-9 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5"
          />
        </svg>
      </div>
      <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">{labelNoData}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">{hintNoData}</p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-5 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors duration-200 shadow-sm shadow-primary/20"
      >
        {labelCreate}
      </button>
    </div>
  )
}

function ReunionPagination({
  currentPage,
  totalPages,
  onPageChange,
  labelRange,
  labelPrev,
  labelNext,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (p: number) => void
  labelRange: string
  labelPrev: string
  labelNext: string
}) {
  const pages = useMemo(() => {
    const result: (number | '...')[] = []
    if (totalPages <= 0) return result
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) result.push(i)
    } else {
      result.push(0)
      if (currentPage > 2) result.push('...')
      for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages - 2, currentPage + 1); i++) {
        result.push(i)
      }
      if (currentPage < totalPages - 3) result.push('...')
      result.push(totalPages - 1)
    }
    return result
  }, [currentPage, totalPages])

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm">
      <div className="flex items-center gap-3">
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{labelRange}</p>
        <div className="h-4 w-px bg-gray-200 dark:bg-gray-600" />
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
          {PAGE_SIZE} / page
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          {labelPrev}
        </button>

        <div className="flex items-center gap-1 mx-1">
          {pages.map((p, idx) =>
            p === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 text-xs">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p as number)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-150 ${
                  p === currentPage
                    ? 'bg-primary text-white shadow-sm shadow-primary/30'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
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

const IconGrid = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
    />
  </svg>
)

const IconClock = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const IconPlus = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
)

export const ReunionHebdoListPage = () => {
  const { t } = useTranslation('reunionHebdo')
  const formatDate = useFormatDate()
  const navigate = useNavigate()
  const confirm = useConfirm()

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '-'
    const [h, m] = timeStr.split(':')
    return `${h}h${m || '00'}`
  }

  const STATUT_LABELS = useMemo(
    () =>
      Object.fromEntries(
        (['BROUILLON', 'VALIDE'] as StatutReunion[]).map((statut) => [
          statut,
          { label: t(`statut.${statut}`), color: STATUT_COLORS[statut] },
        ])
      ) as Record<StatutReunion, { label: string; color: string }>,
    [t]
  )
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

  const isEmpty = !loading && reunions.length === 0

  const paginationRangeLabel = t('list.paginationRange', {
    from: totalElements === 0 ? 0 : currentPage * PAGE_SIZE + 1,
    to: Math.min((currentPage + 1) * PAGE_SIZE, totalElements),
    total: totalElements,
  })

  const totalCountLine = t('list.totalCount', { count: totalElements })

  return (
    <PageContainer size="full" className="h-full flex flex-col min-h-0 bg-gray-50/80 dark:bg-gray-900/80">
      <div className="shrink-0 mb-6">
        <div className="relative overflow-hidden rounded-2xl shadow-xl shadow-primary/10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-secondary" />
          <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative z-10 px-6 py-7 md:py-9">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-lg flex-shrink-0 backdrop-blur-sm">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5"
                    />
                  </svg>
                </div>

                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">{t('list.title')}</h1>
                  <p className="text-white/75 text-sm font-medium mt-1">{t('list.subtitle')}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${totalElements > 0 ? 'bg-green-400' : 'bg-amber-300'} ${loading ? 'animate-pulse' : ''}`}
                    />
                    <p className={`text-xs font-medium ${totalElements > 0 ? 'text-white/70' : 'text-amber-200'}`}>
                      {loading ? t('list.loading') : totalCountLine}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                <div className="flex flex-wrap gap-2 justify-end">
                  {totalElements > 0 && (
                    <StatPill label={t('list.statReunions')} value={totalElements.toLocaleString()} icon={<IconGrid />} />
                  )}
                  {totalPages > 1 && (
                    <StatPill
                      label={t('list.statPagination')}
                      value={`${currentPage + 1}/${totalPages}`}
                      icon={<IconClock />}
                    />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/reunions-hebdo/nouveau')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-primary font-bold text-sm hover:bg-white/90 transition-all duration-200 shadow-lg shadow-black/10"
                >
                  <IconPlus />
                  {t('list.newMeeting')}
                </button>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10" />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-5">
        {isEmpty ? (
          <EmptyState
            onCreate={() => navigate('/reunions-hebdo/nouveau')}
            labelNoData={t('list.emptyTitle')}
            hintNoData={t('list.emptyHint')}
            labelCreate={t('list.createButton')}
          />
        ) : (
          <>
            <div className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="w-7 h-7 rounded-lg bg-secondary/10 dark:bg-secondary/20 text-secondary dark:text-secondary-light flex items-center justify-center">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125H9.375m3.75-3.75h-3.75"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{t('list.sectionTable')}</p>
                  {!loading && reunions.length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-bold">
                      {totalElements}
                    </span>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full" role="table">
                  <thead>
                    <tr className="bg-gray-50/80 dark:bg-gray-700/50">
                      <th scope="col" className="px-5 py-3.5 text-left border-b border-gray-100 dark:border-gray-700/60">
                        <span className="text-[10px] font-black tracking-widest uppercase text-gray-500 dark:text-gray-400">
                          {t('list.columns.date')}
                        </span>
                      </th>
                      <th scope="col" className="px-4 py-3.5 text-left border-b border-gray-100 dark:border-gray-700/60">
                        <span className="text-[10px] font-black tracking-widest uppercase text-gray-500 dark:text-gray-400">
                          {t('list.columns.lieu')}
                        </span>
                      </th>
                      <th scope="col" className="px-4 py-3.5 text-left border-b border-gray-100 dark:border-gray-700/60">
                        <span className="text-[10px] font-black tracking-widest uppercase text-gray-500 dark:text-gray-400">
                          {t('list.columns.heure')}
                        </span>
                      </th>
                      <th scope="col" className="px-4 py-3.5 text-left border-b border-gray-100 dark:border-gray-700/60">
                        <span className="text-[10px] font-black tracking-widest uppercase text-gray-500 dark:text-gray-400">
                          {t('list.columns.redacteur')}
                        </span>
                      </th>
                      <th scope="col" className="px-4 py-3.5 text-center border-b border-gray-100 dark:border-gray-700/60">
                        <span className="text-[10px] font-black tracking-widest uppercase text-gray-500 dark:text-gray-400">
                          {t('list.columns.participants')}
                        </span>
                      </th>
                      <th scope="col" className="px-4 py-3.5 text-center border-b border-gray-100 dark:border-gray-700/60">
                        <span className="text-[10px] font-black tracking-widest uppercase text-gray-500 dark:text-gray-400">
                          {t('list.columns.pointsProjet')}
                        </span>
                      </th>
                      <th scope="col" className="px-4 py-3.5 text-left border-b border-gray-100 dark:border-gray-700/60">
                        <span className="text-[10px] font-black tracking-widest uppercase text-gray-500 dark:text-gray-400">
                          {t('list.columns.statut')}
                        </span>
                      </th>
                      <th scope="col" className="px-5 py-3.5 text-center border-b border-gray-100 dark:border-gray-700/60 w-52">
                        <span className="text-[10px] font-black tracking-widest uppercase text-gray-500 dark:text-gray-400">
                          {t('list.actions')}
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
                    {loading &&
                      Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
                    {!loading &&
                      reunions.map((r) => (
                        <tr
                          key={r.id}
                          className="group hover:bg-primary/[0.02] dark:hover:bg-primary/[0.05] transition-colors duration-150 cursor-pointer"
                          onClick={() => navigate(`/reunions-hebdo/${r.id}`)}
                        >
                          <td className="px-5 py-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {formatDate(r.dateReunion, { weekday: 'short', monthStyle: 'short' })}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{r.lieu || '—'}</td>
                          <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {formatTime(r.heureDebut)} - {formatTime(r.heureFin)}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{r.redacteurNom || '—'}</td>
                          <td className="px-4 py-4 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                            {r.nombreParticipants}
                          </td>
                          <td className="px-4 py-4 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                            {r.nombrePointsProjet}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-lg ${STATUT_LABELS[r.statut]?.color || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
                            >
                              {STATUT_LABELS[r.statut]?.label || r.statut}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex flex-wrap items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => navigate(`/reunions-hebdo/${r.id}`)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-primary dark:text-primary-light hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
                              >
                                {t('list.viewPV')}
                              </button>
                              <button
                                type="button"
                                onClick={() => navigate(`/reunions-hebdo/${r.id}/edit`)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                {t('list.edit')}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(r.id, r.dateReunion)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-danger hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              >
                                {t('list.delete')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

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
