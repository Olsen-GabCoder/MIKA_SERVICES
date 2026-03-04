import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFormatNumber } from '@/hooks/useFormatNumber'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchGlobalDashboard, fetchProjetReport, clearProjetReport } from '@/store/slices/reportingSlice'
import { fetchProjets } from '@/store/slices/projetSlice'
import { fetchNotificationsNonLuesCount, fetchMessagesNonLusCount } from '@/store/slices/communicationSlice'
import { PageContainer } from '@/components/layout/PageContainer'
import { mockEvolutionMensuelle } from '@/mock/data/reporting'
import MeteoWidget from '../components/MeteoWidget'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  Area, Line,
  RadialBarChart, RadialBar,
  ComposedChart,
} from 'recharts'
import type { ProjetSummary } from '@/types/projet'
import type { ProjetReport } from '@/types/reporting'

/* ── Design tokens ── */
const C = {
  accent:  '#FF6B35', secondary: '#2E5266', teal:   '#48B5A0',
  gold:    '#F0C15A', rose:      '#E85D75', violet: '#8B5CF6',
  blue:    '#3B82F6', green:     '#10B981', red:    '#EF4444', gray: '#94A3B8',
  cyan:    '#06B6D4', indigo:    '#6366F1', slate:  '#64748B',
}

const PALETTE = [C.secondary, C.teal, C.accent, C.gold, C.violet, C.rose, C.cyan, C.indigo]

const STATUT_MAP: Record<string, { label: string; color: string }> = {
  EN_COURS:            { label: 'En cours',         color: C.secondary },
  TERMINE:             { label: 'Terminé',           color: C.teal      },
  EN_ATTENTE:          { label: 'En attente',        color: C.gold      },
  PLANIFIE:            { label: 'Planifié',          color: C.violet    },
  SUSPENDU:            { label: 'Suspendu',          color: C.rose      },
  ABANDONNE:           { label: 'Abandonné',         color: C.gray      },
  RECEPTION_PROVISOIRE:{ label: 'Réc. provisoire',  color: C.cyan      },
  RECEPTION_DEFINITIVE:{ label: 'Réc. définitive',  color: C.green     },
}

/* ── Custom tooltip ── */
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-600 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-4 py-3 shadow-xl text-xs min-w-[120px]">
      {label && <p className="font-semibold text-gray-700 dark:text-gray-200 mb-2 border-b border-gray-100 dark:border-gray-600 pb-1.5">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color || p.fill }} />
          <span className="text-gray-500 dark:text-gray-400">{p.name || ''}</span>
          <span className="ml-auto font-bold text-gray-800 dark:text-gray-100">
            {formatter ? formatter(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ── Thin progress bar ── */
const MiniBar = ({ value, color, bg = '#e2e8f0' }: { value: number; color: string; bg?: string }) => (
  <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: bg }}>
    <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700" style={{ width: `${Math.min(value, 100)}%`, background: color }} />
  </div>
)

