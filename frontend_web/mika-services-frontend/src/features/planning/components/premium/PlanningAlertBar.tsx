import { useTranslation } from 'react-i18next'
import type { Tache } from '@/types/planning'
import { Priorite } from '@/types/planning'

export interface PlanningAlertBarProps {
  tachesEnRetard: Tache[]
  selectedProjetId: number | null
}

function Item({ value, label, variant }: { value: number; label: string; variant: 'danger' | 'warn' | 'muted' }) {
  const colorMap = { danger: 'var(--db-danger)', warn: 'var(--db-warn)', muted: 'var(--db-t1)' }
  return (
    <span className="inline-flex items-baseline gap-2 px-4 text-sm" style={{ color: 'var(--db-t2)' }}>
      <span
        className="font-bold text-base db-num db-tight"
        style={{ color: colorMap[variant], animation: value > 0 ? 'db-alert-ping 2s ease-in-out infinite' : undefined }}
      >
        {value}
      </span>
      {label}
    </span>
  )
}

export function PlanningAlertBar({ tachesEnRetard, selectedProjetId }: PlanningAlertBarProps) {
  const { t } = useTranslation('planning')

  const filtered = selectedProjetId
    ? tachesEnRetard.filter((tr) => tr.projetId === selectedProjetId)
    : tachesEnRetard

  if (filtered.length === 0) return null

  const critiques = filtered.filter((tr) => tr.priorite === Priorite.CRITIQUE || tr.priorite === Priorite.URGENTE).length
  const hautes = filtered.filter((tr) => tr.priorite === Priorite.HAUTE).length

  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-xl px-4 py-3 mb-3 overflow-hidden"
      style={{ background: 'var(--db-card)', animation: 'db-rise 380ms ease-out 30ms both' }}
    >
      <span
        className="text-xs uppercase tracking-widest pr-3 mr-1 border-r font-semibold shrink-0"
        style={{ color: 'var(--db-t4)', borderColor: 'var(--db-border)' }}
      >
        {t('alertesLabel', { defaultValue: 'Alertes' })}
      </span>

      <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
        <Item value={filtered.length} label={t('kpiEnRetard')} variant="danger" />
        {critiques > 0 && <Item value={critiques} label={t('alertesCritiques', { defaultValue: 'critiques' })} variant="danger" />}
        {hautes > 0 && <Item value={hautes} label={t('priorite.HAUTE')} variant="warn" />}
      </div>

      <span className="ml-auto hidden sm:inline-flex items-center gap-2 text-xs uppercase tracking-widest font-medium" style={{ color: 'var(--db-t3)' }}>
        <span className="w-2 h-2 rounded-full" style={{ background: 'var(--db-danger)', animation: 'db-pulse 2s infinite' }} />
        {t('kpiEnRetardSub')}
      </span>
    </div>
  )
}
