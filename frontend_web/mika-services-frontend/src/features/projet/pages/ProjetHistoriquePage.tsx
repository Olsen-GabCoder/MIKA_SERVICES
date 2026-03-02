import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useFormatDate } from '@/hooks/useFormatDate'
import { PageContainer } from '@/components/layout/PageContainer'
import { projetApi } from '@/api/projetApi'
import type {
  ProjetHistoriqueResponse,
  PeriodeHistoriqueResponse,
  PvResumeResponse,
  PointBloquant,
} from '@/types/projet'

const CARD =
  'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm overflow-hidden'
const CARD_HEADER =
  'px-5 py-3 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide'
const CARD_BODY = 'p-5'

const PERIOD_OPTIONS = [
  { value: 12, labelKey: 'historique.periodLast12' },
  { value: 26, labelKey: 'historique.periodLast26' },
  { value: 52, labelKey: 'historique.periodLast52' },
] as const

function toNum(x: unknown): number {
  if (x == null) return NaN
  const n = Number(x)
  return Number.isFinite(n) ? n : NaN
}
function isValidYear(n: number): boolean {
  return Number.isInteger(n) && n >= 2000 && n <= 2100
}
function isValidWeek(n: number): boolean {
  return Number.isInteger(n) && n >= 1 && n <= 53
}
function getCurrentYear(): number {
  return new Date().getFullYear()
}
function getCurrentWeek(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const jan1 = new Date(d.getFullYear(), 0, 1)
  return Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + 1) / 7)
}

/** Agrège tous les points bloquants des périodes avec semaine/année pour la vue synthèse */
function aggregateBlockingPoints(
  periodes: PeriodeHistoriqueResponse[]
): (PointBloquant & { semaine: number; annee: number })[] {
  const out: (PointBloquant & { semaine: number; annee: number })[] = []
  periodes.forEach((p) => {
    p.pointsBloquants.forEach((pb) => {
      out.push({ ...pb, semaine: p.semaine, annee: p.annee })
    })
  })
  return out.sort((a, b) => {
    const da = new Date(a.dateDetection).getTime()
    const db = new Date(b.dateDetection).getTime()
    return db - da
  })
}

/** Indicateurs synthèse sur l'ensemble des périodes chargées */
function computeOverview(periodes: PeriodeHistoriqueResponse[]) {
  const withData = periodes.filter(
    (p) =>
      p.previsions.length > 0 ||
      p.pointsBloquants.length > 0 ||
      (p.pvResume &&
        (p.pvResume.resumeTravauxPrevisions ||
          p.pvResume.pointsBloquantsResume ||
          p.pvResume.besoinsMateriel ||
          p.pvResume.besoinsHumain ||
          p.pvResume.propositionsAmelioration))
  ).length
  const totalTasks = periodes.reduce((s, p) => s + p.previsions.length, 0)
  const allBlockers = aggregateBlockingPoints(periodes)
  const openBlockers = allBlockers.filter(
    (b) => b.statut === 'OUVERT' || b.statut === 'EN_COURS' || b.statut === 'ESCALADE'
  ).length
  const resolvedBlockers = allBlockers.filter(
    (b) => b.statut === 'RESOLU' || b.statut === 'FERME'
  ).length
  const lastPv = periodes
    .filter((p) => p.pvResume?.dateReunion)
    .map((p) => p.pvResume!.dateReunion)
    .sort()
    .reverse()[0]
  return {
    periodsWithData: withData,
    totalTasks,
    totalBlockers: allBlockers.length,
    openBlockers,
    resolvedBlockers,
    lastPvDate: lastPv ?? null,
  }
}