export default function DashboardPage() {
  const { t } = useTranslation('common')
  const { formatMontant: fmt, formatShort: fmtS } = useFormatNumber()

  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { dashboard, projetReport, loading } = useAppSelector(s => s.reporting)
  const user = useAppSelector((s: any) => s.auth.user)
  const { messagesNonLusCount, notificationsNonLuesCount } = useAppSelector(s => s.communication)
  const projets = useAppSelector(s => s.projet.projets)
  const [selectedProjetId, setSelectedProjetId] = useState<number | null>(null)

  useEffect(() => {
    dispatch(fetchGlobalDashboard())
    dispatch(fetchProjets({ page: 0, size: 10 }))
    if (user?.id) {
      dispatch(fetchNotificationsNonLuesCount(user.id))
      dispatch(fetchMessagesNonLusCount(user.id))
    }
  }, [dispatch, user?.id])

  useEffect(() => {
    if (selectedProjetId) dispatch(fetchProjetReport(selectedProjetId))
    else dispatch(clearProjetReport())
  }, [dispatch, selectedProjetId])

  const evolutionData = useMemo(() =>
    mockEvolutionMensuelle.map(p => ({ ...p, depM: Math.round(p.depenses / 1e6) })), [])

  const pieData = useMemo(() => {
    if (!projets.length && !dashboard) return []
    if (projets.length) {
      const c: Record<string, number> = {}
      projets.forEach(p => { c[p.statut] = (c[p.statut] || 0) + 1 })
      return Object.entries(c)
        .map(([s, v], i) => ({ name: STATUT_MAP[s]?.label || s, value: v, color: STATUT_MAP[s]?.color || PALETTE[i % PALETTE.length] }))
        .sort((a, b) => b.value - a.value)
    }
    if (!dashboard) return []
    const dp = dashboard.projets
    return [
      { name: t('db.pie.inProgress'), value: dp.enCours,   color: C.secondary },
      { name: t('db.pie.completed'),  value: dp.termines,  color: C.teal      },
      { name: t('db.pie.delayed'),    value: dp.enRetard,  color: C.accent    },
    ].filter(i => i.value > 0)
  }, [projets, dashboard, t])

  const activeProjects = useMemo(() =>
    [...projets].filter(p => p.statut === 'EN_COURS')
      .sort((a, b) => (a.avancementGlobal ?? 0) - (b.avancementGlobal ?? 0)).slice(0, 6),
  [projets])

  const alerts = useMemo(() => {
    if (!dashboard) return []
    const a: { type: 'danger' | 'warning' | 'info'; text: string }[] = []
    if (dashboard.projets.enRetard       > 0) a.push({ type: 'danger',  text: t('db.alerts.projectsDelayed',  { count: dashboard.projets.enRetard }) })
    if (dashboard.planning.tachesEnRetard > 0) a.push({ type: 'danger',  text: t('db.alerts.tasksDelayed',    { count: dashboard.planning.tachesEnRetard }) })
    if (dashboard.securite.incidentsGraves > 0) a.push({ type: 'danger', text: t('db.alerts.seriousIncidents', { count: dashboard.securite.incidentsGraves }) })
    if (dashboard.securite.risquesCritiques > 0) a.push({ type: 'warning', text: t('db.alerts.criticalRisks', { count: dashboard.securite.risquesCritiques }) })
    if (dashboard.materiel.materiauxStockBas > 0) a.push({ type: 'warning', text: t('db.alerts.materialsLow', { count: dashboard.materiel.materiauxStockBas }) })
    if (dashboard.qualite.ncOuvertes > 0) a.push({ type: 'info', text: t('db.alerts.ncOpen', { count: dashboard.qualite.ncOuvertes }) })
    return a
  }, [dashboard, t])

  const radialData = useMemo(() => {
    if (!dashboard) return []
    return [
      { name: t('db.radial.budget'),   value: Math.min(dashboard.budget.tauxConsommation,   100), fill: C.accent    },
      { name: t('db.radial.progress'), value: Math.min(dashboard.planning.tauxAvancement,   100), fill: C.secondary },
      { name: t('db.radial.quality'),  value: Math.min(dashboard.qualite.tauxConformite,     100), fill: C.green     },
    ]
  }, [dashboard, t])

  /* ── Loading skeleton ── */
  if (loading && !dashboard) {
    return (
      <PageContainer size="full">
        <div className="p-6 space-y-5 animate-pulse">
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-2xl" />)}</div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 h-72 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
            <div className="h-72 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-60 bg-gray-200 dark:bg-gray-700 rounded-2xl" />)}</div>
        </div>
      </PageContainer>
    )
  }
  if (!dashboard) return null

  const d = dashboard
  const totalProj = d.projets.total
  const montantTotalProjets = d.projets.montantTotal ?? projets.reduce((s, p) => s + (p.montantHT ?? 0), 0)
  const avancementMoyenProjets = d.projets.avancementMoyen ?? (projets.length > 0
    ? Math.round((projets.reduce((a, p) => a + (p.avancementGlobal ?? 0), 0) / projets.length) * 100) / 100
    : 0)

  /* ── Computed chart datasets ── */
  const projectsChartData = (() => {
    const bars = [
      { name: t('db.pie.inProgress'), value: d.projets.enCours,  fill: C.green  },
      { name: t('db.pie.completed'),  value: d.projets.termines, fill: C.teal   },
      { name: t('db.pie.delayed'),    value: d.projets.enRetard, fill: C.accent },
    ].filter(i => i.value > 0)
    return bars.length ? bars : [{ name: '—', value: 1, fill: C.gray }]
  })()

  const budgetDonut = [
    { name: t('db.charts.consumed'),  value: d.budget.depensesTotales, color: C.accent },
    { name: t('db.charts.remaining'), value: Math.max(0, Number(d.budget.budgetTotalPrevu) - Number(d.budget.depensesTotales)), color: '#E2E8F0' },
  ]
  const tasksBars = [
    { name: t('db.planning.completed'), count: d.planning.tachesTerminees, fill: C.green },
    { name: t('db.planning.inProgress'),count: d.planning.tachesEnCours,   fill: C.blue  },
    { name: t('db.planning.overdue'),   count: d.planning.tachesEnRetard,  fill: C.red   },
  ]
  const qualityDonut = [
    { name: t('db.charts.compliant'),    value: Math.round((d.qualite.controlesTotal * d.qualite.tauxConformite)        / 100), color: C.green },
    { name: t('db.charts.nonCompliant'), value: Math.round((d.qualite.controlesTotal * (100 - d.qualite.tauxConformite))/ 100), color: C.red   },
  ]
  const sitesBars = [
    { name: t('db.charts.active'),    value: d.chantiers.actifs,   fill: C.blue  },
    { name: t('db.charts.completed'), value: d.chantiers.termines, fill: C.green },
  ]
  const safetyBars = [
    { name: t('db.safety.totalIncidents'), value: d.securite.incidentsTotal,   fill: C.gold },
    { name: t('db.safety.serious'),        value: d.securite.incidentsGraves,  fill: C.red  },
    { name: t('db.safety.criticalRisks'),  value: d.securite.risquesCritiques, fill: C.rose },
    { name: t('db.safety.daysStopped'),    value: d.securite.joursArretTotal,  fill: C.gray },
  ]
  const equipDonut = [
    { name: t('db.charts.available'), value: d.materiel.enginsDisponibles, color: C.green },
    { name: t('db.charts.inUse'),     value: d.materiel.enginsTotal - d.materiel.enginsDisponibles, color: C.blue },
  ]
  const budgetHBar = [
    { name: t('db.budgetDetail.planned'), value: Number(d.budget.budgetTotalPrevu), fill: C.secondary },
    { name: t('db.budgetDetail.spent'),   value: Number(d.budget.depensesTotales),  fill: C.accent    },
  ]

  /* ── KPI accent helper ── */
  const budgetAccent = d.budget.tauxConsommation > 90 ? C.red : d.budget.tauxConsommation > 70 ? C.gold : C.green
  const qualAccent   = d.qualite.tauxConformite >= 80 ? C.green : C.gold

  return (
    <PageContainer size="full" className="w-full pb-10 space-y-0">

      {/* ════════════════════════════════════════════════════════════
          HERO HEADER (charte graphique : primary, secondary)
      ════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary-dark via-secondary to-secondary-dark px-6 sm:px-10 py-8 text-white shadow-2xl mb-6">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -right-16 -top-16 w-80 h-80 rounded-full bg-white/[0.04] blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 w-56 h-56 rounded-full bg-primary/10 blur-2xl" />
        <div className="pointer-events-none absolute right-1/3 top-0 w-40 h-40 rounded-full bg-primary-light/10 blur-2xl" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1 h-8 rounded-full bg-gradient-to-b from-primary to-primary-light" />
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                <span className="dashboard-title-shimmer">{t('db.header')}</span>
              </h1>
            </div>
            <p className="text-white/80 text-sm ml-4">{t('db.subtitle')}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {notificationsNonLuesCount > 0 && user?.inAppNotificationsEnabled !== false && (
              <button onClick={() => navigate('/notifications')}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-2 rounded-xl hover:bg-white/20 transition text-xs font-medium">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                {t('dashboard.notificationsUnread', { count: notificationsNonLuesCount })}
              </button>
            )}
            {messagesNonLusCount > 0 && (
              <button onClick={() => navigate('/messagerie')}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-2 rounded-xl hover:bg-white/20 transition text-xs font-medium">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                {t('dashboard.messagesUnread', { count: messagesNonLusCount })}
              </button>
            )}
            <span className="hidden sm:flex items-center gap-1.5 text-white/50 text-xs">
              <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
                {user?.prenom?.[0] ?? '?'}
              </span>
              {t('dashboard.greeting', { name: user?.prenom || '' })}
            </span>
          </div>
        </div>
      </div>

      {/* ════ ALERTS ════ */}
      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {alerts.map((a, i) => (
            <span key={i} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border
              ${a.type === 'danger'
                ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-300'
                : a.type === 'warning'
                ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700/50 text-amber-700 dark:text-amber-300'
                : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700/50 text-blue-700 dark:text-blue-300'}`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0
                ${a.type === 'danger' ? 'bg-red-500' : a.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
              {a.text}
            </span>
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          ROW 1 — 4 KPI CARDS
      ════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <GlassKpi
          accent={C.accent} label={t('db.kpi.totalProjects')} value={totalProj}
          sub={`${d.projets.enCours} ${t('db.kpi.active')} · ${d.projets.enRetard} ${t('db.kpi.delayed')}`}
          progress={d.projets.enCours / Math.max(totalProj, 1) * 100}
          onClick={() => navigate('/projets')} icon="📋" />
        <GlassKpi
          accent={C.secondary} label={t('db.kpi.globalProgress')} value={`${d.planning.tauxAvancement}%`}
          sub={`${d.planning.tachesTerminees}/${d.planning.tachesTotal} ${t('db.kpi.tasks')}`}
          progress={d.planning.tauxAvancement}
          onClick={() => navigate('/planning')} icon="📅" />
        <GlassKpi
          accent={budgetAccent} label={t('db.kpi.budgetConsumed')} value={`${d.budget.tauxConsommation}%`}
          sub={`${fmtS(d.budget.depensesTotales)} / ${fmtS(d.budget.budgetTotalPrevu)}`}
          progress={d.budget.tauxConsommation}
          onClick={() => navigate('/budget')} icon="💰" />
        <GlassKpi
          accent={qualAccent} label={t('db.kpi.qualityRate')} value={`${d.qualite.tauxConformite}%`}
          sub={`${d.qualite.controlesTotal} ${t('db.kpi.controls')} · ${d.qualite.ncOuvertes} NC`}
          progress={d.qualite.tauxConformite}
          onClick={() => navigate('/qualite')} icon="✅" />
      </div>

      {/* ════════════════════════════════════════════════════════════
          VUE D'ENSEMBLE — 3 graphiques
      ════════════════════════════════════════════════════════════ */}
      <SectionHeader title={t('db.projectsOverview.title')} action={{ label: t('db.seeAll'), onClick: () => navigate('/projets') }} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">

        {/* 1 — Répartition statuts */}
        <Card title={t('db.pie.title')} subtitle={`${totalProj} ${t('db.kpi.totalProjects')}`}>
          <div className="relative">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <defs>
                  {projectsChartData.filter(e => e.name !== '—').map((e, i) => (
                    <linearGradient key={i} id={`projGrad-${i}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={e.fill} stopOpacity={1}   />
                      <stop offset="100%" stopColor={e.fill} stopOpacity={0.7} />
                    </linearGradient>
                  ))}
                  <filter id="pieShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.15" />
                  </filter>
                </defs>
                <Pie data={projectsChartData} cx="50%" cy="50%" innerRadius="42%" outerRadius="68%"
                  paddingAngle={4} dataKey="value" startAngle={90} endAngle={-270} filter="url(#pieShadow)">
                  {projectsChartData.map((e, i) => (
                    <Cell key={i} fill={e.name === '—' ? e.fill : `url(#projGrad-${i})`}
                      stroke="rgba(255,255,255,0.6)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Centre label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-3xl font-extrabold text-gray-800 dark:text-gray-100 tabular-nums leading-none">{totalProj}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">total</p>
            </div>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center pt-3 mt-1 border-t border-gray-100 dark:border-gray-700">
            {projectsChartData.filter(e => e.value > 0 && e.name !== '—').map(e => (
              <div key={e.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ background: e.fill }} />
                <span className="text-gray-500 dark:text-gray-400">{e.name}</span>
                <span className="font-bold text-gray-800 dark:text-gray-100">{e.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* 2 — Montant total */}
        <Card title={t('db.kpi.totalAmount')} subtitle={`${totalProj} ${t('db.kpi.totalProjects')}`}>
          <div className="h-[220px] flex flex-col justify-between gap-4">
            <div className="flex-1 flex flex-col items-center justify-center">
              <p className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-50 tabular-nums tracking-tight"
                style={{ letterSpacing: '-0.02em' }}>
                {fmtS(montantTotalProjets)}
              </p>
              <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">XAF HT</p>
            </div>

            {/* Stacked progress bar showing breakdown */}
            <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-700">
              {projectsChartData.filter(e => e.name !== '—').map(e => {
                const pct = Math.round((e.value / Math.max(totalProj, 1)) * 100)
                return (
                  <div key={e.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: e.fill }} />
                    <span className="flex-1 text-gray-500 dark:text-gray-400 truncate">{e.name}</span>
                    <div className="w-20 sm:w-28"><MiniBar value={pct} color={e.fill} bg="rgba(0,0,0,0.06)" /></div>
                    <span className="font-semibold text-gray-700 dark:text-gray-200 w-8 text-right">{e.value}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>

        {/* 3 — Avancement moyen */}
        <Card title={t('db.kpi.avgProgress')} subtitle={t('db.projects.progress')}>
          <div className="h-[220px] flex flex-col">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={[{ name: t('db.kpi.avgProgress'), value: Math.min(avancementMoyenProjets, 100), rest: 100 - Math.min(avancementMoyenProjets, 100) }]}
                margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
                <defs>
                  <linearGradient id="gAvancement" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%"   stopColor={C.accent} stopOpacity={0.7} />
                    <stop offset="100%" stopColor={C.accent} stopOpacity={1}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="#e5e7eb" strokeOpacity={0.8} />
                <XAxis dataKey="name" hide />
                <YAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  width={30} tickFormatter={v => `${v}%`} />
                <Tooltip content={<CustomTooltip formatter={(v: number) => `${v}%`} />} />
                <Bar dataKey="value" fill="url(#gAvancement)" radius={[6, 6, 0, 0]} maxBarSize={90} />
                <Bar dataKey="rest"  fill="#f1f5f9"            radius={[6, 6, 0, 0]} maxBarSize={90} stackId="s" />
              </BarChart>
            </ResponsiveContainer>
            <div className="text-center pt-3 border-t border-gray-100 dark:border-gray-700">
              <span className="text-3xl font-extrabold tabular-nums" style={{ color: C.accent }}>{avancementMoyenProjets}%</span>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-0.5">{t('db.radial.progress')}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* ════════════════════════════════════════════════════════════
          ROW 2 — EVOLUTION CHART + RADIAL GAUGE
      ════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <Card className="lg:col-span-2" title={t('db.evolution.title')} subtitle={t('db.evolution.subtitle')}>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={evolutionData} margin={{ top: 10, right: 14, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gDepArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={C.accent} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={C.accent} stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" strokeOpacity={0.7} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="l" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                label={{ value: 'M FCFA', angle: -90, position: 'insideLeft', offset: 12, style: { fontSize: 10, fill: '#94a3b8' } }} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8}
                formatter={(v) => <span style={{ fontSize: 11, color: '#64748b' }}>{v}</span>} />
              <Area yAxisId="l" type="monotone" dataKey="depM" name={t('db.evolution.expenses')}
                stroke={C.accent} strokeWidth={2.5} fill="url(#gDepArea)"
                dot={{ r: 3.5, fill: C.accent, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: C.accent, stroke: '#fff', strokeWidth: 2 }} />
              <Line yAxisId="r" type="monotone" dataKey="tachesTerminees" name={t('db.evolution.tasksDone')}
                stroke={C.secondary} strokeWidth={2.5}
                dot={{ r: 3, fill: C.secondary, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: C.secondary, stroke: '#fff', strokeWidth: 2 }} />
              <Line yAxisId="r" type="monotone" dataKey="controlesRealises" name={t('db.evolution.controls')}
                stroke={C.teal} strokeWidth={2.5}
                dot={{ r: 3, fill: C.teal, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: C.teal, stroke: '#fff', strokeWidth: 2 }} />
              <Bar yAxisId="r" dataKey="incidents" name={t('db.evolution.incidents')}
                fill={C.rose} radius={[4, 4, 0, 0]} barSize={14} opacity={0.85} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        <Card title={t('db.radial.title')} subtitle={t('db.radial.subtitle')}>
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart cx="50%" cy="55%" innerRadius="25%" outerRadius="90%"
              barSize={16} data={radialData} startAngle={180} endAngle={0}>
              <defs>
                {radialData.map((r, i) => (
                  <linearGradient key={i} id={`radGrad-${i}`} x1="1" y1="0" x2="0" y2="0">
                    <stop offset="0%"   stopColor={r.fill} stopOpacity={1}   />
                    <stop offset="100%" stopColor={r.fill} stopOpacity={0.6} />
                  </linearGradient>
                ))}
              </defs>
              <RadialBar background={{ fill: '#f1f5f9' }} dataKey="value" cornerRadius={8}
                label={{ position: 'insideStart', fill: '#fff', fontSize: 10, fontWeight: 600 }}>
                {radialData.map((_, i) => <Cell key={i} fill={`url(#radGrad-${i})`} />)}
              </RadialBar>
              <Tooltip content={<CustomTooltip formatter={(v: number) => `${v}%`} />} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-2 mt-1 pt-3 border-t border-gray-100 dark:border-gray-700">
            {radialData.map((r, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center mb-1"
                  style={{ background: `${r.fill}20` }}>
                  <span className="text-xs font-bold" style={{ color: r.fill }}>{r.value}%</span>
                </div>
                <p className="text-[9px] text-gray-500 dark:text-gray-400 leading-tight">{r.name}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ════════════════════════════════════════════════════════════
          ROW 3 — 4 CHARTS
      ════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {/* Budget donut */}
        <Card title={t('db.charts.budgetTitle')} subtitle={`${d.budget.tauxConsommation}% ${t('db.charts.consumed')}`}>
          <div className="relative">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <defs>
                  <linearGradient id="gBudCons" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%"   stopColor={C.accent} stopOpacity={1}   />
                    <stop offset="100%" stopColor={C.rose}   stopOpacity={0.9} />
                  </linearGradient>
                </defs>
                <Pie data={budgetDonut} cx="50%" cy="50%" innerRadius={44} outerRadius={66}
                  paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                  <Cell fill="url(#gBudCons)" stroke="none" />
                  <Cell fill="#e2e8f0" stroke="none" />
                </Pie>
                <Tooltip content={<CustomTooltip formatter={fmt} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-extrabold text-gray-800 dark:text-gray-100">{d.budget.tauxConsommation}%</span>
            </div>
          </div>
          <p className="text-center text-[10px] text-gray-400 dark:text-gray-500 mt-1">
            {fmtS(d.budget.depensesTotales)} / {fmtS(d.budget.budgetTotalPrevu)}
          </p>
        </Card>

        {/* Tasks bar */}
        <Card title={t('db.charts.tasksTitle')} subtitle={`${d.planning.tauxAvancement}% ${t('db.charts.advancement')}`}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={tasksBars} margin={{ top: 8, right: 8, left: -12, bottom: 4 }}>
              <defs>
                {tasksBars.map((e, i) => (
                  <linearGradient key={i} id={`gTask-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={e.fill} stopOpacity={1}   />
                    <stop offset="100%" stopColor={e.fill} stopOpacity={0.7} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={24} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {tasksBars.map((_, i) => <Cell key={i} fill={`url(#gTask-${i})`} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Quality donut */}
        <Card title={t('db.charts.qualityTitle')} subtitle={`${d.qualite.controlesTotal} ${t('db.kpi.controls')}`}>
          <div className="relative">
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <defs>
                  <linearGradient id="gQualGreen" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={C.green} stopOpacity={1}   />
                    <stop offset="100%" stopColor={C.teal} stopOpacity={0.9} />
                  </linearGradient>
                </defs>
                <Pie data={qualityDonut} cx="50%" cy="50%" innerRadius={38} outerRadius={58}
                  paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                  <Cell fill="url(#gQualGreen)" stroke="none" />
                  <Cell fill={C.red} stroke="none" opacity={0.8} />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className={`text-xl font-extrabold ${d.qualite.tauxConformite >= 80 ? 'text-green-600' : d.qualite.tauxConformite >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                {d.qualite.tauxConformite}%
              </span>
            </div>
          </div>
          <div className="flex gap-3 justify-center text-xs mt-2">
            {qualityDonut.map(e => (
              <div key={e.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: e.color }} />
                <span className="text-gray-500 dark:text-gray-400">{e.name}</span>
                <span className="font-bold text-gray-700 dark:text-gray-200">{e.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Sites bar */}
        <Card title={t('db.charts.sitesTitle')} subtitle={`${d.chantiers.total} ${t('db.charts.totalSites')}`}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={sitesBars} margin={{ top: 8, right: 8, left: -12, bottom: 4 }}>
              <defs>
                <linearGradient id="gSite0" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.blue}  stopOpacity={1}   />
                  <stop offset="100%" stopColor={C.blue} stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="gSite1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.green}  stopOpacity={1}   />
                  <stop offset="100%" stopColor={C.green} stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={24} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                <Cell fill="url(#gSite0)" />
                <Cell fill="url(#gSite1)" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ════════════════════════════════════════════════════════════
          ROW 4 — PIE + PROJECTS TABLE
      ════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <Card title={t('db.pie.title')}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <defs>
                {pieData.map((e, i) => (
                  <linearGradient key={i} id={`pieAll-${i}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={e.color} stopOpacity={1}   />
                    <stop offset="100%" stopColor={e.color} stopOpacity={0.7} />
                  </linearGradient>
                ))}
              </defs>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                paddingAngle={3} dataKey="value"
                label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}>
                {pieData.map((_, i) => <Cell key={i} fill={`url(#pieAll-${i})`} stroke="none" />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            {pieData.map((e, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: e.color }} />
                <span className="flex-1 text-gray-600 dark:text-gray-300 truncate">{e.name}</span>
                <div className="w-16"><MiniBar value={e.value / Math.max(totalProj, 1) * 100} color={e.color} /></div>
                <span className="font-bold text-gray-800 dark:text-gray-100 w-5 text-right">{e.value}</span>
              </div>
            ))}
            <div className="flex justify-between text-xs pt-1.5 border-t border-gray-100 dark:border-gray-700 font-bold">
              <span className="text-gray-700 dark:text-gray-200">{t('db.pie.total')}</span>
              <span className="text-gray-800 dark:text-gray-100">{totalProj}</span>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2">
          <Card title={t('db.projects.title')}
            action={<button onClick={() => navigate('/projets')} className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">{t('db.seeAll')} →</button>}>
            {activeProjects.length ? (
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr className="text-left border-b border-gray-100 dark:border-gray-700">
                      {[t('db.projects.name'), t('db.projects.amount'), t('db.projects.progress'), t('db.projects.manager')].map((h, i) => (
                        <th key={i} className={`pb-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 ${i === 1 ? 'text-right' : ''} ${i === 2 ? 'pl-4 w-36' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>{activeProjects.map(p => <ProjRow key={p.id} p={p} fmtS={fmtS} nav={navigate} />)}</tbody>
                </table>
              </div>
            ) : <p className="text-sm text-gray-400 text-center py-8">{t('db.projects.empty')}</p>}
          </Card>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          ROW 5 — SAFETY + EQUIPMENT + BUDGET BREAKDOWN
      ════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {/* Safety horizontal bar */}
        <Card title={t('db.safety.title')} subtitle={`${d.securite.incidentsTotal} ${t('db.charts.incidentsReported')}`}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={safetyBars} layout="vertical" margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
              <defs>
                {safetyBars.map((e, i) => (
                  <linearGradient key={i} id={`gSafe-${i}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"   stopColor={e.fill} stopOpacity={0.7} />
                    <stop offset="100%" stopColor={e.fill} stopOpacity={1}   />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 9.5, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {safetyBars.map((_, i) => <Cell key={i} fill={`url(#gSafe-${i})`} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Equipment donut */}
        <Card title={t('db.equipment.title')} subtitle={`${d.materiel.enginsTotal} ${t('db.charts.units')}`}>
          <div className="relative">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <defs>
                  <linearGradient id="gEquipAvail" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%"   stopColor={C.green} stopOpacity={1}   />
                    <stop offset="100%" stopColor={C.teal}  stopOpacity={0.9} />
                  </linearGradient>
                </defs>
                <Pie data={equipDonut} cx="50%" cy="50%" innerRadius={44} outerRadius={66}
                  paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                  <Cell fill="url(#gEquipAvail)" stroke="none" />
                  <Cell fill={C.blue} stroke="none" opacity={0.85} />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-extrabold text-gray-800 dark:text-gray-100">{d.materiel.enginsTotal}</span>
              <span className="text-[9px] text-gray-400">engins</span>
            </div>
          </div>
          <div className="flex gap-3 justify-center text-xs mt-1">
            {equipDonut.map(e => (
              <div key={e.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: e.color }} />
                <span className="text-gray-500 dark:text-gray-400">{e.name}</span>
                <span className="font-bold text-gray-700 dark:text-gray-200">{e.value}</span>
              </div>
            ))}
          </div>
          {d.materiel.materiauxStockBas > 0 && (
            <div className="mt-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 rounded-xl px-3 py-2 text-[11px] text-amber-700 dark:text-amber-300 text-center">
              ⚠ {t('db.alerts.materialsLow', { count: d.materiel.materiauxStockBas })}
            </div>
          )}
        </Card>

        {/* Budget breakdown */}
        <Card title={t('db.charts.budgetBreakdown')} subtitle={t('db.charts.plannedVsSpent')}>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={budgetHBar} layout="vertical" margin={{ top: 8, right: 20, left: 0, bottom: 8 }}>
              <defs>
                <linearGradient id="gBHPlan" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={C.secondary} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={C.secondary} stopOpacity={1}  />
                </linearGradient>
                <linearGradient id="gBHSpent" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={C.accent} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={C.accent} stopOpacity={1}  />
                </linearGradient>
              </defs>
              <XAxis type="number" tickFormatter={v => fmtS(v)} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip formatter={fmt} />} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
                <Cell fill="url(#gBHPlan)" />
                <Cell fill="url(#gBHSpent)" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-between items-center text-xs mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400">{t('db.budgetDetail.remaining')}</span>
            <span className={`font-extrabold text-base tabular-nums ${Number(d.budget.ecart) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {fmt(Number(d.budget.ecart))}
            </span>
          </div>
        </Card>
      </div>

      {/* ════════════════════════════════════════════════════════════
          ROW 6 — PROJET REPORT SELECTOR
      ════════════════════════════════════════════════════════════ */}
      <Card className="mb-6" title={t('db.report.title')} subtitle={t('db.report.subtitle')}>
        <div className="relative max-w-md">
          <select
            value={selectedProjetId ?? ''}
            onChange={e => setSelectedProjetId(e.target.value ? Number(e.target.value) : null)}
            className="w-full appearance-none rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2.5 pr-10 text-sm text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition shadow-sm cursor-pointer">
            <option value="">{t('db.report.choose')}</option>
            {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.755a.75.75 0 111.08 1.04l-4.25 4.3a.75.75 0 01-1.08 0l-4.25-4.3a.75.75 0 01.02-1.06z" clipRule="evenodd"/></svg>
          </div>
        </div>
      </Card>

      {projetReport && <ProjetReportBlock report={projetReport} fmt={fmt} fmtS={fmtS} t={t} />}

      {/* ════════════════════════════════════════════════════════════
          ROW 7 — METEO + QUICK ACCESS
      ════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <MeteoWidget />
        <Card title={t('db.quickAccess')}>
          <div className="grid grid-cols-5 gap-2">
            {[
              { k: 'projets',    p: '/projets',    i: '📋' }, { k: 'planning',  p: '/planning',  i: '📅' },
              { k: 'budget',     p: '/budget',     i: '💰' }, { k: 'engins',    p: '/engins',    i: '🚜' },
              { k: 'materiaux',  p: '/materiaux',  i: '🧱' }, { k: 'qualite',   p: '/qualite',   i: '✅' },
              { k: 'securite',   p: '/securite',   i: '🛡️' }, { k: 'messagerie',p: '/messagerie',i: '💬' },
              { k: 'equipes',    p: '/equipes',    i: '👷' }, { k: 'documents', p: '/documents', i: '📁' },
            ].map(x => (
              <button key={x.p} onClick={() => navigate(x.p)}
                className="group flex flex-col items-center gap-1.5 px-1 py-3 bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600/50 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm transition-all duration-150">
                <span className="text-xl group-hover:scale-110 transition-transform duration-150">{x.i}</span>
                <span className="text-[9px] leading-tight text-center text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                  {t(`db.shortcuts.${x.k}`)}
                </span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </PageContainer>
  )
}

/* ════════════════════════════════════════════════════════════════════
   ProjetReportBlock
════════════════════════════════════════════════════════════════════ */
function ProjetReportBlock({ report, fmt, fmtS, t }: {
  report: ProjetReport; fmt: (v: number) => string; fmtS: (v: number) => string; t: (k: string) => string
}) {
  const b = report.budget, p = report.planning, q = report.qualite, s = report.securite
  const budgetBars = [
    { name: t('db.report.consumed'),  value: Number(b.depensesTotales),                                                fill: C.accent },
    { name: t('db.report.remaining'), value: Math.max(0, Number(b.budgetTotalPrevu) - Number(b.depensesTotales)), fill: C.gray   },
  ]
  const taskDonut = [
    { name: t('db.planning.completed'), value: p.tachesTerminees, color: C.green },
    { name: t('db.planning.inProgress'),value: p.tachesEnCours,   color: C.blue  },
    { name: t('db.planning.overdue'),   value: p.tachesEnRetard,  color: C.red   },
  ]
  return (
    <Card className="mb-6" title={report.projetNom} subtitle={`${t('db.report.status')}: ${report.statut}`}
      action={
        <div className="flex gap-2 flex-wrap">
          <Chip color="blue">{report.nbChantiers} {t('db.report.sites')}</Chip>
          <Chip color="violet">{report.nbSousProjets} {t('db.report.subprojects')}</Chip>
        </div>
      }>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        {/* Budget */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('db.budgetDetail.title')}</p>
            <Chip color={b.tauxConsommation > 90 ? 'red' : b.tauxConsommation > 70 ? 'amber' : 'green'}>{b.tauxConsommation}%</Chip>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart layout="vertical" data={budgetBars} margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id="rBudC" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={C.accent} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={C.accent} stopOpacity={1} />
                </linearGradient>
              </defs>
              <XAxis type="number" tickFormatter={v => fmtS(v)} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip formatter={fmt} />} />
              <Bar dataKey="value" radius={[0, 5, 5, 0]} barSize={20}>
                <Cell fill="url(#rBudC)" />
                <Cell fill={C.gray} opacity={0.5} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-gray-400 mt-1">
            {t('db.budgetDetail.remaining')}:&nbsp;
            <span className={`font-bold ${Number(b.ecart) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(Number(b.ecart))}</span>
          </p>
        </div>

        {/* Planning donut */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('db.planning.title')}</p>
            <Chip color="blue">{p.tauxAvancement}%</Chip>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={taskDonut} cx="50%" cy="50%" innerRadius={36} outerRadius={56} paddingAngle={3} dataKey="value">
                {taskDonut.map((e, i) => <Cell key={i} fill={e.color} stroke="none" />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconSize={7} wrapperStyle={{ fontSize: '10px' }} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Quality + Safety */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('db.report.qualitySafety')}</p>
          <StatRow label={t('db.kpi.qualityRate')} value={`${q.tauxConformite}%`}
            color={q.tauxConformite >= 80 ? 'green' : q.tauxConformite >= 60 ? 'amber' : 'red'}
            progress={q.tauxConformite} />
          <StatRow label={t('db.safety.totalIncidents')} value={s.incidentsTotal} progress={Math.min(s.incidentsTotal * 5, 100)} color="slate" />
          {(q.ncOuvertes > 0 || s.risquesCritiques > 0) && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {q.ncOuvertes     > 0 && <Chip color="red"  >{q.ncOuvertes} NC</Chip>}
              {s.risquesCritiques > 0 && <Chip color="amber">{s.risquesCritiques} {t('db.safety.criticalRisks')}</Chip>}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

/* ════════════════════════════════════════════════════════════════════
   Atomic components
════════════════════════════════════════════════════════════════════ */
function Card({ title, subtitle, action, children, className = '' }: {
  title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode; className?: string
}) {
  return (
    <div className={`rounded-2xl border border-gray-100 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="min-w-0">
          <h3 className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest truncate">{title}</h3>
          {subtitle && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  )
}

function GlassKpi({ accent, label, value, sub, progress, onClick, icon }: {
  accent: string; label: string; value: number | string; sub: string; progress?: number; onClick?: () => void; icon?: string
}) {
  return (
    <button onClick={onClick} style={{ borderTopColor: accent }}
      className="group relative overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700 border-t-[3px] bg-white dark:bg-gray-800 p-5 text-left hover:shadow-lg transition-all duration-200 w-full">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-tight">{label}</p>
        {icon && <span className="text-base opacity-50 group-hover:opacity-100 transition-opacity">{icon}</span>}
      </div>
      <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-50 mt-2 mb-0.5 tabular-nums tracking-tight group-hover:opacity-90 transition-opacity"
        style={{ letterSpacing: '-0.02em' }}>
        {value}
      </p>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-3">{sub}</p>
      {progress !== undefined && (
        <div className="h-1 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(progress, 100)}%`, background: accent }} />
        </div>
      )}
      <div className="pointer-events-none absolute -right-8 -bottom-8 w-24 h-24 rounded-full opacity-[0.07]"
        style={{ background: accent }} />
    </button>
  )
}

function ProjRow({ p, fmtS, nav }: { p: ProjetSummary; fmtS: (v: number) => string; nav: (s: string) => void }) {
  const pct = p.avancementGlobal ?? 0
  const barColor = pct >= 75 ? C.green : pct >= 40 ? C.blue : C.gold
  return (
    <tr onClick={() => nav(`/projets/${p.id}`)}
      className="border-b border-gray-50 dark:border-gray-700/40 hover:bg-gray-50/70 dark:hover:bg-gray-700/20 cursor-pointer transition-colors duration-100 group">
      <td className="py-2.5 pr-3">
        <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{p.nom}</span>
        {p.clientNom && <span className="block text-[10px] text-gray-400 mt-0.5">{p.clientNom}</span>}
      </td>
      <td className="py-2.5 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap pr-3">
        {p.montantHT ? fmtS(p.montantHT) : '—'}
      </td>
      <td className="py-2.5 pl-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: barColor }} />
          </div>
          <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 w-8 text-right tabular-nums">{pct}%</span>
        </div>
      </td>
      <td className="py-2.5 pl-2 text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">{p.responsableNom || '—'}</td>
    </tr>
  )
}

function SectionHeader({ title, action }: { title: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="w-0.5 h-4 rounded-full bg-primary-500" />
        <h2 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{title}</h2>
      </div>
      {action && (
        <button onClick={action.onClick} className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">
          {action.label} →
        </button>
      )}
    </div>
  )
}

function Chip({ children, color }: { children: React.ReactNode; color: string }) {
  const map: Record<string, string> = {
    blue:   'bg-blue-50   dark:bg-blue-900/40   text-blue-700   dark:text-blue-200',
    violet: 'bg-violet-50 dark:bg-violet-900/40 text-violet-700 dark:text-violet-200',
    green:  'bg-green-50  dark:bg-green-900/40  text-green-700  dark:text-green-200',
    red:    'bg-red-50    dark:bg-red-900/40    text-red-700    dark:text-red-200',
    amber:  'bg-amber-50  dark:bg-amber-900/40  text-amber-700  dark:text-amber-200',
    slate:  'bg-slate-50  dark:bg-slate-700/40  text-slate-600  dark:text-slate-300',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${map[color] ?? map.slate}`}>
      {children}
    </span>
  )
}

function StatRow({ label, value, color, progress }: { label: string; value: React.ReactNode; color: string; progress: number }) {
  const colorMap: Record<string, string> = {
    green: C.green, amber: C.gold, red: C.red, slate: C.slate, blue: C.blue,
  }
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl px-4 py-3 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600 dark:text-gray-300">{label}</span>
        <span className="text-sm font-extrabold" style={{ color: colorMap[color] ?? C.slate }}>{value}</span>
      </div>
      <MiniBar value={progress} color={colorMap[color] ?? C.slate} />
    </div>
  )
}