import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFormatNumber } from '@/hooks/useFormatNumber'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchGlobalDashboard, fetchProjetReport, clearProjetReport } from '@/store/slices/reportingSlice'
import { fetchProjets } from '@/store/slices/projetSlice'
import { fetchNotificationsNonLuesCount } from '@/store/slices/communicationSlice'
import { PageContainer } from '@/components/layout/PageContainer'
import { CacheTimestampBanner } from '@/components/pwa/CacheTimestampBanner'
import MeteoWidget from '../components/MeteoWidget'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  RadialBarChart, RadialBar,
  ComposedChart, Area,
} from 'recharts'
import type { ProjetSummary } from '@/types/projet'
import type { ProjetReport, WeekSummary } from '@/types/reporting'

/* ═══════════════════════════════════════════════════════════════════
   Design system
═══════════════════════════════════════════════════════════════════ */
const C = {
  accent: '#FF6B35', secondary: '#2E5266', teal: '#48B5A0',
  gold: '#F0C15A', rose: '#E85D75', violet: '#8B5CF6',
  blue: '#3B82F6', green: '#10B981', red: '#EF4444', gray: '#94A3B8',
  cyan: '#06B6D4', indigo: '#6366F1', slate: '#64748B',
}
const PALETTE = [C.secondary, C.teal, C.accent, C.gold, C.violet, C.rose, C.cyan, C.indigo]

const STATUT_MAP: Record<string, { label: string; color: string }> = {
  INITIALISATION:       { label: 'Initialisation',      color: C.blue },
  EN_COURS_EXECUTION:   { label: "En cours d'exéc.",    color: C.secondary },
  SUSPENSION:           { label: 'Suspension',           color: C.rose },
  RECEPTION_PROVISOIRE: { label: 'Réc. provisoire',     color: C.cyan },
  RECEPTION_DEFINITIVE: { label: 'Réc. définitive',     color: C.green },
  EN_AVANCE:            { label: 'En avance',            color: C.teal },
}

/* ═══════════════════════════════════════════════════════════════════
   Shared atoms
═══════════════════════════════════════════════════════════════════ */
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-600 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-4 py-3 shadow-2xl text-xs min-w-[130px]">
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

const WeeklyTooltip = ({ active, payload, label, t }: any) => {
  if (!active || !payload?.length) return null
  const data = payload[0]?.payload as WeekSummary | undefined
  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-600 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-4 py-3 shadow-2xl text-xs min-w-[160px]">
      <p className="font-semibold text-gray-700 dark:text-gray-200 mb-2 border-b border-gray-100 dark:border-gray-600 pb-1.5">
        {data?.isCurrent ? `${label} — ${t('db.weekly.currentWeek')}` : label}
      </p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color || p.fill }} />
          <span className="text-gray-500 dark:text-gray-400">{p.name}</span>
          <span className="ml-auto font-bold text-gray-800 dark:text-gray-100">
            {p.dataKey === 'avancementMoyen' ? `${p.value}%` : p.value}
          </span>
        </div>
      ))}
      {data && (
        <div className="mt-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-600 flex justify-between font-semibold">
          <span className="text-gray-500 dark:text-gray-400">Total</span>
          <span className="text-gray-800 dark:text-gray-100">{data.total}</span>
        </div>
      )}
    </div>
  )
}

/** Fade-in on scroll — only for below-the-fold sections */
function useFadeIn(immediate = false) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(immediate)
  useEffect(() => {
    if (immediate) return
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); observer.disconnect() } }, { threshold: 0.08 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [immediate])
  return { ref, className: immediate ? '' : `transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}` }
}