export const ProjetHistoriquePage = () => {
  const { t } = useTranslation('projet')
  const formatDate = useFormatDate()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [data, setData] = useState<ProjetHistoriqueResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [maxSemaines, setMaxSemaines] = useState(52)
  /** Période affichée : sélection par année + semaine */
  const [selectedAnnee, setSelectedAnnee] = useState<number | null>(null)
  const [selectedSemaine, setSelectedSemaine] = useState<number | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    projetApi
      .getHistorique(Number(id), maxSemaines)
      .then((res) => {
        const list = Array.isArray(res?.periodes) ? res.periodes : []
        setData({ ...res, periodes: list })
        if (list.length > 0) {
          const first = list[0]
          const a = toNum(first.annee ?? (first as unknown as Record<string, unknown>).year)
          const s = toNum(first.semaine ?? (first as unknown as Record<string, unknown>).week)
          if (isValidYear(a) && isValidWeek(s)) {
            setSelectedAnnee(a)
            setSelectedSemaine(s)
          } else {
            setSelectedAnnee(getCurrentYear())
            setSelectedSemaine(1)
          }
        } else {
          setSelectedAnnee(getCurrentYear())
          setSelectedSemaine(getCurrentWeek())
        }
      })
      .catch(() => setError(t('historique.errorLoad')))
      .finally(() => setLoading(false))
  }, [id, maxSemaines, t])

  const periodes = data?.periodes ?? []

  const yearsList = useMemo(() => {
    const fromData = [...new Set(periodes.map((p) => toNum(p.annee ?? (p as unknown as Record<string, unknown>).year)).filter(isValidYear))]
    const sorted = fromData.sort((a, b) => b - a)
    if (sorted.length > 0) return sorted
    return [getCurrentYear(), getCurrentYear() - 1]
  }, [periodes])

  const weeksForSelectedYear = useMemo(() => {
    if (selectedAnnee == null) return []
    const anneeNum = Number(selectedAnnee)
    const fromData = periodes
      .filter((p) => toNum(p.annee ?? (p as unknown as Record<string, unknown>).year) === anneeNum)
      .map((p) => toNum(p.semaine ?? (p as unknown as Record<string, unknown>).week))
      .filter(isValidWeek)
    const uniq = [...new Set(fromData)].sort((a, b) => a - b)
    if (uniq.length > 0) return uniq
    const maxWeeks = anneeNum === getCurrentYear() ? getCurrentWeek() : 53
    return Array.from({ length: maxWeeks }, (_, i) => i + 1)
  }, [periodes, selectedAnnee])

  const selectedPeriod = useMemo(
    () =>
      selectedAnnee != null && selectedSemaine != null
        ? periodes.find(
            (p) =>
              toNum(p.annee ?? (p as unknown as Record<string, unknown>).year) === Number(selectedAnnee) &&
              toNum(p.semaine ?? (p as unknown as Record<string, unknown>).week) === Number(selectedSemaine)
          ) ?? null
        : null,
    [periodes, selectedAnnee, selectedSemaine]
  )

  const selectedPeriodIndex = useMemo(
    () => (selectedPeriod ? periodes.findIndex((p) => p === selectedPeriod) : -1),
    [periodes, selectedPeriod]
  )

  const prevPeriod = selectedPeriodIndex > 0 ? periodes[selectedPeriodIndex - 1] : null
  const nextPeriod =
    selectedPeriodIndex >= 0 && selectedPeriodIndex < periodes.length - 1
      ? periodes[selectedPeriodIndex + 1]
      : null

  const overview = useMemo(
    () => (data?.periodes ? computeOverview(data.periodes) : null),
    [data?.periodes]
  )

  const aggregatedBlockers = useMemo(
    () => (data?.periodes ? aggregateBlockingPoints(data.periodes) : []),
    [data?.periodes]
  )

  useEffect(() => {
    if (selectedAnnee != null && weeksForSelectedYear.length > 0 && selectedSemaine == null) {
      setSelectedSemaine(weeksForSelectedYear[0])
    }
  }, [selectedAnnee, weeksForSelectedYear, selectedSemaine])

  useEffect(() => {
    if (
      selectedAnnee != null &&
      selectedSemaine != null &&
      weeksForSelectedYear.length > 0 &&
      !weeksForSelectedYear.includes(selectedSemaine)
    ) {
      setSelectedSemaine(weeksForSelectedYear[0])
    }
  }, [selectedAnnee, selectedSemaine, weeksForSelectedYear])

  if (!id) {
    return (
      <PageContainer>
        <p className="text-gray-500">{t('historique.invalidId')}</p>
      </PageContainer>
    )
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      </PageContainer>
    )
  }

  if (error || !data) {
    return (
      <PageContainer>
        <p className="text-red-600 dark:text-red-400">{error ?? t('historique.errorLoad')}</p>
        <button
          type="button"
          onClick={() => navigate(`/projets/${id}`)}
          className="mt-4 text-sm text-primary hover:underline"
        >
          ← {t('detail.backToList')}
        </button>
      </PageContainer>
    )
  }

  return (
    <PageContainer size="full" className="bg-gray-50/80 dark:bg-gray-900/80">
      <header className="rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg mb-6 overflow-hidden">
        <div className="px-6 py-6 md:py-8">
          <button
            type="button"
            onClick={() =>
              navigate(`/projets/${id}`, {
                state: location.state,
              })
            }
            className="text-white/80 hover:text-white text-sm mb-4 flex items-center gap-1"
          >
            ← {t('historique.backToProject')}
          </button>
          <p className="text-white/90 text-sm uppercase tracking-wider font-medium">
            {t('historique.auditCenterSubtitle')}
          </p>
          <h1 className="text-2xl md:text-3xl font-bold mt-1 leading-tight">
            {t('historique.title')} — {data.projetNom}
          </h1>
          <p className="text-white/80 text-sm mt-2">{t('historique.subtitle')}</p>
        </div>
      </header>

      <div className="space-y-6">
        {overview && (
          <section className={CARD}>
            <h2 className={CARD_HEADER}>{t('historique.overviewTitle')}</h2>
            <div className={CARD_BODY}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-4 border border-gray-100 dark:border-gray-600">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('historique.kpiPeriodsWithData')}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {overview.periodsWithData}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {t('historique.kpiPeriodsWithDataHint')}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-4 border border-gray-100 dark:border-gray-600">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('historique.kpiTasksDone')}
                  </p>
                  <p className="text-2xl font-bold text-primary-700 dark:text-primary-300 mt-1">
                    {overview.totalTasks}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {t('historique.kpiTasksDoneHint')}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-4 border border-gray-100 dark:border-gray-600">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('historique.kpiBlockingPoints')}
                  </p>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">
                    {overview.totalBlockers}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {overview.openBlockers} {t('historique.open')} / {overview.resolvedBlockers}{' '}
                    {t('historique.resolved')}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-4 border border-gray-100 dark:border-gray-600">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('historique.kpiLastPv')}
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {overview.lastPvDate
                      ? formatDate(overview.lastPvDate, { monthStyle: 'short' })
                      : '—'}
                  </p>
                </div>
                <div className="rounded-lg bg-primary/10 dark:bg-primary/20 p-4 border border-primary/20 dark:border-primary/30 col-span-2 md:col-span-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300">
                    {t('historique.perimeter')}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">
                    {data.periodes.length} {t('historique.weeksInScope')}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Filtre par semaine et année : sélectionner la période à afficher */}
        <section className={CARD}>
          <h2 className={CARD_HEADER}>{t('historique.selectPeriodTitle')}</h2>
          <div className={CARD_BODY}>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="scope-weeks" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('historique.scopeLabel')}
                </label>
                <select
                  id="scope-weeks"
                  value={maxSemaines}
                  onChange={(e) => setMaxSemaines(Number(e.target.value))}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                >
                  {PERIOD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {t(opt.labelKey)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="year-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('historique.selectYear')}
                </label>
                <select
                  id="year-select"
                  value={selectedAnnee != null ? String(selectedAnnee) : ''}
                  onChange={(e) => {
                    const v = e.target.value
                    setSelectedAnnee(v ? Number(v) : null)
                    setSelectedSemaine(null)
                  }}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:ring-2 focus:ring-primary min-w-[6rem]"
                >
                  <option value="">—</option>
                  {yearsList.map((year) => (
                    <option key={year} value={String(year)}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="week-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('historique.selectWeek')}
                </label>
                <select
                  id="week-select"
                  value={selectedSemaine != null ? String(selectedSemaine) : ''}
                  onChange={(e) => {
                    const v = e.target.value
                    setSelectedSemaine(v ? Number(v) : null)
                  }}
                  disabled={selectedAnnee == null}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:ring-2 focus:ring-primary min-w-[8rem] disabled:opacity-50"
                >
                  <option value="">—</option>
                  {weeksForSelectedYear.map((w) => (
                    <option key={w} value={String(w)}>
                      {t('historique.weekLabel', { semaine: w, annee: selectedAnnee ?? 0 })}
                    </option>
                  ))}
                </select>
              </div>
              {prevPeriod && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAnnee(toNum(prevPeriod.annee ?? (prevPeriod as unknown as Record<string, unknown>).year))
                    setSelectedSemaine(toNum(prevPeriod.semaine ?? (prevPeriod as unknown as Record<string, unknown>).week))
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  ← {t('historique.prevWeek')}
                </button>
              )}
              {nextPeriod && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAnnee(toNum(nextPeriod.annee ?? (nextPeriod as unknown as Record<string, unknown>).year))
                    setSelectedSemaine(toNum(nextPeriod.semaine ?? (nextPeriod as unknown as Record<string, unknown>).week))
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  {t('historique.nextWeek')} →
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              {t('historique.selectPeriodHint')}
            </p>
          </div>
        </section>

        {/* Vue détaillée de la période sélectionnée : toute l'activité de la semaine */}
        {selectedPeriod ? (
          <section className={CARD}>
            <div className={`${CARD_HEADER} flex flex-wrap items-center justify-between gap-3`}>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                {t('historique.activityForPeriod')} — {t('historique.weekLabel', { semaine: selectedPeriod.semaine, annee: selectedPeriod.annee })}
              </h2>
              {selectedPeriod.dateReunion && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary-700 dark:text-primary-200">
                  {t('historique.pvDate')} : {formatDate(selectedPeriod.dateReunion, { monthStyle: 'short' })}
                </span>
              )}
            </div>
            <div className={CARD_BODY}>
              <VuePeriodeDetail periode={selectedPeriod} t={t} />
            </div>
          </section>
        ) : (
          <section className={CARD}>
            <div className={CARD_BODY}>
              <p className="text-gray-500 dark:text-gray-400 text-center py-12">
                {periodes.length === 0 ? t('historique.empty') : t('historique.noPeriodSelected')}
              </p>
            </div>
          </section>
        )}

        {aggregatedBlockers.length > 0 && (
          <section className={CARD}>
            <h2 className={CARD_HEADER}>{t('historique.aggregateBlockersTitle')}</h2>
            <div className={CARD_BODY}>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {t('historique.aggregateBlockersIntro')}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-600">
                      <th className="text-left py-2.5 px-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                        {t('historique.colWeek')}
                      </th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                        {t('historique.colBlockerTitle')}
                      </th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                        {t('historique.colBlockerStatus')}
                      </th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                        {t('historique.colBlockerPriority')}
                      </th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                        {t('historique.colBlockerDetection')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {aggregatedBlockers.map((pb) => (
                      <tr
                        key={`${pb.semaine}-${pb.annee}-${pb.id}`}
                        className="border-b border-gray-100 dark:border-gray-600 hover:bg-gray-50/60 dark:hover:bg-gray-700/40"
                      >
                        <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300">
                          S{pb.semaine} {pb.annee}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-gray-900 dark:text-gray-100">
                          {pb.titre}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                              pb.statut === 'RESOLU' || pb.statut === 'FERME'
                                ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200'
                                : pb.statut === 'OUVERT' || pb.statut === 'ESCALADE'
                                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                            }`}
                          >
                            {t(`enums.statutPointBloquant.${pb.statut}`)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">
                          {pb.priorite ? t(`enums.priorite.${pb.priorite}`) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">
                          {formatDate(pb.dateDetection, { monthStyle: 'short' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </div>
    </PageContainer>
  )
}

/** Vue détaillée d'une seule période : activité, tâches prévues/réalisées avec %, modifications, PV */
function VuePeriodeDetail({
  periode,
  t,
}: {
  periode: PeriodeHistoriqueResponse
  t: (key: string) => string
}) {
  return (
    <div className="space-y-6">
      {periode.pvResume &&
        (periode.pvResume.avancementPhysiquePct != null ||
          periode.pvResume.avancementFinancierPct != null ||
          periode.pvResume.delaiConsommePct != null) && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
            {t('historique.indicatorsSection')}
          </h3>
          <IndicateursPv pv={periode.pvResume} t={t} />
        </div>
      )}

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
          {t('historique.tasksPlannedForWeek')}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {t('historique.tasksPlannedHint')}
        </p>
        {periode.previsions.length > 0 ? (
          <ul className="space-y-2">
            {periode.previsions.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-4 py-3 px-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600"
              >
                <span className="text-sm text-gray-800 dark:text-gray-200 min-w-0 flex-1">
                  {p.description ?? (p.type && p.type.replace(/_/g, ' ')) ?? '—'}
                </span>
                {p.avancementPct != null ? (
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-24 h-2.5 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          p.avancementPct >= 100
                            ? 'bg-green-500'
                            : p.avancementPct >= 50
                              ? 'bg-primary'
                              : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, p.avancementPct)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 tabular-nums w-12">
                      {p.avancementPct} %
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                    {t('historique.noAdvancementRecorded')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-4 italic">
            {t('historique.noTasksForWeek')}
          </p>
        )}
      </div>

      {periode.pointsBloquants.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2">
            {(t as (key: string, opts?: { count?: number }) => string)('historique.blockingPoints', { count: periode.pointsBloquants.length })}
          </h3>
          <ul className="space-y-2">
            {periode.pointsBloquants.map((pb) => (
              <li
                key={pb.id}
                className="flex items-start justify-between gap-3 py-3 px-4 rounded-lg border border-amber-100 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-900/20"
              >
                <div>
                  <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    {pb.titre}
                  </span>
                  {pb.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{pb.description}</p>
                  )}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                  {t(`enums.statutPointBloquant.${pb.statut}`)}
                  {pb.priorite && ` · ${t(`enums.priorite.${pb.priorite}`)}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {periode.pvResume &&
        (periode.pvResume.resumeTravauxPrevisions ||
          periode.pvResume.pointsBloquantsResume ||
          periode.pvResume.besoinsMateriel ||
          periode.pvResume.besoinsHumain ||
          periode.pvResume.propositionsAmelioration) && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
            {t('historique.modificationsAndSummary')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {t('historique.modificationsHint')}
          </p>
          <ResumePv pv={periode.pvResume} t={t} />
        </div>
      )}

      {periode.previsions.length === 0 &&
        periode.pointsBloquants.length === 0 &&
        !periode.pvResume && (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            {t('historique.noDataForWeek')}
          </p>
        )}
    </div>
  )
}

function IndicateursPv({
  pv,
  t,
}: {
  pv: PvResumeResponse
  t: (key: string) => string
}) {
  const hasIndicators =
    pv.avancementPhysiquePct != null ||
    pv.avancementFinancierPct != null ||
    pv.delaiConsommePct != null
  if (!hasIndicators) return null
  return (
    <div className="flex flex-wrap gap-3">
      {pv.avancementPhysiquePct != null && (
        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200">
          {t('historique.indicatorPhysical')} : {pv.avancementPhysiquePct} %
        </span>
      )}
      {pv.avancementFinancierPct != null && (
        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200">
          {t('historique.indicatorFinancial')} : {pv.avancementFinancierPct} %
        </span>
      )}
      {pv.delaiConsommePct != null && (
        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
          {t('historique.indicatorDelay')} : {pv.delaiConsommePct} %
        </span>
      )}
    </div>
  )
}

function ResumePv({
  pv,
  t,
}: {
  pv: PvResumeResponse
  t: (key: string) => string
}) {
  const hasContent =
    pv.resumeTravauxPrevisions ||
    pv.pointsBloquantsResume ||
    pv.besoinsMateriel ||
    pv.besoinsHumain ||
    pv.propositionsAmelioration
  if (!hasContent) return null
  return (
    <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
      {pv.resumeTravauxPrevisions && (
        <div>
          <span className="font-medium text-gray-600 dark:text-gray-400">
            {t('historique.resumeTravaux')} :
          </span>{' '}
          {pv.resumeTravauxPrevisions}
        </div>
      )}
      {pv.pointsBloquantsResume && (
        <div>
          <span className="font-medium text-amber-700 dark:text-amber-400">
            {t('historique.pointsBloquantsResume')} :
          </span>{' '}
          {pv.pointsBloquantsResume}
        </div>
      )}
      {pv.besoinsMateriel && (
        <div>
          <span className="font-medium text-gray-600 dark:text-gray-400">
            {t('detail.besoinsMateriel')} :
          </span>{' '}
          {pv.besoinsMateriel}
        </div>
      )}
      {pv.besoinsHumain && (
        <div>
          <span className="font-medium text-gray-600 dark:text-gray-400">
            {t('detail.besoinsHumain')} :
          </span>{' '}
          {pv.besoinsHumain}
        </div>
      )}
      {pv.propositionsAmelioration && (
        <div>
          <span className="font-medium text-gray-600 dark:text-gray-400">
            {t('detail.propositionsAmelioration')} :
          </span>{' '}
          {pv.propositionsAmelioration}
        </div>
      )}
    </div>
  )
}
