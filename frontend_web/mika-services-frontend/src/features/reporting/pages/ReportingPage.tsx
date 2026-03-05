import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
} from 'recharts'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchGlobalDashboard, fetchProjetReport, clearProjetReport } from '@/store/slices/reportingSlice'
import { fetchProjets } from '@/store/slices/projetSlice'
import { PageContainer } from '@/components/layout/PageContainer'
import type { GlobalDashboard, ProjetReport } from '@/types/reporting'
import { useFormatNumber } from '@/hooks/useFormatNumber'

const CHART_COLORS = {
  primary: '#FF6B35',
  primaryLight: '#FF8C61',
  secondary: '#2E5266',
  success: '#6BBF59',
  warning: '#F4A261',
  danger: '#E63946',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  gray: '#94A3B8',
}

const STATUT_COLORS: Record<string, string> = {
  EN_COURS: CHART_COLORS.blue,
  TERMINE: CHART_COLORS.success,
  EN_ATTENTE: CHART_COLORS.warning,
  PLANIFIE: CHART_COLORS.purple,
  SUSPENDU: '#E85D75',
  ABANDONNE: CHART_COLORS.gray,
  RECEPTION_PROVISOIRE: '#06B6D4',
  RECEPTION_DEFINITIVE: '#10B981',
}

/** Carte KPI avec valeur principale et détail */
function KPICard({
  title,
  value,
  subtitle,
  detail,
  trend,
  accent = 'primary',
}: {
  title: string
  value: string | number
  subtitle?: string
  detail?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  accent?: 'primary' | 'success' | 'warning' | 'danger' | 'secondary'
}) {
  const accentClasses = {
    primary: 'border-l-primary bg-gradient-to-br from-white to-orange-50/30 dark:from-gray-800 dark:to-gray-800/80 dark:border-orange-500',
    success: 'border-l-success bg-gradient-to-br from-white to-green-50/30 dark:from-gray-800 dark:to-gray-800/80 dark:border-green-500',
    warning: 'border-l-warning bg-gradient-to-br from-white to-amber-50/30 dark:from-gray-800 dark:to-gray-800/80 dark:border-amber-500',
    danger: 'border-l-danger bg-gradient-to-br from-white to-red-50/30 dark:from-gray-800 dark:to-gray-800/80 dark:border-red-500',
    secondary: 'border-l-secondary bg-gradient-to-br from-white to-slate-50/50 dark:from-gray-800 dark:to-gray-800/80 dark:border-slate-500',
  }
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : 'text-gray-500 dark:text-gray-400'
  return (
    <div
      className={`rounded-2xl border border-gray-100 dark:border-gray-600 bg-white dark:bg-gray-800 p-5 shadow-sm transition-all duration-300 hover:shadow-md border-l-4 ${accentClasses[accent]}`}
    >
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</span>
        {trend !== undefined && <span className={`text-sm font-medium ${trendColor}`}>{trendIcon}</span>}
      </div>
      {subtitle && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
      {detail && <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">{detail}</div>}
    </div>
  )
}

/** Section avec titre accentué */
function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
    </div>
  )
}

