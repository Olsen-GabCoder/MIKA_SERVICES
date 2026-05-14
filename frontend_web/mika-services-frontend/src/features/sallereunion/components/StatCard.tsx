interface StatCardProps {
  label: string
  value: string
  sub?: string
  tone?: 'live' | 'closed' | 'warning' | null
  live?: boolean
  avatarNode?: React.ReactNode
}

export function StatCard({ label, value, sub, tone, live, avatarNode }: StatCardProps) {
  const valueClass =
    tone === 'live' ? 'text-emerald-600 dark:text-emerald-400'
    : tone === 'closed' ? 'text-rose-500 dark:text-rose-400'
    : tone === 'warning' ? 'text-amber-600 dark:text-amber-400'
    : 'text-neutral-900 dark:text-white'

  return (
    <div className="rounded-2xl bg-white dark:bg-neutral-900/70 p-5 sm:p-6 border border-neutral-100 dark:border-neutral-800/60 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center gap-2.5 text-[13px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">
        {label}
        {live && (
          <span className="relative inline-block w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-emerald-500" />
            <span className="absolute inset-0 rounded-full salle-live-dot text-emerald-500" />
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center gap-3">
        {avatarNode}
        <div className={'text-[26px] sm:text-[28px] tracking-[-0.03em] font-bold tabular-nums ' + valueClass}>{value}</div>
      </div>
      {sub && <div className="text-[14px] text-neutral-500 dark:text-neutral-400 mt-1">{sub}</div>}
    </div>
  )
}
