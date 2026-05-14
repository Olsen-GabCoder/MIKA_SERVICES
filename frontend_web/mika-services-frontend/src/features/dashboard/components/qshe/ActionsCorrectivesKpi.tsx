import { useTranslation } from 'react-i18next'
import { KpiCard } from '../shared/KpiCard'

export interface ActionsCorrectivesKpiProps {
  enRetard: number
  loading?: boolean
}

export function ActionsCorrectivesKpi({ enRetard, loading = false }: ActionsCorrectivesKpiProps) {
  const { t } = useTranslation('common')
  const hasOverdue = enRetard > 0

  return (
    <KpiCard
      label={t('db.qshe.actionsEnRetard')}
      value={enRetard}
      sub=""
      accent={hasOverdue ? 'var(--db-warning-text)' : 'var(--db-success-text)'}
      variant={hasOverdue ? 'alert' : 'standard'}
      badge={hasOverdue ? { text: t('db.qshe.actionRequise'), variant: 'warning' as const } : undefined}
      href="/qshe"
      loading={loading}
      colSpan={4}
      colSpanTablet={6}
      colSpanMobile={6}
      icon={
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
        </svg>
      }
    />
  )
}
