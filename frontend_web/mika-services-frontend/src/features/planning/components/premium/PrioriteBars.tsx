import { useTranslation } from 'react-i18next'
import { Priorite } from '@/types/planning'
import type { Tache } from '@/types/planning'

export interface PrioriteBarsProps {
  taches: Tache[]
}

const PRIO_ORDER: Priorite[] = [Priorite.BASSE, Priorite.NORMALE, Priorite.HAUTE, Priorite.URGENTE, Priorite.CRITIQUE]

const PRIO_COLORS: Record<Priorite, string> = {
  [Priorite.BASSE]: '#8FA3AD',
  [Priorite.NORMALE]: '#6B7280',
  [Priorite.HAUTE]: 'var(--db-orange)',
  [Priorite.URGENTE]: '#E4572E',
  [Priorite.CRITIQUE]: 'var(--db-danger)',
}

export function PrioriteBars({ taches }: PrioriteBarsProps) {
  const { t } = useTranslation('planning')

  const counts = PRIO_ORDER.map((p) => ({
    key: p,
    count: taches.filter((task) => task.priorite === p).length,
  }))
  const total = taches.length
  if (total === 0) return null

  return (
    <div style={{
      background: 'var(--db-card)',
      border: '1px solid var(--db-border)',
      borderRadius: 'var(--db-radius)',
      padding: '16px 18px',
    }}>
      <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 14 }}>
        {t('prioriteBarsTitle', { defaultValue: 'Répartition par priorité' })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {counts.map((item) => {
          const pct = Math.round((item.count / Math.max(total, 1)) * 100)
          return (
            <div key={item.key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{
                  width: 9, height: 9, minWidth: 9,
                  borderRadius: 3, background: PRIO_COLORS[item.key],
                }} />
                <span style={{ fontSize: 11.5, fontWeight: 600, flex: 1 }}>
                  {t(`priorite.${item.key}`)}
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                  {item.count}
                </span>
                <span style={{ fontSize: 10.5, color: 'var(--db-t3)', minWidth: 32, textAlign: 'right' as const }}>
                  {pct}%
                </span>
              </div>
              <div style={{ height: 7, borderRadius: 4, background: 'var(--db-subtle)', overflow: 'hidden' }}>
                <div style={{
                  width: `${pct}%`, height: '100%',
                  borderRadius: 4,
                  background: PRIO_COLORS[item.key],
                  transition: 'width .5s ease',
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
