import { useTranslation } from 'react-i18next'
import { KpiCard } from '../shared/KpiCard'
import type { QualiteStats } from '@/types/reporting'

export interface ConformiteKpiProps {
  qualite: QualiteStats
}

function getAccent(taux: number): string {
  if (taux >= 90) return 'var(--db-success-text)'
  if (taux >= 75) return '#48B5A0'
  if (taux >= 50) return 'var(--db-warning-text)'
  return 'var(--db-danger-text)'
}

export function ConformiteKpi({ qualite }: ConformiteKpiProps) {
  const { t } = useTranslation('common')

  return (
    <KpiCard
      label={t('db.qualite.tauxConformite')}
      value={`${qualite.tauxConformite.toFixed(1)}%`}
      sub={t('db.qualite.controlesTotal', { total: qualite.controlesTotal })}
      progress={qualite.tauxConformite}
      accent={getAccent(qualite.tauxConformite)}
      variant={qualite.tauxConformite < 75 ? 'alert' : 'standard'}
      href="/qualite/evenements"
      colSpan={6}
      colSpanTablet={6}
      colSpanMobile={6}
      icon={
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
        </svg>
      }
    />
  )
}
