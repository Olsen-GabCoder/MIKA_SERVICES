import { useTranslation } from 'react-i18next'
import { SectionHeader } from '../shared/SectionHeader'
import { DashboardSkeleton } from '../shared/DashboardSkeleton'
import { IncidentsKpi } from './IncidentsKpi'
import { RisquesKpi } from './RisquesKpi'
import { ActionsCorrectivesKpi } from './ActionsCorrectivesKpi'
import { CertificationsKpi } from './CertificationsKpi'
import { EpiKpi } from './EpiKpi'
import { QsheSummary } from './QsheSummary'
import { useQsheCounts } from '../../hooks/useQsheCounts'
import type { GlobalDashboard, SecuriteStats } from '@/types/reporting'

const EMPTY_SECURITE: SecuriteStats = { incidentsTotal: 0, incidentsGraves: 0, joursArretTotal: 0, risquesCritiques: 0 }

export interface QsheRegionProps {
  dashboard: GlobalDashboard | null
  loading?: boolean
}

export function QsheRegion({ dashboard, loading = false }: QsheRegionProps) {
  const { t } = useTranslation('common')
  const { counts, loading: qsheLoading } = useQsheCounts()

  if (!dashboard || loading) {
    return (
      <div>
        <SectionHeader title={t('db.qshe.sectionTitle')} number={2} />
        <DashboardSkeleton variant="region" />
      </div>
    )
  }

  return (
    <div>
      <SectionHeader
        title={t('db.qshe.sectionTitle')}
        number={2}
        action={{ label: t('db.seeAll'), onClick: () => {} }}
      />

      <div className="grid grid-cols-12 gap-4">
        {/* Row 1: KPIs principaux */}
        <IncidentsKpi securite={dashboard.securite ?? EMPTY_SECURITE} />
        <RisquesKpi securite={dashboard.securite ?? EMPTY_SECURITE} />
        <ActionsCorrectivesKpi enRetard={counts.actions.enRetard} loading={qsheLoading} />

        {/* Row 2: Certifications + EPI (6+6) */}
        <CertificationsKpi
          expirant={counts.certifications.expirant}
          expirees={counts.certifications.expirees}
          loading={qsheLoading}
        />
        <EpiKpi
          expires={counts.epi.expires}
          stockBas={counts.epi.stockBas}
          loading={qsheLoading}
        />

        {/* Row 3: Summary pleine largeur */}
        <QsheSummary securite={dashboard.securite ?? EMPTY_SECURITE} />
      </div>
    </div>
  )
}
