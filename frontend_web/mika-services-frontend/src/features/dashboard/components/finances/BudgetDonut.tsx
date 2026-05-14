import { useTranslation } from 'react-i18next'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useFormatNumber } from '@/hooks/useFormatNumber'
import { BentoCard } from '../shared/BentoCard'
import { DashboardTooltip } from '../shared/CustomTooltip'
import { useChartColors } from '../../hooks/useChartColors'
import type { BudgetStats } from '@/types/reporting'

export interface BudgetDonutProps {
  budget: BudgetStats
}

export function BudgetDonut({ budget }: BudgetDonutProps) {
  const { t } = useTranslation('common')
  const { formatMontant, formatShort } = useFormatNumber()
  const colors = useChartColors()

  const restant = Math.max(0, budget.budgetTotalPrevu - budget.depensesTotales)
  const isOver = budget.depensesTotales > budget.budgetTotalPrevu

  const data = [
    { name: t('db.finances.depense'), value: budget.depensesTotales, color: colors.series[2] },
    { name: t('db.finances.restant'), value: restant, color: colors.series[1] },
  ]

  return (
    <BentoCard
      title={t('db.finances.budgetDonut')}
      subtitle={t('db.finances.budgetSubtitle')}
      href="/budget"
      colSpan={6}
      colSpanTablet={12}
      colSpanMobile={12}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Donut */}
        <div className="relative">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="44%"
                outerRadius="70%"
                paddingAngle={3}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<DashboardTooltip formatter={formatMontant} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="db-display-num text-2xl text-[var(--db-text-primary)]">
              {budget.tauxConsommation.toFixed(1)}%
            </p>
            <p className="text-[9px] text-[var(--db-text-faint)] uppercase tracking-widest">
              {t('db.finances.consomme')}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-[10px] font-bold text-[var(--db-text-faint)] uppercase tracking-widest mb-0.5">
              {t('db.finances.budgetPrevu')}
            </p>
            <p className="db-display-num text-xl text-[var(--db-text-primary)]">
              {formatShort(budget.budgetTotalPrevu)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[var(--db-text-faint)] uppercase tracking-widest mb-0.5">
              {t('db.finances.depense')}
            </p>
            <p className={`db-display-num text-xl ${budget.tauxConsommation > 80 ? 'text-[var(--db-warning-text)]' : 'text-[var(--db-text-primary)]'}`}>
              {formatShort(budget.depensesTotales)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[var(--db-text-faint)] uppercase tracking-widest mb-0.5">
              {isOver ? t('db.finances.depassement') : t('db.finances.restant')}
            </p>
            <p className={`db-display-num text-xl ${isOver ? 'text-[var(--db-danger-text)]' : 'text-[var(--db-success-text)]'}`}>
              {isOver ? `−${formatShort(Math.abs(budget.ecart))}` : formatShort(restant)}
            </p>
          </div>
        </div>
      </div>
    </BentoCard>
  )
}
