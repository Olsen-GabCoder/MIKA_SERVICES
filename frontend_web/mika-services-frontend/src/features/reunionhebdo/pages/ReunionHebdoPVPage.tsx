import { useEffect, useMemo, useState, type FormEvent, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useConfirm } from '@/contexts/ConfirmContext'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { reunionHebdoApi } from '@/api/reunionHebdoApi'
import { projetApi, pointBloquantApi } from '@/api/projetApi'
import type { ReunionHebdo, PointProjetPV, PointProjetPVRequest, StatutReunion } from '@/types/reunionHebdo'
import { useFormatDate } from '@/hooks/useFormatDate'
import { getWeekYearFromDateString } from '@/utils/weekFromDate'
import { generatePVDocument } from '@/features/reunionhebdo/export'

const formatTime = (timeStr?: string) => (timeStr ? timeStr.slice(0, 5).replace(':', 'h') : '-')

const STATUT_COLORS: Record<StatutReunion, string> = {
  BROUILLON: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200',
  VALIDE: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200',
}

function SectionCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  )
}

function SectionHeader({
  icon,
  title,
  subtitle,
  accent = false,
  badge,
}: {
  icon: ReactNode
  title: string
  subtitle?: string
  accent?: boolean
  badge?: ReactNode
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-4 px-6 py-5 border-b border-gray-100 dark:border-gray-700/60 bg-gray-50/60 dark:bg-gray-800/40 rounded-t-2xl${accent ? ' border-l-4 border-l-primary' : ''}`}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/10 text-primary dark:text-primary-light">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 dark:text-white text-sm">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {badge}
    </div>
  )
}

function StatPill({ label, value, icon }: { label: string; value: string | number; icon: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600">
      <span className="text-gray-500 dark:text-gray-400">{icon}</span>
      <div>
        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-none">{label}</p>
        <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{value}</p>
      </div>
    </div>
  )
}

function SummaryStat({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 px-4 py-3">
      <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light flex items-center justify-center flex-shrink-0 text-sm">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{value || '—'}</p>
      </div>
    </div>
  )
}

function FieldGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold tracking-widest uppercase text-gray-500 dark:text-gray-400">{label}</label>
      {children}
    </div>
  )
}

function StyledInput(props: React.ComponentProps<'input'>) {
  const { className = '', ...rest } = props
  return (
    <input
      {...rest}
      className={`
        w-full px-4 py-2.5 rounded-xl border text-sm font-medium
        bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700
        text-gray-900 dark:text-gray-100
        focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
        transition-all duration-200
        ${className}
      `}
    />
  )
}

function StyledTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = '', ...rest } = props
  return (
    <textarea
      {...rest}
      className={`
        w-full px-4 py-2.5 rounded-xl border text-sm font-medium
        bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700
        text-gray-900 dark:text-gray-100
        focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
        transition-all duration-200
        ${className}
      `}
    />
  )
}

const IconUsers = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z"
    />
  </svg>
)

const IconBriefcase = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006a2.194 2.194 0 01-.75 1.661m-18 0a2.194 2.194 0 01-.75-1.661V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m0 0A2.25 2.25 0 0112 2.25a2.25 2.25 0 012.25 2.25v.894m0 0a48.342 48.342 0 013.478-.397m-15.956 0a48.342 48.342 0 00-3.478-.397m0 0A2.25 2.25 0 0012 2.25h.006A2.25 2.25 0 0014.25 4.5v.894m0 0a48.342 48.342 0 013.478-.397M12 12.75h.008v.008H12V12.75zm0 3h.008v.008H12V15.75zm0 3h.008v.008H12V18.75z"
    />
  </svg>
)

const IconDoc = () => (
  <svg className="w-5 h-5 text-primary dark:text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
    />
  </svg>
)

const IconArrowLeft = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
)

const IconInfo = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
    />
  </svg>
)

const IconPencil = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
  </svg>
)

const IconDownload = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
)

function PVLoadingSkeleton() {
  const { t } = useTranslation('reunionHebdo')
  return (
    <PageContainer size="full" className="w-full min-h-[calc(100dvh-4rem)] flex flex-col bg-gray-50/80 dark:bg-gray-900/80 pb-6">
      {/* Header skeleton */}
      <div className="rounded-2xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800/80 shadow-sm overflow-hidden mb-6">
        <div className="h-1 bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="px-6 py-7 space-y-3">
          <div className="h-3 w-32 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-8 w-72 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse" />
          <div className="h-4 w-full max-w-md bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
          <div className="flex gap-2 pt-2">
            <div className="h-8 w-28 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
            <div className="h-8 w-28 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
      <div className="flex flex-col xl:flex-row gap-6 flex-1">
        <div className="flex-1 space-y-4">
          <div className="h-40 bg-white dark:bg-gray-700/60 rounded-2xl border border-gray-100 dark:border-gray-600/60 animate-pulse" />
          <div className="h-48 bg-white dark:bg-gray-700/60 rounded-2xl border border-gray-100 dark:border-gray-600/60 animate-pulse" />
        </div>
        <div className="xl:w-72 h-64 xl:h-auto bg-white dark:bg-gray-700/60 rounded-2xl border border-gray-100 dark:border-gray-600/60 animate-pulse" />
      </div>
      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">{t('pv.loading')}</p>
    </PageContainer>
  )
}

export const ReunionHebdoPVPage = () => {
  const { t } = useTranslation('reunionHebdo')
  const formatDate = useFormatDate()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const [pv, setPv] = useState<ReunionHebdo | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingPoint, setEditingPoint] = useState<number | null>(null)
  const [exportingPV, setExportingPV] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setPv(null)
      setLoading(false)
      return
    }
    setLoading(true)
    reunionHebdoApi
      .findById(Number(id))
      .then(setPv)
      .catch(() => setPv(null))
      .finally(() => setLoading(false))
  }, [id])

  const refreshPv = () => {
    if (id) reunionHebdoApi.findById(Number(id)).then(setPv)
  }

  const handleSavePoint = async (data: PointProjetPVRequest) => {
    if (!id) return
    await reunionHebdoApi.savePointProjet(Number(id), data)
    refreshPv()
    setEditingPoint(null)
  }

  const handleDeletePoint = async (pointId: number) => {
    if (!id || !(await confirm({ messageKey: 'confirm.removeProjectFromPV' }))) return
    await reunionHebdoApi.deletePointProjet(Number(id), pointId)
    refreshPv()
    setEditingPoint(null)
  }

  const handleDownloadPV = async () => {
    if (!pv) return
    setDownloadError(null)
    setExportingPV(true)
    try {
      const { week, year } = getWeekYearFromDateString(pv.dateReunion)
      const listRes = await projetApi.findAll(0, 500)
      const results = await Promise.allSettled(
        listRes.content.map((p) =>
          Promise.all([
            projetApi.findById(p.id),
            projetApi.getPrevisions(p.id),
            pointBloquantApi.findByProjet(p.id, 0, 100),
          ]).then(([projet, previsions, pointsBloquantsRes]) => ({
            projet,
            previsions: previsions ?? [],
            pointsBloquants: pointsBloquantsRes?.content ?? [],
          }))
        )
      )
      const projetsData = results
        .filter((r): r is PromiseFulfilledResult<{ projet: Awaited<ReturnType<typeof projetApi.findById>>; previsions: Awaited<ReturnType<typeof projetApi.getPrevisions>>; pointsBloquants: Awaited<ReturnType<typeof pointBloquantApi.findByProjet>>['content'] }> => r.status === 'fulfilled')
        .map((r) => r.value)
      projetsData.sort((a, b) => a.projet.nom.localeCompare(b.projet.nom, 'fr'))
      await generatePVDocument({
        reunion: pv,
        semaineReunion: week,
        anneeReunion: year,
        projetsData,
        formatDate: (d) => formatDate(d),
        formatTime: () => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : t('form.errorGeneric')
      setDownloadError(message)
      console.error('Erreur téléchargement PV:', err)
    } finally {
      setExportingPV(false)
    }
  }

  const statutLabel = useMemo(() => {
    if (!pv) return ''
    return t(`statut.${pv.statut}`)
  }, [pv, t])

  if (loading) {
    return <PVLoadingSkeleton />
  }

  if (!pv) {
    return (
      <PageContainer size="full" className="w-full min-h-[calc(100dvh-4rem)] flex flex-col items-center justify-center bg-gray-50/80 dark:bg-gray-900/80 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700/60 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('pv.notFound')}</p>
          <button
            type="button"
            onClick={() => navigate('/reunions-hebdo')}
            className="mt-4 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
          >
            {t('pv.backToList')}
          </button>
        </div>
      </PageContainer>
    )
  }

  const dateLong = formatDate(pv.dateReunion, { weekday: 'long', monthStyle: 'long' })
  const heureRange = `${formatTime(pv.heureDebut)} – ${formatTime(pv.heureFin)}`

  return (
    <PageContainer size="full" className="w-full min-h-full min-h-[calc(100dvh-4rem)] flex flex-col bg-gray-50/80 dark:bg-gray-900/80 pb-6">
      {/* ── Header card ── */}
      <motion.div
        className="shrink-0 mb-6"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="rounded-2xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800/80 shadow-sm overflow-hidden">
          {/* Orange accent strip */}
          <div className="h-1 bg-gradient-to-r from-primary via-orange-400 to-amber-400" />

          <div className="px-6 py-6 md:py-7 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            {/* Left: breadcrumb + title */}
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center flex-shrink-0">
                <IconDoc />
              </div>
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => navigate('/reunions-hebdo')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary-light transition-colors mb-1.5"
                >
                  <IconArrowLeft />
                  {t('pv.backToList')}
                </button>
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
                  {t('pv.title')}
                </h1>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
                  {dateLong} — {pv.lieu || t('pv.lieuNonPrecise')}
                </p>
              </div>
            </div>

            {/* Right: statut + stat chips + action buttons */}
            <div className="flex flex-col items-stretch sm:items-end gap-3 shrink-0">
              {/* Chips row */}
              <div className="flex flex-wrap gap-2 justify-end items-center">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${STATUT_COLORS[pv.statut]}`}>
                  {statutLabel}
                </span>
                <StatPill label={t('pv.statParticipants')} value={pv.participants.length} icon={<IconUsers />} />
                <StatPill label={t('pv.statAffaires')} value={pv.pointsProjet.length} icon={<IconBriefcase />} />
              </div>
              {/* Buttons row */}
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleDownloadPV}
                  disabled={exportingPV}
                  className="bg-primary text-white rounded-xl px-5 py-2.5 font-bold inline-flex items-center gap-2 hover:bg-primary-dark transition-colors disabled:opacity-60 text-sm shadow-sm"
                >
                  {exportingPV ? (
                    <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <IconDownload />
                  )}
                  {t('pv.downloadPV')}
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/20 text-white uppercase tracking-wide">PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/reunions-hebdo/' + id + '/edit')}
                  className="border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors inline-flex items-center gap-2"
                >
                  <IconPencil />
                  {t('pv.editMeeting')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Download error banner ── */}
      {downloadError && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-700/60 bg-red-50 dark:bg-red-900/20 px-5 py-4 shadow-sm">
          <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
            !
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">{t('pv.errorTitle')}</p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-0.5 break-words">{downloadError}</p>
            <button
              type="button"
              onClick={() => setDownloadError(null)}
              className="text-xs font-semibold text-red-600 dark:text-red-400 mt-2 underline underline-offset-2"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col xl:flex-row gap-6 min-h-0">
        {/* ── Main content column ── */}
        <div className="flex-1 min-w-0 space-y-5 overflow-y-auto min-h-0 xl:pr-1">

          {/* Info section */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0 }}
          >
            <SectionCard>
              <SectionHeader
                accent
                title={t('pv.header')}
                subtitle={t('pv.sectionHeaderHint')}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5"
                    />
                  </svg>
                }
              />
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800/50 px-4 py-3">
                    <p className="text-[10px] font-black tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-1">{t('pv.date')}</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{dateLong}</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800/50 px-4 py-3">
                    <p className="text-[10px] font-black tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-1">{t('pv.lieu')}</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{pv.lieu || '—'}</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800/50 px-4 py-3">
                    <p className="text-[10px] font-black tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-1">{t('pv.heure')}</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{heureRange}</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800/50 px-4 py-3">
                    <p className="text-[10px] font-black tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-1">{t('pv.redacteur')}</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {pv.redacteur ? `${pv.redacteur.prenom} ${pv.redacteur.nom}` : '—'}
                    </p>
                  </div>
                </div>
                {pv.ordreDuJour && (
                  <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700/60">
                    <p className="text-xs font-bold tracking-widest uppercase text-gray-500 dark:text-gray-400 mb-2">{t('pv.ordreDuJour')}</p>
                    <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50/80 dark:bg-gray-900/40 rounded-xl p-4 border border-gray-100 dark:border-gray-700/60">
                      {pv.ordreDuJour}
                    </pre>
                  </div>
                )}
              </div>
            </SectionCard>
          </motion.div>

          {/* Participants section */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            <SectionCard className="overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60 bg-gray-50/60 dark:bg-gray-800/40 rounded-t-2xl flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light flex items-center justify-center">
                  <IconUsers />
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{t('pv.participants')}</p>
                <span className="px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-bold">
                  {pv.participants.length}
                </span>
              </div>
              <div className="p-5">
                <div className="flex flex-wrap gap-2">
                  {pv.participants.map((p) => {
                    const initiales = `${p.prenom?.[0] ?? ''}${p.nom?.[0] ?? ''}`.toUpperCase()
                    return (
                      <div
                        key={p.id}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50 shadow-sm"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light flex items-center justify-center text-xs font-black flex-shrink-0">
                          {initiales || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                            {p.prenom} {p.nom}
                          </p>
                          {p.manuel && (
                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                              {t('pv.externe')}
                            </span>
                          )}
                          {p.telephone && !p.manuel && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 leading-tight">{p.telephone}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </SectionCard>
          </motion.div>

          {/* Points par projet section */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
          >
            <SectionCard>
              <SectionHeader
                title={t('pv.pointsParProjet')}
                subtitle={t('pv.pointsSectionHint')}
                icon={<IconBriefcase />}
              />
              <div className="p-6">
                {pv.pointsProjet.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">{t('pv.noPointsProjet')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pv.pointsProjet.map((point, index) => (
                      <div
                        key={point.id}
                        className="rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 overflow-hidden shadow-sm"
                      >
                        {/* Card header */}
                        <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-gray-50/60 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-700/40">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light flex items-center justify-center text-xs font-black flex-shrink-0">
                              {index + 1}
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm flex-1 min-w-0 truncate">
                              {t('pv.affaire', { n: index + 1, name: point.projetNom, code: point.projetCode })}
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingPoint(editingPoint === point.id ? null : point.id)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-wide transition-colors shrink-0 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800"
                          >
                            {editingPoint === point.id ? (
                              <>
                                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                {t('pv.form.cancel')}
                              </>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                                </svg>
                                {t('pv.edit')}
                              </>
                            )}
                          </button>
                        </div>

                        {/* Card body */}
                        <div className="px-5 py-4 space-y-4">
                          {point.chefProjetNom && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-semibold text-gray-600 dark:text-gray-300">{t('pv.chefProjet')}</span> {point.chefProjetNom}
                            </p>
                          )}

                          {/* Progress bars */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Avancement physique */}
                            <div className="rounded-xl bg-gray-50/60 dark:bg-gray-900/30 px-3 py-2.5">
                              <div className="flex justify-between text-[10px] mb-1">
                                <span className="text-gray-500 dark:text-gray-400">{t('pv.avancementPhysique')}</span>
                                <span className="font-bold text-gray-900 dark:text-white">
                                  {point.avancementPhysiquePct != null ? `${point.avancementPhysiquePct}%` : '—'}
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-primary to-orange-400"
                                  style={{ width: `${point.avancementPhysiquePct ?? 0}%` }}
                                />
                              </div>
                            </div>
                            {/* Avancement financier */}
                            <div className="rounded-xl bg-gray-50/60 dark:bg-gray-900/30 px-3 py-2.5">
                              <div className="flex justify-between text-[10px] mb-1">
                                <span className="text-gray-500 dark:text-gray-400">{t('pv.avancementFinancier')}</span>
                                <span className="font-bold text-gray-900 dark:text-white">
                                  {point.avancementFinancierPct != null ? `${point.avancementFinancierPct}%` : '—'}
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-primary to-orange-400"
                                  style={{ width: `${point.avancementFinancierPct ?? 0}%` }}
                                />
                              </div>
                            </div>
                            {/* Délai consommé */}
                            <div className="rounded-xl bg-gray-50/60 dark:bg-gray-900/30 px-3 py-2.5">
                              <div className="flex justify-between text-[10px] mb-1">
                                <span className="text-gray-500 dark:text-gray-400">{t('pv.delaiConsomme')}</span>
                                <span className="font-bold text-gray-900 dark:text-white">
                                  {point.delaiConsommePct != null ? `${point.delaiConsommePct}%` : '—'}
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-primary to-orange-400"
                                  style={{ width: `${point.delaiConsommePct ?? 0}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Text fields */}
                          <div className="space-y-2.5">
                            {point.resumeTravauxPrevisions && (
                              <div className="bg-gray-50/60 dark:bg-gray-900/30 rounded-xl px-4 py-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{t('pv.travauxPrevisions')}</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{point.resumeTravauxPrevisions}</p>
                              </div>
                            )}
                            {point.pointsBloquantsResume && (
                              <div className="bg-gray-50/60 dark:bg-gray-900/30 rounded-xl px-4 py-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{t('pv.pointsBloquants')}</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{point.pointsBloquantsResume}</p>
                              </div>
                            )}
                            {point.besoinsMateriel && (
                              <div className="bg-gray-50/60 dark:bg-gray-900/30 rounded-xl px-4 py-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{t('pv.besoinsMateriel')}</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{point.besoinsMateriel}</p>
                              </div>
                            )}
                            {point.besoinsHumain && (
                              <div className="bg-gray-50/60 dark:bg-gray-900/30 rounded-xl px-4 py-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{t('pv.besoinsHumain')}</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{point.besoinsHumain}</p>
                              </div>
                            )}
                            {point.propositionsAmelioration && (
                              <div className="bg-gray-50/60 dark:bg-gray-900/30 rounded-xl px-4 py-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{t('pv.propositions')}</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{point.propositionsAmelioration}</p>
                              </div>
                            )}
                          </div>

                          {editingPoint === point.id && (
                            <PointProjetEditForm
                              point={point}
                              onSave={handleSavePoint}
                              onCancel={() => setEditingPoint(null)}
                              onDelete={() => handleDeletePoint(point.id)}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SectionCard>
          </motion.div>

          {/* Divers section */}
          {pv.divers && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.3 }}
            >
              <SectionCard>
                <SectionHeader
                  title={t('pv.divers')}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  }
                />
                <div className="px-6 pb-6 pt-5">
                  <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50/80 dark:bg-gray-900/40 rounded-xl p-4 border border-gray-100 dark:border-gray-700/60">
                    {pv.divers}
                  </pre>
                </div>
              </SectionCard>
            </motion.div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="xl:w-72 flex-shrink-0 space-y-5 xl:sticky xl:top-4 xl:self-start">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
          >
            <SectionCard>
              <SectionHeader
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                }
                title={t('pv.summaryTitle')}
              />
              <div className="p-4 space-y-3">
                <SummaryStat
                  label={t('pv.date')}
                  value={dateLong}
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
                    </svg>
                  }
                />
                <SummaryStat
                  label={t('pv.heure')}
                  value={heureRange}
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
                <SummaryStat
                  label={t('pv.lieu')}
                  value={pv.lieu || ''}
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  }
                />
                <SummaryStat
                  label={t('list.columns.statut')}
                  value={statutLabel}
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
              </div>
            </SectionCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.25 }}
          >
            <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-info/10 text-info flex items-center justify-center flex-shrink-0 mt-0.5">
                  <IconInfo />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">{t('pv.helpTitle')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{t('pv.helpBody')}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="hidden xl:block space-y-2">
            <Button type="button" variant="primary" className="w-full justify-center inline-flex items-center gap-2" onClick={handleDownloadPV} disabled={exportingPV} isLoading={exportingPV}>
              <IconDownload />
              {t('pv.downloadPV')}
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/20 text-white uppercase tracking-wide">PDF</span>
            </Button>
            <button
              type="button"
              onClick={() => navigate('/reunions-hebdo/' + id + '/edit')}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors inline-flex items-center justify-center gap-2"
            >
              <IconPencil />
              {t('pv.editMeeting')}
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}

function PointProjetEditForm({
  point,
  onSave,
  onCancel,
  onDelete,
}: {
  point: PointProjetPV
  onSave: (data: PointProjetPVRequest) => Promise<void>
  onCancel: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation('reunionHebdo')
  const [saving, setSaving] = useState(false)
  const [avancementPhysiquePct, setAvancementPhysiquePct] = useState<string>(String(point.avancementPhysiquePct ?? ''))
  const [avancementFinancierPct, setAvancementFinancierPct] = useState<string>(String(point.avancementFinancierPct ?? ''))
  const [delaiConsommePct, setDelaiConsommePct] = useState<string>(String(point.delaiConsommePct ?? ''))
  const [resumeTravauxPrevisions, setResumeTravauxPrevisions] = useState(point.resumeTravauxPrevisions ?? '')
  const [pointsBloquantsResume, setPointsBloquantsResume] = useState(point.pointsBloquantsResume ?? '')
  const [besoinsMateriel, setBesoinsMateriel] = useState(point.besoinsMateriel ?? '')
  const [besoinsHumain, setBesoinsHumain] = useState(point.besoinsHumain ?? '')
  const [propositionsAmelioration, setPropositionsAmelioration] = useState(point.propositionsAmelioration ?? '')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await onSave({
      projetId: point.projetId,
      avancementPhysiquePct: avancementPhysiquePct ? Number(avancementPhysiquePct) : undefined,
      avancementFinancierPct: avancementFinancierPct ? Number(avancementFinancierPct) : undefined,
      delaiConsommePct: delaiConsommePct ? Number(delaiConsommePct) : undefined,
      resumeTravauxPrevisions: resumeTravauxPrevisions || undefined,
      pointsBloquantsResume: pointsBloquantsResume || undefined,
      besoinsMateriel: besoinsMateriel || undefined,
      besoinsHumain: besoinsHumain || undefined,
      propositionsAmelioration: propositionsAmelioration || undefined,
      ordreAffichage: point.ordreAffichage,
    })
    setSaving(false)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 space-y-4 rounded-xl border-l-4 border-l-primary bg-orange-50/40 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 p-5 shadow-sm"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FieldGroup label={t('pv.form.avPhysiquePct')}>
          <StyledInput type="number" min={0} max={100} step={0.01} value={avancementPhysiquePct} onChange={(e) => setAvancementPhysiquePct(e.target.value)} />
        </FieldGroup>
        <FieldGroup label={t('pv.form.avFinancierPct')}>
          <StyledInput type="number" min={0} max={100} step={0.01} value={avancementFinancierPct} onChange={(e) => setAvancementFinancierPct(e.target.value)} />
        </FieldGroup>
        <FieldGroup label={t('pv.form.delaiConsommePct')}>
          <StyledInput type="number" min={0} max={100} step={0.01} value={delaiConsommePct} onChange={(e) => setDelaiConsommePct(e.target.value)} />
        </FieldGroup>
      </div>
      <FieldGroup label={t('pv.form.travauxPrevisions')}>
        <StyledTextarea value={resumeTravauxPrevisions} onChange={(e) => setResumeTravauxPrevisions(e.target.value)} rows={2} />
      </FieldGroup>
      <FieldGroup label={t('pv.form.pointsBloquants')}>
        <StyledTextarea value={pointsBloquantsResume} onChange={(e) => setPointsBloquantsResume(e.target.value)} rows={2} />
      </FieldGroup>
      <FieldGroup label={t('pv.form.besoinsMateriel')}>
        <StyledTextarea value={besoinsMateriel} onChange={(e) => setBesoinsMateriel(e.target.value)} rows={2} />
      </FieldGroup>
      <FieldGroup label={t('pv.form.besoinsHumain')}>
        <StyledTextarea value={besoinsHumain} onChange={(e) => setBesoinsHumain(e.target.value)} rows={2} />
      </FieldGroup>
      <FieldGroup label={t('pv.form.propositions')}>
        <StyledTextarea value={propositionsAmelioration} onChange={(e) => setPropositionsAmelioration(e.target.value)} rows={2} />
      </FieldGroup>
      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="submit" variant="primary" size="sm" disabled={saving} isLoading={saving}>
          {t('pv.form.save')}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          {t('pv.form.cancel')}
        </Button>
        <Button type="button" variant="danger" size="sm" onClick={() => onDelete()}>
          {t('pv.form.removeFromPV')}
        </Button>
      </div>
    </form>
  )
}
