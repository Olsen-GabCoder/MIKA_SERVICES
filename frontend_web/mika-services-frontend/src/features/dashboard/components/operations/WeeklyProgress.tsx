import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ComposedChart, Bar, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { BentoCard } from '../shared/BentoCard'
import { WeeklyDashboardTooltip } from '../shared/CustomTooltip'
import { useChartColors } from '../../hooks/useChartColors'
import type { WeekSummary } from '@/types/reporting'

export interface WeeklyProgressProps {
  weeks: WeekSummary[]
  semaineActuelle: number
  anneeActuelle: number
}

export function WeeklyProgress({ weeks, semaineActuelle, anneeActuelle }: WeeklyProgressProps) {
  const { t } = useTranslation('common')
  const colors = useChartColors()

  const chartData = useMemo(() =>
    weeks.map(w => ({
      ...w,
      displayLabel: w.isCurrent ? `${w.label} \u2605` : w.label,
    })),
    [weeks],
  )

  return (
    <BentoCard
      title={t('db.operations.weeklyProgress')}
      subtitle={t('db.operations.weeklySubtitle', { semaine: semaineActuelle, annee: anneeActuelle })}
      colSpan={8}
      colSpanTablet={12}
      colSpanMobile={12}
    >
      {chartData.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-xs text-[var(--db-text-faint)]">
          {t('db.operations.emptyWeekly')}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
            <XAxis
              dataKey="displayLabel"
              tick={{ fontSize: 9, fill: colors.tick, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10, fill: colors.tick }}
              axisLine={false}
              tickLine={false}
              width={24}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 9, fill: colors.tick }}
              axisLine={false}
              tickLine={false}
              width={28}
              tickFormatter={v => `${v}%`}
            />
            <Tooltip content={<WeeklyDashboardTooltip t={t} />} />
            <Legend
              iconType="circle"
              iconSize={7}
              formatter={(v: string) => <span style={{ fontSize: 9, color: colors.tick }}>{v}</span>}
            />
            <Bar
              yAxisId="left"
              dataKey="terminees"
              name={t('db.weekly.done')}
              stackId="stack"
              fill={colors.series[1]}
              barSize={16}
            />
            <Bar
              yAxisId="left"
              dataKey="enCours"
              name={t('db.weekly.inProgress')}
              stackId="stack"
              fill={colors.series[0]}
              barSize={16}
            />
            <Bar
              yAxisId="left"
              dataKey="nonCommencees"
              name={t('db.weekly.notStarted')}
              stackId="stack"
              fill={colors.series[3]}
              radius={[4, 4, 0, 0]}
              barSize={16}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="avancementMoyen"
              name={t('db.weekly.avgProgress')}
              stroke={colors.series[2]}
              strokeWidth={2.5}
              fill={`${colors.series[2]}20`}
              dot={{ r: 3, fill: colors.series[2], strokeWidth: 0 }}
              activeDot={{ r: 5, fill: colors.series[2], stroke: '#fff', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </BentoCard>
  )
}
