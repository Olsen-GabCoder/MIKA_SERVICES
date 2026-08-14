import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StatutTache } from '@/types/planning'

export interface PlanningDonutProps {
  counts: Record<StatutTache, number>
  colSpanClass?: string
}

const COLORS: Record<StatutTache, string> = {
  [StatutTache.A_FAIRE]: '#94A3B8',
  [StatutTache.EN_COURS]: 'var(--db-teal)',
  [StatutTache.EN_ATTENTE]: 'var(--db-orange)',
  [StatutTache.TERMINEE]: 'var(--db-success)',
  [StatutTache.ANNULEE]: 'var(--db-danger)',
}

export function PlanningDonut({ counts, colSpanClass = 'col-span-12 lg:col-span-4' }: PlanningDonutProps) {
  const { t } = useTranslation('planning')
  const [hoverKey, setHoverKey] = useState<StatutTache | null>(null)

  const segments = useMemo(() => {
    const entries = Object.entries(counts).filter(([, v]) => v > 0) as [StatutTache, number][]
    const total = entries.reduce((s, [, v]) => s + v, 0)
    const circ = 2 * Math.PI * 40
    let offset = 0
    return entries.map(([key, value]) => {
      const dash = (value / Math.max(total, 1)) * circ
      const seg = { key, value, pct: Math.round((value / Math.max(total, 1)) * 100), dash, offset, color: COLORS[key] }
      offset -= dash
      return seg
    })
  }, [counts])

  const total = segments.reduce((s, seg) => s + seg.value, 0)

  if (total === 0) return null

  return (
    <div
      className={`${colSpanClass} rounded-2xl p-5 relative overflow-hidden`}
      style={{ background: 'var(--db-card)', animation: 'db-rise 380ms ease-out 210ms both' }}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--db-t3)' }}>
          {t('donutTitle', { defaultValue: 'Répartition par statut' })}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
        {/* Donut SVG */}
        <div className="relative w-full" style={{ aspectRatio: '1' }} onMouseLeave={() => setHoverKey(null)}>
          <svg viewBox="0 0 100 100">
            <circle cx={50} cy={50} r={40} fill="none" stroke="var(--db-subtle)" strokeWidth={14} />
            {segments.map((seg, i) => {
              const isHovered = hoverKey === seg.key
              return (
                <circle
                  key={seg.key} cx={50} cy={50} r={40} fill="none"
                  stroke={seg.color}
                  strokeWidth={isHovered ? 18 : 14}
                  strokeDasharray={`${seg.dash} ${2 * Math.PI * 40}`}
                  strokeDashoffset={seg.offset}
                  transform="rotate(-90 50 50)"
                  onMouseEnter={() => setHoverKey(seg.key)}
                  style={{
                    '--db-arc-circ': `${2 * Math.PI * 40}`,
                    animation: `db-arc-fill 1s cubic-bezier(0.22, 1, 0.36, 1) ${200 + i * 120}ms both`,
                    transition: 'stroke-width 200ms',
                    cursor: 'pointer',
                    filter: isHovered ? 'brightness(1.1)' : undefined,
                  } as React.CSSProperties}
                />
              )
            })}
          </svg>

          {/* Centre */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {hoverKey ? (
              <>
                <div className="text-2xl font-bold db-tight db-num" style={{ color: 'var(--db-t1)' }}>
                  {segments.find((s) => s.key === hoverKey)?.value ?? 0}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-center px-2 truncate max-w-[80px]" style={{ color: 'var(--db-t3)' }}>
                  {t(`statut.${hoverKey}`)}
                </div>
              </>
            ) : (
              <>
                <div className="text-3xl font-bold db-tight db-num" style={{ color: 'var(--db-t1)' }}>{total}</div>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--db-t3)' }}>{t('kpiTotal')}</div>
              </>
            )}
          </div>
        </div>

        {/* Legende */}
        <div className="flex flex-col gap-2">
          {segments.map((seg) => {
            const isHovered = hoverKey === seg.key
            return (
              <div
                key={seg.key}
                className="flex items-center gap-2.5 text-sm px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-150"
                style={{ background: isHovered ? 'var(--db-subtle)' : 'transparent', color: 'var(--db-t2)' }}
                onMouseEnter={() => setHoverKey(seg.key)}
                onMouseLeave={() => setHoverKey(null)}
              >
                <span
                  className="w-3 h-3 rounded shrink-0 transition-transform duration-150"
                  style={{ background: seg.color, transform: isHovered ? 'scale(1.3)' : 'scale(1)' }}
                />
                <span className="flex-1 truncate text-xs font-medium" style={{ fontWeight: isHovered ? 600 : 500, color: isHovered ? 'var(--db-t1)' : undefined }}>
                  {t(`statut.${seg.key}`)}
                </span>
                <span className="font-bold db-num text-sm shrink-0" style={{ color: isHovered ? seg.color : 'var(--db-t1)' }}>{seg.value}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
