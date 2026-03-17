import { useEffect, useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { auditApi, userApi } from '@/api/userApi'
import type { AuditLogEntry, AuditFilterOptions, PaginatedResponse, GlobalAuditStats } from '@/api/userApi'
import type { User } from '@/types'
import { useFormatDate } from '@/hooks/useFormatDate'

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

const TABS = [
  { key: 'all',      label: 'Tout' },
  { key: 'auth',     label: 'Connexions' },
  { key: 'nav',      label: 'Navigation' },
  { key: 'security', label: 'Sécurité' },
  { key: 'admin',    label: 'Administration' },
] as const
type TabKey = (typeof TABS)[number]['key']

const PAGE_SIZES = [15, 30, 50] as const

function getMeta(action: string) {
  return ACTION_META[action] ?? { icon: '•', color: 'gray', label: action, category: 'other' }
}

function badge(color: string) {
  const m: Record<string, string> = {
    green: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
    gray: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300',
  }
  return m[color] ?? m.gray
}

function dot(color: string) {
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
    case 'PASSWORD_CHANGE': return 'Par l\'utilisateur'
    case 'PASSWORD_RESET': return 'Par l\'administrateur'
    case '2FA_ENABLE': return 'TOTP configuré'
    case '2FA_DISABLE': return 'TOTP retiré'
    default: return detail || '—'
  }
}

function tabActions(cat: TabKey): string[] | null {
  if (cat === 'all') return null
  return Object.entries(ACTION_META).filter(([, m]) => m.category === cat).map(([k]) => k)
}

