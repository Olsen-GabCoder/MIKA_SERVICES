import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useCountUp } from '../../hooks/useCountUp'
import type { PlanningStats } from '@/types/reporting'
import type { ProjetSummary } from '@/types/projet'

export interface GaugeAvancementProps {
  planning: PlanningStats | null
  projets: ProjetSummary[]
}

export function GaugeAvancement({ planning, projets }: GaugeAvancementProps) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()

  // Avancement moyen des projets en cours d'exécution
  const projetsEnCours = useMemo(() =>
    projets.filter(p => ['EN_COURS_EXECUTION', 'EN_AVANCE'].includes(p.statut)),
    [projets]
  )
  const avancementMoyen = useMemo(() => {
    if (projetsEnCours.length === 0) return 0
    const sum = projetsEnCours.reduce((acc, p) => acc + (p.avancementGlobal ?? 0), 0)
    return Math.round((sum / projetsEnCours.length) * 100) / 100
  }, [projetsEnCours])

  const top5 = useMemo(() =>
    [...projetsEnCours].sort((a, b) => (b.avancementGlobal ?? 0) - (a.avancementGlobal ?? 0)).slice(0, 5),
    [projetsEnCours]
  )

  const clamped = Math.min(Math.max(avancementMoyen, 0), 100)
  const animatedPct = useCountUp(clamped, 1400)
  const r = 52, circ = 2 * Math.PI * r
  const offset = circ * (1 - clamped / 100)

  const tachesTerminees = planning?.tachesTerminees ?? 0
  const tachesTotal = planning?.tachesTotal ?? 0
  const tachesEnRetard = planning?.tachesEnRetard ?? 0

  const ringColor = clamped >= 70 ? 'var(--db-success)' : clamped >= 40 ? 'var(--db-orange)' : 'var(--db-danger)'

  return (
    <div
      className="col-span-12 lg:col-span-4 rounded-2xl p-5 flex flex-col cursor-pointer hover:shadow-lg transition-shadow overflow-hidden relative"
      onClick={() => navigate('/planning')}
      style={{ background: 'var(--db-card)', animation: 'db-rise 380ms ease-out 150ms both' }}
    >
      {/* Accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: ringColor }} />

      <div className="flex items-center gap-2.5 mb-3 w-full">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--db-t3)' }}>
          {t('db.premium.avancementGlobal')}
        </span>
      </div>

      {/* Anneau + pourcentage */}
      <div className="flex justify-center mb-3">
        <div className="relative" style={{ width: 130, height: 130 }}>
          <svg viewBox="0 0 130 130" width={130} height={130}>
            {/* Track */}
            <circle cx={65} cy={65} r={r} fill="none" stroke="var(--db-subtle)" strokeWidth={10} />
            {/* Fill animé */}
            <circle cx={65} cy={65} r={r} fill="none" stroke={ringColor} strokeWidth={10}
              strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
              transform="rotate(-90 65 65)"
              style={{ '--db-arc-circ': `${circ}`, transition: 'stroke-dashoffset 1.4s cubic-bezier(0.22, 1, 0.36, 1)', animation: 'db-arc-fill 1.4s cubic-bezier(0.22, 1, 0.36, 1) both' } as React.CSSProperties} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[34px] font-bold db-tighter db-num" style={{ color: 'var(--db-t1)' }}>
              {animatedPct}<span className="text-[14px] font-medium" style={{ color: 'var(--db-t3)' }}>%</span>
            </div>
            <div className="text-[9px] uppercase tracking-[0.08em] mt-0.5" style={{ color: 'var(--db-t4)' }}>
              {t('db.premium.moyenneEnCours')}
            </div>
          </div>
        </div>
      </div>

      {/* Mini KPIs planning */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: t('db.premium.miniTaches'), value: `${tachesTerminees}/${tachesTotal}`, color: 'var(--db-teal)' },
          { label: t('db.premium.miniRetard'), value: String(tachesEnRetard), color: tachesEnRetard > 0 ? 'var(--db-danger)' : 'var(--db-success)' },
          { label: t('db.premium.miniProjets'), value: String(projetsEnCours.length), color: 'var(--db-t1)' },
        ].map((kpi, i) => (
          <div key={i} className="rounded-lg px-2 py-1.5 text-center" style={{ background: 'var(--db-subtle)' }}>
            <div className="text-[14px] font-bold db-num db-tight" style={{ color: kpi.color }}>{kpi.value}</div>
            <div className="text-[8px] uppercase tracking-[0.06em] mt-0.5" style={{ color: 'var(--db-t4)' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Top 5 projets — barres horizontales */}
      <div className="flex-1 flex flex-col gap-2">
        <div className="text-[9.5px] uppercase tracking-[0.08em] font-medium" style={{ color: 'var(--db-t4)' }}>
          {t('db.premium.topProjetsAvancement')}
        </div>
        {top5.map((p) => {
          const pct = p.avancementGlobal ?? 0
          const barColor = pct >= 70 ? 'var(--db-success)' : pct >= 40 ? 'var(--db-orange)' : pct > 0 ? 'var(--db-warn)' : 'var(--db-t4)'
          return (
            <div key={p.id} className="flex items-center gap-2">
              <span className="text-[10px] truncate flex-1 min-w-0" style={{ color: 'var(--db-t2)' }}>{p.nom}</span>
              <div className="w-[60px] h-[5px] rounded-sm overflow-hidden shrink-0" style={{ background: 'var(--db-subtle)' }}>
                <div className="h-full rounded-sm db-progress-fill" style={{ width: `${pct}%`, background: barColor }} />
              </div>
              <span className="text-[10px] font-semibold db-num w-[32px] text-right shrink-0" style={{ color: barColor }}>{pct}%</span>
            </div>
          )
        })}
        {top5.length === 0 && (
          <div className="text-[10.5px] text-center py-2" style={{ color: 'var(--db-t4)' }}>—</div>
        )}
      </div>
    </div>
  )
}
