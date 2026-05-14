import { useTranslation } from 'react-i18next'
import { useFormatDate } from '@/hooks/useFormatDate'
import { BentoCard } from '../shared/BentoCard'
import type { BentoCardProps } from '../shared/BentoCard'
import type { ReunionHebdoSummary } from '@/types/reunionHebdo'

export interface ReunionInfoProps {
  data: ReunionHebdoSummary | null
  loading?: boolean
  colSpan?: BentoCardProps['colSpan']
}

export function ReunionInfo({ data, loading = false, colSpan = 6 }: ReunionInfoProps) {
  const { t } = useTranslation('common')
  const formatDate = useFormatDate()

  return (
    <BentoCard
      title={t('db.transversal.reunions')}
      subtitle={t('db.transversal.reunionsSubtitle')}
      href="/salle-mika/pv"
      loading={loading}
      colSpan={colSpan}
      colSpanTablet={12}
      colSpanMobile={12}
    >
      {!data ? (
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <svg className="w-10 h-10 text-[var(--db-text-faint)] opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <p className="text-sm text-[var(--db-text-faint)]">{t('db.transversal.reunionsEmpty')}</p>
        </div>
      ) : (
        <div className="flex items-start gap-4">
          {/* Calendar icon */}
          <div className="w-12 h-12 rounded-xl bg-[var(--db-accent-muted)] flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-[var(--db-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            {/* Date */}
            <p className="db-display-num text-lg text-[var(--db-text-primary)]">
              {formatDate(data.dateReunion, { monthStyle: 'long', weekday: 'long' })}
            </p>

            {/* Lieu */}
            {data.lieu && (
              <p className="text-xs text-[var(--db-text-muted)] mt-0.5">{data.lieu}</p>
            )}

            {/* Status badge */}
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold border ${
                data.statut === 'VALIDE'
                  ? 'bg-[var(--db-success-bg)] text-[var(--db-success-text)] border-[var(--db-success-border)]'
                  : 'bg-[var(--db-warning-bg)] text-[var(--db-warning-text)] border-[var(--db-warning-border)]'
              }`}>
                {data.statut === 'VALIDE' ? t('db.transversal.reunionStatutValide') : t('db.transversal.reunionStatutBrouillon')}
              </span>
            </div>

            {/* Footer info */}
            <p className="text-[10px] text-[var(--db-text-faint)] mt-2">
              {t('db.transversal.reunionParticipants', { count: data.nombreParticipants })}
              {' · '}
              {t('db.transversal.reunionPointsProjet', { count: data.nombrePointsProjet })}
            </p>

            {/* Redacteur */}
            {data.redacteurNom && (
              <p className="text-[10px] text-[var(--db-text-faint)] mt-0.5">
                {t('db.transversal.reunionRedacteur', { nom: data.redacteurNom })}
              </p>
            )}
          </div>
        </div>
      )}
    </BentoCard>
  )
}