/** Format attendu yyyy-MM-dd (valeur native de <input type="date">). Évite d'envoyer des dates corrompues (ex. 0002, 0202). */
const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/
function toDateRangeISO(dateStr: string, endOfDay: boolean): string | null {
  if (!dateStr || !ISO_DATE_ONLY.test(dateStr)) return null
  const iso = endOfDay ? `${dateStr}T23:59:59.999` : `${dateStr}T00:00:00`
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

// ─── Component ────────────────────────────────────────────────
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
    userApi.getAll({ size: 200 }).then((r) => setUsers(r.content.map((u) => ({ id: u.id, nom: u.nom, prenom: u.prenom })))).catch(() => {})
  }, [])

  const effectiveActions = useMemo(() => {
    if (selectedAction) return selectedAction
    const ta = tabActions(activeTab)
    return ta ? ta.join(',') : ''
  }, [activeTab, selectedAction])

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const p: Record<string, string | number | undefined> = { page, size }
      if (selectedUserId) p.userId = Number(selectedUserId)
      if (effectiveActions) p.action = effectiveActions
      // Plage du jour en fuseau utilisateur → ISO UTC ; n'envoyer que si format yyyy-MM-dd (évite 0002, 0202, 502)
      const startIso = startDate ? toDateRangeISO(startDate, false) : null
      const endIso = endDate ? toDateRangeISO(endDate, true) : null
      if (startIso) p.startDate = startIso
      if (endIso) p.endDate = endIso
      const res: PaginatedResponse<AuditLogEntry> = await auditApi.getGlobalLogs(p as Parameters<typeof auditApi.getGlobalLogs>[0])
      setLogs(res.content)
      setTotalPages(res.totalPages)
      setTotalElements(res.totalElements)
    } catch {
      setLogs([])
      setLoadError(true)
    }
    finally { setLoading(false) }
  }, [page, size, selectedUserId, effectiveActions, startDate, endDate])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const reset = () => { setSelectedUserId(''); setSelectedAction(''); setStartDate(''); setEndDate(''); setActiveTab('all'); setPage(0) }
  const hasFilters = selectedUserId || selectedAction || startDate || endDate || activeTab !== 'all'

  const changePct = stats && stats.eventsYesterday > 0
    ? Math.round(((stats.eventsToday - stats.eventsYesterday) / stats.eventsYesterday) * 100) : null

  const sel = 'h-8 px-2.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary/50 outline-none'

  const from = page * size + 1
  const to = Math.min((page + 1) * size, totalElements)

  return (
    <PageContainer size="full" className="bg-gray-50/80 dark:bg-gray-900/80">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            {t('user:activity.title')}
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" /></span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('user:activity.subtitle')}</p>
        </div>
        <button onClick={() => { auditApi.getGlobalStats().then(setStats).catch(() => {}); fetchLogs() }}
          className="h-8 px-3 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          ↻ {t('user:activity.refresh')}
        </button>
      </div>

      {/* KPI */}
      {stats && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 mb-5">
          <Kpi v={stats.eventsToday} l={t('user:activity.kpi.eventsToday')} c="primary" pct={changePct} />
          <Kpi v={stats.loginsToday} l={t('user:activity.kpi.loginsToday')} c="green" />
          <Kpi v={stats.logoutsToday} l={t('user:activity.kpi.logoutsToday')} c="gray" />
          <Kpi v={stats.uniqueUsersToday} l={t('user:activity.kpi.uniqueUsers')} c="blue" />
          <Kpi v={stats.pageViewsToday} l={t('user:activity.kpi.pageViews')} c="purple" />
          <Kpi v={stats.securityEventsToday} l={t('user:activity.kpi.securityEvents')} c="orange" />
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        {/* Left */}
        <div className="xl:col-span-3 space-y-3">
          {/* Tabs + filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 p-2">
            <div className="flex gap-1 mb-2 overflow-x-auto">
              {TABS.map((tab) => (
                <button key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setSelectedAction(''); setPage(0) }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                    activeTab === tab.key ? 'bg-primary text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}>{tab.label}</button>
              ))}
            </div>
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
              {hasFilters && <button onClick={reset} className="text-xs text-red-500 hover:underline">✕ Reset</button>}
              <span className="ml-auto text-[11px] text-gray-400">{totalElements.toLocaleString()} {t('user:activity.results')}</span>
            </div>
          </div>

          {/* Log list */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 border-t-primary rounded-full animate-spin" /></div>
            ) : loadError ? (
              <div className="py-12 text-center text-sm text-amber-600 dark:text-amber-400">{t('user:activity.loadError')}</div>
            ) : logs.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">{t('user:activity.noLogs')}</div>
            ) : (
              <>
                {/* Table header */}
                <div className="hidden sm:grid grid-cols-[minmax(0,2fr)_100px_minmax(0,2.5fr)_90px_80px] gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700">
                  <span>{t('user:detail.columns.user')}</span>
                  <span>{t('user:detail.columns.action')}</span>
                  <span>{t('user:detail.columns.details')}</span>
                  <span>{t('user:detail.columns.ip')}</span>
                  <span className="text-right">{t('user:detail.columns.date')}</span>
                </div>

                {/* Rows */}
                <div className="divide-y divide-gray-50 dark:divide-gray-700/30">
                  {logs.map((log) => {
                    const meta = getMeta(log.action)
                    const isExpanded = expandedId === log.id
                    return (
                      <div key={log.id}>
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : log.id)}
                          className="w-full text-left sm:grid grid-cols-[minmax(0,2fr)_100px_minmax(0,2.5fr)_90px_80px] gap-2 items-center px-4 py-2 hover:bg-gray-50/80 dark:hover:bg-gray-700/20 transition-colors"
                        >
                          {/* User */}
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot(meta.color)}`} />
                            {log.userId ? (
                              <span onClick={(e) => { e.stopPropagation(); navigate(`/users/${log.userId}`) }}
                                className="text-sm text-gray-800 dark:text-gray-200 font-medium truncate hover:text-primary cursor-pointer">
                                {log.userName || `#${log.userId}`}
                              </span>
                            ) : <span className="text-sm text-gray-400">Système</span>}
                          </div>
                          {/* Action badge */}
                          <span className={`inline-flex items-center gap-1 w-fit px-1.5 py-0.5 text-[11px] font-semibold rounded ${badge(meta.color)}`}>
                            {meta.icon} {meta.label}
                          </span>
                          {/* Description */}
                          <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{shortDesc(log)}</span>
                          {/* IP */}
                          <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono truncate">{log.ipAddress || '—'}</span>
                          {/* Time */}
                          <span className="text-[11px] text-gray-400 dark:text-gray-500 text-right whitespace-nowrap" title={formatDate(log.createdAt, { includeTime: true })}>
                            {relTime(log.createdAt)}
                          </span>
                        </button>

                        {/* Expanded */}
                        {isExpanded && (
                          <div className="px-4 pb-3 pt-1">
                            <div className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-lg text-xs grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 border border-gray-200 dark:border-gray-700">
                              <div><span className="text-gray-400">{t('user:activity.detail.date')}</span><p className="text-gray-700 dark:text-gray-300 font-medium">{formatDate(log.createdAt, { includeTime: true })}</p></div>
                              <div><span className="text-gray-400">{t('user:activity.detail.user')}</span><p className="text-gray-700 dark:text-gray-300 font-medium">{log.userName || '—'}</p></div>
                              <div><span className="text-gray-400">{t('user:activity.detail.ip')}</span><p className="text-gray-700 dark:text-gray-300 font-mono">{log.ipAddress || '—'}</p></div>
                              <div><span className="text-gray-400">{t('user:activity.detail.module')}</span><p className="text-gray-700 dark:text-gray-300">{log.module}</p></div>
                              {log.details && (
                                <div className="col-span-2 sm:col-span-4"><span className="text-gray-400">{t('user:activity.detail.rawDetails')}</span><p className="text-gray-600 dark:text-gray-400 break-all mt-0.5">{log.details}</p></div>
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

            {/* Pagination bar */}
            {totalPages > 0 && !loading && logs.length > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/10 text-xs">
                <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                  <span>{from}–{to} / {totalElements.toLocaleString()}</span>
                  <select value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(0) }}
                    className="h-7 px-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none">
                    {PAGE_SIZES.map((s) => <option key={s} value={s}>{s} / page</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <PgBtn disabled={page === 0} onClick={() => setPage(0)}>««</PgBtn>
                  <PgBtn disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹</PgBtn>
                  {paginate(page, totalPages).map((p, i) =>
                    p === -1
                      ? <span key={`e${i}`} className="px-1 text-gray-400">…</span>
                      : <PgBtn key={p} active={p === page} onClick={() => setPage(p)}>{p + 1}</PgBtn>
                  )}
                  <PgBtn disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>›</PgBtn>
                  <PgBtn disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>»»</PgBtn>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {stats && stats.recentOnlineUsers.length > 0 && (
            <Side title={t('user:activity.sidebar.onlineUsers')} icon="●" ic="text-green-500">
              {stats.recentOnlineUsers.map((u) => (
                <button key={u.userId} onClick={() => navigate(`/users/${u.userId}`)}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors text-left">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">{u.userName.charAt(0)}</div>
                    <span className="text-xs text-gray-800 dark:text-gray-200 truncate">{u.userName}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0 ml-2">{relTime(u.lastSeen)}</span>
                </button>
              ))}
            </Side>
          )}

          {stats && stats.topPages.length > 0 && (
            <Side title={t('user:activity.sidebar.topPages')} icon="◉" ic="text-purple-500">
              {stats.topPages.map((p, i) => {
                const pct = stats.topPages[0].count > 0 ? (p.count / stats.topPages[0].count) * 100 : 0
                return (
                  <div key={i} className="px-3 py-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{p.label}</span>
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 ml-2 shrink-0">{p.count}</span>
                    </div>
                    <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500/70 dark:bg-purple-400/70 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </Side>
          )}

          {stats && stats.topUsers.length > 0 && (
            <Side title={t('user:activity.sidebar.topUsers')} icon="⚡" ic="text-amber-500">
              {stats.topUsers.map((u, i) => (
                <button key={u.userId} onClick={() => navigate(`/users/${u.userId}`)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors text-left">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                    i === 0 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                    : i === 1 ? 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                    : i === 2 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                  }`}>{i + 1}</span>
                  <span className="text-xs text-gray-800 dark:text-gray-200 truncate flex-1">{u.userName}</span>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 shrink-0">{u.count}</span>
                </button>
              ))}
            </Side>
          )}

          {stats && Object.keys(stats.actionBreakdown).length > 0 && (
            <Side title={t('user:activity.sidebar.todayBreakdown')} icon="≡" ic="text-blue-500">
              <div className="flex flex-wrap gap-1 px-3 pb-1">
                {Object.entries(stats.actionBreakdown).sort(([, a], [, b]) => b - a).map(([action, count]) => {
                  const m = getMeta(action)
                  return <span key={action} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded ${badge(m.color)}`}>{m.label} <b>{count}</b></span>
                })}
              </div>
            </Side>
          )}
        </div>
      </div>
    </PageContainer>
  )
}

// ─── Small components ─────────────────────────────────────────
function Kpi({ v, l, c, pct }: { v: number; l: string; c: string; pct?: number | null }) {
  const cm: Record<string, string> = {
    primary: 'text-primary', green: 'text-green-600 dark:text-green-400', gray: 'text-gray-500 dark:text-gray-400',
    blue: 'text-blue-600 dark:text-blue-400', purple: 'text-purple-600 dark:text-purple-400', orange: 'text-orange-600 dark:text-orange-400',
  }
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
      <div className="flex items-end justify-between">
        <span className={`text-xl font-bold ${cm[c] ?? cm.primary}`}>{v.toLocaleString()}</span>
        {pct != null && <span className={`text-[10px] font-semibold ${pct >= 0 ? 'text-green-600' : 'text-red-500'}`}>{pct >= 0 ? '↑' : '↓'}{Math.abs(pct)}%</span>}
      </div>
      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{l}</p>
    </div>
  )
}

function Side({ title, icon, ic, children }: { title: string; icon: string; ic: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600">
      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 flex items-center gap-1.5">
        <span className={`text-xs ${ic}`}>{icon}</span>
        <h3 className="text-xs font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
      </div>
      <div className="py-1.5">{children}</div>
    </div>
  )
}

function PgBtn({ children, active, disabled, onClick }: { children: React.ReactNode; active?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button disabled={disabled} onClick={onClick}
      className={`min-w-[28px] h-7 px-1.5 text-[11px] font-medium rounded transition-all ${
        active ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30'
      }`}>{children}</button>
  )
}

function paginate(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)
  if (current <= 2) return [0, 1, 2, 3, -1, total - 1]
  if (current >= total - 3) return [0, -1, total - 4, total - 3, total - 2, total - 1]
  return [0, -1, current - 1, current, current + 1, -1, total - 1]
}
