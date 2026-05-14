import { useTranslation } from 'react-i18next'
import { SectionHeader } from '../shared/SectionHeader'
import { DashboardSkeleton } from '../shared/DashboardSkeleton'
import { ConformiteKpi } from './ConformiteKpi'
import { NcOuvertesKpi } from './NcOuvertesKpi'
import { AgrementsDistribution } from './AgrementsDistribution'
import { EvenementsDistribution } from './EvenementsDistribution'
import { useQualiteStats } from '../../hooks/useQualiteStats'
import type { GlobalDashboard, QualiteStats } from '@/types/reporting'

const EMPTY_QUALITE: QualiteStats = { controlesTotal: 0, tauxConformite: 0, ncOuvertes: 0 }

export interface QualiteRegionProps {
  dashboard: GlobalDashboard | null
  loading?: boolean
}

export function QualiteRegion({ dashboard, loading = false }: QualiteRegionProps) {
  const { t } = useTranslation('common')
  const { data: qualiteData, loading: statsLoading } = useQualiteStats()

  if (!dashboard || loading) {
    return (
      <div>
        <SectionHeader title={t('db.qualite.sectionTitle')} number={3} />
        <DashboardSkeleton variant="region" />
      </div>
    )
  }

  return (
    <div>
      <SectionHeader title={t('db.qualite.sectionTitle')} number={3} />

      <div className="grid grid-cols-12 gap-4">
        {/* Row 1: KPIs 6+6 */}
        <ConformiteKpi qualite={dashboard.qualite ?? EMPTY_QUALITE} />
        <NcOuvertesKpi qualite={dashboard.qualite ?? EMPTY_QUALITE} />

        {/* Row 2: Distributions 6+6 */}
        <AgrementsDistribution data={qualiteData.agrementsByStatut} loading={statsLoading} />
        <EvenementsDistribution data={qualiteData.evenementsByStatut} loading={statsLoading} />
      </div>
    </div>
  )
}
