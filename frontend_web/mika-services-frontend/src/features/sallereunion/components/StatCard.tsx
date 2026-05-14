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
    : tone === 'closed' ? 'text-rose-500'
    : tone === 'warning' ? 'text-amber-500'
    : 'text-neutral-900 dark:text-white'

  return (
    <div className="rounded-xl bg-white dark:bg-neutral-900/70 p-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-medium">
        {label}
        {live && (
          <span className="relative inline-block w-1.5 h-1.5">
            <span className="absolute inset-0 rounded-full bg-emerald-500" />
            <span className="absolute inset-0 rounded-full salle-live-dot text-emerald-500" />
          </span>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        {avatarNode}
        <div className={'text-[24px] tracking-[-0.03em] font-semibold tabular-nums ' + valueClass}>{value}</div>
      </div>
      {sub && <div className="text-[11.5px] text-neutral-500 dark:text-neutral-400 mt-0.5">{sub}</div>}
    </div>
  )
}
