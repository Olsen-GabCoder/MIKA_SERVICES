import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { SectionHeader } from '../shared/SectionHeader'
import { DashboardSkeleton } from '../shared/DashboardSkeleton'
import { DonutStatuts } from './DonutStatuts'
import { TopProjets } from './TopProjets'
import { ProjetTable } from './ProjetTable'
import { EnginsAffectesKpi } from './EnginsAffectesKpi'
import { MaterielKpi } from './MaterielKpi'
import { DmaKpi } from './DmaKpi'
import { WeeklyProgress } from './WeeklyProgress'
import { RadialGauge } from './RadialGauge'
import { useDmaCounts } from '../../hooks/useDmaCounts'
import type { GlobalDashboard, MaterielStats } from '@/types/reporting'
import type { ProjetSummary } from '@/types/projet'

const EMPTY_MATERIEL: MaterielStats = { enginsTotal: 0, enginsDisponibles: 0, materiauxStockBas: 0 }

export interface OperationsRegionProps {
  dashboard: GlobalDashboard | null
  projets: ProjetSummary[]
  loading?: boolean
}

export function OperationsRegion({ dashboard, projets, loading = false }: OperationsRegionProps) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const { counts: dmaCounts, loading: dmaLoading } = useDmaCounts()

  if (!dashboard || loading) {
    return (
      <div>
        <SectionHeader title={t('db.operations.sectionTitle')} number={1} />
        <DashboardSkeleton variant="region" />
      </div>
    )
  }

  return (
    <div>
      <SectionHeader
        title={t('db.operations.sectionTitle')}
        number={1}
        action={{ label: t('db.seeAll'), onClick: () => navigate('/projets') }}
      />

      <div className="grid grid-cols-12 gap-4">
        {/* Row 1: Donut + Top Projets */}
        <DonutStatuts parStatut={dashboard.projets?.parStatut ?? {}} />
        <TopProjets projets={projets} />

        {/* Row 2: Projet Table */}
        <ProjetTable projets={projets} />

        {/* Row 3: Weekly + Radial */}
        <WeeklyProgress
          weeks={dashboard.weeklyProgress?.weeks ?? []}
          semaineActuelle={dashboard.weeklyProgress?.semaineActuelle ?? 0}
          anneeActuelle={dashboard.weeklyProgress?.anneeActuelle ?? 0}
        />
        <RadialGauge value={dashboard.planning?.tauxAvancement ?? 0} />

        {/* Row 4: KPIs */}
        <EnginsAffectesKpi projets={projets} enginsTotal={dashboard.materiel?.enginsTotal ?? 0} />
        <MaterielKpi materiel={dashboard.materiel ?? EMPTY_MATERIEL} />
        <DmaKpi counts={dmaCounts} loading={dmaLoading} />
      </div>
    </div>
  )
}
