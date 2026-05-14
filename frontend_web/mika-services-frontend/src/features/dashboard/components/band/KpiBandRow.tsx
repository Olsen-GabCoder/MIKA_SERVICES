import { useTranslation } from 'react-i18next'
import { useFormatNumber } from '@/hooks/useFormatNumber'
import { KpiCard } from '../shared/KpiCard'
import type { GlobalDashboard } from '@/types/reporting'

export interface KpiBandRowProps {
  dashboard: GlobalDashboard | null
  dmaCount?: number
  loading?: boolean
}

/* Heroicon SVGs (outline, 24x24, strokeWidth 1.5) */
const IconProjects = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
  </svg>
)
const IconSites = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
  </svg>
)
const IconBudget = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const IconIncident = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
)
const IconRisk = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
)
const IconDma = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.07-.504 1.07-1.125V14.25M3.375 14.25h17.25" />
  </svg>
)

export function KpiBandRow({ dashboard, dmaCount, loading = false }: KpiBandRowProps) {
  const { t } = useTranslation('common')
  const { formatShort } = useFormatNumber()

  const isLoading = loading || !dashboard

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <KpiCard key={i} label="" value="" loading colSpan={4} colSpanTablet={6} colSpanMobile={6} />
        ))}
      </div>
    )
  }

  const d = dashboard
  const graves = d.securite?.incidentsGraves ?? 0
  const critiques = d.securite?.risquesCritiques ?? 0

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* BS-2 Projets actifs */}
      <KpiCard
        label={t('db.band.kpi.projetsActifs')}
        value={d.projets?.enCours ?? 0}
        sub={t('db.band.kpi.surTotal', { total: d.projets?.total ?? 0 })}
        icon={<IconProjects />}
        accent="#FF6B35"
        href="/projets"
        variant="compact"
        colSpan={4}
        colSpanTablet={6}
        colSpanMobile={6}
      />

      {/* BS-3 Chantiers actifs */}
      <KpiCard
        label={t('db.band.kpi.chantiersActifs')}
        value={d.chantiers?.actifs ?? 0}
        sub={t('db.band.kpi.surTotal', { total: d.chantiers?.total ?? 0 })}
        icon={<IconSites />}
        accent="#2E5266"
        href="/equipes"
        variant="compact"
        colSpan={4}
        colSpanTablet={6}
        colSpanMobile={6}
      />

      {/* BS-4 Budget engage */}
      <KpiCard
        label={t('db.band.kpi.budgetEngage')}
        value={formatShort(d.budget?.depensesTotales ?? 0)}
        sub={t('db.band.kpi.tauxConsommation', { taux: (d.budget?.tauxConsommation ?? 0).toFixed(1) })}
        icon={<IconBudget />}
        accent="#48B5A0"
        progress={d.budget?.tauxConsommation ?? 0}
        href="/budget"
        variant="compact"
        colSpan={4}
        colSpanTablet={6}
        colSpanMobile={6}
      />

      {/* BS-5 Incidents graves */}
      <KpiCard
        label={t('db.band.kpi.incidentsGraves')}
        value={graves}
        sub={t('db.band.kpi.surTotal', { total: d.securite?.incidentsTotal ?? 0 })}
        icon={<IconIncident />}
        accent={graves > 0 ? '#EF4444' : '#10B981'}
        badge={graves > 0 ? { text: `${graves}`, variant: 'danger' as const } : undefined}
        href="/qshe/incidents"
        variant={graves > 0 ? 'alert' : 'compact'}
        colSpan={4}
        colSpanTablet={6}
        colSpanMobile={6}
      />

      {/* BS-6 Risques critiques */}
      <KpiCard
        label={t('db.band.kpi.risquesCritiques')}
        value={critiques}
        sub=""
        icon={<IconRisk />}
        accent={critiques > 0 ? '#EF4444' : '#10B981'}
        badge={critiques > 0 ? { text: `${critiques}`, variant: 'danger' as const } : undefined}
        href="/qshe/risques"
        variant={critiques > 0 ? 'alert' : 'compact'}
        colSpan={4}
        colSpanTablet={6}
        colSpanMobile={6}
      />

      {/* BS-7 DMA en attente */}
      <KpiCard
        label={t('db.band.kpi.dmaEnAttente')}
        value={dmaCount ?? '\u2013'}
        sub={t('db.band.kpi.dma')}
        icon={<IconDma />}
        accent="#FF6B35"
        href="/dma"
        variant="compact"
        colSpan={4}
        colSpanTablet={6}
        colSpanMobile={6}
      />
    </div>
  )
}
