import { useTranslation } from 'react-i18next'
import type { Tache } from '@/types/planning'
import { Priorite } from '@/types/planning'

export interface PlanningAlertBarProps {
  tachesEnRetard: Tache[]
  selectedProjetId: number | null
}

export function PlanningAlertBar({ tachesEnRetard, selectedProjetId }: PlanningAlertBarProps) {
  const { t } = useTranslation('planning')

  const filtered = selectedProjetId
    ? tachesEnRetard.filter((tr) => tr.projetId === selectedProjetId)
    : tachesEnRetard

  if (filtered.length === 0) return null

  const critiques = filtered.filter((tr) => tr.priorite === Priorite.CRITIQUE || tr.priorite === Priorite.URGENTE).length
  const hautes = filtered.filter((tr) => tr.priorite === Priorite.HAUTE).length

  const chips = [
    critiques > 0 && `${critiques} critiques / urgentes`,
    hautes > 0 && `${hautes} haute priorité`,
  ].filter(Boolean) as string[]

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      background: 'var(--db-danger-bg2)',
      border: '1px solid var(--db-danger)',
      borderRadius: 'var(--db-radius)',
      padding: '12px 16px',
    }}>
      <span style={{
        width: 9, height: 9, minWidth: 9, borderRadius: '50%',
        background: 'var(--db-danger)',
        animation: 'mkPulse 1.8s ease-in-out infinite',
      }} />
      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--db-danger)' }}>
        {filtered.length} {t('kpiEnRetard', { defaultValue: 'tâches en retard' })}
      </span>
      <div style={{ display: 'flex', gap: 7 }}>
        {chips.map((label) => (
          <span key={label} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 11, fontWeight: 700,
            color: 'var(--db-danger)', background: 'transparent',
            border: '1px solid var(--db-danger)',
            borderRadius: 'var(--db-radius-xs)', padding: '3px 7px',
            whiteSpace: 'nowrap',
          }}>{label}</span>
        ))}
      </div>
      <span style={{ fontSize: 12, color: 'var(--db-t2)' }}>
        À traiter en priorité — l'échéance contractuelle est dépassée.
      </span>
      <button style={{
        marginLeft: 'auto', height: 34, padding: '0 12px',
        border: '1px solid var(--db-danger)',
        background: 'transparent',
        color: 'var(--db-danger)',
        borderRadius: 'var(--db-radius-xs)',
        fontSize: 12, fontWeight: 700, cursor: 'pointer',
      }}>Voir les retards</button>
    </div>
  )
}
