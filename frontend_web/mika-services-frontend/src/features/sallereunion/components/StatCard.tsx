interface StatCardProps {
  label: string
  value: string
  sub?: string
  tone?: 'live' | 'closed' | 'warning' | null
  live?: boolean
  avatarNode?: React.ReactNode
}

const TONE_STYLES = {
  live: {
    border: 'border-emerald-200/60 dark:border-emerald-500/20',
    bg: 'bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-500/[0.07] dark:to-neutral-900/70',
    icon: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    value: 'text-emerald-700 dark:text-emerald-400',
    dot: true,
  },
  closed: {
    border: 'border-neutral-200/60 dark:border-neutral-800/60',
    bg: 'bg-white dark:bg-neutral-900/70',
    icon: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500',
    value: 'text-neutral-600 dark:text-neutral-400',
    dot: false,
  },
  warning: {
    border: 'border-amber-200/60 dark:border-amber-500/20',
    bg: 'bg-gradient-to-br from-amber-50 to-white dark:from-amber-500/[0.07] dark:to-neutral-900/70',
    icon: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    value: 'text-amber-700 dark:text-amber-400',
    dot: true,
  },
} as const

export function StatCard({ label, value, sub, tone, live, avatarNode }: StatCardProps) {
  const s = TONE_STYLES[tone ?? 'closed']

  return (
    <div className={`rounded-2xl p-5 sm:p-6 border shadow-sm hover:shadow-md transition-shadow duration-200 ${s.border} ${s.bg}`}>
      <div className="flex items-start gap-4">
        {/* Icon / Avatar */}
        <div className={'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ' + s.icon}>
          {avatarNode || (
            tone === 'live' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49m11.31-2.82a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14"/></svg>
            ) : tone === 'warning' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M18.36 6.64A9 9 0 005.636 18.364M18.364 18.364A9 9 0 005.636 5.636"/><line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round"/></svg>
            )
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Label */}
          <div className="flex items-center gap-2 text-[12px] sm:text-[13px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">
            {label}
            {live && s.dot && (
              <span className="relative inline-block w-2 h-2">
                <span className="absolute inset-0 rounded-full bg-emerald-500" />
                <span className="absolute inset-0 rounded-full salle-live-dot text-emerald-500" />
              </span>
            )}
          </div>

          {/* Value */}
          <div className={'mt-1.5 text-[22px] sm:text-[26px] tracking-[-0.03em] font-bold tabular-nums leading-none ' + s.value}>
            {value}
          </div>

          {/* Sub */}
          {sub && <div className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-2">{sub}</div>}
        </div>
      </div>
    </div>
  )
}
