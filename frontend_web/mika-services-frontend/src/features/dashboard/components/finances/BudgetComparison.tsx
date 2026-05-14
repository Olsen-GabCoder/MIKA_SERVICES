import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList, ResponsiveContainer, Cell } from 'recharts'
import { useFormatNumber } from '@/hooks/useFormatNumber'
import { BentoCard } from '../shared/BentoCard'
import { DashboardTooltip } from '../shared/CustomTooltip'
import { useChartColors } from '../../hooks/useChartColors'
import type { BudgetStats } from '@/types/reporting'

export interface BudgetComparisonProps {
  budget: BudgetStats
}

export function BudgetComparison({ budget }: BudgetComparisonProps) {
  const { t } = useTranslation('common')
  const { formatMontant, formatShort } = useFormatNumber()
  const colors = useChartColors()

  const isOver = budget.ecart < 0
  const ecartColor = isOver ? 'var(--db-danger-text)' : colors.series[1]

  const data = useMemo(() => [
    { name: t('db.finances.barPrevu'), value: budget.budgetTotalPrevu, fill: colors.series[0] },
    { name: t('db.finances.barDepense'), value: budget.depensesTotales, fill: colors.series[2] },
    { name: t('db.finances.barEcart'), value: Math.abs(budget.ecart), fill: ecartColor },
  ], [budget, colors.series, ecartColor, t])

  const overPct = budget.tauxConsommation > 100
    ? (budget.tauxConsommation - 100).toFixed(1)
    : null

  return (
    <BentoCard
      title={t('db.finances.budgetComparison')}
      subtitle={t('db.finances.budgetComparisonSubtitle')}
      href="/budget"
      colSpan={6}
      colSpanTablet={12}
      colSpanMobile={12}
    >
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 24, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: colors.tick }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={v => formatShort(v)}
            tick={{ fontSize: 10, fill: colors.tick }}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip content={<DashboardTooltip formatter={formatMontant} />} />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={48} cursor="pointer">
            {data.map((d, i) => (
              <Cell key={i} fill={d.fill} />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              formatter={(v) => formatShort(v as number)}
              style={{ fontSize: 10, fontWeight: 700, fill: 'var(--db-text-muted)' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Footer: consumption rate */}
      <div className="mt-3 pt-3 border-t border-[var(--db-border-subtle)]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-[var(--db-text-faint)] uppercase tracking-widest">
            {t('db.finances.tauxConsommation')}
          </span>
          <div className="flex items-center gap-2">
            <span className="db-display-num text-xl text-[var(--db-text-primary)]">
              {budget.tauxConsommation.toFixed(1)}%
            </span>
            {overPct && (
              <span className="text-[10px] font-semibold text-[var(--db-danger-text)]">
                {t('db.finances.depassementPct', { taux: overPct })}
              </span>
            )}
          </div>
        </div>
        <div className="h-1 w-full rounded-full bg-[var(--db-border-subtle)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(budget.tauxConsommation, 100)}%`,
              background: 'var(--db-accent)',
            }}
          />
        </div>
      </div>
    </BentoCard>
  )
}
