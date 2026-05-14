import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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
  const W = 800, H = 220, padL = 34, padR = 22, padT = 14, padB = 30
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
  const lineMin = Math.min(...line, 0) - 10, lineMax = Math.max(...line, 100) + 10
  const slot = innerW / bars.length, barW = Math.min(18, slot * 0.45)

  const pts = line.map((v, i) => ({
    x: padL + slot * i + slot / 2,
    y: padT + (1 - (v - lineMin) / (lineMax - lineMin)) * innerH,
  }))
  const path = smoothPath(pts)
  const baseline = padT + innerH

  return (
    <div className="col-span-12 lg:col-span-8 rounded-xl p-4" style={{ background: 'var(--db-card)', animation: 'db-rise 380ms ease-out 240ms both' }}>
      <div className="flex items-center gap-2.5 mb-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: 'var(--db-t3)' }}>{t('db.premium.progressionHebdo')}</span>
        <div className="ml-auto flex gap-3.5 text-[11px]" style={{ color: 'var(--db-t3)' }}>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: 'var(--db-teal-dk)' }} />{t('db.premium.jalonsLivres')}</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--db-orange)' }} />{t('db.premium.avancementPct')}</span>
        </div>
      </div>
      <svg className="w-full block" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: 220 }}>
        {[0, 1, 2, 3, 4].map(g => {
          const y = padT + (g / 4) * innerH
          const v = Math.round(lineMax - (lineMax - lineMin) * (g / 4))
          return <g key={g}><line x1={padL} x2={W - padR} y1={y} y2={y} stroke="var(--db-grid)" strokeWidth={1} /><text x={padL - 6} y={y + 3} fontSize={9} fill="var(--db-t4)" textAnchor="end">{v}%</text></g>
        })}
        {bars.map((v, i) => {
          const h = (v / barMax) * innerH, x = padL + slot * i + (slot - barW) / 2, y = padT + innerH - h
          return <g key={i}><rect x={x} y={y} width={barW} height={h} rx={3} fill="var(--db-teal-dk)" opacity={0.85} /><text x={padL + slot * i + slot / 2} y={H - 10} fontSize={9.5} fill="var(--db-t3)" textAnchor="middle">{labels[i]}</text></g>
        })}
        <defs><linearGradient id="wk-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--db-orange)" stopOpacity={0.12} /><stop offset="100%" stopColor="var(--db-orange)" stopOpacity={0} /></linearGradient></defs>
        <path d={`${path} L ${pts[pts.length - 1].x} ${baseline} L ${pts[0].x} ${baseline} Z`} fill="url(#wk-grad)" />
        <path d={path} fill="none" stroke="var(--db-orange)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill="var(--db-card)" stroke="var(--db-orange)" strokeWidth={1.8} />)}
      </svg>
    </div>
  )
}