/* ═══════════════════════════════════════════════════════════════════
   Main component
═══════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { t } = useTranslation('common')
  const { formatMontant: fmt, formatShort: fmtS } = useFormatNumber()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { dashboard, projetReport, loading, lastFetched } = useAppSelector(s => s.reporting)
  const user = useAppSelector((s: any) => s.auth.user)
  const { notificationsNonLuesCount } = useAppSelector(s => s.communication)
  const projets = useAppSelector(s => s.projet.projets)
  const [selectedProjetId, setSelectedProjetId] = useState<number | null>(null)

  const greetingInfo = useMemo(() => {
    const fb = t('db.userFallback')
    if (!user) return { key: 'db.greetingNeutral' as const, name: fb }
    const prenom = user.prenom?.trim()
    const nom = user.nom?.trim()
    if (!prenom && !nom) return { key: 'db.greetingNeutral' as const, name: fb }
    const sexeNorm = user.sexe ? String(user.sexe).replace(/^Sexe\./i, '').toUpperCase() : null
    if (sexeNorm === 'HOMME') return { key: 'db.greetingMale' as const, name: nom || prenom || fb }
    if (sexeNorm === 'FEMME') return { key: 'db.greetingFemale' as const, name: nom || prenom || fb }
    return { key: 'db.greetingNeutral' as const, name: prenom || nom || fb }
  }, [user, t])

  useEffect(() => {
    dispatch(fetchGlobalDashboard())
    dispatch(fetchProjets({ page: 0, size: 200 }))
    if (user?.id) dispatch(fetchNotificationsNonLuesCount(user.id))
  }, [dispatch, user?.id])

  useEffect(() => {
    if (selectedProjetId) dispatch(fetchProjetReport(selectedProjetId))
    else dispatch(clearProjetReport())
  }, [dispatch, selectedProjetId])

  /* ── Computed data ── */
  const topProjets = useMemo(() =>
    [...projets].filter(p => (p.montantHT ?? 0) > 0)
      .sort((a, b) => (b.montantHT ?? 0) - (a.montantHT ?? 0))
      .slice(0, 8)
      .map(p => ({ name: p.nom.length > 25 ? p.nom.slice(0, 22) + '…' : p.nom, montant: p.montantHT ?? 0, pct: p.avancementGlobal ?? 0 })),
  [projets])

  const pieData = useMemo(() => {
    if (!dashboard) return []
    const ps = dashboard.projets.parStatut
    if (ps && Object.keys(ps).length > 0) {
      return Object.entries(ps)
        .map(([s, v], i) => ({ name: STATUT_MAP[s]?.label || s, value: v, color: STATUT_MAP[s]?.color || PALETTE[i % PALETTE.length] }))
        .filter(i => i.value > 0).sort((a, b) => b.value - a.value)
    }
    return [
      { name: t('db.pie.inProgress'), value: dashboard.projets.enCours, color: C.secondary },
      { name: t('db.pie.completed'), value: dashboard.projets.termines, color: C.teal },
      { name: t('db.pie.delayed'), value: dashboard.projets.enRetard, color: C.accent },
    ].filter(i => i.value > 0)
  }, [dashboard, t])

  const activeProjects = useMemo(() =>
    [...projets].filter(p => p.statut === 'EN_COURS_EXECUTION' || p.statut === 'EN_AVANCE')
      .sort((a, b) => (a.avancementGlobal ?? 0) - (b.avancementGlobal ?? 0)).slice(0, 6),
  [projets])

  const alerts = useMemo(() => {
    if (!dashboard) return []
    const a: { type: 'danger' | 'warning' | 'info'; text: string }[] = []
    if (dashboard.projets.enRetard > 0) a.push({ type: 'danger', text: t('db.alerts.projectsDelayed', { count: dashboard.projets.enRetard }) })
    if (dashboard.planning.tachesEnRetard > 0) a.push({ type: 'danger', text: t('db.alerts.tasksDelayed', { count: dashboard.planning.tachesEnRetard }) })
    if (dashboard.materiel.materiauxStockBas > 0) a.push({ type: 'warning', text: t('db.alerts.materialsLow', { count: dashboard.materiel.materiauxStockBas }) })
    return a
  }, [dashboard, t])

  const radialData = useMemo(() => {
    if (!dashboard) return []
    return [
      { name: t('db.radial.budget'), value: Math.min(dashboard.budget.tauxConsommation, 100), fill: C.accent },
      { name: t('db.radial.progress'), value: Math.min(dashboard.planning.tauxAvancement, 100), fill: C.secondary },
    ]
  }, [dashboard, t])

  // Above-the-fold = immediate, below = fade-in on scroll
  const fade1 = useFadeIn(true)
  const fade2 = useFadeIn(true)
  const fade3 = useFadeIn(true)
  const fade4 = useFadeIn()
  const fade5 = useFadeIn()
  const fade6 = useFadeIn()
  const fade7 = useFadeIn()

  /* ── Loading skeleton ── */
  if (loading && !dashboard) {
    return (
      <PageContainer size="full" className="bg-gray-50/80 dark:bg-gray-900/80">
        <div className="p-6 space-y-6 animate-pulse">
          <div className="h-28 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl" />)}</div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 h-80 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
            <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
          </div>
        </div>
      </PageContainer>
    )
  }
  if (!dashboard) return null

  const d = dashboard
  const totalProj = d.projets.total
  const montantTotalProjets = d.projets.montantTotal
  const avancementMoyenProjets = d.projets.avancementMoyen

  const projectsChartData = (() => {
    const bars = [
      { name: t('db.pie.inProgress'), value: d.projets.enCours, fill: C.green },
      { name: t('db.pie.completed'), value: d.projets.termines, fill: C.teal },
      { name: t('db.pie.delayed'), value: d.projets.enRetard, fill: C.accent },
    ].filter(i => i.value > 0)
    return bars.length ? bars : [{ name: '—', value: 1, fill: C.gray }]
  })()

  const budgetDonut = [
    { name: t('db.charts.consumed'), value: d.budget.depensesTotales, color: C.accent },
    { name: t('db.charts.remaining'), value: Math.max(0, Number(d.budget.budgetTotalPrevu) - Number(d.budget.depensesTotales)), color: '#E2E8F0' },
  ]
  const weeklyChartData: (WeekSummary & { displayLabel: string })[] = (d.weeklyProgress?.weeks ?? []).map(w => ({
    ...w, displayLabel: w.isCurrent ? `${w.label} ★` : w.label,
  }))
  const equipDonut = [
    { name: t('db.charts.available'), value: d.materiel.enginsDisponibles, color: C.green },
    { name: t('db.charts.inUse'), value: d.materiel.enginsTotal - d.materiel.enginsDisponibles, color: C.blue },
  ]
  const budgetHBar = [
    { name: t('db.budgetDetail.planned'), value: Number(d.budget.budgetTotalPrevu), fill: C.secondary },
    { name: t('db.budgetDetail.spent'), value: Number(d.budget.depensesTotales), fill: C.accent },
  ]
  const budgetAccent = d.budget.tauxConsommation > 90 ? C.red : d.budget.tauxConsommation > 70 ? C.gold : C.green

  return (
    <PageContainer size="full" className="w-full pb-10 space-y-0 bg-gray-50/80 dark:bg-transparent">
      <CacheTimestampBanner lastFetched={lastFetched} />

      {/* ═══════════════════════════════════════════════════════════
          HERO HEADER
      ═══════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl shadow-2xl mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary-dark via-secondary to-[#1a3a4a]" />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="pointer-events-none absolute -right-20 -top-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-teal-400/10 blur-3xl" />

        <div className="relative z-10 px-6 sm:px-10 py-8 sm:py-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <div className="w-1 h-9 rounded-full bg-gradient-to-b from-primary to-primary-light" />
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {t('db.header')}
                </h1>
              </div>
              <p className="text-white/70 text-sm ml-4 font-medium">{t('db.subtitle')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {notificationsNonLuesCount > 0 && user?.inAppNotificationsEnabled !== false && (
                <button onClick={() => navigate('/notifications')}
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2.5 rounded-xl hover:bg-white/20 transition text-xs font-semibold text-white shadow-lg">
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                  {t('dashboard.notificationsUnread', { count: notificationsNonLuesCount })}
                </button>
              )}
              <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-2.5 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-sm font-bold shadow-md">
                  {greetingInfo.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-white text-sm font-semibold">{t(greetingInfo.key, { name: greetingInfo.name })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ ALERTS ═══ */}
      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {alerts.map((a, i) => (
            <span key={i} className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border shadow-sm
              ${a.type === 'danger' ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-300'
              : a.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700/50 text-amber-700 dark:text-amber-300'
              : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700/50 text-blue-700 dark:text-blue-300'}`}>
              <span className={`w-2 h-2 rounded-full shrink-0 ${a.type === 'danger' ? 'bg-red-500' : a.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
              {a.text}
            </span>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          ROW 1 — 4 KPI CARDS (premium glassmorphism)
      ═══════════════════════════════════════════════════════════ */}
      <div ref={fade1.ref} className={fade1.className}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard accent={C.accent} label={t('db.kpi.totalProjects')} value={totalProj}
            sub={`${d.projets.enCours} ${t('db.kpi.active')} · ${d.projets.enRetard} ${t('db.kpi.delayed')}`}
            progress={d.projets.enCours / Math.max(totalProj, 1) * 100}
            onClick={() => navigate('/projets')}
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>} />
          <KpiCard accent={C.secondary} label={t('db.kpi.globalProgress')} value={`${d.planning.tauxAvancement}%`}
            sub={`${d.planning.tachesTerminees}/${d.planning.tachesTotal} ${t('db.kpi.tasks')}`}
            progress={d.planning.tauxAvancement}
            onClick={() => navigate('/planning')}
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>} />
          <KpiCard accent={budgetAccent} label={t('db.kpi.budgetConsumed')} value={`${d.budget.tauxConsommation}%`}
            sub={`${fmtS(d.budget.depensesTotales)} / ${fmtS(d.budget.budgetTotalPrevu)}`}
            progress={d.budget.tauxConsommation}
            onClick={() => navigate('/budget')}
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
          <KpiCard accent={C.blue} label={t('db.kpi.equipment')} value={d.materiel.enginsTotal}
            sub={`${d.materiel.enginsDisponibles} ${t('db.kpi.available')} · ${d.materiel.materiauxStockBas} ${t('db.kpi.lowStock')}`}
            progress={d.materiel.enginsTotal > 0 ? (d.materiel.enginsDisponibles / d.materiel.enginsTotal) * 100 : 0}
            onClick={() => navigate('/engins')}
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.07-.504 1.07-1.125V14.25M3.375 14.25h17.25" /></svg>} />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          ROW 2 — VUE D'ENSEMBLE (3 charts)
      ═══════════════════════════════════════════════════════════ */}
      <div ref={fade2.ref} className={fade2.className}>
        <SectionTitle title={t('db.projectsOverview.title')} action={{ label: t('db.seeAll'), onClick: () => navigate('/projets') }} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          {/* Donut statuts */}
          <Card title={t('db.pie.title')} subtitle={`${totalProj} ${t('db.kpi.totalProjects')}`}>
            <div className="relative">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <defs>
                    {projectsChartData.filter(e => e.name !== '—').map((e, i) => (
                      <linearGradient key={i} id={`projGrad-${i}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={e.fill} stopOpacity={1} />
                        <stop offset="100%" stopColor={e.fill} stopOpacity={0.7} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie data={projectsChartData} cx="50%" cy="50%" innerRadius="42%" outerRadius="68%"
                    paddingAngle={4} dataKey="value" startAngle={90} endAngle={-270}>
                    {projectsChartData.map((e, i) => (
                      <Cell key={i} fill={e.name === '—' ? e.fill : `url(#projGrad-${i})`} stroke="rgba(255,255,255,0.6)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-3xl font-extrabold text-gray-800 dark:text-gray-100 tabular-nums leading-none">{totalProj}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">total</p>
              </div>
            </div>
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

          {/* Montant total */}
          <Card title={t('db.kpi.totalAmount')} subtitle={`${totalProj} ${t('db.kpi.totalProjects')}`}>
            <div className="h-[220px] flex flex-col justify-between gap-4">
              <div className="flex-1 flex flex-col items-center justify-center">
                <p className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-50 tabular-nums tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                  {fmtS(montantTotalProjets)}
                </p>
                <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">XAF HT</p>
              </div>
              <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                {pieData.map(e => {
                  const pct = Math.round((e.value / Math.max(totalProj, 1)) * 100)
                  return (
                    <div key={e.name} className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: e.color }} />
                      <span className="flex-1 text-gray-500 dark:text-gray-400 truncate">{e.name}</span>
                      <div className="w-20 sm:w-28 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: e.color }} />
                      </div>
                      <span className="font-semibold text-gray-700 dark:text-gray-200 w-8 text-right">{e.value}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>

          {/* Avancement moyen */}
          <Card title={t('db.kpi.avgProgress')} subtitle={t('db.projects.progress')}>
            <div className="h-[220px] flex flex-col">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={[{ name: t('db.kpi.avgProgress'), value: Math.min(avancementMoyenProjets, 100), rest: 100 - Math.min(avancementMoyenProjets, 100) }]}
                  margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
                  <defs>
                    <linearGradient id="gAvancement" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor={C.accent} stopOpacity={0.7} />
                      <stop offset="100%" stopColor={C.accent} stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="#e5e7eb" strokeOpacity={0.6} />
                  <XAxis dataKey="name" hide />
                  <YAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={30} tickFormatter={v => `${v}%`} />
                  <Tooltip content={<CustomTooltip formatter={(v: number) => `${v}%`} />} />
                  <Bar dataKey="value" fill="url(#gAvancement)" radius={[8, 8, 0, 0]} maxBarSize={90} />
                  <Bar dataKey="rest" fill="#f1f5f9" radius={[8, 8, 0, 0]} maxBarSize={90} stackId="s" />
                </BarChart>
              </ResponsiveContainer>
              <div className="text-center pt-3 border-t border-gray-100 dark:border-gray-700">
                <span className="text-3xl font-extrabold tabular-nums" style={{ color: C.accent }}>{avancementMoyenProjets}%</span>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-0.5">{t('db.radial.progress')}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          ROW 3 — TOP PROJETS + RADIAL GAUGE
      ═══════════════════════════════════════════════════════════ */}
      <div ref={fade3.ref} className={fade3.className}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
          <Card className="lg:col-span-2" title={t('db.topProjets.title')} subtitle={t('db.topProjets.subtitle')}>
            {topProjets.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={topProjets} layout="vertical" margin={{ top: 4, right: 40, left: 10, bottom: 4 }}>
                  <defs>
                    <linearGradient id="gTopProj" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={C.secondary} stopOpacity={0.8} />
                      <stop offset="100%" stopColor={C.accent} stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" tickFormatter={v => fmtS(v)} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip formatter={fmt} />} />
                  <Bar dataKey="montant" name={t('db.topProjets.amount')} fill="url(#gTopProj)" radius={[0, 8, 8, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[320px] flex items-center justify-center text-sm text-gray-400">{t('db.projects.empty')}</div>
            )}
          </Card>

          <Card title={t('db.radial.title')} subtitle={t('db.radial.subtitle')}>
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart cx="50%" cy="55%" innerRadius="25%" outerRadius="90%" barSize={18} data={radialData} startAngle={180} endAngle={0}>
                <defs>
                  {radialData.map((r, i) => (
                    <linearGradient key={i} id={`radGrad-${i}`} x1="1" y1="0" x2="0" y2="0">
                      <stop offset="0%" stopColor={r.fill} stopOpacity={1} />
                      <stop offset="100%" stopColor={r.fill} stopOpacity={0.5} />
                    </linearGradient>
                  ))}
                </defs>
                <RadialBar background={{ fill: '#f1f5f9' }} dataKey="value" cornerRadius={10}
                  label={{ position: 'insideStart', fill: '#fff', fontSize: 10, fontWeight: 700 }}>
                  {radialData.map((_, i) => <Cell key={i} fill={`url(#radGrad-${i})`} />)}
                </RadialBar>
                <Tooltip content={<CustomTooltip formatter={(v: number) => `${v}%`} />} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-3 mt-2 pt-3 border-t border-gray-100 dark:border-gray-700">
              {radialData.map((r) => (
                <div key={r.name} className="flex items-center gap-2.5 p-2.5 rounded-xl" style={{ background: `${r.fill}08` }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm" style={{ background: `${r.fill}15` }}>
                    <span className="text-sm font-extrabold" style={{ color: r.fill }}>{r.value}%</span>
                  </div>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400 font-semibold leading-tight">{r.name}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          ROW 4 — BUDGET + WEEKLY + STATUT BREAKDOWN
      ═══════════════════════════════════════════════════════════ */}
      <div ref={fade4.ref} className={fade4.className}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {/* Budget donut */}
          <Card title={t('db.charts.budgetTitle')} subtitle={`${d.budget.tauxConsommation}% ${t('db.charts.consumed')}`}>
            <div className="relative">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <defs>
                    <linearGradient id="gBudCons" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={C.accent} stopOpacity={1} />
                      <stop offset="100%" stopColor={C.rose} stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                  <Pie data={budgetDonut} cx="50%" cy="50%" innerRadius={44} outerRadius={66} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
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

          {/* Weekly progress */}
          <Card title={t('db.weekly.title')} subtitle={t('db.weekly.subtitle', { week: d.weeklyProgress?.semaineActuelle ?? '' })}>
            {weeklyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <ComposedChart data={weeklyChartData} margin={{ top: 8, right: 8, left: -12, bottom: 4 }}>
                  <defs>
                    <linearGradient id="gWkDone" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.green} /><stop offset="100%" stopColor={C.green} stopOpacity={0.7} /></linearGradient>
                    <linearGradient id="gWkProg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.blue} /><stop offset="100%" stopColor={C.blue} stopOpacity={0.7} /></linearGradient>
                    <linearGradient id="gWkTodo" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.gold} stopOpacity={0.9} /><stop offset="100%" stopColor={C.gold} stopOpacity={0.5} /></linearGradient>
                    <linearGradient id="gWkLine" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.accent} stopOpacity={0.25} /><stop offset="100%" stopColor={C.accent} stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="displayLabel" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={24} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={28} tickFormatter={v => `${v}%`} />
                  <Tooltip content={<WeeklyTooltip t={t} />} />
                  <Legend iconType="circle" iconSize={7} formatter={(v: string) => <span style={{ fontSize: 9, color: '#64748b' }}>{v}</span>} />
                  <Bar yAxisId="left" dataKey="terminees" name={t('db.weekly.done')} stackId="stack" fill="url(#gWkDone)" barSize={16} />
                  <Bar yAxisId="left" dataKey="enCours" name={t('db.weekly.inProgress')} stackId="stack" fill="url(#gWkProg)" barSize={16} />
                  <Bar yAxisId="left" dataKey="nonCommencees" name={t('db.weekly.notStarted')} stackId="stack" fill="url(#gWkTodo)" radius={[4, 4, 0, 0]} barSize={16} />
                  <Area yAxisId="right" type="monotone" dataKey="avancementMoyen" name={t('db.weekly.avgProgress')}
                    stroke={C.accent} strokeWidth={2.5} fill="url(#gWkLine)" dot={{ r: 3, fill: C.accent, strokeWidth: 0 }} activeDot={{ r: 5, fill: C.accent, stroke: '#fff', strokeWidth: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-xs text-gray-400">{t('db.weekly.empty')}</div>
            )}
          </Card>

          {/* Status breakdown bars */}
          <Card title={t('db.charts.statusBreakdown')} subtitle={`${totalProj} ${t('db.kpi.totalProjects')}`}>
            <div className="space-y-3 py-2">
              {pieData.map(e => {
                const pct = Math.round((e.value / Math.max(totalProj, 1)) * 100)
                return (
                  <div key={e.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-3 h-3 rounded-md shrink-0 shadow-sm" style={{ background: e.color }} />
                        <span className="text-gray-600 dark:text-gray-300 truncate font-medium">{e.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-extrabold text-gray-800 dark:text-gray-100 tabular-nums">{e.value}</span>
                        <span className="text-gray-400 dark:text-gray-500 tabular-nums w-9 text-right text-[10px]">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: e.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          ROW 5 — PROJETS ACTIFS TABLE (pleine largeur)
      ═══════════════════════════════════════════════════════════ */}
      <div ref={fade5.ref} className={fade5.className}>
        <Card className="mb-8" title={t('db.projects.title')}
          action={<button onClick={() => navigate('/projets')} className="text-xs font-semibold text-primary hover:underline">{t('db.seeAll')} →</button>}>
          {activeProjects.length ? (
            <>
              <div className="sm:hidden space-y-2">
                {activeProjects.map(p => {
                  const pct = p.avancementGlobal ?? 0
                  const barColor = pct >= 75 ? C.green : pct >= 40 ? C.blue : C.gold
                  return (
                    <div key={p.id} onClick={() => navigate(`/projets/${p.id}`)}
                      className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:bg-gray-50/70 dark:hover:bg-gray-700/20 cursor-pointer transition-all hover:shadow-sm">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs line-clamp-1">{p.nom}</span>
                          {p.clientNom && <span className="block text-[10px] text-gray-400 mt-0.5">{p.clientNom}</span>}
                        </div>
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap shrink-0">{p.montantHT ? fmtS(p.montantHT) : '—'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: barColor }} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 w-8 text-right tabular-nums">{pct}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="overflow-x-auto -mx-1 hidden sm:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-gray-100 dark:border-gray-700">
                      {[t('db.projects.name'), t('db.projects.amount'), t('db.projects.progress'), t('db.projects.manager')].map((h, i) => (
                        <th key={i} className={`pb-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 ${i === 1 ? 'text-right' : ''} ${i === 2 ? 'pl-4 w-36' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>{activeProjects.map(p => <ProjRow key={p.id} p={p} fmtS={fmtS} nav={navigate} />)}</tbody>
                </table>
              </div>
            </>
          ) : <p className="text-sm text-gray-400 text-center py-8">{t('db.projects.empty')}</p>}
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          ROW 6 — EQUIPMENT + BUDGET BREAKDOWN
      ═══════════════════════════════════════════════════════════ */}
      <div ref={fade6.ref} className={fade6.className}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <Card title={t('db.equipment.title')} subtitle={`${d.materiel.enginsTotal} ${t('db.charts.units')}`}>
            <div className="relative">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <defs>
                    <linearGradient id="gEquipAvail" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={C.green} stopOpacity={1} />
                      <stop offset="100%" stopColor={C.teal} stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                  <Pie data={equipDonut} cx="50%" cy="50%" innerRadius={44} outerRadius={66} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
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
            <div className="flex gap-4 justify-center text-xs mt-2">
              {equipDonut.map(e => (
                <div key={e.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ background: e.color }} />
                  <span className="text-gray-500 dark:text-gray-400">{e.name}</span>
                  <span className="font-bold text-gray-700 dark:text-gray-200">{e.value}</span>
                </div>
              ))}
            </div>
            {d.materiel.materiauxStockBas > 0 && (
              <div className="mt-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 rounded-xl px-3 py-2 text-[11px] text-amber-700 dark:text-amber-300 text-center font-medium">
                {t('db.alerts.materialsLow', { count: d.materiel.materiauxStockBas })}
              </div>
            )}
          </Card>

          <Card title={t('db.charts.budgetBreakdown')} subtitle={t('db.charts.plannedVsSpent')}>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={budgetHBar} layout="vertical" margin={{ top: 8, right: 20, left: 0, bottom: 8 }}>
                <defs>
                  <linearGradient id="gBHPlan" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={C.secondary} stopOpacity={0.8} /><stop offset="100%" stopColor={C.secondary} /></linearGradient>
                  <linearGradient id="gBHSpent" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={C.accent} stopOpacity={0.8} /><stop offset="100%" stopColor={C.accent} /></linearGradient>
                </defs>
                <XAxis type="number" tickFormatter={v => fmtS(v)} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip formatter={fmt} />} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={22}>
                  <Cell fill="url(#gBHPlan)" />
                  <Cell fill="url(#gBHSpent)" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-between items-center text-xs mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <span className="text-gray-500 dark:text-gray-400 font-medium">{t('db.budgetDetail.remaining')}</span>
              <span className={`font-extrabold text-lg tabular-nums ${Number(d.budget.ecart) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {fmt(Number(d.budget.ecart))}
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          ROW 7 — RAPPORT PROJET + METEO + QUICK ACCESS
      ═══════════════════════════════════════════════════════════ */}
      <div ref={fade7.ref} className={fade7.className}>
        <SectionTitle title={t('db.report.title')} />
        <Card className="mb-6" subtitle={t('db.report.subtitle')}>
          <div className="relative max-w-md">
            <select value={selectedProjetId ?? ''} onChange={e => setSelectedProjetId(e.target.value ? Number(e.target.value) : null)}
              className="w-full appearance-none rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2.5 pr-10 text-sm text-gray-900 dark:text-gray-100 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition shadow-sm cursor-pointer">
              <option value="">{t('db.report.choose')}</option>
              {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.755a.75.75 0 111.08 1.04l-4.25 4.3a.75.75 0 01-1.08 0l-4.25-4.3a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
            </div>
          </div>
        </Card>

        {projetReport && <ProjetReportBlock report={projetReport} fmt={fmt} fmtS={fmtS} t={t} />}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <MeteoWidget />
          <Card title={t('db.quickAccess')}>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {([
                { k: 'projets', p: '/projets', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg> },
                { k: 'planning', p: '/planning', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg> },
                { k: 'budget', p: '/budget', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
                { k: 'engins', p: '/engins', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.07-.504 1.07-1.125V14.25M3.375 14.25h17.25" /></svg> },
                { k: 'materiaux', p: '/materiaux', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg> },
                { k: 'messagerie', p: '/messagerie', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg> },
                { k: 'equipes', p: '/equipes', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg> },
                { k: 'documents', p: '/documents', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> },
              ] as const).map(x => (
                <button key={x.p} onClick={() => navigate(x.p)}
                  className="group flex flex-col items-center gap-1.5 px-1 py-3 bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600/50 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:border-primary-300 dark:hover:border-primary-700 hover:text-primary dark:hover:text-primary-400 hover:shadow-md transition-all duration-200">
                  <span className="group-hover:scale-110 transition-transform duration-200">{x.icon}</span>
                  <span className="text-[9px] leading-tight text-center font-semibold">{t(`db.shortcuts.${x.k}`)}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   ProjetReportBlock
═══════════════════════════════════════════════════════════════════ */
function ProjetReportBlock({ report, fmt, fmtS, t }: { report: ProjetReport; fmt: (v: number) => string; fmtS: (v: number) => string; t: (k: string) => string }) {
  const b = report.budget, p = report.planning
  const budgetBars = [
    { name: t('db.report.consumed'), value: Number(b.depensesTotales), fill: C.accent },
    { name: t('db.report.remaining'), value: Math.max(0, Number(b.budgetTotalPrevu) - Number(b.depensesTotales)), fill: C.gray },
  ]
  const taskDonut = [
    { name: t('db.planning.completed'), value: p.tachesTerminees, color: C.green },
    { name: t('db.planning.inProgress'), value: p.tachesEnCours, color: C.blue },
    { name: t('db.planning.overdue'), value: p.tachesEnRetard, color: C.red },
  ]
  return (
    <Card className="mb-6" title={report.projetNom} subtitle={`${t('db.report.status')}: ${STATUT_MAP[report.statut]?.label ?? report.statut}`}
      action={<div className="flex gap-2 flex-wrap"><Chip color="blue">{report.nbChantiers} {t('db.report.sites')}</Chip><Chip color="violet">{report.nbSousProjets} {t('db.report.subprojects')}</Chip></div>}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{t('db.budgetDetail.title')}</p>
            <Chip color={b.tauxConsommation > 90 ? 'red' : b.tauxConsommation > 70 ? 'amber' : 'green'}>{b.tauxConsommation}%</Chip>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart layout="vertical" data={budgetBars} margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
              <defs><linearGradient id="rBudC" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={C.accent} stopOpacity={0.8} /><stop offset="100%" stopColor={C.accent} /></linearGradient></defs>
              <XAxis type="number" tickFormatter={v => fmtS(v)} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip formatter={fmt} />} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}><Cell fill="url(#rBudC)" /><Cell fill={C.gray} opacity={0.5} /></Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-gray-400 mt-1">{t('db.budgetDetail.remaining')}: <span className={`font-bold ${Number(b.ecart) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(Number(b.ecart))}</span></p>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{t('db.planning.title')}</p>
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
      </div>
    </Card>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   Atomic components (premium)
═══════════════════════════════════════════════════════════════════ */
function Card({ title, subtitle, action, children, className = '' }: { title?: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-gray-100 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-lg transition-shadow duration-300 ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="min-w-0">
            {title && <h3 className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest truncate">{title}</h3>}
            {subtitle && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  )
}

function KpiCard({ accent, label, value, sub, progress, onClick, icon }: { accent: string; label: string; value: number | string; sub: string; progress?: number; onClick?: () => void; icon: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ borderTopColor: accent }}
      className="group relative overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700 border-t-[3px] bg-white dark:bg-gray-800 p-5 text-left hover:shadow-xl transition-all duration-300 w-full">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-tight">{label}</p>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `${accent}15`, color: accent }}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-50 mt-1.5 mb-0.5 tabular-nums tracking-tight group-hover:translate-x-0.5 transition-transform duration-200" style={{ letterSpacing: '-0.02em' }}>
        {value}
      </p>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-3">{sub}</p>
      {progress !== undefined && (
        <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(progress, 100)}%`, background: accent }} />
        </div>
      )}
      <div className="pointer-events-none absolute -right-8 -bottom-8 w-28 h-28 rounded-full opacity-[0.05] group-hover:opacity-[0.1] transition-opacity duration-300" style={{ background: accent }} />
    </button>
  )
}

function ProjRow({ p, fmtS, nav }: { p: ProjetSummary; fmtS: (v: number) => string; nav: (s: string) => void }) {
  const pct = p.avancementGlobal ?? 0
  const barColor = pct >= 75 ? C.green : pct >= 40 ? C.blue : C.gold
  return (
    <tr onClick={() => nav(`/projets/${p.id}`)}
      className="border-b border-gray-50 dark:border-gray-700/40 hover:bg-gray-50/70 dark:hover:bg-gray-700/20 cursor-pointer transition-colors duration-100 group">
      <td className="py-3 pr-3">
        <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs line-clamp-1 group-hover:text-primary transition-colors">{p.nom}</span>
        {p.clientNom && <span className="block text-[10px] text-gray-400 mt-0.5">{p.clientNom}</span>}
      </td>
      <td className="py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap pr-3">{p.montantHT ? fmtS(p.montantHT) : '—'}</td>
      <td className="py-3 pl-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: barColor }} />
          </div>
          <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 w-8 text-right tabular-nums">{pct}%</span>
        </div>
      </td>
      <td className="py-3 pl-2 text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">{p.responsableNom || '—'}</td>
    </tr>
  )
}

function SectionTitle({ title, action }: { title: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className="w-1 h-5 rounded-full bg-gradient-to-b from-primary to-primary-light" />
        <h2 className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">{title}</h2>
      </div>
      {action && <button onClick={action.onClick} className="text-xs font-semibold text-primary hover:underline">{action.label} →</button>}
    </div>
  )
}

function Chip({ children, color }: { children: React.ReactNode; color: string }) {
  const map: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200',
    violet: 'bg-violet-50 dark:bg-violet-900/40 text-violet-700 dark:text-violet-200',
    green: 'bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-200',
    red: 'bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-200',
    amber: 'bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200',
    slate: 'bg-slate-50 dark:bg-slate-700/40 text-slate-600 dark:text-slate-300',
  }
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${map[color] ?? map.slate}`}>{children}</span>
}
