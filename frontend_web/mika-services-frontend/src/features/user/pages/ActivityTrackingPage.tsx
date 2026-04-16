import { useEffect, useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { auditApi, userApi } from '@/api/userApi'
import type { AuditLogEntry, AuditFilterOptions, GlobalAuditStats } from '@/api/userApi'
import type { User } from '@/types'
import { useFormatDate } from '@/hooks/useFormatDate'

// ─── Metadata ─────────────────────────────────────────────────
const ACTION_META: Record<string, { icon: string; color: string; label: string; category: string }> = {
  LOGIN:            { icon: '→',  color: 'green',   label: 'Connexion',        category: 'auth' },
  FIRST_LOGIN:      { icon: '★',  color: 'emerald', label: '1re connexion',    category: 'auth' },
  LOGOUT:           { icon: '←',  color: 'gray',    label: 'Déconnexion',      category: 'auth' },
  PAGE_VIEW:        { icon: '◉',  color: 'purple',  label: 'Navigation',       category: 'nav' },
  CREATE:           { icon: '+',  color: 'blue',    label: 'Création',         category: 'admin' },
  UPDATE:           { icon: '✎',  color: 'amber',   label: 'Modification',     category: 'admin' },
  DELETE:           { icon: '✕',  color: 'red',     label: 'Suppression',      category: 'admin' },
  ACTIVATE:         { icon: '✓',  color: 'emerald', label: 'Activation',       category: 'admin' },
  DEACTIVATE:       { icon: '⊘',  color: 'red',     label: 'Désactivation',    category: 'admin' },
  PASSWORD_CHANGE:  { icon: '⚿',  color: 'orange',  label: 'Mdp modifié',      category: 'security' },
  PASSWORD_RESET:   { icon: '↻',  color: 'orange',  label: 'Mdp réinitialisé', category: 'security' },
  '2FA_ENABLE':     { icon: '⊕',  color: 'indigo',  label: '2FA activée',      category: 'security' },
  '2FA_DISABLE':    { icon: '⊖',  color: 'red',     label: '2FA désactivée',   category: 'security' },
}

const CATEGORY_META: Record<string, { label: string; gradient: string; bar: string; text: string; dot: string }> = {
  auth:     { label: 'Connexions',     gradient: 'from-emerald-500 to-green-400',   bar: 'from-emerald-500 to-green-400',   text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  nav:      { label: 'Navigation',     gradient: 'from-violet-500 to-purple-400',   bar: 'from-violet-500 to-purple-400',   text: 'text-violet-600 dark:text-violet-400',  dot: 'bg-violet-500'  },
  security: { label: 'Sécurité',       gradient: 'from-orange-500 to-amber-400',    bar: 'from-orange-500 to-amber-400',    text: 'text-orange-600 dark:text-orange-400', dot: 'bg-orange-500'  },
  admin:    { label: 'Administration', gradient: 'from-blue-500 to-sky-400',        bar: 'from-blue-500 to-sky-400',        text: 'text-blue-600 dark:text-blue-400',     dot: 'bg-blue-500'    },
}

const KPI_CONFIG = [
  { key: 'eventsToday',       label: 'Événements',      color: 'indigo',  icon: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z' },
  { key: 'loginsToday',       label: 'Connexions',       color: 'emerald', icon: 'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9' },
  { key: 'logoutsToday',      label: 'Déconnexions',     color: 'slate',   icon: 'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75' },
  { key: 'uniqueUsersToday',  label: 'Utilisateurs',     color: 'blue',    icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z' },
  { key: 'pageViewsToday',    label: 'Pages vues',       color: 'violet',  icon: 'M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  { key: 'securityEventsToday', label: 'Sécurité',       color: 'rose',    icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z' },
]

const COLOR_MAP: Record<string, {
  gradient: string; softBg: string; text: string; bar: string
  ring: string; iconBg: string; pctPos: string; pctNeg: string
}> = {
  indigo:  { gradient: 'from-indigo-500 via-purple-500 to-indigo-600',  softBg: 'bg-indigo-50 dark:bg-indigo-900/20',  text: 'text-indigo-600 dark:text-indigo-400',  bar: 'from-indigo-500 to-purple-400',   ring: 'ring-indigo-200 dark:ring-indigo-800',  iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',  pctPos: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',   pctNeg: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
  emerald: { gradient: 'from-emerald-500 via-green-500 to-teal-500',    softBg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', bar: 'from-emerald-500 to-teal-400',    ring: 'ring-emerald-200 dark:ring-emerald-800', iconBg: 'bg-emerald-100 dark:bg-emerald-900/40', pctPos: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',   pctNeg: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
  slate:   { gradient: 'from-slate-500 via-gray-500 to-slate-600',      softBg: 'bg-slate-50 dark:bg-slate-900/20',    text: 'text-slate-600 dark:text-slate-400',    bar: 'from-slate-400 to-gray-400',      ring: 'ring-slate-200 dark:ring-slate-700',    iconBg: 'bg-slate-100 dark:bg-slate-800',       pctPos: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',   pctNeg: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
  blue:    { gradient: 'from-blue-500 via-sky-500 to-blue-600',         softBg: 'bg-blue-50 dark:bg-blue-900/20',      text: 'text-blue-600 dark:text-blue-400',      bar: 'from-blue-500 to-sky-400',        ring: 'ring-blue-200 dark:ring-blue-800',      iconBg: 'bg-blue-100 dark:bg-blue-900/40',      pctPos: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',   pctNeg: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
  violet:  { gradient: 'from-violet-500 via-purple-500 to-violet-600',  softBg: 'bg-violet-50 dark:bg-violet-900/20',  text: 'text-violet-600 dark:text-violet-400',  bar: 'from-violet-500 to-purple-400',   ring: 'ring-violet-200 dark:ring-violet-800',  iconBg: 'bg-violet-100 dark:bg-violet-900/40',  pctPos: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',   pctNeg: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
  rose:    { gradient: 'from-rose-500 via-pink-500 to-rose-600',        softBg: 'bg-rose-50 dark:bg-rose-900/20',      text: 'text-rose-600 dark:text-rose-400',      bar: 'from-rose-500 to-pink-400',       ring: 'ring-rose-200 dark:ring-rose-800',      iconBg: 'bg-rose-100 dark:bg-rose-900/40',      pctPos: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',   pctNeg: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
}

const TABS = [
  { key: 'all',      label: 'Tout' },
  { key: 'auth',     label: 'Connexions' },
  { key: 'nav',      label: 'Navigation' },
  { key: 'security', label: 'Sécurité' },
  { key: 'admin',    label: 'Administration' },
] as const
type TabKey = (typeof TABS)[number]['key']
const PAGE_SIZES = [15, 30, 50] as const

function getMeta(action: string) { return ACTION_META[action] ?? { icon: '•', color: 'gray', label: action, category: 'other' } }

function badgeCls(color: string) {
  const m: Record<string, string> = {
    green:   'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
    gray:    'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
    purple:  'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
    blue:    'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    amber:   'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
    red:     'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
    orange:  'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
    indigo:  'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300',
  }
  return m[color] ?? m.gray
}

function dotCls(color: string) {
  const m: Record<string, string> = {
    green: 'bg-green-500', emerald: 'bg-emerald-500', gray: 'bg-gray-400',
    purple: 'bg-purple-500', blue: 'bg-blue-500', amber: 'bg-amber-500',
    red: 'bg-red-500', orange: 'bg-orange-500', indigo: 'bg-indigo-500',
  }
  return m[color] ?? 'bg-gray-400'
}

function relTime(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 1) return "à l'instant"
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}j`
}

function shortDesc(log: AuditLogEntry): string {
  const detail = log.details?.replace(/\s*\|.*$/, '') || ''
  switch (log.action) {
    case 'PAGE_VIEW': return detail || 'Page inconnue'
    case 'LOGIN': case 'FIRST_LOGIN': return detail || 'Connexion'
    case 'LOGOUT': return detail || 'Déconnexion'
    case 'CREATE': return 'Nouveau compte'
    case 'UPDATE': return 'Profil mis à jour'
    case 'DELETE': return 'Compte supprimé'
    case 'ACTIVATE': return 'Compte activé'
    case 'DEACTIVATE': return 'Compte désactivé'
    case 'PASSWORD_CHANGE': return "Par l'utilisateur"
    case 'PASSWORD_RESET': return "Par l'administrateur"
    case '2FA_ENABLE': return 'TOTP configuré'
    case '2FA_DISABLE': return 'TOTP retiré'
    default: return detail || '—'
  }
}

function tabActions(cat: TabKey): string[] | null {
  if (cat === 'all') return null
  return Object.entries(ACTION_META).filter(([, m]) => m.category === cat).map(([k]) => k)
}

const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/
function toDateRangeISO(dateStr: string, endOfDay: boolean): string | null {
  if (!dateStr || !ISO_DATE_ONLY.test(dateStr)) return null
  const iso = endOfDay ? `${dateStr}T23:59:59.999` : `${dateStr}T00:00:00`
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

function pctChange(today: number, yesterday: number): number | null {
  if (yesterday === 0) return today > 0 ? 100 : null
  return Math.round(((today - yesterday) / yesterday) * 100)
}

// ─── Page ─────────────────────────────────────────────────────
export const ActivityTrackingPage = () => {
  const { t } = useTranslation(['user', 'common'])
  const navigate = useNavigate()
  const formatDate = useFormatDate()

  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [page, setPage] = useState(0)
  const [size, setSize] = useState<number>(15)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<boolean | null>(null)
  const [stats, setStats] = useState<GlobalAuditStats | null>(null)
  const [totalUsers, setTotalUsers] = useState(0)
  const [filterOptions, setFilterOptions] = useState<AuditFilterOptions>({ modules: [], actions: [] })
  const [users, setUsers] = useState<Pick<User, 'id' | 'nom' | 'prenom'>[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedAction, setSelectedAction] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    auditApi.getFilterOptions().then(setFilterOptions).catch(() => {})
    auditApi.getGlobalStats().then(setStats).catch(() => {})
    userApi.getAll({ size: 200 }).then((r) => {
      setUsers(r.content.map((u) => ({ id: u.id, nom: u.nom, prenom: u.prenom })))
      setTotalUsers(r.totalElements ?? r.content.length)
    }).catch(() => {})
  }, [])

  const effectiveActions = useMemo(() => {
    if (selectedAction) return selectedAction
    const ta = tabActions(activeTab)
    return ta ? ta.join(',') : ''
  }, [activeTab, selectedAction])

  const fetchLogs = useCallback(async () => {
    setLoading(true); setLoadError(null)
    try {
      if (selectedUserId) {
        const res = await userApi.getAuditLogs(Number(selectedUserId), page, size)
        setLogs(res.content ?? []); setTotalPages(res.totalPages ?? 0); setTotalElements(res.totalElements ?? 0)
      } else {
        const p: Record<string, string | number | undefined> = { page, size }
        if (effectiveActions) p.action = effectiveActions
        const s = startDate ? toDateRangeISO(startDate, false) : null
        const e = endDate ? toDateRangeISO(endDate, true) : null
        if (s) p.startDate = s
        if (e) p.endDate = e
        const res = await auditApi.getGlobalLogs(p as Parameters<typeof auditApi.getGlobalLogs>[0])
        setLogs(res.content ?? []); setTotalPages(res.totalPages ?? 0); setTotalElements(res.totalElements ?? 0)
      }
    } catch { setLogs([]); setLoadError(true) }
    finally { setLoading(false) }
  }, [page, size, selectedUserId, effectiveActions, startDate, endDate])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const reset = () => { setSelectedUserId(''); setSelectedAction(''); setStartDate(''); setEndDate(''); setActiveTab('all'); setPage(0) }
  const hasFilters = selectedUserId || selectedAction || startDate || endDate || activeTab !== 'all'

  const sel = 'h-8 px-2.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary/40 outline-none transition'

  const totalToday = stats?.eventsToday ?? 0
  const totalYesterday = stats?.eventsYesterday ?? 0

  const categoryBreakdown = useMemo(() => {
    if (!stats?.actionBreakdown) return []
    const catMap: Record<string, number> = {}
    Object.entries(stats.actionBreakdown).forEach(([action, count]) => {
      const cat = ACTION_META[action]?.category ?? 'other'
      catMap[cat] = (catMap[cat] ?? 0) + count
    })
    const total = Object.values(catMap).reduce((a, b) => a + b, 0)
    return Object.entries(catMap)
      .map(([cat, count]) => ({ cat, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }))
      .sort((a, b) => b.count - a.count)
  }, [stats])

  const actionBreakdown = useMemo(() => {
    if (!stats?.actionBreakdown) return []
    const total = Object.values(stats.actionBreakdown).reduce((a, b) => a + b, 0)
    return Object.entries(stats.actionBreakdown)
      .map(([action, count]) => ({ action, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }))
      .sort((a, b) => b.count - a.count)
  }, [stats])

  const engagementPct = totalUsers > 0 && stats ? Math.min(100, Math.round((stats.uniqueUsersToday / totalUsers) * 100)) : 0

  const topPagesWithPct = useMemo(() => {
    if (!stats?.topPages?.length) return []
    const total = stats.topPages.reduce((a, p) => a + p.count, 0)
    const max = stats.topPages[0].count
    return stats.topPages.map((p) => ({
      ...p,
      barPct: max > 0 ? Math.round((p.count / max) * 100) : 0,
      trafficPct: total > 0 ? Math.round((p.count / total) * 100) : 0,
    }))
  }, [stats])

  const topUsersWithPct = useMemo(() => {
    if (!stats?.topUsers?.length) return []
    const total = stats.topUsers.reduce((a, u) => a + u.count, 0)
    const max = stats.topUsers[0].count
    return stats.topUsers.map((u) => ({
      ...u,
      barPct: max > 0 ? Math.round((u.count / max) * 100) : 0,
      activityPct: total > 0 ? Math.round((u.count / total) * 100) : 0,
    }))
  }, [stats])

  const from = page * size + 1
  const to = Math.min((page + 1) * size, totalElements)

  return (
    <PageContainer size="full" className="bg-gray-50 dark:bg-gray-950">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              {t('user:activity.title')}
            </h1>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('user:activity.subtitle')}</p>
        </div>
        <button
          onClick={() => { auditApi.getGlobalStats().then(setStats).catch(() => {}); fetchLogs() }}
          className="inline-flex items-center gap-1.5 h-9 px-4 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          {t('user:activity.refresh')}
        </button>
      </div>

      {/* ── KPI Cards ──────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
          {KPI_CONFIG.map((cfg, i) => {
            const value = (stats as unknown as Record<string, number>)[cfg.key] ?? 0
            const isFirst = i === 0
            const barOf = i === 0 ? undefined : i === 3 ? totalUsers : totalToday
            const changePct = isFirst ? pctChange(totalToday, totalYesterday) : null
            return (
              <KpiCard
                key={cfg.key}
                value={value}
                label={cfg.label}
                color={cfg.color}
                iconPath={cfg.icon}
                pct={changePct}
                barOf={barOf}
                hint={i === 3 && totalUsers > 0 ? `/ ${totalUsers} total` : isFirst ? `${totalYesterday} hier` : undefined}
                featured={isFirst}
              />
            )
          })}
        </div>
      )}

      {/* ── Analytics row ──────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">

          {/* Répartition des actions */}
          <div className="xl:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
            <SectionTitle icon="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z">
              Répartition des actions
            </SectionTitle>

            {/* Catégories */}
            <div className="space-y-3 mb-5">
              {categoryBreakdown.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Aucune activité aujourd'hui</p>
              ) : categoryBreakdown.map(({ cat, count, pct }) => {
                const m = CATEGORY_META[cat]
                if (!m) return null
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${m.dot}`} />
                        <span className={`text-sm font-medium ${m.text}`}>{m.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">{count.toLocaleString()} evt</span>
                        <span className={`text-sm font-bold w-10 text-right ${m.text}`}>{pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${m.bar} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Détail par action */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Détail par action</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {actionBreakdown.map(({ action, count, pct }) => {
                  const meta = getMeta(action)
                  return (
                    <div key={action} className="flex items-center gap-2.5 group">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotCls(meta.color)}`} />
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">{meta.label}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${dotCls(meta.color)} opacity-80`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 w-8 text-right">{pct}%</span>
                        <span className="text-[10px] text-gray-400 w-5 text-right">{count}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Engagement + En ligne */}
          <div className="space-y-4">
            {/* Engagement */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
              <SectionTitle icon="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z">
                Engagement
              </SectionTitle>

              {/* Gauge circulaire */}
              <div className="flex items-center justify-center my-3">
                <div className="relative">
                  <CircularGauge pct={engagementPct} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-gray-900 dark:text-white">{engagementPct}%</span>
                    <span className="text-[10px] text-gray-400 font-medium">actifs</span>
                  </div>
                </div>
              </div>
              <p className="text-center text-xs text-gray-400 mb-4">
                <span className="font-semibold text-gray-700 dark:text-gray-300">{stats.uniqueUsersToday}</span> utilisateurs sur <span className="font-semibold text-gray-700 dark:text-gray-300">{totalUsers}</span>
              </p>

              {/* Mini-stats 2x2 */}
              <div className="grid grid-cols-2 gap-2">
                <MiniStat label="Connexions" value={totalToday > 0 ? Math.round((stats.loginsToday / totalToday) * 100) : 0} gradient="from-emerald-500 to-teal-400" />
                <MiniStat label="Navigation" value={totalToday > 0 ? Math.round((stats.pageViewsToday / totalToday) * 100) : 0} gradient="from-violet-500 to-purple-400" />
                <MiniStat label="Sécurité"   value={totalToday > 0 ? Math.round((stats.securityEventsToday / totalToday) * 100) : 0} gradient="from-orange-500 to-amber-400" />
                <MiniStat label="vs hier"
                  value={Math.abs(pctChange(totalToday, totalYesterday) ?? 0)}
                  gradient={totalToday >= totalYesterday ? 'from-emerald-500 to-teal-400' : 'from-rose-500 to-pink-400'}
                  prefix={totalToday >= totalYesterday ? '+' : '−'}
                />
              </div>
            </div>

            {/* Récemment actifs */}
            {stats.recentOnlineUsers.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
                <SectionTitle icon="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z">
                  Récemment actifs
                  <span className="ml-auto relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                </SectionTitle>
                <div className="space-y-1 mt-1">
                  {stats.recentOnlineUsers.slice(0, 5).map((u) => (
                    <button key={u.userId} onClick={() => navigate(`/users/${u.userId}`)}
                      className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/70 to-primary flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                        {u.userName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">{u.userName}</span>
                      <span className="text-[11px] text-gray-400 shrink-0">{relTime(u.lastSeen)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Top pages + Top users ──────────────────────── */}
      {stats && (topPagesWithPct.length > 0 || topUsersWithPct.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">

          {topPagesWithPct.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
              <SectionTitle icon="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z">
                Pages les plus visitées
                <span className="ml-auto text-[10px] text-gray-400 font-normal">7 derniers jours</span>
              </SectionTitle>
              <div className="space-y-3.5 mt-2">
                {topPagesWithPct.map((p, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-[11px] font-black w-5 shrink-0 ${i === 0 ? 'text-violet-500' : 'text-gray-400'}`}>#{i + 1}</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{p.label}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-xs text-gray-400">{p.count}</span>
                        <span className={`text-sm font-bold w-10 text-right ${i === 0 ? 'text-violet-600 dark:text-violet-400' : 'text-gray-600 dark:text-gray-400'}`}>{p.trafficPct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full transition-all duration-700"
                        style={{ width: `${p.barPct}%`, opacity: 1 - i * 0.08 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {topUsersWithPct.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
              <SectionTitle icon="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605">
                Utilisateurs les plus actifs
                <span className="ml-auto text-[10px] text-gray-400 font-normal">7 derniers jours</span>
              </SectionTitle>
              <div className="space-y-3.5 mt-2">
                {topUsersWithPct.map((u, i) => (
                  <div key={u.userId}>
                    <div className="flex items-center justify-between mb-1">
                      <button onClick={() => navigate(`/users/${u.userId}`)} className="flex items-center gap-2 min-w-0 hover:text-primary transition-colors">
                        <span className={`text-[11px] font-black w-5 shrink-0 text-left ${i === 0 ? 'text-amber-500' : 'text-gray-400'}`}>#{i + 1}</span>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 bg-gradient-to-br ${
                          i === 0 ? 'from-amber-400 to-orange-500' : i === 1 ? 'from-slate-400 to-slate-500' : i === 2 ? 'from-orange-400 to-amber-600' : 'from-gray-400 to-gray-500'
                        }`}>{u.userName.charAt(0)}</div>
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{u.userName}</span>
                      </button>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-xs text-gray-400">{u.count}</span>
                        <span className={`text-sm font-bold w-10 text-right ${i === 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400'}`}>{u.activityPct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${
                          i === 0 ? 'from-amber-400 to-orange-400' : i === 1 ? 'from-slate-400 to-gray-400' : i === 2 ? 'from-orange-400 to-amber-500' : 'from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500'
                        }`}
                        style={{ width: `${u.barPct}%`, opacity: 1 - i * 0.08 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Journal des événements ─────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Journal des événements</span>
            {totalElements > 0 && <span className="ml-auto text-xs text-gray-400">{totalElements.toLocaleString()} entrées</span>}
          </div>
          {/* Tabs */}
          <div className="flex gap-1 mb-3 overflow-x-auto">
            {TABS.map((tab) => (
              <button key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSelectedAction(''); setPage(0) }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}>{tab.label}</button>
            ))}
          </div>
          {/* Filtres */}
          <div className="flex flex-wrap gap-2 items-center">
            <select value={selectedUserId} onChange={(e) => { setSelectedUserId(e.target.value); setPage(0) }} className={sel}>
              <option value="">{t('user:activity.filters.allUsers')}</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>)}
            </select>
            <select value={selectedAction} onChange={(e) => { setSelectedAction(e.target.value); setPage(0) }} className={sel}>
              <option value="">{t('user:activity.filters.allActions')}</option>
              {filterOptions.actions.map((a) => <option key={a} value={a}>{getMeta(a).label}</option>)}
            </select>
            <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(0) }} className={sel} />
            <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(0) }} className={sel} />
            {hasFilters && <button onClick={reset} className="text-xs text-rose-500 hover:underline">✕ Reset</button>}
          </div>
        </div>

        {/* Rows */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-gray-200 dark:border-gray-700 border-t-primary rounded-full animate-spin" />
          </div>
        ) : loadError ? (
          <div className="py-16 text-center text-sm text-amber-500">{t('user:activity.loadError')}</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">{t('user:activity.noLogs')}</div>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-[minmax(0,2fr)_110px_minmax(0,2.5fr)_90px_80px] gap-2 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 border-b border-gray-100 dark:border-gray-800">
              <span>{t('user:detail.columns.user')}</span>
              <span>{t('user:detail.columns.action')}</span>
              <span>{t('user:detail.columns.details')}</span>
              <span>{t('user:detail.columns.ip')}</span>
              <span className="text-right">{t('user:detail.columns.date')}</span>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {logs.map((log) => {
                const meta = getMeta(log.action)
                const isExpanded = expandedId === log.id
                return (
                  <div key={log.id}>
                    <button type="button" onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      className="w-full text-left sm:grid grid-cols-[minmax(0,2fr)_110px_minmax(0,2.5fr)_90px_80px] gap-2 items-center px-5 py-2.5 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${dotCls(meta.color)}`} />
                        {log.userId
                          ? <span onClick={(e) => { e.stopPropagation(); navigate(`/users/${log.userId}`) }}
                              className="text-sm text-gray-800 dark:text-gray-200 font-medium truncate hover:text-primary cursor-pointer">
                              {log.userName || `#${log.userId}`}
                            </span>
                          : <span className="text-sm text-gray-400 italic">Système</span>
                        }
                      </div>
                      <span className={`inline-flex items-center gap-1 w-fit px-2 py-0.5 text-[11px] font-semibold rounded-full ${badgeCls(meta.color)}`}>
                        {meta.icon} {meta.label}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{shortDesc(log)}</span>
                      <span className="text-[11px] text-gray-400 font-mono truncate">{log.ipAddress || '—'}</span>
                      <span className="text-[11px] text-gray-400 text-right whitespace-nowrap" title={formatDate(log.createdAt, { includeTime: true })}>
                        {relTime(log.createdAt)}
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="px-5 pb-3 pt-1">
                        <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl text-xs grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2.5 border border-gray-100 dark:border-gray-700">
                          <div><p className="text-gray-400 mb-0.5">{t('user:activity.detail.date')}</p><p className="text-gray-700 dark:text-gray-300 font-medium">{formatDate(log.createdAt, { includeTime: true })}</p></div>
                          <div><p className="text-gray-400 mb-0.5">{t('user:activity.detail.user')}</p><p className="text-gray-700 dark:text-gray-300 font-medium">{log.userName || '—'}</p></div>
                          <div><p className="text-gray-400 mb-0.5">{t('user:activity.detail.ip')}</p><p className="text-gray-700 dark:text-gray-300 font-mono">{log.ipAddress || '—'}</p></div>
                          <div><p className="text-gray-400 mb-0.5">{t('user:activity.detail.module')}</p><p className="text-gray-700 dark:text-gray-300">{log.module}</p></div>
                          {log.details && (
                            <div className="col-span-2 sm:col-span-4">
                              <p className="text-gray-400 mb-0.5">{t('user:activity.detail.rawDetails')}</p>
                              <p className="text-gray-600 dark:text-gray-400 break-all">{log.details}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 0 && !loading && logs.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800 text-xs">
            <div className="flex items-center gap-3 text-gray-500">
              <span>{from}–{to} / {totalElements.toLocaleString()}</span>
              <select value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(0) }}
                className="h-7 px-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 outline-none">
                {PAGE_SIZES.map((s) => <option key={s} value={s}>{s} / page</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <PgBtn disabled={page === 0} onClick={() => setPage(0)}>««</PgBtn>
              <PgBtn disabled={page === 0} onClick={() => setPage((p) => p - 1)}>‹</PgBtn>
              {paginate(page, totalPages).map((p, i) =>
                p === -1
                  ? <span key={`e${i}`} className="px-1 text-gray-400">…</span>
                  : <PgBtn key={p} active={p === page} onClick={() => setPage(p)}>{p + 1}</PgBtn>
              )}
              <PgBtn disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>›</PgBtn>
              <PgBtn disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>»»</PgBtn>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────
function KpiCard({ value, label, color, iconPath, pct, barOf, hint, featured }: {
  value: number; label: string; color: string; iconPath: string
  pct?: number | null; barOf?: number; hint?: string; featured?: boolean
}) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.indigo
  const barPct = barOf != null && barOf > 0 ? Math.min(100, Math.round((value / barOf) * 100)) : null

  if (featured) {
    return (
      <div className={`relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${c.gradient} shadow-lg col-span-1`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/30" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/20" />
        </div>
        <div className="relative">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
              </svg>
            </div>
            {pct != null && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white`}>
                {pct >= 0 ? '↑' : '↓'} {Math.abs(pct)}%
              </span>
            )}
          </div>
          <div className="text-3xl font-black text-white mb-0.5">{value.toLocaleString()}</div>
          <p className="text-xs text-white/70 font-medium">{label}</p>
          {hint && <p className="text-[10px] text-white/50 mt-1">{hint}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl ${c.iconBg} flex items-center justify-center`}>
          <svg className={`w-4.5 h-4.5 ${c.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
          </svg>
        </div>
        {pct != null && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${pct >= 0 ? c.pctPos : c.pctNeg}`}>
            {pct >= 0 ? '↑' : '↓'}{Math.abs(pct)}%
          </span>
        )}
      </div>
      <div className={`text-2xl font-black ${c.text} mb-0.5`}>{value.toLocaleString()}</div>
      <p className="text-xs text-gray-400 font-medium mb-2.5">{label}</p>
      {barPct !== null && (
        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div className={`h-full bg-gradient-to-r ${c.bar} rounded-full transition-all duration-700`} style={{ width: `${barPct}%` }} />
        </div>
      )}
      {hint && <p className="text-[10px] text-gray-400 mt-1.5">{hint}</p>}
    </div>
  )
}

// ─── Circular gauge SVG ───────────────────────────────────────
function CircularGauge({ pct }: { pct: number }) {
  const size = 96
  const strokeWidth = 8
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#f43f5e'
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-gray-100 dark:text-gray-800" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)' }} />
    </svg>
  )
}

// ─── Section title ────────────────────────────────────────────
function SectionTitle({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
      </svg>
      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 w-full">{children}</span>
    </div>
  )
}

// ─── Mini stat ────────────────────────────────────────────────
function MiniStat({ label, value, gradient, prefix = '' }: { label: string; value: number; gradient: string; prefix?: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5">
      <div className="flex items-end justify-between mb-1.5">
        <span className="text-[10px] text-gray-400 font-medium leading-tight">{label}</span>
        <span className="text-sm font-black text-gray-800 dark:text-gray-200">{prefix}{value}%</span>
      </div>
      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-700`} style={{ width: `${Math.min(100, Math.abs(value))}%` }} />
      </div>
    </div>
  )
}

// ─── Pagination button ────────────────────────────────────────
function PgBtn({ children, active, disabled, onClick }: { children: React.ReactNode; active?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button disabled={disabled} onClick={onClick}
      className={`min-w-[30px] h-7 px-1.5 text-[11px] font-medium rounded-lg transition-all ${
        active ? 'bg-primary text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30'
      }`}>{children}</button>
  )
}

function paginate(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)
  if (current <= 2) return [0, 1, 2, 3, -1, total - 1]
  if (current >= total - 3) return [0, -1, total - 4, total - 3, total - 2, total - 1]
  return [0, -1, current - 1, current, current + 1, -1, total - 1]
}
