import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { BentoCard } from '../shared/BentoCard'
import { DashboardTooltip } from '../shared/CustomTooltip'
import { useChartColors } from '../../hooks/useChartColors'

export interface AgrementsDistributionProps {
  data: Record<string, number>
  loading?: boolean
}

export function AgrementsDistribution({ data, loading = false }: AgrementsDistributionProps) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const colors = useChartColors()

  const entries = useMemo(() => {
    const sorted = Object.entries(data)
      .filter(([, v]) => v > 0)
      .sort(([a], [b]) => a.localeCompare(b))
    return sorted.map(([key, value], i) => ({
      key,
      name: t(`db.qualite.statuts.${key}`, key),
      value,
      color: colors.series[i % colors.series.length],
    }))
  }, [data, colors.series, t])

  const total = useMemo(() => entries.reduce((s, e) => s + e.value, 0), [entries])

  return (
    <BentoCard
      title={t('db.qualite.agrementsTitle')}
      subtitle={t('db.qualite.agrementsSubtitle')}
      loading={loading}
      colSpan={6}
      colSpanTablet={12}
      colSpanMobile={12}
    >
      {total === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-sm text-[var(--db-text-faint)]">
          {t('db.qualite.emptyAgrements')}
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Donut */}
            <div className="relative w-full sm:w-1/2">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={entries}
                    cx="50%"
                    cy="50%"
                    innerRadius="40%"
                    outerRadius="70%"
                    paddingAngle={3}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                    onClick={() => navigate('/qualite/agrements')}
                    cursor="pointer"
                  >
                    {entries.map((e, i) => (
                      <Cell key={i} fill={e.color} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<DashboardTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="db-display-num text-2xl text-[var(--db-text-primary)]">{total}</p>
                <p className="text-[9px] text-[var(--db-text-faint)] uppercase tracking-widest">total</p>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-col gap-1.5 w-full sm:w-1/2">
              {entries.map(e => {
                const pct = Math.round((e.value / Math.max(total, 1)) * 100)
                return (
                  <div key={e.key} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-md shrink-0" style={{ background: e.color }} />
                    <span className="text-[var(--db-text-muted)] truncate flex-1">{e.name}</span>
                    <span className="db-display-num text-sm text-[var(--db-text-primary)] shrink-0">{e.value}</span>
                    <span className="text-[10px] text-[var(--db-text-faint)] w-8 text-right shrink-0">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Total footer */}
          <button
            type="button"
            onClick={() => navigate('/qualite/agrements')}
            className="mt-3 pt-3 border-t border-[var(--db-border-subtle)] text-xs text-[var(--db-text-muted)] hover:text-[var(--db-accent)] transition-colors w-full text-left min-h-[44px] flex items-center"
          >
            {t('db.qualite.agrementsTotal', { count: total })}
          </button>
        </>
      )}
    </BentoCard>
  )
}
