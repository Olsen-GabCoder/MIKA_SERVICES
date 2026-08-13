import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Tache, DependanceResponse } from '@/types/planning'

interface GanttChartProps {
  taches: Tache[]
  dependances: DependanceResponse[]
  cheminCritique: number[]
  onEdit?: (tache: Tache) => void
}

const STATUT_COLORS: Record<string, string> = {
  A_FAIRE: '#94a3b8',
  EN_COURS: '#3b82f6',
  EN_ATTENTE: '#f59e0b',
  TERMINEE: '#22c55e',
  ANNULEE: '#ef4444',
}

const DAY_WIDTH = 28
const ROW_HEIGHT = 36
const HEADER_HEIGHT = 56
const LEFT_PANEL_WIDTH = 280

export function GanttChart({ taches, dependances, cheminCritique, onEdit }: GanttChartProps) {
  const { t } = useTranslation('planning')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  const { startDate, days, months } = useMemo(() => {
    const dates = taches.flatMap((t) => [t.dateDebut, t.dateFin, t.dateEcheance].filter(Boolean) as string[])
    if (dates.length === 0) {
      const now = new Date()
      const s = new Date(now.getFullYear(), now.getMonth(), 1)
      const e = new Date(now.getFullYear(), now.getMonth() + 3, 0)
      return { startDate: s, endDate: e, days: getDays(s, e), months: getMonths(s, e) }
    }
    const sorted = dates.map((d) => new Date(d)).sort((a, b) => a.getTime() - b.getTime())
    const s = new Date(sorted[0])
    s.setDate(s.getDate() - 7) // 1 week padding
    const e = new Date(sorted[sorted.length - 1])
    e.setDate(e.getDate() + 14) // 2 weeks padding
    return { startDate: s, endDate: e, days: getDays(s, e), months: getMonths(s, e) }
  }, [taches])

  const totalWidth = days.length * DAY_WIDTH
  const totalHeight = taches.length * ROW_HEIGHT

  const sortedTaches = useMemo(() => {
    return [...taches].sort((a, b) => {
      if (a.ordreAffichage != null && b.ordreAffichage != null) return a.ordreAffichage - b.ordreAffichage
      if (a.ordreAffichage != null) return -1
      if (b.ordreAffichage != null) return 1
      const da = a.dateDebut || a.dateEcheance || '9999'
      const db = b.dateDebut || b.dateEcheance || '9999'
      return da.localeCompare(db)
    })
  }, [taches])

  function dayOffset(dateStr: string): number {
    const d = new Date(dateStr)
    return Math.floor((d.getTime() - startDate.getTime()) / 86400000)
  }

  if (taches.length === 0) {
    return (
      <div className="col-span-12 rounded-xl p-8 text-center" style={{ background: 'var(--db-card)' }}>
        <p className="text-sm" style={{ color: 'var(--db-t4)' }}>{t('ganttEmpty', { defaultValue: 'Aucune tache avec des dates pour afficher le Gantt' })}</p>
      </div>
    )
  }

  return (
    <div className="col-span-12 rounded-xl overflow-hidden border" style={{ background: 'var(--db-card)', borderColor: 'var(--db-border)' }}>
      <div className="flex">
        {/* Left panel: task names */}
        <div style={{ width: LEFT_PANEL_WIDTH, flexShrink: 0 }}>
          <div
            className="flex items-center px-3 font-semibold text-xs uppercase tracking-wider border-b"
            style={{ height: HEADER_HEIGHT, borderColor: 'var(--db-border)', color: 'var(--db-t3)', background: 'var(--db-subtle)' }}
          >
            {t('ganttTaches', { defaultValue: 'Taches' })}
          </div>
          {sortedTaches.map((tache) => (
            <div
              key={tache.id}
              className="flex items-center px-3 border-b cursor-pointer transition-colors"
              style={{
                height: ROW_HEIGHT,
                borderColor: 'var(--db-border)',
                background: hoveredId === tache.id ? 'var(--db-subtle)' : 'transparent',
                color: 'var(--db-t1)',
              }}
              onMouseEnter={() => setHoveredId(tache.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onEdit?.(tache)}
            >
              <span className="text-xs truncate flex-1">
                {tache.estJalon ? '\u25C6 ' : ''}{tache.titre}
              </span>
              <span className="text-[10px] ml-1 db-num" style={{ color: 'var(--db-t4)' }}>
                {tache.pourcentageAvancement}%
              </span>
            </div>
          ))}
        </div>

        {/* Right panel: timeline */}
        <div ref={scrollRef} className="overflow-x-auto flex-1 border-l" style={{ borderColor: 'var(--db-border)' }}>
          <div style={{ width: totalWidth, minWidth: '100%' }}>
            {/* Month headers */}
            <div className="flex border-b" style={{ height: HEADER_HEIGHT / 2, borderColor: 'var(--db-border)', background: 'var(--db-subtle)' }}>
              {months.map((m, i) => (
                <div
                  key={i}
                  className="text-[10px] font-semibold uppercase tracking-wider flex items-center justify-center border-r"
                  style={{ width: m.days * DAY_WIDTH, borderColor: 'var(--db-border)', color: 'var(--db-t3)' }}
                >
                  {m.label}
                </div>
              ))}
            </div>
            {/* Day headers */}
            <div className="flex border-b" style={{ height: HEADER_HEIGHT / 2, borderColor: 'var(--db-border)', background: 'var(--db-subtle)' }}>
              {days.map((d, i) => {
                const isWeekend = d.getDay() === 0 || d.getDay() === 6
                return (
                  <div
                    key={i}
                    className="text-[9px] flex items-center justify-center border-r"
                    style={{
                      width: DAY_WIDTH, borderColor: 'var(--db-border)',
                      color: isWeekend ? 'var(--db-t5)' : 'var(--db-t4)',
                      background: isWeekend ? 'color-mix(in srgb, var(--db-subtle) 80%, var(--db-border))' : undefined,
                    }}
                  >
                    {d.getDate()}
                  </div>
                )
              })}
            </div>

            {/* Bars */}
            <div style={{ position: 'relative', height: totalHeight }}>
              {/* Weekend columns */}
              {days.map((d, i) => {
                const isWeekend = d.getDay() === 0 || d.getDay() === 6
                if (!isWeekend) return null
                return (
                  <div
                    key={`we-${i}`}
                    style={{
                      position: 'absolute', left: i * DAY_WIDTH, top: 0,
                      width: DAY_WIDTH, height: totalHeight,
                      background: 'color-mix(in srgb, var(--db-subtle) 50%, transparent)',
                    }}
                  />
                )
              })}

              {/* Today line */}
              {(() => {
                const todayOff = dayOffset(new Date().toISOString().slice(0, 10))
                if (todayOff >= 0 && todayOff < days.length) {
                  return (
                    <div
                      style={{
                        position: 'absolute', left: todayOff * DAY_WIDTH + DAY_WIDTH / 2 - 1, top: 0,
                        width: 2, height: totalHeight, background: '#ef4444', opacity: 0.6, zIndex: 5,
                      }}
                    />
                  )
                }
                return null
              })()}

              {/* Task bars */}
              {sortedTaches.map((tache, rowIdx) => {
                const dStr = tache.dateDebut || tache.dateEcheance
                const fStr = tache.dateFin || tache.dateEcheance || tache.dateDebut
                if (!dStr) return null

                const left = dayOffset(dStr) * DAY_WIDTH
                const barDays = fStr ? Math.max(1, dayOffset(fStr) - dayOffset(dStr) + 1) : 1
                const width = barDays * DAY_WIDTH
                const top = rowIdx * ROW_HEIGHT + 6
                const isCritical = cheminCritique.includes(tache.id)
                const color = tache.couleur || STATUT_COLORS[tache.statut] || '#94a3b8'

                if (tache.estJalon) {
                  return (
                    <div
                      key={tache.id}
                      style={{
                        position: 'absolute', left: left + DAY_WIDTH / 2 - 10, top: top + 2,
                        width: 20, height: 20, transform: 'rotate(45deg)',
                        background: color, border: isCritical ? '2px solid #ef4444' : undefined,
                        cursor: 'pointer', zIndex: 10,
                      }}
                      title={`${tache.titre} (jalon)`}
                      onClick={() => onEdit?.(tache)}
                      onMouseEnter={() => setHoveredId(tache.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    />
                  )
                }

                return (
                  <div
                    key={tache.id}
                    style={{
                      position: 'absolute', left, top, width, height: ROW_HEIGHT - 12,
                      borderRadius: 6, overflow: 'hidden', cursor: 'pointer', zIndex: 10,
                      background: `color-mix(in srgb, ${color} 25%, var(--db-card))`,
                      border: isCritical ? `2px solid #ef4444` : `1px solid ${color}`,
                      boxShadow: hoveredId === tache.id ? '0 2px 8px rgba(0,0,0,0.15)' : undefined,
                    }}
                    title={`${tache.titre} — ${tache.pourcentageAvancement}%`}
                    onClick={() => onEdit?.(tache)}
                    onMouseEnter={() => setHoveredId(tache.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* Progress fill */}
                    <div
                      style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0,
                        width: `${tache.pourcentageAvancement}%`,
                        background: color, opacity: 0.7,
                      }}
                    />
                    {width > 50 && (
                      <span
                        className="text-[10px] font-medium truncate relative px-1.5"
                        style={{ color: 'var(--db-t1)', zIndex: 1, lineHeight: `${ROW_HEIGHT - 12}px` }}
                      >
                        {tache.titre}
                      </span>
                    )}
                  </div>
                )
              })}

              {/* Dependency arrows (simplified) */}
              <svg style={{ position: 'absolute', top: 0, left: 0, width: totalWidth, height: totalHeight, pointerEvents: 'none', zIndex: 15 }}>
                {dependances.map((dep) => {
                  const sourceIdx = sortedTaches.findIndex((t) => t.id === dep.tacheSourceId)
                  const cibleIdx = sortedTaches.findIndex((t) => t.id === dep.tacheCibleId)
                  if (sourceIdx === -1 || cibleIdx === -1) return null

                  const source = sortedTaches[sourceIdx]
                  const cible = sortedTaches[cibleIdx]
                  const sEnd = source.dateFin || source.dateEcheance || source.dateDebut
                  const cStart = cible.dateDebut || cible.dateEcheance
                  if (!sEnd || !cStart) return null

                  const x1 = (dayOffset(sEnd) + 1) * DAY_WIDTH
                  const y1 = sourceIdx * ROW_HEIGHT + ROW_HEIGHT / 2
                  const x2 = dayOffset(cStart) * DAY_WIDTH
                  const y2 = cibleIdx * ROW_HEIGHT + ROW_HEIGHT / 2

                  return (
                    <g key={dep.id}>
                      <path
                        d={`M ${x1} ${y1} C ${x1 + 20} ${y1}, ${x2 - 20} ${y2}, ${x2} ${y2}`}
                        fill="none"
                        stroke="var(--db-t4)"
                        strokeWidth={1.5}
                        strokeDasharray={dep.typeDependance !== 'FIN_DEBUT' ? '4 3' : undefined}
                      />
                      {/* Arrow head */}
                      <polygon
                        points={`${x2},${y2} ${x2 - 6},${y2 - 4} ${x2 - 6},${y2 + 4}`}
                        fill="var(--db-t4)"
                      />
                    </g>
                  )
                })}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getDays(start: Date, end: Date): Date[] {
  const days: Date[] = []
  const cur = new Date(start)
  while (cur <= end) {
    days.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

function getMonths(start: Date, end: Date): { label: string; days: number }[] {
  const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec']
  const months: { label: string; days: number }[] = []
  const cur = new Date(start)
  while (cur <= end) {
    const m = cur.getMonth()
    const y = cur.getFullYear()
    const endOfMonth = new Date(y, m + 1, 0)
    const last = endOfMonth > end ? end : endOfMonth
    const daysInRange = Math.floor((last.getTime() - cur.getTime()) / 86400000) + 1
    months.push({ label: `${MONTH_NAMES[m]} ${y}`, days: daysInRange })
    cur.setFullYear(y, m + 1, 1)
  }
  return months
}
