import { useTranslation } from 'react-i18next'
import { KpiCard } from '../shared/KpiCard'
import type { QualiteStats } from '@/types/reporting'

export interface NcOuvertesKpiProps {
  qualite: QualiteStats
}

export function NcOuvertesKpi({ qualite }: NcOuvertesKpiProps) {
  const { t } = useTranslation('common')
  const hasNc = qualite.ncOuvertes > 0

  return (
    <KpiCard
      label={t('db.qualite.ncOuvertes')}
      value={qualite.ncOuvertes}
      sub={t('db.qualite.ncSubtitle')}
      accent={hasNc ? 'var(--db-warning-text)' : 'var(--db-success-text)'}
      variant={hasNc ? 'alert' : 'standard'}
      badge={hasNc ? { text: t('db.qualite.actionRequise'), variant: 'warning' as const } : undefined}
      href="/qualite/evenements"
      colSpan={6}
      colSpanTablet={6}
      colSpanMobile={6}
      icon={
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      }
    />
  )
}
