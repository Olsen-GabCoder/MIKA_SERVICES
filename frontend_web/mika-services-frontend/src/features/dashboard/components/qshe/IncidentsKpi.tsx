import { useTranslation } from 'react-i18next'
import { KpiCard } from '../shared/KpiCard'
import type { SecuriteStats } from '@/types/reporting'

export interface IncidentsKpiProps {
  securite: SecuriteStats
}

export function IncidentsKpi({ securite }: IncidentsKpiProps) {
  const { t } = useTranslation('common')
  const hasGraves = securite.incidentsGraves > 0

  return (
    <KpiCard
      label={t('db.qshe.incidentsGraves')}
      value={securite.incidentsGraves}
      sub={t('db.qshe.surTotal', { total: securite.incidentsTotal })}
      accent={hasGraves ? 'var(--db-danger-text)' : 'var(--db-success-text)'}
      variant={hasGraves ? 'alert' : 'standard'}
      href="/qshe/incidents"
      colSpan={4}
      colSpanTablet={6}
      colSpanMobile={6}
      icon={
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      }
    />
  )
}
