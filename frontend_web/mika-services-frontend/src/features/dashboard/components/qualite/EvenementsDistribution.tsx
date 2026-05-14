import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BentoCard } from '../shared/BentoCard'
import { StatusBars } from '../shared/StatusBars'

export interface EvenementsDistributionProps {
  data: Record<string, number>
  loading?: boolean
}

const STATUT_SEMANTIC: Record<string, string> = {
  BROUILLON: 'var(--db-info-text)',
  DETECTEE: 'var(--db-danger-text)',
  EN_TRAITEMENT: 'var(--db-warning-text)',
  EN_VERIFICATION: 'var(--db-warning-text)',
  LEVEE: 'var(--db-success-text)',
  ANALYSEE: 'var(--db-success-text)',
  CLOTUREE: 'var(--db-success-text)',
}

export function EvenementsDistribution({ data, loading = false }: EvenementsDistributionProps) {
  const { t } = useTranslation('common')

  const bars = useMemo(() =>
    Object.entries(data)
      .filter(([, v]) => v > 0)
      .map(([key, value]) => ({
        label: t(`db.qualite.evtStatuts.${key}`, key),
        value,
        color: STATUT_SEMANTIC[key] ?? 'var(--db-info-text)',
      })),
    [data, t],
  )

  const total = useMemo(() => bars.reduce((s, b) => s + b.value, 0), [bars])

  return (
    <BentoCard
      title={t('db.qualite.evenementsTitle')}
      subtitle={t('db.qualite.evenementsSubtitle')}
      href="/qualite/evenements"
      loading={loading}
      colSpan={6}
      colSpanTablet={12}
      colSpanMobile={12}
    >
      {total === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-sm text-[var(--db-text-faint)]">
          {t('db.qualite.emptyEvenements')}
        </div>
      ) : (
        <StatusBars data={bars} total={total} height={8} />
      )}
    </BentoCard>
  )
}
