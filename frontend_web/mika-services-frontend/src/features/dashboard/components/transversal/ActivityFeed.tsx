import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BentoCard } from '../shared/BentoCard'
import { useIsAdmin } from '../../hooks/useIsAdmin'
import type { GlobalAuditStats } from '../../hooks/useAuditStats'

export interface ActivityFeedProps {
  data: GlobalAuditStats | null
  loading?: boolean
}

function StatBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <p className="db-display-num text-2xl text-[var(--db-text-primary)]">{value}</p>
      <p className="text-[9px] text-[var(--db-text-faint)] uppercase tracking-widest">{label}</p>
    </div>
  )
}

export function ActivityFeed({ data, loading = false }: ActivityFeedProps) {
  const { t } = useTranslation('common')
  const isAdmin = useIsAdmin()

  const minutesAgo = useMemo(() => (lastSeen: string) => {
    const diff = Date.now() - new Date(lastSeen).getTime()
    return Math.max(1, Math.floor(diff / 60_000))
  }, [])

  if (!isAdmin) return null

  return (
    <BentoCard
      title={t('db.transversal.activity')}
      subtitle={t('db.transversal.activitySubtitle')}
      href="/suivi-activite"
      loading={loading}
      colSpan={6}
      colSpanTablet={12}
      colSpanMobile={12}
    >
      {!data ? (
        <div className="py-8 text-center text-sm text-[var(--db-text-faint)]">
          {t('db.transversal.activityEmpty')}
        </div>
      ) : (
        <div className="max-h-[360px] overflow-y-auto space-y-4">
          {/* Top stats row */}
          <div className="grid grid-cols-3 gap-3 pb-3 border-b border-[var(--db-border-subtle)]">
            <StatBlock value={data.eventsToday} label={t('db.transversal.activityEventsToday')} />
            <StatBlock value={data.loginsToday} label={t('db.transversal.activityLoginsToday')} />
            <StatBlock value={data.uniqueUsersToday} label={t('db.transversal.activityUniqueUsersToday')} />
          </div>

          {/* Top users */}
          {data.topUsers.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[var(--db-text-faint)] uppercase tracking-widest mb-2">
                {t('db.transversal.activityTopUsers')}
              </p>
              <div className="space-y-1.5">
                {data.topUsers.slice(0, 5).map((u, i) => (
                  <div key={u.userId} className="flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-[var(--db-accent-muted)] text-[var(--db-accent)] flex items-center justify-center text-[9px] font-bold shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-[var(--db-text-muted)] truncate flex-1">{u.userName}</span>
                    <span className="text-[var(--db-text-faint)] shrink-0">
                      {t('db.transversal.activityActions', { count: u.count })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Online users */}
          {data.recentOnlineUsers.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[var(--db-text-faint)] uppercase tracking-widest mb-2">
                {t('db.transversal.activityOnlineUsers')}
              </p>
              <div className="space-y-1.5">
                {data.recentOnlineUsers.slice(0, 5).map(u => (
                  <div key={u.userId} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-[var(--db-success-text)] shrink-0" />
                    <span className="text-[var(--db-text-muted)] truncate flex-1">{u.userName}</span>
                    <span className="text-[var(--db-text-faint)] shrink-0">
                      {t('db.transversal.activityLastSeen', { minutes: minutesAgo(u.lastSeen) })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </BentoCard>
  )
}
