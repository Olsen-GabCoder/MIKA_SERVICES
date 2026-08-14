import { useTranslation } from 'react-i18next'
import { Priorite } from '@/types/planning'
import type { Tache } from '@/types/planning'

export interface PrioriteBarsProps {
  taches: Tache[]
  colSpanClass?: string
}

const PRIO_ORDER: Priorite[] = [Priorite.CRITIQUE, Priorite.URGENTE, Priorite.HAUTE, Priorite.NORMALE, Priorite.BASSE]

const PRIO_COLORS: Record<Priorite, string> = {
  [Priorite.CRITIQUE]: 'var(--db-danger)',
  [Priorite.URGENTE]: 'var(--db-danger)',
  [Priorite.HAUTE]: 'var(--db-orange)',
  [Priorite.NORMALE]: 'var(--db-teal)',
  [Priorite.BASSE]: 'var(--db-t3)',
}

export function PrioriteBars({ taches, colSpanClass = 'col-span-12 lg:col-span-4' }: PrioriteBarsProps) {
  const { t } = useTranslation('planning')

  const counts = PRIO_ORDER.map((p) => ({ key: p, count: taches.filter((task) => task.priorite === p).length }))
  const max = Math.max(...counts.map((c) => c.count), 1)
  const total = taches.length

  if (total === 0) return null

  return (
    <div
      className={`${colSpanClass} rounded-xl p-5`}
      style={{ background: 'var(--db-card)', animation: 'db-rise 380ms ease-out 270ms both' }}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--db-t3)' }}>
          {t('prioriteBarsTitle', { defaultValue: 'Répartition par priorité' })}
        </span>
      </div>

      <div className="space-y-4">
        {counts.map((item, idx) => {
          const pct = Math.round((item.count / Math.max(total, 1)) * 100)
          const barWidth = Math.max((item.count / max) * 100, item.count > 0 ? 8 : 0)
          return (
            <div key={item.key} style={{ animation: `db-rise 280ms ease-out ${idx * 40}ms both` }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium" style={{ color: 'var(--db-t2)' }}>
                  {t(`priorite.${item.key}`)}
                </span>
                <span className="text-sm font-bold db-num" style={{ color: item.count > 0 ? PRIO_COLORS[item.key] : 'var(--db-t4)' }}>
                  {item.count}
                  <span className="text-xs font-normal ml-1.5" style={{ color: 'var(--db-t4)' }}>{pct}%</span>
                </span>
              </div>
              <div className="h-2 rounded-sm overflow-hidden" style={{ background: 'var(--db-subtle)' }}>
                <div
                  className="h-full rounded-sm db-progress-fill"
                  style={{ width: `${barWidth}%`, background: PRIO_COLORS[item.key] }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
