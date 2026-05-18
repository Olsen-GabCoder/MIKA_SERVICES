import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useCountUp } from '../../hooks/useCountUp'
import type { ProjetSummary } from '@/types/projet'

interface KpiData {
  title: string
  value: string
  delta?: { text: string; dir: 'up' | 'down' | 'flat' }
  sub: string
  sparkData: number[]
  sparkColor: string
  sparkType?: 'area' | 'bars'
  href?: string
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
        return <rect key={i} x={x} y={H - 2 - h} width={bw} height={h} rx={1.5} fill={color} opacity={i === data.length - 1 ? 1 : 0.55}
          style={{ transformOrigin: `${x + bw / 2}px ${H - 2}px`, animation: `db-bar-grow 600ms ease-out ${i * 50}ms both` }} />
      })}
    </svg>
  )
}

function AnimatedValue({ n }: { n: number }) {
  const v = useCountUp(n)
  return <>{v}</>
}

// ── Mini graphique retard (deux courbes dans un espace compact) ──

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

function RetardMiniChart({ projets }: { projets: ProjetSummary[] }) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const retards = useMemo(() =>
    projets
      .filter(p => ['EN_COURS_EXECUTION', 'EN_AVANCE'].includes(p.statut) && p.dateFin && p.dateFin < today)
      .map(p => ({
        id: p.id,
        nom: p.nom,
        avancement: p.avancementGlobal ?? 0,
        joursRetard: daysBetween(p.dateFin!, today),
      }))
      .sort((a, b) => b.joursRetard - a.joursRetard),
    [projets, today]
  )

  if (retards.length === 0) {
    return (
      <div className="flex items-center justify-center h-[46px] text-[10px] gap-1.5" style={{ color: 'var(--db-success)' }}>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        {t('db.premium.retardOk')}
      </div>
    )
  }

  const W = 280, H = 46, padX = 4, padT = 4, padB = 4
  const maxR = Math.max(...retards.map(r => r.joursRetard), 1) * 1.15

  const xAt = (i: number) => padX + (retards.length === 1 ? (W - padX * 2) / 2 : (i / (retards.length - 1)) * (W - padX * 2))
  const yR = (v: number) => padT + (1 - v / maxR) * (H - padT - padB)
  const yA = (v: number) => padT + (1 - v / 100) * (H - padT - padB)

  const ptsR = retards.map((r, i) => ({ x: xAt(i), y: yR(r.joursRetard) }))
  const ptsA = retards.map((r, i) => ({ x: xAt(i), y: yA(r.avancement) }))
  const baseline = H - padB

  const hoveredData = hoverIdx !== null ? retards[hoverIdx] : null

  return (
    <div className="relative" onMouseLeave={() => setHoverIdx(null)}>
      <svg className="w-full block" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: 46 }}>
        {/* Aire + courbe retard (rouge) */}
        {ptsR.length >= 2 && (
          <>
            <path d={`${smoothPath(ptsR)} L ${ptsR[ptsR.length - 1].x} ${baseline} L ${ptsR[0].x} ${baseline} Z`} fill="var(--db-danger)" opacity={0.12} />
            <path d={smoothPath(ptsR)} fill="none" stroke="var(--db-danger)" strokeWidth={2} strokeLinecap="round" />
          </>
        )}
        {/* Aire + courbe avancement (vert) */}
        {ptsA.length >= 2 && (
          <>
            <path d={`${smoothPath(ptsA)} L ${ptsA[ptsA.length - 1].x} ${baseline} L ${ptsA[0].x} ${baseline} Z`} fill="var(--db-success)" opacity={0.08} />
            <path d={smoothPath(ptsA)} fill="none" stroke="var(--db-success)" strokeWidth={1.5} strokeLinecap="round" opacity={0.8} />
          </>
        )}
        {/* Points retard */}
        {ptsR.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={hoverIdx === i ? 4 : 2.5}
            fill={hoverIdx === i ? 'var(--db-danger)' : 'var(--db-card)'}
            stroke="var(--db-danger)" strokeWidth={1.5}
            style={{ transition: 'r 120ms, fill 120ms', cursor: 'pointer' }}
            onClick={e => { e.stopPropagation(); navigate(`/projets/${retards[i].id}`) }} />
        ))}
        {/* Zones de survol */}
        {retards.map((_, i) => {
          const x = xAt(i)
          const slotW = retards.length === 1 ? W : (W - padX * 2) / (retards.length - 1)
          return <rect key={`h${i}`} x={x - slotW / 2} y={0} width={slotW} height={H} fill="transparent" onMouseEnter={() => setHoverIdx(i)} />
        })}
      </svg>
      {/* Infobulle compacte */}
      {hoveredData && hoverIdx !== null && (
        <div className="absolute z-30 pointer-events-none" style={{
          left: `${(xAt(hoverIdx) / W) * 100}%`,
          top: -60,
          transform: xAt(hoverIdx) > W * 0.7 ? 'translateX(-90%)' : xAt(hoverIdx) < W * 0.3 ? 'translateX(-10%)' : 'translateX(-50%)',
        }}>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl px-2.5 py-1.5 text-[10px] whitespace-nowrap" style={{ animation: 'db-rise 120ms ease-out both' }}>
            <div className="font-semibold mb-0.5 truncate" style={{ color: 'var(--db-t1)', maxWidth: 150 }}>{hoveredData.nom}</div>
            <span className="font-bold db-num" style={{ color: 'var(--db-danger)' }}>+{hoveredData.joursRetard}j</span>
            <span className="mx-1.5" style={{ color: 'var(--db-t4)' }}>·</span>
            <span className="font-bold db-num" style={{ color: 'var(--db-success)' }}>{hoveredData.avancement}%</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Composant principal ──

export interface KpiRowProps {
  projetsActifs: number
  projetsTotal: number
  projetsDelta: number
  projetsEnRetard: number
  dmaEnAttente: number
  enginsAffectes: number
  enginsTotal: number
  projets: ProjetSummary[]
}

export function KpiRow(p: KpiRowProps) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()

  const kpis: KpiData[] = [
    {
      title: t('db.premium.kpiProjets'),
      value: String(p.projetsActifs),
      delta: { text: `+${p.projetsDelta}`, dir: 'up' },
      sub: `${t('db.premium.sur')} ${p.projetsTotal} ${t('db.premium.totaux')}`,
      sparkData: [14, 15, 14, 15, 16, 16, 17, 16, 17, 17, 18, 18],
      sparkColor: 'var(--db-teal)',
      href: '/projets',
    },
    {
      title: t('db.premium.kpiDma'),
      value: String(p.dmaEnAttente),
      delta: p.dmaEnAttente > 5 ? { text: `+${Math.max(1, Math.floor(p.dmaEnAttente * 0.3))}`, dir: 'down' } : undefined,
      sub: t('db.premium.aValider'),
      sparkData: [5, 6, 4, 7, 8, 9, 8, 10, 9, 11, 10, p.dmaEnAttente],
      sparkColor: 'var(--db-warn)',
      sparkType: 'bars',
      href: '/dma',
    },
    {
      title: t('db.premium.kpiEngins'),
      value: `${p.enginsAffectes}`,
      delta: { text: `${Math.round((p.enginsAffectes / Math.max(p.enginsTotal, 1)) * 100)}%`, dir: 'flat' },
      sub: t('db.premium.parcDeploye'),
      sparkData: [22, 24, 25, 23, 26, 27, 26, 27, 28, 27, 28, p.enginsAffectes],
      sparkColor: 'var(--db-orange)',
      href: '/engins',
    },
  ]

  return (
    <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 3 KPIs classiques */}
      {kpis.map((k, i) => (
        <div
          key={i}
          onClick={k.href ? () => navigate(k.href!) : undefined}
          className={`rounded-xl p-4 flex flex-col transition-all duration-200 hover:scale-[1.015] hover:shadow-lg ${k.href ? 'cursor-pointer' : ''}`}
          style={{ background: 'var(--db-card)', animation: `db-rise 380ms ease-out ${i * 30}ms both` }}
        >
          <div className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: 'var(--db-t3)' }}>
            {k.title}
          </div>
          <div className="text-[30px] font-semibold db-tighter db-num leading-none mt-0.5 mb-1" style={{ color: 'var(--db-t1)' }}>
            <AnimatedValue n={Number(k.value)} />
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

      {/* 4ème carte : Projets en retard avec mini graphique à courbes */}
      <div
        onClick={() => navigate('/projets')}
        className="rounded-xl p-4 flex flex-col transition-all duration-200 hover:scale-[1.015] hover:shadow-lg cursor-pointer relative"
        style={{ background: 'var(--db-card)', animation: 'db-rise 380ms ease-out 90ms both' }}
      >
        {p.projetsEnRetard > 0 && <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'var(--db-danger)' }} />}
        <div className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: 'var(--db-t3)' }}>
          {t('db.premium.kpiRetard')}
        </div>
        <div className="text-[30px] font-semibold db-tighter db-num leading-none mt-0.5 mb-1" style={{ color: p.projetsEnRetard > 0 ? 'var(--db-danger)' : 'var(--db-t1)' }}>
          <AnimatedValue n={p.projetsEnRetard} />
        </div>
        <div className="flex items-center gap-1.5 text-[11.5px] mb-3" style={{ color: 'var(--db-t3)' }}>
          {p.projetsEnRetard > 0
            ? <DeltaBadge text={String(p.projetsEnRetard)} dir="down" />
            : <DeltaBadge text="0" dir="up" />}
          <span>{p.projetsEnRetard > 0 ? t('db.premium.retardSub') : t('db.premium.retardOk')}</span>
        </div>
        <div className="mt-auto">
          {/* Légende mini */}
          <div className="flex items-center gap-2.5 mb-1 text-[8.5px]" style={{ color: 'var(--db-t4)' }}>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--db-danger)' }} />{t('db.premium.retardJoursRetard')}</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--db-success)' }} />{t('db.premium.retardAvancement')}</span>
          </div>
          <RetardMiniChart projets={p.projets} />
        </div>
      </div>
    </div>
  )
}
