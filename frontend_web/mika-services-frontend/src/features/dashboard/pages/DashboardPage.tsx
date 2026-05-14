import { useEffect, useMemo, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchGlobalDashboard, fetchProjetReport, clearProjetReport } from '@/store/slices/reportingSlice'
import { fetchProjets } from '@/store/slices/projetSlice'
import { fetchNotificationsNonLuesCount, fetchMessagesNonLusCount } from '@/store/slices/communicationSlice'
import { PageContainer } from '@/components/layout/PageContainer'
import { CacheTimestampBanner } from '@/components/pwa/CacheTimestampBanner'

import { DashHeader } from '../components/premium/DashHeader'
import { DashAlertBar } from '../components/premium/DashAlertBar'
import { KpiRow } from '../components/premium/KpiRow'
import { HeroBudget } from '../components/premium/HeroBudget'
import { GaugeAvancement } from '../components/premium/GaugeAvancement'
import { OpsMetricsRow } from '../components/premium/OpsMetricsRow'
import { ProjetsTable } from '../components/premium/ProjetsTable'
import { QsheSidebar } from '../components/premium/QsheSidebar'
import { WeeklyChart } from '../components/premium/WeeklyChart'
import { PremiumDonutStatuts } from '../components/premium/PremiumDonutStatuts'
import { ConformiteRow } from '../components/premium/ConformiteRow'
import { ProjetDetail } from '../components/premium/ProjetDetail'
import { QuickAccess } from '../components/premium/QuickAccess'
import { MeetingCard } from '../components/premium/MeetingCard'

import { useMeteo } from '../hooks/useMeteo'
import { usePollDispatch } from '../hooks/usePollDispatch'
import { useDmaCounts } from '../hooks/useDmaCounts'
import { useQsheCounts } from '../hooks/useQsheCounts'
import { useReunionLatest } from '../hooks/useReunionLatest'
import { computeGreeting } from '../utils/greeting'

export default function DashboardPage() {
  const dispatch = useAppDispatch()
  const user = useAppSelector(s => s.auth.user)
  const { dashboard, projetReport, lastFetched } = useAppSelector(s => s.reporting)
  const projets = useAppSelector(s => s.projet.projets)
  const notificationsNonLuesCount = useAppSelector(s => s.communication.notificationsNonLuesCount ?? 0)
  const messagesNonLusCount = useAppSelector(s => s.communication.messagesNonLusCount ?? 0)

  const { meteo } = useMeteo()
  const { counts: dmaCounts } = useDmaCounts()
  const { counts: qsheCounts } = useQsheCounts()
  const reunion = useReunionLatest()
  const [selectedProjetId, setSelectedProjetId] = useState<number | null>(null)

  usePollDispatch(() => fetchGlobalDashboard(), 60_000)

  useEffect(() => { dispatch(fetchProjets({ page: 0, size: 200 })) }, [dispatch])
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchNotificationsNonLuesCount(user.id))
      dispatch(fetchMessagesNonLusCount(user.id))
    }
  }, [dispatch, user?.id])
  useEffect(() => {
    if (selectedProjetId !== null) dispatch(fetchProjetReport(selectedProjetId))
    else dispatch(clearProjetReport())
  }, [dispatch, selectedProjetId])

  const greetingInfo = useMemo(() => computeGreeting(user, 'Utilisateur'), [user])

  const d = dashboard

  return (
    <PageContainer size="full" className="pb-8" style={{ background: 'var(--db-page)' }}>
      <CacheTimestampBanner lastFetched={lastFetched} />

      <div className="px-1 sm:px-2">
        {/* Header */}
        <DashHeader
          greetingKey={greetingInfo.key}
          greetingName={greetingInfo.name}
          notificationsCount={notificationsNonLuesCount}
          meteo={meteo}
        />

        {/* AlertBar */}
        <DashAlertBar
          projetsEnRetard={d?.projets?.enRetard ?? 0}
          tachesEnRetard={d?.planning?.tachesEnRetard ?? 0}
          incidentsGraves={d?.securite?.incidentsGraves ?? 0}
          risquesCritiques={d?.securite?.risquesCritiques ?? 0}
          stocksBas={d?.materiel?.materiauxStockBas ?? 0}
        />

        {/* Grid layout matching design source */}
        <div className="grid grid-cols-12 gap-3">
          {/* Row 1: 4 KPIs */}
          <KpiRow
            projetsActifs={d?.projets?.enCours ?? 0}
            projetsTotal={d?.projets?.total ?? 0}
            projetsDelta={2}
            chantiersActifs={d?.chantiers?.actifs ?? 0}
            chantiersTotal={d?.chantiers?.total ?? 0}
            chantiersDelta={5}
            dmaEnAttente={dmaCounts.total}
            enginsAffectes={projets.reduce((s, p) => s + (p.nombreEnginsAffectes ?? 0), 0)}
            enginsTotal={d?.materiel?.enginsTotal ?? 0}
          />

          {/* Row 2: Hero Budget (8) + Gauge (4) */}
          {d?.budget && <HeroBudget budget={d.budget} />}
          <GaugeAvancement value={d?.planning?.tauxAvancement ?? 0} />

          {/* Row 3: 4-up Operations metrics */}
          <OpsMetricsRow />

          {/* Row 4: Table (8) + QSHE Sidebar (4) */}
          <ProjetsTable projets={projets} />
          {d?.securite && <QsheSidebar securite={d.securite} counts={qsheCounts} />}

          {/* Row 5: Weekly (8) + Donut (4) */}
          <WeeklyChart weeks={d?.weeklyProgress?.weeks ?? []} />
          <PremiumDonutStatuts parStatut={d?.projets?.parStatut ?? {}} />

          {/* Row 6: 4-up Conformité */}
          <ConformiteRow />

          {/* Row 7: Rapport projet (12) */}
          <ProjetDetail
            projets={projets}
            report={projetReport}
            selectedId={selectedProjetId}
            onSelect={setSelectedProjetId}
          />

          {/* Row 8: Quick Access (8) + Meeting (4) */}
          <QuickAccess
            tachesEnRetard={d?.planning?.tachesEnRetard ?? 0}
            stocksBas={d?.materiel?.materiauxStockBas ?? 0}
            messagesNonLus={messagesNonLusCount}
          />
          <MeetingCard data={reunion.data} loading={reunion.loading} />
        </div>
      </div>
    </PageContainer>
  )
}
