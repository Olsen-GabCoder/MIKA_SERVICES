import { useTranslation } from 'react-i18next'
import { BentoCard } from '../shared/BentoCard'
import type { SecuriteStats } from '@/types/reporting'

export interface QsheSummaryProps {
  securite: SecuriteStats
}

export function QsheSummary({ securite }: QsheSummaryProps) {
  const { t } = useTranslation('common')
  const gravePct = securite.incidentsTotal > 0
    ? Math.round((securite.incidentsGraves / securite.incidentsTotal) * 100)
    : 0

  return (
    <BentoCard
      title={t('db.qshe.summary')}
      subtitle={t('db.qshe.summarySubtitle')}
      href="/qshe"
      colSpan={12}
      colSpanTablet={12}
      colSpanMobile={12}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Incidents column */}
        <div>
          <p className="text-[10px] font-bold text-[var(--db-text-faint)] uppercase tracking-widest mb-3">
            {t('db.qshe.incidentsLabel')}
          </p>
          <p className={`db-display-num text-3xl mb-1 ${securite.incidentsGraves > 0 ? 'text-[var(--db-danger-text)]' : 'text-[var(--db-text-primary)]'}`}>
            {securite.incidentsGraves}
          </p>
          <p className="text-xs text-[var(--db-text-muted)] mb-3">
            {t('db.qshe.surTotal', { total: securite.incidentsTotal })}
          </p>
          {/* Proportion bar */}
          <div className="h-2 w-full rounded-full bg-[var(--db-border-subtle)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${gravePct}%`,
                background: 'var(--db-danger-text)',
              }}
            />
          </div>
          <p className="text-[10px] text-[var(--db-text-faint)] mt-1">{gravePct}% {t('db.qshe.incidentsGraves').toLowerCase()}</p>
        </div>

        {/* Risks column */}
        <div>
          <p className="text-[10px] font-bold text-[var(--db-text-faint)] uppercase tracking-widest mb-3">
            {t('db.qshe.risquesLabel')}
          </p>
          <p className={`db-display-num text-3xl mb-1 ${securite.risquesCritiques > 0 ? 'text-[var(--db-danger-text)]' : 'text-[var(--db-text-primary)]'}`}>
            {securite.risquesCritiques}
          </p>
          <p className="text-xs text-[var(--db-text-muted)]">
            {t('db.qshe.risquesActifs')}
          </p>
        </div>
      </div>

      {/* Days stopped footer */}
      {securite.joursArretTotal > 0 && (
        <div className="mt-4 pt-4 border-t border-[var(--db-border-subtle)] flex items-center gap-2">
          <svg className="w-4 h-4 text-[var(--db-warning-text)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-semibold text-[var(--db-warning-text)]">
            {t('db.qshe.joursArret', { count: securite.joursArretTotal })}
          </p>
        </div>
      )}
    </BentoCard>
  )
}
