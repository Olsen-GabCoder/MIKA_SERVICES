import { useTranslation } from 'react-i18next'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'
import { BentoCard } from '../shared/BentoCard'
import { useChartColors } from '../../hooks/useChartColors'

export interface RadialGaugeProps {
  value: number
}

export function RadialGauge({ value }: RadialGaugeProps) {
  const { t } = useTranslation('common')
  const colors = useChartColors()
  const clamped = Math.min(Math.max(value, 0), 100)

  const data = [{ name: t('db.operations.avancementGlobal'), value: clamped, fill: colors.series[2] }]

  return (
    <BentoCard
      title={t('db.operations.avancementGlobal')}
      href="/planning"
      colSpan={4}
      colSpanTablet={6}
      colSpanMobile={12}
    >
      <div className="relative">
        <ResponsiveContainer width="100%" height={180}>
          <RadialBarChart
            cx="50%"
            cy="55%"
            innerRadius="60%"
            outerRadius="90%"
            barSize={14}
            data={data}
            startAngle={180}
            endAngle={0}
          >
            <RadialBar
              background={{ fill: 'var(--db-border-subtle)' }}
              dataKey="value"
              cornerRadius={10}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pt-4">
          <p className="db-display-num text-4xl text-[var(--db-text-primary)]">{clamped}</p>
          <p className="text-sm font-semibold text-[var(--db-text-muted)] -mt-0.5">%</p>
          <p className="text-[9px] text-[var(--db-text-faint)] uppercase tracking-widest mt-1">
            {t('db.radial.progress')}
          </p>
        </div>
      </div>
    </BentoCard>
  )
}
