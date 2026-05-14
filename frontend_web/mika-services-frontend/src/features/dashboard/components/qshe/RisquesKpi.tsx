import { useTranslation } from 'react-i18next'
import { KpiCard } from '../shared/KpiCard'
import type { SecuriteStats } from '@/types/reporting'

export interface RisquesKpiProps {
  securite: SecuriteStats
}

export function RisquesKpi({ securite }: RisquesKpiProps) {
  const { t } = useTranslation('common')
  const hasCritical = securite.risquesCritiques > 0

  return (
    <KpiCard
      label={t('db.qshe.risquesCritiques')}
      value={securite.risquesCritiques}
      sub={hasCritical ? t('db.qshe.risquesActifs') : t('db.qshe.aucunRisque')}
      accent={hasCritical ? 'var(--db-danger-text)' : 'var(--db-success-text)'}
      variant={hasCritical ? 'alert' : 'standard'}
      href="/qshe/risques"
      colSpan={4}
      colSpanTablet={6}
      colSpanMobile={6}
      icon={
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      }
    />
  )
}
