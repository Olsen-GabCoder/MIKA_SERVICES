import { useTranslation } from 'react-i18next'
import { BentoCard } from '../shared/BentoCard'

export interface EpiKpiProps {
  expires: number
  stockBas: number
  loading?: boolean
}

export function EpiKpi({ expires, stockBas, loading = false }: EpiKpiProps) {
  const { t } = useTranslation('common')
  const total = expires + stockBas

  return (
    <BentoCard
      title={t('db.qshe.epi')}
      href="/qshe/epi"
      loading={loading}
      colSpan={6}
      colSpanTablet={6}
      colSpanMobile={12}
    >
      <div className="flex flex-col gap-3">
        {/* Expired */}
        <div>
          <p className="text-[10px] font-bold text-[var(--db-text-faint)] uppercase tracking-widest mb-1">
            {t('db.qshe.epiExpires')}
          </p>
          <p className={`db-display-num text-3xl ${expires > 0 ? 'text-[var(--db-danger-text)]' : 'text-[var(--db-text-primary)]'}`}>
            {expires}
          </p>
        </div>

        <div className="border-t border-[var(--db-border-subtle)]" />

        {/* Low stock */}
        <div>
          <p className="text-[10px] font-bold text-[var(--db-text-faint)] uppercase tracking-widest mb-1">
            {t('db.qshe.epiStockBas')}
          </p>
          <p className={`db-display-num text-3xl ${stockBas > 0 ? 'text-[var(--db-warning-text)]' : 'text-[var(--db-text-primary)]'}`}>
            {stockBas}
          </p>
        </div>

        {/* Total footer */}
        {total > 0 && (
          <p className="text-xs text-[var(--db-text-muted)] pt-2 border-t border-[var(--db-border-subtle)]">
            {t('db.qshe.atraiter', { count: total })}
          </p>
        )}
      </div>
    </BentoCard>
  )
}