/** Carte conteneur pour graphiques */
function ChartCard({
  title,
  subtitle,
  children,
  className = '',
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-2xl border border-gray-100 dark:border-gray-600 bg-white dark:bg-gray-800 p-5 shadow-sm transition-all duration-300 hover:shadow-md ${className}`}>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

export default function ReportingPage() {
  const { t } = useTranslation('reporting')
  const { formatMontant, formatShort } = useFormatNumber()
  const dispatch = useAppDispatch()
  const { dashboard, projetReport, loading, error } = useAppSelector((state) => state.reporting)
  const projets = useAppSelector((state) => state.projet.projets)
  const [selectedProjetId, setSelectedProjetId] = useState<number | null>(null)

  useEffect(() => {
    dispatch(fetchGlobalDashboard())
    dispatch(fetchProjets({ page: 0, size: 100 }))
  }, [dispatch])

  useEffect(() => {
    if (selectedProjetId) dispatch(fetchProjetReport(selectedProjetId))
    else dispatch(clearProjetReport())
  }, [dispatch, selectedProjetId])

  if (loading && !dashboard) {
    return (
      <PageContainer size="wide" className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">{t('loading')}</div>
      </PageContainer>
    )
  }

  const d = dashboard as GlobalDashboard | null

  return (
    <PageContainer size="wide" className="space-y-10 pb-12">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary via-secondary-dark to-secondary px-8 py-10 text-white shadow-xl">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight">{t('pageTitle')}</h1>
          <p className="mt-2 max-w-2xl text-white/90">
            {t('pageSubtitle')}
          </p>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-white/10 to-transparent" aria-hidden />
      </div>

      {/* KPIs globaux */}
      {d && (
        <>
          <section>
            <SectionTitle title={t('global')} subtitle={t('globalSubtitle')} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title={t('projects')}
                value={d.projets.total}
                subtitle={`${d.projets.enCours} ${t('inProgress')} · ${d.projets.termines} ${t('completed')}`}
                detail={
                  <>
                    <span className="text-blue-600 dark:text-blue-400">{d.projets.enCours} {t('inProgress')}</span>
                    <span className="text-green-600 dark:text-green-400">{d.projets.termines} {t('completed')}</span>
                    {d.projets.enRetard > 0 && <span className="text-red-600 dark:text-red-400">{d.projets.enRetard} {t('late')}</span>}
                  </>
                }
                accent="primary"
              />
              <KPICard
                title={t('budgetConsumed')}
                value={`${d.budget.tauxConsommation}%`}
                subtitle={formatMontant(d.budget.depensesTotales) + ' / ' + formatMontant(d.budget.budgetTotalPrevu)}
                trend={d.budget.tauxConsommation > 80 ? 'up' : 'neutral'}
                accent={d.budget.tauxConsommation > 90 ? 'danger' : d.budget.tauxConsommation > 70 ? 'warning' : 'success'}
              />
              <KPICard
                title={t('taskProgress')}
                value={`${d.planning.tauxAvancement}%`}
                subtitle={`${d.planning.tachesTerminees} / ${d.planning.tachesTotal} ${t('tasks')}`}
                detail={
                  <>
                    <span className="text-green-600 dark:text-green-400">{d.planning.tachesTerminees} {t('completed')}</span>
                    {d.planning.tachesEnRetard > 0 && (
                      <span className="text-red-600 dark:text-red-400">{d.planning.tachesEnRetard} {t('late')}</span>
                    )}
                  </>
                }
                accent="secondary"
              />
              <KPICard
                title={t('qualityCompliance')}
                value={`${d.qualite.tauxConformite}%`}
                subtitle={`${d.qualite.controlesTotal} ${t('controls')}`}
                detail={
                  d.qualite.ncOuvertes > 0 ? (
                    <span className="text-red-600 dark:text-red-400">{d.qualite.ncOuvertes} {t('ncOpen')}</span>
                  ) : undefined
                }
                accent={d.qualite.tauxConformite >= 80 ? 'success' : d.qualite.tauxConformite >= 60 ? 'warning' : 'danger'}
              />
            </div>
          </section>

          {/* Graphiques principaux : barres + donuts + courbe */}
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ChartCard title={t('projectDistribution')} subtitle={t('byStatus')}>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: t('inProgress'), value: d.projets.enCours, fill: CHART_COLORS.blue },
                      { name: t('completed'), value: d.projets.termines, fill: CHART_COLORS.success },
                      { name: t('late'), value: d.projets.enRetard, fill: CHART_COLORS.danger },
                    ]}
                    layout="vertical"
                    margin={{ top: 8, right: 24, left: 80, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => String(v)} />
                    <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number | undefined) => [value ?? 0, t('projects')]} />
                    <Bar dataKey="value" name={t('projects')} radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title={t('globalBudget')} subtitle={t('consumedVsRemaining')}>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: t('consumed'), value: d.budget.depensesTotales, color: CHART_COLORS.primary },
                        {
                          name: t('remaining'),
                          value: Math.max(0, Number(d.budget.budgetTotalPrevu) - Number(d.budget.depensesTotales)),
                          color: CHART_COLORS.gray,
                        },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                    >
                      <Cell fill={CHART_COLORS.primary} />
                      <Cell fill={CHART_COLORS.gray} />
                    </Pie>
                    <Tooltip formatter={(value: number | undefined) => [formatMontant(value ?? 0), '']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title={t('planningTasksByStatus')} subtitle={t('tasksStatusSubtitle')}>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: t('completed'), count: d.planning.tachesTerminees, fill: CHART_COLORS.success },
                      { name: t('inProgress'), count: d.planning.tachesEnCours, fill: CHART_COLORS.blue },
                      { name: t('late'), count: d.planning.tachesEnRetard, fill: CHART_COLORS.danger },
                    ]}
                    margin={{ top: 16, right: 16, left: 16, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number | undefined) => [value ?? 0, t('tasks')]} />
                    <Bar dataKey="count" name={t('tasks')} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title={t('qualityComplianceChart')} subtitle={t('compliantVsNonCompliant')}>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: t('compliant'),
                          value: Math.round((d.qualite.controlesTotal * d.qualite.tauxConformite) / 100),
                          color: CHART_COLORS.success,
                        },
                        {
                          name: t('nonCompliant'),
                          value: Math.round((d.qualite.controlesTotal * (100 - d.qualite.tauxConformite)) / 100),
                          color: CHART_COLORS.danger,
                        },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      <Cell fill={CHART_COLORS.success} />
                      <Cell fill={CHART_COLORS.danger} />
                    </Pie>
                    <Tooltip formatter={(value: number | undefined) => [value ?? 0, t('controls')]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </section>

          {/* Répartition détaillée par statut + indicateurs radiaux */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartCard
              title={t('statusBreakdown')}
              subtitle={t('statusBreakdownSubtitle')}
              className="lg:col-span-2"
            >
              <div className="h-80">
                {d.projets.parStatut && Object.keys(d.projets.parStatut).length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={Object.entries(d.projets.parStatut).map(([statut, count]) => ({
                        name: statut.replace(/_/g, ' '),
                        count,
                        fill: STATUT_COLORS[statut] ?? CHART_COLORS.gray,
                      }))}
                      layout="vertical"
                      margin={{ top: 8, right: 24, left: 120, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value: number | undefined) => [value ?? 0, t('projects')]} />
                      <Bar dataKey="count" name={t('projects')} radius={[0, 6, 6, 0]}>
                        {Object.entries(d.projets.parStatut).map(([statut], i) => (
                          <Cell key={i} fill={STATUT_COLORS[statut] ?? CHART_COLORS.gray} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">{t('noData')}</div>
                )}
              </div>
            </ChartCard>

            <ChartCard title={t('keyIndicators')} subtitle={t('ratePercent')}>
              <div className="h-80 flex flex-col justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="40%"
                    outerRadius="90%"
                    barSize={12}
                    data={[
                      { name: t('budget'), value: Math.min(d.budget.tauxConsommation, 100), fill: CHART_COLORS.primary },
                      { name: t('progress'), value: Math.min(d.planning.tauxAvancement, 100), fill: CHART_COLORS.secondary },
                      { name: t('compliance'), value: Math.min(d.qualite.tauxConformite, 100), fill: CHART_COLORS.success },
                    ]}
                    startAngle={180}
                    endAngle={0}
                  >
                    <RadialBar background dataKey="value" cornerRadius={6} />
                    <Legend iconSize={10} layout="vertical" align="right" verticalAlign="middle" />
                    <Tooltip formatter={(value: number | undefined) => [`${value ?? 0}%`, '']} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </section>

          {/* Chantiers, Sécurité, Matériel — cartes secondaires */}
          <section>
            <SectionTitle title={t('otherIndicators')} subtitle={t('otherIndicatorsSubtitle')} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ChartCard title={t('sites')} subtitle={t('sitesSubtitle')}>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: t('active'), value: d.chantiers.actifs, fill: CHART_COLORS.blue },
                        { name: t('completed'), value: d.chantiers.termines, fill: CHART_COLORS.success },
                      ]}
                      margin={{ top: 16, right: 16, left: 16, bottom: 8 }}
                    >
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
              <KPICard
                title={t('safety')}
                value={d.securite.incidentsTotal}
                subtitle={t('incidentsReported')}
                detail={
                  <>
                    {d.securite.incidentsGraves > 0 && <span className="text-red-600 dark:text-red-400">{d.securite.incidentsGraves} {t('serious')}</span>}
                    {d.securite.joursArretTotal > 0 && (
                      <span className="text-orange-600 dark:text-orange-400">{d.securite.joursArretTotal} {t('daysOff')}</span>
                    )}
                    {d.securite.risquesCritiques > 0 && (
                      <span className="text-red-600 dark:text-red-400">{d.securite.risquesCritiques} {t('criticalRisks')}</span>
                    )}
                  </>
                }
                accent="warning"
              />
              <KPICard
                title={t('equipment')}
                value={d.materiel.enginsTotal}
                subtitle={t('equipmentSubtitle')}
                detail={
                  <>
                    <span className="text-green-600 dark:text-green-400">{d.materiel.enginsDisponibles} {t('available')}</span>
                    {d.materiel.materiauxStockBas > 0 && (
                      <span className="text-orange-600 dark:text-orange-400">{d.materiel.materiauxStockBas} {t('lowStock')}</span>
                    )}
                  </>
                }
                accent="secondary"
              />
            </div>
          </section>
        </>
      )}

      {/* Rapport par projet */}
      <section className="rounded-2xl border border-gray-100 dark:border-gray-600 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <SectionTitle title={t('detailedReportByProject')} subtitle={t('selectProjectForIndicators')} />
        <select
          value={selectedProjetId ?? ''}
          onChange={(e) => setSelectedProjetId(e.target.value ? Number(e.target.value) : null)}
          className="w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-shadow"
        >
          <option value="">{t('chooseProject')}</option>
          {projets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nom}
            </option>
          ))}
        </select>
      </section>

      {projetReport && <ProjetReportSection report={projetReport} />}

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/30 p-4 text-red-700 dark:text-red-200">
          {error}
        </div>
      )}
    </PageContainer>
  )
}

/** Bloc rapport détaillé d'un projet avec graphiques */
function ProjetReportSection({ report }: { report: ProjetReport }) {
  const { formatMontant, formatShort } = useFormatNumber()
  const { t } = useTranslation('reporting')
  const b = report.budget
  const p = report.planning
  const q = report.qualite
  const s = report.securite

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-gray-100 dark:border-gray-600 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {report.projetNom}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('status')}: {report.statut}</p>
          </div>
          <div className="flex gap-2">
            <span className="rounded-full bg-blue-50 dark:bg-blue-900/50 px-3 py-1 text-sm font-medium text-blue-700 dark:text-blue-200">
              {report.nbChantiers} {t('sitesCount')}
            </span>
            <span className="rounded-full bg-purple-50 dark:bg-purple-900/50 px-3 py-1 text-sm font-medium text-purple-700 dark:text-purple-200">
              {report.nbSousProjets} {t('subprojects')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard title={t('budget')} subtitle={`${b.tauxConsommation}% ${t('consumedPercent')}`}>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={[
                    { name: t('consumed'), value: Number(b.depensesTotales), fill: CHART_COLORS.primary },
                    {
                      name: t('remaining'),
                      value: Math.max(0, Number(b.budgetTotalPrevu) - Number(b.depensesTotales)),
                      fill: CHART_COLORS.gray,
                    },
                  ]}
                  margin={{ top: 8, right: 24, left: 70, bottom: 8 }}
                >
                  <XAxis type="number" tickFormatter={(v) => formatShort(v)} />
                  <YAxis type="category" dataKey="name" width={65} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number | undefined) => [formatMontant(value ?? 0), '']} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {t('variance')}: <span className={Number(b.ecart) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>{formatMontant(Number(b.ecart))}</span>
            </p>
          </ChartCard>

          <ChartCard title={t('taskProgress')} subtitle={`${p.tauxAvancement}% — ${p.tachesTerminees}/${p.tachesTotal} ${t('tasks')}`}>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: t('completed'), value: p.tachesTerminees, color: CHART_COLORS.success },
                      { name: t('inProgress'), value: p.tachesEnCours, color: CHART_COLORS.blue },
                      { name: t('late'), value: p.tachesEnRetard, color: CHART_COLORS.danger },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    <Cell fill={CHART_COLORS.success} />
                    <Cell fill={CHART_COLORS.blue} />
                    <Cell fill={CHART_COLORS.danger} />
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title={t('qualityAndSafety')}>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-green-50/80 dark:bg-green-900/30 px-4 py-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('compliance')}</span>
                <span
                  className={`text-lg font-bold ${
                    q.tauxConformite >= 80 ? 'text-green-600 dark:text-green-400' : q.tauxConformite >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {q.tauxConformite}%
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50/80 dark:bg-gray-700/80 px-4 py-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('incidents')}</span>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{s.incidentsTotal}</span>
              </div>
              {(q.ncOuvertes > 0 || s.risquesCritiques > 0) && (
                <div className="flex flex-wrap gap-2 text-xs">
                  {q.ncOuvertes > 0 && (
                    <span className="rounded-full bg-red-50 dark:bg-red-900/50 px-2 py-1 text-red-700 dark:text-red-200">{q.ncOuvertes} {t('ncOpen')}</span>
                  )}
                  {s.risquesCritiques > 0 && (
                    <span className="rounded-full bg-amber-50 dark:bg-amber-900/50 px-2 py-1 text-amber-700 dark:text-amber-200">{s.risquesCritiques} {t('criticalRisks')}</span>
                  )}
                </div>
              )}
            </div>
          </ChartCard>
        </div>
      </div>
    </section>
  )
}
