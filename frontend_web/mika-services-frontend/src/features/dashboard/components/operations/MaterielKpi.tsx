import { useTranslation } from 'react-i18next'
import { KpiCard } from '../shared/KpiCard'
import type { MaterielStats } from '@/types/reporting'

export interface MaterielKpiProps {
  materiel: MaterielStats
}

export function MaterielKpi({ materiel }: MaterielKpiProps) {
  const { t } = useTranslation('common')

  return (
    <KpiCard
      label={t('db.operations.materiel')}
      value={materiel.enginsDisponibles}
      sub={t('db.operations.surTotalEngins', { total: materiel.enginsTotal })}
      progress={materiel.enginsTotal > 0 ? (materiel.enginsDisponibles / materiel.enginsTotal) * 100 : 0}
      badge={materiel.materiauxStockBas > 0
        ? { text: t('db.operations.stockBas', { count: materiel.materiauxStockBas }), variant: 'warning' as const }
        : undefined}
      accent="#48B5A0"
      href="/engins"
      variant="standard"
      colSpan={4}
      colSpanTablet={6}
      colSpanMobile={6}
      icon={
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.07-.504 1.07-1.125V14.25M3.375 14.25h17.25" />
        </svg>
      }
    />
  )
}
