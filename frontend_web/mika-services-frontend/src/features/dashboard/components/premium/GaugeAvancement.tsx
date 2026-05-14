import { useTranslation } from 'react-i18next'

export interface GaugeAvancementProps {
  value: number
}

export function GaugeAvancement({ value }: GaugeAvancementProps) {
  const { t } = useTranslation('common')
  const clamped = Math.min(Math.max(value, 0), 100)
  // stroke-dasharray: circumference of the semi-circle arc = PI * r = PI * 85 ≈ 267
  // offset = 267 * (1 - pct/100)
  const circ = Math.PI * 85
  const offset = circ * (1 - clamped / 100)
  // needle rotation: -90° (left) to +90° (right), 0% = -90°, 100% = +90°
  const needleAngle = -90 + (clamped / 100) * 180

  return (
    <div
      className="col-span-12 lg:col-span-4 rounded-xl p-4 flex flex-col items-center justify-center"
      style={{ background: 'var(--db-card)', animation: 'db-rise 380ms ease-out 150ms both' }}
    >
      <div className="flex items-center gap-2.5 mb-2 w-full">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: 'var(--db-t3)' }}>
          {t('db.premium.avancementGlobal')}
        </span>
      </div>

      <div className="w-full max-w-[260px] relative" style={{ aspectRatio: '2 / 1.05' }}>
        <svg viewBox="0 0 200 110" width="100%" height="100%">
          <defs>
            <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2E5266" />
              <stop offset="60%" stopColor="#48B5A0" />
              <stop offset="100%" stopColor="#FF6B35" />
            </linearGradient>
          </defs>
          {/* Track */}
          <path d="M 15 100 A 85 85 0 0 1 185 100" fill="none" stroke="var(--db-subtle)" strokeWidth={14} strokeLinecap="round" />
          {/* Fill */}
          <path d="M 15 100 A 85 85 0 0 1 185 100" fill="none" stroke="url(#gauge-grad)" strokeWidth={14} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset} />
          {/* Needle */}
          <g transform={`translate(100 100) rotate(${needleAngle})`}>
            <line x1={0} y1={0} x2={0} y2={-78} stroke="var(--db-t1)" strokeWidth={1.6} strokeLinecap="round" />
            <circle cx={0} cy={0} r={4} fill="var(--db-card)" stroke="var(--db-t1)" strokeWidth={1.6} />
          </g>
          {/* Labels */}
          <text x={10} y={116} fontSize={9} fill="var(--db-t4)" textAnchor="middle">0</text>
          <text x={100} y={116} fontSize={9} fill="var(--db-t4)" textAnchor="middle">50</text>
          <text x={190} y={116} fontSize={9} fill="var(--db-t4)" textAnchor="middle">100</text>
        </svg>
        <div className="absolute left-0 right-0 bottom-0 text-center">
          <div className="text-[42px] font-semibold db-tighter db-num" style={{ color: 'var(--db-t1)' }}>
            {clamped}<span className="text-[18px] font-medium ml-0.5" style={{ color: 'var(--db-t3)' }}>%</span>
          </div>
          <div className="text-[10.5px] uppercase tracking-[0.1em]" style={{ color: 'var(--db-t3)' }}>
            {t('db.radial.progress')}
          </div>
        </div>
      </div>
    </div>
  )
}
