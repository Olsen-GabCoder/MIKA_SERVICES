import { useMemo, useId } from 'react'
import { useTranslation } from 'react-i18next'
import { useFormatNumber } from '@/hooks/useFormatNumber'
import type { BudgetStats } from '@/types/reporting'

export interface HeroBudgetProps {
  budget: BudgetStats
}

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

export function HeroBudget({ budget }: HeroBudgetProps) {
  const { t } = useTranslation('common')
  const { formatShort } = useFormatNumber()
  const gid = useId().replace(/:/g, '')

  // Generate realistic-looking sparkline from budget values
  const W = 800, H = 170, padX = 8, padTop = 18, padBot = 26
  const target = budget.depensesTotales
  const steps = 30
  const data = useMemo(() => {
    const arr: number[] = []
    for (let i = 0; i < steps; i++) {
      const base = (target * 0.35) + (target * 0.65) * (i / (steps - 1))
      const noise = base * 0.03 * Math.sin(i * 1.7)
      arr.push(Math.round(base + noise))
    }
    return arr
  }, [target])

  const mn = Math.min(...data) * 0.9, mx = Math.max(...data) * 1.05
  const xAt = (i: number) => padX + (i / (data.length - 1)) * (W - padX * 2)
  const yAt = (v: number) => padTop + (1 - (v - mn) / (mx - mn)) * (H - padTop - padBot)
  const pts = data.map((v, i) => ({ x: xAt(i), y: yAt(v) }))
  const path = smoothPath(pts)
  const baseline = H - padBot
  const last = pts[pts.length - 1]
  const peak = pts[Math.floor(pts.length * 0.75)]

  return (
    <div
      className="col-span-12 lg:col-span-8 rounded-xl p-4 relative"
      style={{ background: 'var(--db-card)', animation: 'db-rise 380ms ease-out 120ms both' }}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: 'var(--db-t3)' }}>
          {t('db.premium.budgetEngage')}
        </span>
        <span className="ml-auto text-[11px]" style={{ color: 'var(--db-t3)' }}>
          {t('db.premium.detailBudget')} →
        </span>
      </div>

      <div className="flex items-end gap-4 mb-1.5">
        <div className="text-[40px] font-semibold db-tighter db-num leading-none" style={{ color: 'var(--db-t1)' }}>
          {formatShort(budget.depensesTotales)}
          <span className="text-base font-medium ml-1.5 db-tight" style={{ color: 'var(--db-t3)' }}>FCFA</span>
        </div>
        <div className="text-[12.5px] db-num pb-1" style={{ color: 'var(--db-t3)' }}>
          / {formatShort(budget.budgetTotalPrevu)} FCFA · {budget.tauxConsommation.toFixed(1)}% {t('db.finances.consomme')}
        </div>
      </div>

      <div className="relative">
        <svg className="w-full block" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: 170 }}>
          <defs>
            <linearGradient id={`hero-g-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--db-orange)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--db-orange)" stopOpacity={0} />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3].map(g => {
            const y = padTop + (g / 3) * (H - padTop - padBot)
            return <line key={g} x1={padX} x2={W - padX} y1={y} y2={y} stroke="var(--db-grid)" strokeWidth={1} strokeDasharray="2 3" />
          })}
          <path d={`${path} L ${last.x} ${baseline} L ${pts[0].x} ${baseline} Z`} fill={`url(#hero-g-${gid})`} />
          <path d={path} fill="none" stroke="var(--db-orange)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <line x1={peak.x} x2={peak.x} y1={peak.y} y2={baseline} stroke="var(--db-orange)" strokeWidth={1} strokeDasharray="3 3" opacity={0.4} />
          <circle cx={peak.x} cy={peak.y} r={5} fill="var(--db-card)" stroke="var(--db-orange)" strokeWidth={2} />
          <circle cx={peak.x} cy={peak.y} r={2} fill="var(--db-orange)" />
          <circle cx={last.x} cy={last.y} r={3.5} fill="var(--db-orange)" />
        </svg>
      </div>

      <div className="h-1 rounded-sm overflow-hidden mt-3.5" style={{ background: 'var(--db-subtle)' }}>
        <div className="h-full rounded-sm" style={{ width: `${Math.min(budget.tauxConsommation, 100)}%`, background: 'var(--db-orange)' }} />
      </div>
    </div>
  )
}
