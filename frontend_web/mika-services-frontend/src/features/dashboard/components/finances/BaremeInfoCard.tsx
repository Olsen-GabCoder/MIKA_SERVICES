import { useTranslation } from 'react-i18next'
import { useFormatDate } from '@/hooks/useFormatDate'
import { BentoCard } from '../shared/BentoCard'
import type { BaremeVersion } from '@/features/bareme/types'

export interface BaremeInfoCardProps {
  data: BaremeVersion | null
  loading?: boolean
}

export function BaremeInfoCard({ data, loading = false }: BaremeInfoCardProps) {
  const { t } = useTranslation('common')
  const formatDate = useFormatDate()

  const hasDate = data?.derniereMiseAJour != null

  return (
    <BentoCard
      title={t('db.finances.bareme')}
      href="/bareme"
      loading={loading}
      colSpan={6}
      colSpanTablet={6}
      colSpanMobile={12}
    >
      <div className="flex items-center gap-4">
        {/* Calendar icon */}
        <div className="w-12 h-12 rounded-xl bg-[var(--db-accent-muted)] flex items-center justify-center shrink-0">
          <svg className="w-6 h-6 text-[var(--db-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
        </div>

        <div>
          <p className="text-[10px] font-bold text-[var(--db-text-faint)] uppercase tracking-widest mb-0.5">
            {t('db.finances.baremeUpdate')}
          </p>
          {hasDate ? (
            <p className="db-display-num text-lg text-[var(--db-text-primary)]">
              {formatDate(data!.derniereMiseAJour!, { monthStyle: 'long' })}
            </p>
          ) : (
            <p className="text-sm text-[var(--db-text-faint)]">
              {t('db.finances.baremeAucune')}
            </p>
          )}
        </div>
      </div>
    </BentoCard>
  )
}
