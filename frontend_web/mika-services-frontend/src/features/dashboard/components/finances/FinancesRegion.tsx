import { useTranslation } from 'react-i18next'
import { SectionHeader } from '../shared/SectionHeader'
import { DashboardSkeleton } from '../shared/DashboardSkeleton'
import { BudgetDonut } from './BudgetDonut'
import { BudgetComparison } from './BudgetComparison'
import { EcartBudgetaireKpi } from './EcartBudgetaireKpi'
import { BaremeInfoCard } from './BaremeInfoCard'
import { useBaremeInfo } from '../../hooks/useBaremeInfo'
import type { GlobalDashboard, BudgetStats } from '@/types/reporting'

const EMPTY_BUDGET: BudgetStats = { budgetTotalPrevu: 0, depensesTotales: 0, ecart: 0, tauxConsommation: 0 }

export interface FinancesRegionProps {
  dashboard: GlobalDashboard | null
  loading?: boolean
}

export function FinancesRegion({ dashboard, loading = false }: FinancesRegionProps) {
  const { t } = useTranslation('common')
  const { data: baremeData, loading: baremeLoading } = useBaremeInfo()

  if (!dashboard || loading) {
    return (
      <div>
        <SectionHeader title={t('db.finances.sectionTitle')} number={4} />
        <DashboardSkeleton variant="region" />
      </div>
    )
  }

  return (
    <div>
      <SectionHeader title={t('db.finances.sectionTitle')} number={4} />

      <div className="grid grid-cols-12 gap-4">
        {/* Row 1: Donut + Comparison */}
        <BudgetDonut budget={dashboard.budget ?? EMPTY_BUDGET} />
        <BudgetComparison budget={dashboard.budget ?? EMPTY_BUDGET} />

        {/* Row 2: Ecart + Bareme */}
        <EcartBudgetaireKpi budget={dashboard.budget ?? EMPTY_BUDGET} />
        <BaremeInfoCard data={baremeData} loading={baremeLoading} />
      </div>
    </div>
  )
}
