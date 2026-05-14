import { useTranslation } from 'react-i18next'


interface KpiData {
  title: string
  value: string
  delta?: { text: string; dir: 'up' | 'down' | 'flat' }
  sub: string
  sparkData: number[]
  sparkColor: string
  sparkType?: 'area' | 'bars'
}

function DeltaBadge({ text, dir }: { text: string; dir: 'up' | 'down' | 'flat' }) {
  const cls = dir === 'up' ? 'text-[var(--db-success)] bg-[var(--db-success-bg)]'
    : dir === 'down' ? 'text-[var(--db-danger)] bg-[var(--db-danger-bg2)]'
    : 'text-[var(--db-t2)] bg-[var(--db-subtle)]'
  const arrow = dir === 'up'
    ? <path d="M7 17l5-5 5 5M7 11l5-5 5 5" />
    : dir === 'down'
    ? <path d="M7 7l5 5 5-5M7 13l5 5 5-5" />
    : null
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-px rounded db-num ${cls}`}>
      {arrow && <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>{arrow}</svg>}
      {text}
    </span>
  )
}

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2
    const t = 0.22
    d += ` C ${p1.x + (p2.x - p0.x) * t} ${p1.y + (p2.y - p0.y) * t}, ${p2.x - (p3.x - p1.x) * t} ${p2.y - (p3.y - p1.y) * t}, ${p2.x} ${p2.y}`
  }
  return d
}

function SparkArea({ data, color, W = 280, H = 46 }: { data: number[]; color: string; W?: number; H?: number }) {
  const padX = 2, padT = 4, padB = 4
  const mn = Math.min(...data) - (Math.max(...data) - Math.min(...data)) * 0.15
  const mx = Math.max(...data) + (Math.max(...data) - Math.min(...data)) * 0.15
  const pts = data.map((v, i) => ({
    x: padX + (i / (data.length - 1)) * (W - padX * 2),
    y: padT + (1 - (v - mn) / (mx - mn)) * (H - padT - padB),
  }))
  const path = smoothPath(pts)
  const gid = `sg${color.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6)}`
  const last = pts[pts.length - 1]
  return (
    <svg className="w-full block" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: 46 }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.18} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${path} L ${last.x} ${H - padB} L ${pts[0].x} ${H - padB} Z`} fill={`url(#${gid})`} />
      <path d={path} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x} cy={last.y} r={2.4} fill={color} />
    </svg>
  )
}

function SparkBars({ data, color, W = 280, H = 46 }: { data: number[]; color: string; W?: number; H?: number }) {
  const padX = 2
  const mx = Math.max(...data) * 1.1
  const slot = (W - padX * 2) / data.length
  const bw = slot * 0.55
  return (
    <svg className="w-full block" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: 46 }}>
      {data.map((v, i) => {
        const h = (v / mx) * (H - 6)
        const x = padX + slot * i + (slot - bw) / 2
        return <rect key={i} x={x} y={H - 2 - h} width={bw} height={h} rx={1.5} fill={color} opacity={i === data.length - 1 ? 1 : 0.55} />
      })}
    </svg>
  )
}

export interface KpiRowProps {
  projetsActifs: number
  projetsTotal: number
  projetsDelta: number
  chantiersActifs: number
  chantiersTotal: number
  chantiersDelta: number
  dmaEnAttente: number
  enginsAffectes: number
  enginsTotal: number
}

export function KpiRow(p: KpiRowProps) {
  const { t } = useTranslation('common')

  const kpis: KpiData[] = [
    {
      title: t('db.premium.kpiProjets'),
      value: String(p.projetsActifs),
      delta: { text: `+${p.projetsDelta}`, dir: 'up' },
      sub: `${t('db.premium.vsPrecedent')} · ${t('db.premium.sur')} ${p.projetsTotal} ${t('db.premium.totaux')}`,
      sparkData: [14, 15, 14, 15, 16, 16, 17, 16, 17, 17, 18, 18],
      sparkColor: 'var(--db-teal)',
    },
    {
      title: t('db.premium.kpiChantiers'),
      value: String(p.chantiersActifs),
      delta: { text: `+${p.chantiersDelta}`, dir: 'up' },
      sub: `${t('db.premium.sur')} ${p.chantiersTotal} ${t('db.premium.references')}`,
      sparkData: [35, 36, 38, 37, 39, 40, 41, 40, 41, 42, 42, 42],
      sparkColor: 'var(--db-teal-dk)',
    },
    {
      title: t('db.premium.kpiDma'),
      value: String(p.dmaEnAttente),
      delta: p.dmaEnAttente > 5 ? { text: `+${Math.max(1, Math.floor(p.dmaEnAttente * 0.3))}`, dir: 'down' } : undefined,
      sub: t('db.premium.aValider'),
      sparkData: [5, 6, 4, 7, 8, 9, 8, 10, 9, 11, 10, p.dmaEnAttente],
      sparkColor: 'var(--db-warn)',
      sparkType: 'bars',
    },
    {
      title: t('db.premium.kpiEngins'),
      value: `${p.enginsAffectes}`,
      delta: { text: `${Math.round((p.enginsAffectes / Math.max(p.enginsTotal, 1)) * 100)}%`, dir: 'flat' },
      sub: t('db.premium.parcDeploye'),
      sparkData: [22, 24, 25, 23, 26, 27, 26, 27, 28, 27, 28, p.enginsAffectes],
      sparkColor: 'var(--db-orange)',
    },
  ]

  return (
    <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((k, i) => (
        <div
          key={i}
          className="rounded-xl p-4 flex flex-col transition-all duration-150"
          style={{ background: 'var(--db-card)', animation: `db-rise 380ms ease-out ${i * 30}ms both` }}
        >
          <div className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: 'var(--db-t3)' }}>
            {k.title}
          </div>
          <div className="text-[30px] font-semibold db-tighter db-num leading-none mt-0.5 mb-1" style={{ color: 'var(--db-t1)' }}>
            {k.value}
            {k.title === t('db.premium.kpiEngins') && (
              <span className="text-[18px] font-medium db-tight ml-1" style={{ color: 'var(--db-t3)' }}>/ {p.enginsTotal}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11.5px] mb-3" style={{ color: 'var(--db-t3)' }}>
            {k.delta && <DeltaBadge text={k.delta.text} dir={k.delta.dir} />}
            <span>{k.sub}</span>
          </div>
          <div className="mt-auto">
            {k.sparkType === 'bars'
              ? <SparkBars data={k.sparkData} color={k.sparkColor} />
              : <SparkArea data={k.sparkData} color={k.sparkColor} />}
          </div>
        </div>
      ))}
    </div>
  )
}
