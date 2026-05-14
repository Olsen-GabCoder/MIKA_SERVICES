import { useTranslation } from 'react-i18next'
import { BentoCard } from '../shared/BentoCard'
import { StatusBars } from '../shared/StatusBars'
import type { DmaCounts } from '../../hooks/useDmaCounts'

export interface DmaKpiProps {
  counts: DmaCounts
  loading?: boolean
}

export function DmaKpi({ counts, loading = false }: DmaKpiProps) {
  const { t } = useTranslation('common')

  const data = [
    { label: t('db.operations.dmaSoumises'), value: counts.soumise, color: 'var(--db-warning-text)' },
    { label: t('db.operations.dmaEnValidation'), value: counts.enValidation, color: 'var(--db-info-text)' },
    { label: t('db.operations.dmaPriseEnCharge'), value: counts.priseEnCharge, color: 'var(--db-success-text)' },
  ]

  return (
    <BentoCard
      title={t('db.operations.dma')}
      href="/dma"
      loading={loading}
      colSpan={4}
      colSpanTablet={6}
      colSpanMobile={12}
    >
      <div className="mb-3">
        <p className="db-display-num text-3xl text-[var(--db-text-primary)]">{counts.total}</p>
        <p className="text-[10px] text-[var(--db-text-faint)]">{t('db.operations.dmaEnCours')}</p>
      </div>
      <StatusBars data={data} total={counts.total} height={6} />
    </BentoCard>
  )
}
