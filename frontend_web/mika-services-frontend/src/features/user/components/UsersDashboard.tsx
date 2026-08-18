import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { userApi, type UserStats } from '@/api/userApi'
import { Loading } from '@/components/ui/Loading'

const PALETTE = ['#FF6B35', '#2E5266', '#48B5A0', '#8B5CF6', '#17A2B8', '#F4A261', '#6BBF59', '#E63946']

const cardClass =
  'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm'

const initials = (prenom: string, nom: string) =>
  `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase()

interface Props {
  onNavigateTab: (tab: string) => void
}

export const UsersDashboard = ({ onNavigateTab }: Props) => {
  const { t, i18n } = useTranslation(['user', 'common'])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    userApi
      .getStats()
      .then((s) => { if (!cancelled) setStats(s) })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [])

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 text-sm">
        {t('user:org.dash.error')}
      </div>
    )
  }
  if (!stats) return <Loading />

  const statusColors: Record<string, string> = {
    ACTIF: '#6BBF59',
    INACTIF: '#94A3B8',
    VERROUILLE: '#E63946',
  }
  const statusLabel = (label: string) =>
    t(`user:org.dash.status.${label.toLowerCase()}`, { defaultValue: label })

  // Donut conic-gradient (statut ACTIF/INACTIF ; les verrouillés sont un sous-ensemble affiché en légende)
  const donutSegments = stats.parStatut.filter((s) => s.label !== 'VERROUILLE')
  const donutTotal = donutSegments.reduce((acc, s) => acc + s.count, 0) || 1
  let acc = 0
  const gradientParts = donutSegments.map((s) => {
    const from = (acc / donutTotal) * 360
    acc += s.count
    const to = (acc / donutTotal) * 360
    return `${statusColors[s.label] ?? '#94A3B8'} ${from}deg ${to}deg`
  })

  const maxDept = Math.max(1, ...stats.parDepartement.map((d) => d.count))
  const maxRole = Math.max(1, ...stats.parRole.map((r) => r.count))

  const kpis = [
    { label: t('user:org.dash.kpi.total'), value: stats.total, sub: t('user:org.dash.kpi.totalSub'), dot: '#2E5266' },
    { label: t('user:org.dash.kpi.actifs'), value: stats.actifs, sub: t('user:org.dash.kpi.actifsSub'), dot: '#6BBF59' },
    { label: t('user:org.dash.kpi.inactifs'), value: stats.inactifs, sub: t('user:org.dash.kpi.inactifsSub'), dot: '#94A3B8' },
    { label: t('user:org.dash.kpi.verrouilles'), value: stats.verrouilles, sub: t('user:org.dash.kpi.verrouillesSub'), dot: '#E63946' },
    { label: t('user:org.dash.kpi.embauches'), value: stats.embauches90Jours, sub: t('user:org.dash.kpi.embauchesSub'), dot: '#FF6B35' },
  ]

  const alerts = [
    {
      show: stats.sansRole > 0,
      icon: '⚠',
      color: '#F4A261',
      title: t('user:org.dash.alerts.sansRole', { count: stats.sansRole }),
      sub: t('user:org.dash.alerts.sansRoleSub'),
      cta: t('user:org.dash.alerts.see'),
      onClick: () => onNavigateTab('directory'),
    },
    {
      show: stats.departementsSansResponsable.length > 0,
      icon: '◆',
      color: '#17A2B8',
      title: t('user:org.dash.alerts.deptNoResp', { count: stats.departementsSansResponsable.length }),
      sub: stats.departementsSansResponsable.join(' · '),
      cta: t('user:org.dash.alerts.see'),
      onClick: () => onNavigateTab('departments'),
    },
    {
      show: stats.verrouilles > 0,
      icon: '🔒',
      color: '#E63946',
      title: t('user:org.dash.alerts.locked', { count: stats.verrouilles }),
      sub: t('user:org.dash.alerts.lockedSub'),
      cta: t('user:org.dash.alerts.see'),
      onClick: () => onNavigateTab('directory'),
    },
  ].filter((a) => a.show)

  const quickLinks = [
    { key: 'directory', label: t('user:org.tabs.directory'), dot: '#FF6B35' },
    { key: 'orgchart', label: t('user:org.tabs.orgchart'), dot: '#2E5266' },
    { key: 'roles', label: t('user:org.tabs.roles'), dot: '#8B5CF6' },
    { key: 'teams', label: t('user:org.tabs.teams'), dot: '#48B5A0' },
  ]

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString(i18n.language === 'en' ? 'en-GB' : 'fr-FR') : '—'

  return (
    <div className="flex flex-col gap-4">
      {/* Bandeau KPI */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 flex flex-col gap-4 bg-gradient-to-r from-[#EAF0F4] via-[#FFF0E9] to-[#EAF0F4] dark:from-[#1B2C3C] dark:via-[#33241C] dark:to-[#1B2C3C]">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
            {t('user:org.dash.title')}
          </h2>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {t('user:org.dash.subtitle', { date: new Date().toLocaleDateString(i18n.language === 'en' ? 'en-GB' : 'fr-FR') })}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="rounded-lg border border-gray-200/70 dark:border-gray-600/60 bg-white/70 dark:bg-gray-800/60 backdrop-blur p-3 flex flex-col gap-1.5 transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: k.dot }} />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{k.label}</span>
              </div>
              <div className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tabular-nums">{k.value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{k.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Alertes */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {alerts.map((a) => (
            <div key={a.title} className="flex items-center gap-3 rounded-xl border p-3.5 bg-white dark:bg-gray-800" style={{ borderColor: a.color }}>
              <span className="text-lg" style={{ color: a.color }}>{a.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{a.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{a.sub}</div>
              </div>
              <button
                type="button"
                onClick={a.onClick}
                className="shrink-0 h-8 px-3 rounded-md border text-xs font-semibold cursor-pointer bg-transparent"
                style={{ borderColor: a.color, color: a.color }}
              >
                {a.cta}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">
        <div className="flex flex-col gap-4">
          {/* Effectifs par département */}
          <div className={cardClass}>
            <div className="text-base font-extrabold text-gray-900 dark:text-gray-100">{t('user:org.dash.deptTitle')}</div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 mb-3.5">
              {t('user:org.dash.deptSubtitle', { count: stats.parDepartement.length })}
            </div>
            <div className="flex flex-col gap-2.5">
              {stats.parDepartement.map((d, i) => (
                <div key={d.label} className="grid grid-cols-[130px_1fr_60px] sm:grid-cols-[150px_1fr_60px] gap-3 items-center">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{d.label}</span>
                  </div>
                  <div className="h-[9px] rounded-md bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <div
                      className="h-full rounded-md"
                      style={{ width: `${(d.count / maxDept) * 100}%`, background: PALETTE[i % PALETTE.length] }}
                    />
                  </div>
                  <div className="text-sm font-extrabold text-gray-900 dark:text-gray-100 tabular-nums text-right">
                    {d.count} <span className="font-medium text-gray-400 text-xs">{t('user:org.dash.persons')}</span>
                  </div>
                </div>
              ))}
              {stats.parDepartement.length === 0 && (
                <div className="text-xs text-gray-400">{t('user:org.dash.noData')}</div>
              )}
            </div>
          </div>

          {/* Embauches récentes */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3.5 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2.5">
              <span className="text-base font-extrabold text-gray-900 dark:text-gray-100">{t('user:org.dash.hiresTitle')}</span>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-0.5">
                {t('user:org.dash.hires90')}
              </span>
            </div>
            {stats.embauchesRecentes.length === 0 && (
              <div className="px-4 py-4 text-xs text-gray-400">{t('user:org.dash.noHires')}</div>
            )}
            {stats.embauchesRecentes.map((h, i) => (
              <div
                key={h.id}
                className="grid grid-cols-[36px_1fr_110px] sm:grid-cols-[36px_1fr_150px_130px_100px] gap-3 items-center px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-extrabold text-white"
                  style={{ background: PALETTE[i % PALETTE.length] }}
                >
                  {initials(h.prenom, h.nom)}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{h.prenom} {h.nom}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{h.matricule}</div>
                </div>
                <div className="hidden sm:block text-sm text-gray-500 dark:text-gray-400 truncate">{h.role ?? '—'}</div>
                <div className="hidden sm:block">
                  {h.departement && (
                    <span className="text-xs font-semibold text-[#2E5266] dark:text-[#9FBFD4] bg-[#EAF0F4] dark:bg-[#1B2C3C] rounded-md px-2 py-0.5">
                      {h.departement}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 tabular-nums text-right sm:text-left">{formatDate(h.dateEmbauche)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Donut statut */}
          <div className={cardClass}>
            <div className="text-base font-extrabold text-gray-900 dark:text-gray-100 mb-3.5">{t('user:org.dash.statusTitle')}</div>
            <div className="flex items-center gap-4">
              <div className="relative w-32 h-32 min-w-32">
                <div className="w-full h-full rounded-full" style={{ background: `conic-gradient(${gradientParts.join(', ')})` }} />
                <div className="absolute inset-[31px] rounded-full bg-white dark:bg-gray-800 flex flex-col items-center justify-center">
                  <div className="text-2xl font-extrabold leading-none tabular-nums text-gray-900 dark:text-gray-100">{stats.total}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-1">{t('user:org.dash.accounts')}</div>
                </div>
              </div>
              <div className="flex flex-col gap-2 flex-1">
                {stats.parStatut.map((s) => (
                  <div key={s.label} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: statusColors[s.label] ?? '#94A3B8' }} />
                    <span className="text-sm font-semibold flex-1 text-gray-900 dark:text-gray-100">{statusLabel(s.label)}</span>
                    <span className="text-sm font-extrabold tabular-nums text-gray-900 dark:text-gray-100">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Répartition par rôle */}
          <div className={cardClass}>
            <div className="text-base font-extrabold text-gray-900 dark:text-gray-100 mb-3.5">{t('user:org.dash.roleTitle')}</div>
            <div className="flex flex-col gap-2">
              {stats.parRole.map((r, i) => (
                <div key={r.label} className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 w-[140px] truncate">{r.label}</span>
                  <div className="flex-1 h-2 rounded bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <div className="h-full rounded" style={{ width: `${(r.count / maxRole) * 100}%`, background: PALETTE[i % PALETTE.length] }} />
                  </div>
                  <span className="text-sm font-extrabold tabular-nums text-gray-900 dark:text-gray-100 w-6 text-right">{r.count}</span>
                </div>
              ))}
              {stats.parRole.length === 0 && <div className="text-xs text-gray-400">{t('user:org.dash.noData')}</div>}
            </div>
          </div>

          {/* Accès rapides */}
          <div className={cardClass}>
            <div className="text-base font-extrabold text-gray-900 dark:text-gray-100 mb-3">{t('user:org.dash.quickTitle')}</div>
            <div className="grid grid-cols-2 gap-2">
              {quickLinks.map((q) => (
                <button
                  key={q.key}
                  type="button"
                  onClick={() => onNavigateTab(q.key)}
                  className="border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-left cursor-pointer flex flex-col gap-1.5 hover:border-[#FF6B35] transition-colors"
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: q.dot }} />
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{q.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
