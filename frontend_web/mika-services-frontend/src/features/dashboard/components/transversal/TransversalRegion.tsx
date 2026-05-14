import { useTranslation } from 'react-i18next'
import { SectionHeader } from '../shared/SectionHeader'
import { DashboardSkeleton } from '../shared/DashboardSkeleton'
import { ProjetReportBlock } from './ProjetReportBlock'
import { QuickAccessGrid } from './QuickAccessGrid'
import { ActivityFeed } from './ActivityFeed'
import { ReunionInfo } from './ReunionInfo'
import { useIsAdmin } from '../../hooks/useIsAdmin'
import { useAuditStats } from '../../hooks/useAuditStats'
import { useReunionLatest } from '../../hooks/useReunionLatest'
import type { GlobalDashboard } from '@/types/reporting'
import type { ProjetSummary } from '@/types/projet'
import type { ProjetReport } from '@/types/reporting'

export interface TransversalRegionProps {
  dashboard: GlobalDashboard | null
  projets: ProjetSummary[]
  projetReport: ProjetReport | null
  selectedProjetId: number | null
  onSelectProjet: (id: number | null) => void
  messagesNonLus: number
  loading?: boolean
}

export function TransversalRegion({
  dashboard,
  projets,
  projetReport,
  selectedProjetId,
  onSelectProjet,
  messagesNonLus,
  loading = false,
}: TransversalRegionProps) {
  const { t } = useTranslation('common')
  const isAdmin = useIsAdmin()
  const audit = useAuditStats()
  const reunion = useReunionLatest()

  if (!dashboard || loading) {
    return (
      <div>
        <SectionHeader title={t('db.transversal.sectionTitle')} />
        <DashboardSkeleton variant="region" />
      </div>
    )
  }

  return (
    <div>
      <SectionHeader title={t('db.transversal.sectionTitle')} />

      <div className="space-y-4">
        {/* Row 1: Projet Report */}
        <div className="grid grid-cols-12 gap-4">
          <ProjetReportBlock
            projets={projets}
            projetReport={projetReport}
            selectedProjetId={selectedProjetId}
            onSelectProjet={onSelectProjet}
          />
        </div>

        {/* Row 2: Quick Access */}
        <div className="grid grid-cols-12 gap-4">
          <QuickAccessGrid
            tachesEnRetard={dashboard.planning?.tachesEnRetard ?? 0}
            materiauxStockBas={dashboard.materiel?.materiauxStockBas ?? 0}
            messagesNonLus={messagesNonLus}
          />
        </div>

        {/* Row 3: Activity (admin only) + Reunion */}
        <div className="grid grid-cols-12 gap-4">
          {isAdmin && <ActivityFeed data={audit.data} loading={audit.loading} />}
          <ReunionInfo data={reunion.data} loading={reunion.loading} colSpan={isAdmin ? 6 : 12} />
        </div>
      </div>
    </div>
  )
}
