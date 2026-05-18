import { useTranslation } from 'react-i18next'
import { MOCK_TRESORERIE, MOCK_PRODUCTIVITE, MOCK_COUT_CIMENT, MOCK_HEURES } from '../../data/mockOperations'

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

function CardShell({ title, idx, children }: { title: string; idx: number; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4 flex flex-col transition-all duration-200 hover:scale-[1.015] hover:shadow-lg" style={{ background: 'var(--db-card)', animation: `db-rise 380ms ease-out ${idx * 30}ms both` }}>
      <div className="flex items-center gap-2.5 mb-1">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: 'var(--db-t3)' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

function Row1({ value, unit, delta, dir }: { value: string; unit: string; delta: string; dir: 'up' | 'down' }) {
  return (
    <div className="flex items-baseline justify-between gap-2 my-0.5">
      <span className="text-[22px] font-semibold db-tight db-num" style={{ color: 'var(--db-t1)' }}>
        {value}<span className="text-[11px] font-medium ml-1 tracking-normal" style={{ color: 'var(--db-t3)' }}>{unit}</span>
      </span>
      <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-px rounded db-num ${dir === 'up' ? 'text-[var(--db-success)] bg-[var(--db-success-bg)]' : 'text-[var(--db-danger)] bg-[var(--db-danger-bg2)]'}`}>
        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          {dir === 'up' ? <path d="M7 17l5-5 5 5M7 11l5-5 5 5" /> : <path d="M7 7l5 5 5-5M7 13l5 5 5-5" />}
        </svg>
        {delta}
      </span>
    </div>
  )
}

function TresorerieCard() {
  const { t } = useTranslation('common')
  const d = MOCK_TRESORERIE
  const W = 280, H = 86, padX = 4, padT = 6, padB = 4
  const mn = 100, mx = 200
  const pts = d.series.map((v, i) => ({ x: padX + (i / (d.series.length - 1)) * (W - padX * 2), y: padT + (1 - (v - mn) / (mx - mn)) * (H - padT - padB) }))
  const path = smoothPath(pts)
  const last = pts[pts.length - 1]
  return (
    <CardShell title={t('db.premium.tresorerie')} idx={6}>
      <Row1 value={`+${d.value}M`} unit="FCFA" delta={d.delta} dir="up" />
      <div className="text-[11px] mb-2.5" style={{ color: 'var(--db-t3)' }}>Encaissements {d.encaissements}M · Décaissements {d.decaissements}M</div>
      <svg className="w-full block mt-auto" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: 86 }}>
        <defs><linearGradient id="cash-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--db-teal)" stopOpacity={0.22} /><stop offset="100%" stopColor="var(--db-teal)" stopOpacity={0} /></linearGradient></defs>
        <path d={`${path} L ${last.x} ${H - padB} L ${pts[0].x} ${H - padB} Z`} fill="url(#cash-g)" />
        <path d={path} fill="none" stroke="var(--db-teal)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={last.x} cy={last.y} r={2.8} fill="var(--db-teal)" />
      </svg>
    </CardShell>
  )
}

function ProductiviteCard() {
  const { t } = useTranslation('common')
  const d = MOCK_PRODUCTIVITE
  const colors = ['var(--db-teal)', 'var(--db-teal-dk)', 'var(--db-teal-dk)', 'var(--db-warn)']
  return (
    <CardShell title={t('db.premium.productivite')} idx={7}>
      <Row1 value={String(d.moyenne)} unit={d.unit} delta={d.delta} dir="up" />
      <div className="text-[11px] mb-2.5" style={{ color: 'var(--db-t3)' }}>Top 4 chantiers · béton coulé</div>
      <div className="flex flex-col gap-2.5 mt-auto">
        {d.chantiers.map((c, i) => (
          <div key={i} className="grid gap-x-2 gap-y-1" style={{ gridTemplateColumns: '1fr auto' }}>
            <span className="text-[11.5px] truncate" style={{ color: 'var(--db-t2)' }}>{c.nom}</span>
            <span className="text-[11.5px] font-medium db-num" style={{ color: 'var(--db-t1)' }}>{c.value} m³</span>
            <div className="col-span-2 h-[5px] rounded-sm overflow-hidden" style={{ background: 'var(--db-subtle)' }}>
              <div className="h-full rounded-sm" style={{ width: `${c.pct}%`, background: colors[i], opacity: i > 1 ? 0.7 : 1 }} />
            </div>
          </div>
        ))}
      </div>
    </CardShell>
  )
}

function CimentCard() {
  const { t } = useTranslation('common')
  const d = MOCK_COUT_CIMENT
  const W = 280, H = 86, padX = 6, padT = 6, padB = 14
  const mn = 70, mx = 86
  const xAt = (i: number) => padX + (i / (d.current.length - 1)) * (W - padX * 2)
  const yAt = (v: number) => padT + (1 - (v - mn) / (mx - mn)) * (H - padT - padB)
  const ptsC = d.current.map((v, i) => ({ x: xAt(i), y: yAt(v) }))
  const ptsP = d.previous.map((v, i) => ({ x: xAt(i), y: yAt(v) }))
  const pathC = smoothPath(ptsC), pathP = smoothPath(ptsP)
  return (
    <CardShell title={t('db.premium.coutCiment')} idx={8}>
      <Row1 value="82 500" unit="FCFA / T" delta={d.delta} dir="down" />
      <div className="text-[11px] mb-2.5" style={{ color: 'var(--db-t3)' }}>6 derniers mois · {d.label}</div>
      <svg className="w-full block mt-auto" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: 86 }}>
        <path d={pathP} fill="none" stroke="var(--db-t4)" strokeWidth={1.4} strokeDasharray="3 3" opacity={0.7} />
        <path d={pathC} fill="none" stroke="var(--db-orange)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        {ptsC.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={i === ptsC.length - 1 ? 2.8 : 1.8} fill={i === ptsC.length - 1 ? 'var(--db-orange)' : 'var(--db-card)'} stroke="var(--db-orange)" strokeWidth={i === ptsC.length - 1 ? 0 : 1.4} />)}
        {d.months.map((m, i) => <text key={i} x={xAt(i)} y={H - 2} fontSize={8} fill="var(--db-t4)" textAnchor="middle">{m}</text>)}
      </svg>
    </CardShell>
  )
}

function HeuresCard() {
  const { t } = useTranslation('common')
  const d = MOCK_HEURES
  const W = 280, H = 86, padX = 4, padT = 4, padB = 14
  const mx = Math.max(...d.days.map(x => x.reg + x.sup)) * 1.08
  const slot = (W - padX * 2) / d.days.length, bw = slot * 0.5
  return (
    <CardShell title={t('db.premium.heuresTravaillees')} idx={9}>
      <Row1 value={d.total.toLocaleString('fr')} unit="h" delta={d.delta} dir="up" />
      <div className="text-[11px] mb-2.5" style={{ color: 'var(--db-t3)' }}>Régulières {d.regulieres.toLocaleString('fr')} · Supp. {d.supplementaires.toLocaleString('fr')}</div>
      <svg className="w-full block mt-auto" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: 86 }}>
        {d.days.map((day, i) => {
          const total = day.reg + day.sup
          const x = padX + slot * i + (slot - bw) / 2
          const ht = (total / mx) * (H - padT - padB)
          const hs = (day.sup / mx) * (H - padT - padB)
          const hr = (day.reg / mx) * (H - padT - padB)
          const yTop = H - padB - ht
          return (
            <g key={i}>
              <rect x={x} y={yTop} width={bw} height={hs} rx={1.5} fill="var(--db-orange)" opacity={0.85} />
              <rect x={x} y={yTop + hs} width={bw} height={hr} rx={1.5} fill="var(--db-teal-dk)" opacity={0.9} />
              <text x={x + bw / 2} y={H - 3} fontSize={8} fill="var(--db-t4)" textAnchor="middle">{day.label}</text>
            </g>
          )
        })}
      </svg>
    </CardShell>
  )
}

export function OpsMetricsRow() {
  return (
    <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <TresorerieCard />
      <ProductiviteCard />
      <CimentCard />
      <HeuresCard />
    </div>
  )
}
