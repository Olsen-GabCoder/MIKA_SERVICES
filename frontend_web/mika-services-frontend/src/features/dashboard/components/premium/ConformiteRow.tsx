import { useTranslation } from 'react-i18next'
import { MOCK_RISQUES, MOCK_PAIEMENTS, MOCK_CONFORMITE_DOC, MOCK_APPROVISIONNEMENT } from '../../data/mockConformite'

function CardShell({ title, idx, children }: { title: string; idx: number; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4 flex flex-col transition-all duration-200 hover:scale-[1.015] hover:shadow-lg" style={{ background: 'var(--db-card)', animation: `db-rise 380ms ease-out ${idx * 30}ms both` }}>
      <div className="flex items-center gap-2.5 mb-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: 'var(--db-t3)' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

function RisquesCard() {
  const { t } = useTranslation('common')
  const niveauColor: Record<string, string> = { Critique: 'var(--db-danger)', 'Élevé': 'var(--db-danger)', Modéré: 'var(--db-warn)', Faible: 'var(--db-t2)' }
  const barColor: Record<string, string> = { Critique: 'var(--db-danger)', 'Élevé': 'var(--db-danger)', Modéré: 'var(--db-warn)', Faible: 'var(--db-teal-dk)' }
  return (
    <CardShell title={t('db.premium.topRisques')} idx={14}>
      <div className="flex flex-col gap-3 mt-1.5">
        {MOCK_RISQUES.map((r, i) => (
          <div key={i} className="grid gap-x-2 gap-y-1" style={{ gridTemplateColumns: '1fr auto' }}>
            <span className="text-[11.5px] truncate" style={{ color: 'var(--db-t2)' }}>{r.nom}</span>
            <span className="text-[11.5px] font-medium" style={{ color: niveauColor[r.niveau] }}>{r.niveau}</span>
            <div className="col-span-2 h-[5px] rounded-sm overflow-hidden" style={{ background: 'var(--db-subtle)' }}>
              <div className="h-full rounded-sm" style={{ width: `${r.pct}%`, background: barColor[r.niveau], opacity: r.pct < 50 ? 0.75 : 1 }} />
            </div>
          </div>
        ))}
      </div>
    </CardShell>
  )
}

function PaiementsCard() {
  const { t } = useTranslation('common')
  const d = MOCK_PAIEMENTS
  const W = 280, H = 86, padX = 4, padT = 6, padB = 14
  const mx = Math.max(...d.bins.map(b => b.value)) * 1.15
  const slot = (W - padX * 2) / d.bins.length, bw = slot * 0.7
  return (
    <CardShell title={t('db.premium.delaisPaiement')} idx={15}>
      <div className="flex items-baseline justify-between gap-2 my-0.5">
        <span className="text-[22px] font-semibold db-tight db-num" style={{ color: 'var(--db-t1)' }}>{d.moyenne}<span className="text-[11px] font-medium ml-1" style={{ color: 'var(--db-t3)' }}>jours · moy.</span></span>
        <span className="inline-flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-px rounded db-num text-[var(--db-danger)] bg-[var(--db-danger-bg2)]">
          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M7 7l5 5 5-5M7 13l5 5 5-5" /></svg>{d.delta}
        </span>
      </div>
      <div className="text-[11px] mb-2.5" style={{ color: 'var(--db-t3)' }}>{d.factures} factures émises · {d.enRetard} en retard</div>
      <svg className="w-full block mt-auto" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: 86 }}>
        {d.bins.map((b, i) => {
          const h = (b.value / mx) * (H - padT - padB), x = padX + slot * i + (slot - bw) / 2, y = H - padB - h
          return <g key={i}><rect x={x} y={y} width={bw} height={h} rx={2} fill={b.color} opacity={0.85} /><text x={x + bw / 2} y={H - 3} fontSize={7.5} fill="var(--db-t4)" textAnchor="middle">{b.label}</text></g>
        })}
      </svg>
    </CardShell>
  )
}

