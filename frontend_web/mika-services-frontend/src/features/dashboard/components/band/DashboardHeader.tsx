import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

export interface DashboardHeaderProps {
  greetingKey: string
  greetingName: string
  notificationsCount: number
  onNotificationsClick: () => void
}

export function DashboardHeader({
  greetingKey,
  greetingName,
  notificationsCount,
  onNotificationsClick,
}: DashboardHeaderProps) {
  const { t, i18n } = useTranslation('common')

  const dateStr = useMemo(() => {
    const locale = i18n.language === 'en' ? 'en-GB' : 'fr-FR'
    return new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(new Date())
  }, [i18n.language])

  return (
    <div className="flex items-center justify-between gap-4 pb-4 mb-6 border-b border-[var(--db-border-subtle)]">
      {/* Left — greeting + date */}
      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl font-bold text-[var(--db-text-primary)] truncate">
          {t(greetingKey, { name: greetingName })}
        </h1>
        <p className="text-xs text-[var(--db-text-muted)] mt-0.5 capitalize">
          {dateStr}
        </p>
      </div>

      {/* Right — notifications */}
      <button
        type="button"
        onClick={onNotificationsClick}
        aria-label={t('db.band.notifications.aria', { count: notificationsCount })}
        className={[
          'relative flex items-center justify-center w-11 h-11 rounded-xl shrink-0',
          'border border-[var(--db-border-default)] transition-all duration-200',
          'hover:shadow-md hover:border-[var(--db-accent)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--db-accent)] focus-visible:ring-offset-2',
          notificationsCount > 0
            ? 'bg-[var(--db-accent-muted)] text-[var(--db-accent)]'
            : 'bg-[var(--db-bg-surface)] text-[var(--db-text-muted)]',
        ].join(' ')}
      >
        {/* Bell icon (Heroicons outline) */}
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>

        {/* Badge */}
        {notificationsCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-[var(--db-danger-text)] text-white text-[9px] font-bold flex items-center justify-center px-1">
            {notificationsCount > 99 ? '99+' : notificationsCount}
          </span>
        )}
      </button>
    </div>
  )
}
