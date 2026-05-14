import { useTranslation } from 'react-i18next'
import { BentoCard } from '../shared/BentoCard'

export interface CertificationsKpiProps {
  expirant: number
  expirees: number
  loading?: boolean
}

export function CertificationsKpi({ expirant, expirees, loading = false }: CertificationsKpiProps) {
  const { t } = useTranslation('common')
  const total = expirant + expirees

  return (
    <BentoCard
      title={t('db.qshe.certifications')}
      href="/qshe/formations"
      loading={loading}
      colSpan={6}
      colSpanTablet={6}
      colSpanMobile={12}
    >
      <div className="flex flex-col gap-3">
        {/* Expired */}
        <div>
          <p className="text-[10px] font-bold text-[var(--db-text-faint)] uppercase tracking-widest mb-1">
            {t('db.qshe.certifExpirees')}
          </p>
          <p className={`db-display-num text-3xl ${expirees > 0 ? 'text-[var(--db-danger-text)]' : 'text-[var(--db-text-primary)]'}`}>
            {expirees}
          </p>
        </div>

        <div className="border-t border-[var(--db-border-subtle)]" />

        {/* Expiring soon */}
        <div>
          <p className="text-[10px] font-bold text-[var(--db-text-faint)] uppercase tracking-widest mb-1">
            {t('db.qshe.certifExpirant')}
          </p>
          <p className={`db-display-num text-3xl ${expirant > 0 ? 'text-[var(--db-warning-text)]' : 'text-[var(--db-text-primary)]'}`}>
            {expirant}
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
