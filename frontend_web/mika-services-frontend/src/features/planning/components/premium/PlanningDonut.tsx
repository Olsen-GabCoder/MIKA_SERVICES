import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StatutTache } from '@/types/planning'

export interface PlanningDonutProps {
  counts: Record<StatutTache, number>
  label?: string
  subtitle?: string
  large?: boolean
}

const STATUT_ORDER: StatutTache[] = [
  StatutTache.A_FAIRE,
  StatutTache.EN_COURS,
  StatutTache.EN_ATTENTE,
  StatutTache.TERMINEE,
  StatutTache.ANNULEE,
]

const COLORS: Record<StatutTache, string> = {
  [StatutTache.A_FAIRE]: '#6B7280',
  [StatutTache.EN_COURS]: 'var(--db-info)',
  [StatutTache.EN_ATTENTE]: 'var(--db-warn)',
  [StatutTache.TERMINEE]: 'var(--db-success)',
  [StatutTache.ANNULEE]: '#B08078',
}

export function PlanningDonut({ counts, label, subtitle, large }: PlanningDonutProps) {
  const { t } = useTranslation('planning')
  const [hoverKey, setHoverKey] = useState<StatutTache | null>(null)

  const segments = useMemo(() => {
    return STATUT_ORDER.map((k) => ({ key: k, value: counts[k] || 0 }))
  }, [counts])

  const total = segments.reduce((s, x) => s + x.value, 0)
  if (total === 0) return null

  // Build conic-gradient stops
  const stops: string[] = []
  let acc = 0
  segments.forEach((x) => {
    if (x.value > 0) {
      const from = (acc / total) * 360
      const to = ((acc + x.value) / total) * 360
      stops.push(`${COLORS[x.key]} ${from}deg ${to}deg`)
    }
    acc += x.value
  })

  const hoveredSeg = hoverKey ? segments.find((s) => s.key === hoverKey) : null

  return (
    <div style={{
      background: 'var(--db-card)',
      border: '1px solid var(--db-border)',
      borderRadius: 'var(--db-radius)',
      padding: '16px 18px',
    }}>
      <div style={{ fontSize: 13.5, fontWeight: 800 }}>
        {label || t('donutTitle', { defaultValue: 'Répartition par statut' })}
      </div>
      <div style={{ fontSize: 11, color: 'var(--db-t3)', marginTop: 3, marginBottom: 14 }}>
        {subtitle || `${total} tâches du projet`}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        {/* Donut */}
        <div style={{ position: 'relative', width: large ? 140 : 132, height: large ? 140 : 132, minWidth: large ? 140 : 132 }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: `conic-gradient(${stops.length ? stops.join(',') : 'var(--db-subtle) 0deg 360deg'})`,
          }} />
          <div style={{
            position: 'absolute', inset: large ? 34 : 32, borderRadius: '50%',
            background: 'var(--db-card)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              fontSize: large ? 24 : 23, fontWeight: 800, lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {hoveredSeg ? hoveredSeg.value : total}
            </div>
            <div style={{
              fontSize: 10, fontWeight: 700,
              letterSpacing: '.08em', textTransform: 'uppercase' as const,
              color: 'var(--db-t3)', marginTop: 3,
            }}>
              {hoveredSeg ? t(`statut.${hoverKey}`) : 'tâches'}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
          {segments.map((seg) => (
            <div
              key={seg.key}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '3px 6px',
                borderRadius: 'var(--db-radius-xs)',
                cursor: 'default',
                background: hoverKey === seg.key ? 'var(--db-subtle)' : 'transparent',
              }}
              onMouseEnter={() => setHoverKey(seg.key)}
              onMouseLeave={() => setHoverKey(null)}
            >
              <span style={{
                width: 9, height: 9, minWidth: 9,
                borderRadius: 3, background: COLORS[seg.key],
              }} />
              <span style={{ fontSize: 11.5, fontWeight: 600, flex: 1 }}>
                {t(`statut.${seg.key}`)}
              </span>
              <span style={{
                fontSize: 11.5, fontWeight: 800,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {seg.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
