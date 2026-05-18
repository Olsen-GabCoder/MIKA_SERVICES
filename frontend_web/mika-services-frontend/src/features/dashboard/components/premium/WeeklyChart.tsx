import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { WeekSummary } from '@/types/reporting'

export interface WeeklyChartProps { weeks: WeekSummary[] }

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2
    const t = 0.22
    d += ` C ${p1.x + (p2.x - p0.x) * t} ${p1.y + (p2.y - p0.y) * t}, ${p2.x - (p3.x - p1.x) * t} ${p2.y - (p3.y - p1.y) * t}, ${p2.x} ${p2.y}`
  }
  return d
}

export function WeeklyChart({ weeks }: WeeklyChartProps) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const W = 800, H = 240, padL = 42, padR = 42, padT = 14, padB = 30
  const innerW = W - padL - padR, innerH = H - padT - padB

  const bars = useMemo(() => weeks.map(w => w.terminees), [weeks])
  const line = useMemo(() => weeks.map(w => w.avancementMoyen), [weeks])
  const labels = useMemo(() => weeks.map(w => w.label), [weeks])

  if (weeks.length === 0) return (
    <div className="col-span-12 lg:col-span-8 rounded-xl p-4 flex items-center justify-center h-[280px] text-[12px]" style={{ background: 'var(--db-card)', color: 'var(--db-t3)' }}>
      {t('db.operations.emptyWeekly')}
    </div>
  )

  const barMax = Math.max(...bars, 1) * 1.2
  const lineMin = 0, lineMax = Math.max(...line, 100) * 1.1
  const slot = innerW / bars.length, barW = Math.min(22, slot * 0.45)

  const pts = line.map((v, i) => ({
    x: padL + slot * i + slot / 2,
    y: padT + (1 - (v - lineMin) / (lineMax - lineMin)) * innerH,
  }))
  const path = smoothPath(pts)
  const baseline = padT + innerH

  const hoveredWeek = hoverIdx !== null && hoverIdx < weeks.length ? weeks[hoverIdx] : null
  const hoveredX = hoverIdx !== null ? padL + slot * hoverIdx + slot / 2 : 0

  // Y ticks gauche (jalons terminés)
  const yTicksBar = [0, 1, 2, 3].map(g => ({
    y: padT + (g / 3) * innerH,
    val: Math.round(barMax * (1 - g / 3)),
  }))

  // Y ticks droite (avancement %)
  const yTicksLine = [0, 1, 2, 3].map(g => ({
    y: padT + (g / 3) * innerH,
    val: Math.round(lineMax * (1 - g / 3)),
  }))

  return (
    <div className="col-span-12 lg:col-span-8 rounded-2xl p-5 relative overflow-hidden" style={{ background: 'var(--db-card)', animation: 'db-rise 380ms ease-out 240ms both' }}>
      <div className="flex items-center gap-2.5 mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--db-t3)' }}>{t('db.premium.progressionHebdo')}</span>
        <div className="ml-auto flex gap-4 text-[10px]" style={{ color: 'var(--db-t3)' }}>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: 'var(--db-teal-dk)', opacity: 0.85 }} />{t('db.premium.jalonsLivres')}</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: 'var(--db-orange)' }} />{t('db.premium.avancementPct')}</span>
          <span onClick={() => navigate('/planning')} className="cursor-pointer hover:text-[var(--db-t1)] transition-colors">{t('db.premium.voirTous')} →</span>
        </div>
      </div>

      <div className="relative">
        <svg
          className="w-full block"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          style={{ height: 240 }}
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id="wk-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--db-orange)" stopOpacity={0.15} />
              <stop offset="100%" stopColor="var(--db-orange)" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Grille + labels Y gauche (jalons) */}
          {yTicksBar.map((tick, g) => (
            <g key={g}>
              <line x1={padL} x2={W - padR} y1={tick.y} y2={tick.y} stroke="var(--db-border)" strokeWidth={0.6} />
              <text x={padL - 6} y={tick.y + 4} fontSize={9} fill="var(--db-teal-dk)" textAnchor="end" fontWeight={500}>{tick.val}</text>
            </g>
          ))}

          {/* Labels Y droite (avancement %) */}
          {yTicksLine.map((tick, g) => (
            <text key={`r${g}`} x={W - padR + 6} y={tick.y + 4} fontSize={9} fill="var(--db-orange)" textAnchor="start" fontWeight={500}>{tick.val}%</text>
          ))}

          {/* Barres jalons terminés */}
          {bars.map((v, i) => {
            const h = (v / barMax) * innerH
            const x = padL + slot * i + (slot - barW) / 2
            const y = padT + innerH - h
            const isHovered = hoverIdx === i
            const isCurrent = weeks[i]?.isCurrent
            return (
              <g key={i}>
                <rect x={x} y={y} width={barW} height={h} rx={3}
                  fill="var(--db-teal-dk)" opacity={isHovered ? 1 : isCurrent ? 0.9 : 0.7}
                  style={{ transformOrigin: `${x + barW / 2}px ${baseline}px`, animation: `db-bar-grow 600ms ease-out ${i * 60}ms both`, transition: 'opacity 150ms' }} />
                {/* Marqueur semaine courante */}
                {isCurrent && (
                  <rect x={padL + slot * i + 2} y={baseline + 1} width={slot - 4} height={2} rx={1} fill="var(--db-orange)" opacity={0.6} />
                )}
              </g>
            )
          })}

          {/* Aire + courbe avancement */}
          <path d={`${path} L ${pts[pts.length - 1].x} ${baseline} L ${pts[0].x} ${baseline} Z`} fill="url(#wk-grad)" />
          <path d={path} fill="none" stroke="var(--db-orange)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

          {/* Points avancement */}
          {pts.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={hoverIdx === i ? 5 : 3}
              fill={hoverIdx === i ? 'var(--db-orange)' : 'var(--db-card)'}
              stroke="var(--db-orange)" strokeWidth={hoverIdx === i ? 0 : 2}
              style={{ transition: 'r 120ms, fill 120ms' }} />
          ))}

          {/* Labels semaines */}
          {labels.map((label, i) => (
            <text key={`l${i}`} x={padL + slot * i + slot / 2} y={H - 6} fontSize={9.5}
              fill={hoverIdx === i ? 'var(--db-t1)' : weeks[i]?.isCurrent ? 'var(--db-orange)' : 'var(--db-t3)'}
              textAnchor="middle" fontWeight={hoverIdx === i || weeks[i]?.isCurrent ? 700 : 400}>
              {label}
            </text>
          ))}

          {/* Ligne verticale hover */}
          {hoverIdx !== null && (
            <line x1={hoveredX} x2={hoveredX} y1={padT} y2={baseline} stroke="var(--db-t3)" strokeWidth={0.8} strokeDasharray="3 2" opacity={0.4} />
          )}

          {/* Zones de survol */}
          {weeks.map((_, i) => (
            <rect key={`h${i}`} x={padL + slot * i} y={0} width={slot} height={H}
              fill="transparent" onMouseEnter={() => setHoverIdx(i)} />
          ))}
        </svg>

        {/* Infobulle */}
        {hoveredWeek && hoverIdx !== null && (
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              left: `${(hoveredX / W) * 100}%`,
              top: 4,
              transform: hoveredX > W * 0.7 ? 'translateX(-100%)' : hoveredX < W * 0.3 ? 'translateX(0)' : 'translateX(-50%)',
            }}
          >
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl px-3.5 py-2.5 text-[11px] min-w-[200px]" style={{ animation: 'db-rise 120ms ease-out both' }}>
              <div className="font-bold text-[12.5px] mb-2 pb-1.5 border-b" style={{ color: 'var(--db-t1)', borderColor: 'var(--db-border)' }}>
                {t('db.premium.semaine')} {hoveredWeek.semaine} — {hoveredWeek.annee}
                {hoveredWeek.isCurrent && <span className="ml-1.5 text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ background: 'var(--db-orange)', color: 'white', opacity: 0.9 }}>{t('db.premium.semaineCourante')}</span>}
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center gap-3">
                  <span className="flex items-center gap-1.5" style={{ color: 'var(--db-teal-dk)' }}>
                    <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: 'var(--db-teal-dk)', opacity: 0.85 }} />
                    {t('db.premium.jalonsLivres')}
                  </span>
                  <span className="font-bold db-num" style={{ color: 'var(--db-t1)' }}>{hoveredWeek.terminees} / {hoveredWeek.total}</span>
                </div>
                <div className="flex justify-between items-center gap-3">
                  <span className="flex items-center gap-1.5" style={{ color: 'var(--db-orange)' }}>
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: 'var(--db-orange)' }} />
                    {t('db.premium.avancementPct')}
                  </span>
                  <span className="font-bold db-num" style={{ color: 'var(--db-t1)' }}>{hoveredWeek.avancementMoyen}%</span>
                </div>
                <div className="flex justify-between items-center gap-3">
                  <span style={{ color: 'var(--db-t4)' }}>{t('db.premium.enCoursSemaine')}</span>
                  <span className="font-medium db-num" style={{ color: 'var(--db-t2)' }}>{hoveredWeek.enCours}</span>
                </div>
                <div className="flex justify-between items-center gap-3">
                  <span style={{ color: 'var(--db-t4)' }}>{t('db.premium.nonCommencees')}</span>
                  <span className="font-medium db-num" style={{ color: 'var(--db-t2)' }}>{hoveredWeek.nonCommencees}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
