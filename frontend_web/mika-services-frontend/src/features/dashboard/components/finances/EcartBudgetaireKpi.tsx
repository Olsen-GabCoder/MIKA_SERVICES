import { useTranslation } from 'react-i18next'
import { useFormatNumber } from '@/hooks/useFormatNumber'
import { KpiCard } from '../shared/KpiCard'
import type { BudgetStats } from '@/types/reporting'

export interface EcartBudgetaireKpiProps {
  budget: BudgetStats
}

export function EcartBudgetaireKpi({ budget }: EcartBudgetaireKpiProps) {
  const { t } = useTranslation('common')
  const { formatShort } = useFormatNumber()

  const isOver = budget.ecart < 0
  const displayValue = isOver
    ? `\u2212${formatShort(Math.abs(budget.ecart))}`
    : `+${formatShort(budget.ecart)}`

  return (
    <KpiCard
      label={t('db.finances.ecart')}
      value={displayValue}
      sub={isOver ? t('db.finances.ecartNegatif') : t('db.finances.ecartPositif')}
      accent={isOver ? 'var(--db-danger-text)' : 'var(--db-success-text)'}
      variant={isOver ? 'alert' : 'standard'}
      href="/budget"
      colSpan={6}
      colSpanTablet={6}
      colSpanMobile={6}
      icon={
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={isOver
            ? 'M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898M2.25 6h6m-6 0v6'
            : 'M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22M21.75 6.75h-6m6 0v6'
          } />
        </svg>
      }
    />
  )
}
