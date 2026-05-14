import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { KpiCard } from '../shared/KpiCard'
import type { ProjetSummary } from '@/types/projet'

export interface EnginsAffectesKpiProps {
  projets: ProjetSummary[]
  enginsTotal: number
}

export function EnginsAffectesKpi({ projets, enginsTotal }: EnginsAffectesKpiProps) {
  const { t } = useTranslation('common')

  const affectes = useMemo(
    () => projets.reduce((sum, p) => sum + (p.nombreEnginsAffectes ?? 0), 0),
    [projets],
  )

  return (
    <KpiCard
      label={t('db.operations.enginsAffectes')}
      value={affectes}
      sub={t('db.operations.surTotalEngins', { total: enginsTotal })}
      progress={enginsTotal > 0 ? (affectes / enginsTotal) * 100 : 0}
      accent="#2E5266"
      href="/engins"
      variant="standard"
      colSpan={4}
      colSpanTablet={6}
      colSpanMobile={6}
      icon={
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384 3.077A1.5 1.5 0 014.5 17.1V6.9a1.5 1.5 0 011.536-1.147l5.384 3.077m0 0l5.384-3.077A1.5 1.5 0 0118 6.9v10.2a1.5 1.5 0 01-1.296 1.147L11.42 15.17z" />
        </svg>
      }
    />
  )
}
