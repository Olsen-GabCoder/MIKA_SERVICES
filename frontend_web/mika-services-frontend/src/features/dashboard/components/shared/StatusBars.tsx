export interface StatusBarItem {
  label: string
  value: number
  color: string
}

export interface StatusBarsProps {
  data: StatusBarItem[]
  /** If provided, percentages are computed as value/total. Otherwise, sum of values is used. */
  total?: number
  showPercentage?: boolean
  /** Height of each bar in px */
  height?: number
}

export function StatusBars({
  data,
  total: totalOverride,
  showPercentage = true,
  height = 8,
}: StatusBarsProps) {
  const computedTotal = totalOverride ?? data.reduce((s, d) => s + d.value, 0)
  const safeTotal = Math.max(computedTotal, 1)

  if (data.length === 0) {
    return (
      <p className="text-xs text-[var(--db-text-faint)] text-center py-4">
        Aucune donnee
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const pct = Math.round((item.value / safeTotal) * 100)
        return (
          <div key={item.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-3 h-3 rounded-md shrink-0 shadow-sm"
                  style={{ background: item.color }}
                />
                <span className="text-[var(--db-text-muted)] truncate font-medium">
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="db-display-num text-sm text-[var(--db-text-primary)]">
                  {item.value}
                </span>
                {showPercentage && (
                  <span className="text-[var(--db-text-faint)] text-[10px] w-9 text-right">
                    {pct}%
                  </span>
                )}
              </div>
            </div>
            <div
              className="w-full rounded-full bg-[var(--db-border-subtle)] overflow-hidden"
              style={{ height: `${height}px` }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: item.color }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
