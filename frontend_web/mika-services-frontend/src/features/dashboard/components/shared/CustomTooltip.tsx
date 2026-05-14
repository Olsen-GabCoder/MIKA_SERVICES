import { useChartColors } from '../../hooks/useChartColors'

/* ── Shared tooltip for all dashboard recharts ── */

export interface DashboardTooltipProps {
  active?: boolean
  payload?: Array<{ color?: string; fill?: string; name?: string; value?: number | string; dataKey?: string }>
  label?: string | number
  /** Custom value formatter (ex: formatMontant) */
  formatter?: (value: number) => string
}

export function DashboardTooltip({
  active,
  payload,
  label,
  formatter,
}: DashboardTooltipProps) {
  const colors = useChartColors()

  if (!active || !payload?.length) return null

  return (
    <div
      className="rounded-xl border px-4 py-3 shadow-2xl text-xs min-w-[130px] backdrop-blur-sm"
      style={{
        background: colors.tooltipBg,
        borderColor: colors.tooltipBorder,
      }}
    >
      {label && (
        <p
          className="font-semibold mb-2 pb-1.5"
          style={{
            color: 'var(--db-text-primary)',
            borderBottom: `1px solid ${colors.tooltipBorder}`,
          }}
        >
          {label}
        </p>
      )}
      {payload.map((p: { color?: string; fill?: string; name?: string; value?: number | string }, i: number) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: (p.color || p.fill || colors.series[i % colors.series.length]) as string }}
          />
          <span style={{ color: 'var(--db-text-muted)' }}>
            {p.name ?? ''}
          </span>
          <span className="ml-auto font-bold" style={{ color: 'var(--db-text-primary)' }}>
            {formatter && typeof p.value === 'number'
              ? formatter(p.value)
              : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ── Weekly tooltip variant (with total row) ── */

export interface WeeklyTooltipData {
  isCurrent?: boolean
  total?: number
  [key: string]: unknown
}

export interface WeeklyTooltipProps {
  active?: boolean
  payload?: Array<{ color?: string; fill?: string; name?: string; value?: number | string; dataKey?: string; payload?: WeeklyTooltipData }>
  label?: string | number
  /** i18next translation function */
  t: (key: string) => string
}

export function WeeklyDashboardTooltip({
  active,
  payload,
  label,
  t,
}: WeeklyTooltipProps) {
  const colors = useChartColors()

  if (!active || !payload?.length) return null

  const data = payload[0]?.payload as WeeklyTooltipData | undefined

  return (
    <div
      className="rounded-xl border px-4 py-3 shadow-2xl text-xs min-w-[160px] backdrop-blur-sm"
      style={{
        background: colors.tooltipBg,
        borderColor: colors.tooltipBorder,
      }}
    >
      <p
        className="font-semibold mb-2 pb-1.5"
        style={{
          color: 'var(--db-text-primary)',
          borderBottom: `1px solid ${colors.tooltipBorder}`,
        }}
      >
        {data?.isCurrent ? `${label} — ${t('db.weekly.currentWeek')}` : label}
      </p>
      {payload.map((p: { color?: string; fill?: string; name?: string; value?: number | string; dataKey?: string }, i: number) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: (p.color || p.fill || colors.series[i % colors.series.length]) as string }}
          />
          <span style={{ color: 'var(--db-text-muted)' }}>{p.name}</span>
          <span className="ml-auto font-bold" style={{ color: 'var(--db-text-primary)' }}>
            {p.dataKey === 'avancementMoyen' ? `${p.value}%` : p.value}
          </span>
        </div>
      ))}
      {data?.total !== undefined && (
        <div
          className="mt-1.5 pt-1.5 flex justify-between font-semibold"
          style={{ borderTop: `1px solid ${colors.tooltipBorder}` }}
        >
          <span style={{ color: 'var(--db-text-muted)' }}>Total</span>
          <span style={{ color: 'var(--db-text-primary)' }}>{data.total}</span>
        </div>
      )}
    </div>
  )
}