function ConformiteDocCard() {
  const { t } = useTranslation('common')
  const d = MOCK_CONFORMITE_DOC
  const circ = 2 * Math.PI * 40, dash = (d.pct / 100) * circ
  return (
    <CardShell title={t('db.premium.conformiteDoc')} idx={16}>
      <div className="grid grid-cols-2 items-center gap-2" style={{ height: 'auto', paddingTop: 4 }}>
        <div className="relative mx-auto" style={{ width: 96, aspectRatio: '1' }}>
          <svg viewBox="0 0 100 100">
            <circle cx={50} cy={50} r={40} fill="none" stroke="var(--db-subtle)" strokeWidth={14} />
            <circle cx={50} cy={50} r={40} fill="none" stroke="var(--db-teal)" strokeWidth={14}
              strokeDasharray={`${dash} ${circ}`} strokeDashoffset={0} transform="rotate(-90 50 50)" strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[28px] font-semibold db-tight db-num" style={{ color: 'var(--db-t1)' }}>{d.pct}<span className="text-[14px]" style={{ color: 'var(--db-t3)' }}>%</span></div>
            <div className="text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--db-t3)' }}>Conforme</div>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5 text-[12px]" style={{ color: 'var(--db-t2)' }}><span className="w-[9px] h-[9px] rounded-sm" style={{ background: 'var(--db-teal)' }} />À jour <span className="ml-auto font-medium db-num" style={{ color: 'var(--db-t1)' }}>{d.aJour}</span></div>
          <div className="flex items-center gap-2.5 text-[12px]" style={{ color: 'var(--db-t2)' }}><span className="w-[9px] h-[9px] rounded-sm" style={{ background: 'var(--db-warn)' }} />Expirent &lt; 30j <span className="ml-auto font-medium db-num" style={{ color: 'var(--db-t1)' }}>{d.expirent30j}</span></div>
          <div className="flex items-center gap-2.5 text-[12px]" style={{ color: 'var(--db-t2)' }}><span className="w-[9px] h-[9px] rounded-sm" style={{ background: 'var(--db-danger)' }} />Expirés <span className="ml-auto font-medium db-num" style={{ color: 'var(--db-t1)' }}>{d.expires}</span></div>
        </div>
      </div>
    </CardShell>
  )
}

function ApprovisionnementCard() {
  const { t } = useTranslation('common')
  const d = MOCK_APPROVISIONNEMENT
  const r = 30, cx = 50, cy = 50, circ = 2 * Math.PI * r, off = circ * (1 - d.pctATemps / 100)
  return (
    <CardShell title={t('db.premium.approvisionnement')} idx={17}>
      <div className="flex items-center gap-3.5 mt-1.5">
        <svg width={100} height={100} viewBox="0 0 100 100" className="shrink-0">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--db-subtle)" strokeWidth={9} />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--db-teal-dk)" strokeWidth={9}
            strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} />
          <text x={cx} y={cy + 1} fontSize={18} fontWeight={600} fill="var(--db-t1)" textAnchor="middle" dominantBaseline="middle" className="db-num db-tight">{d.pctATemps}%</text>
          <text x={cx} y={cy + 13} fontSize={6.5} fill="var(--db-t3)" textAnchor="middle" letterSpacing="0.1em">À TEMPS</text>
        </svg>
        <div className="flex-1 flex flex-col gap-2.5 text-[11.5px]">
          {[{ label: 'Commandes', value: d.commandes, color: 'var(--db-t1)' }, { label: 'À temps', value: d.aTemps, color: 'var(--db-success)' }, { label: 'Retard', value: d.retard, color: 'var(--db-warn)' }, { label: 'Litige', value: d.litige, color: 'var(--db-danger)' }].map((row, i) => (
            <div key={i} className="flex justify-between items-baseline gap-1.5">
              <span style={{ color: 'var(--db-t2)' }}>{row.label}</span>
              <span className="font-semibold db-num" style={{ color: row.color }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </CardShell>
  )
}

export function ConformiteRow() {
  return (
    <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <RisquesCard />
      <PaiementsCard />
      <ConformiteDocCard />
      <ApprovisionnementCard />
    </div>
  )
}
