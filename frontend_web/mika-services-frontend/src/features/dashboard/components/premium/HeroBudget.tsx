import { useMemo, useId, useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useFormatNumber } from '@/hooks/useFormatNumber'
import type { BudgetStats, EvolutionCA } from '@/types/reporting'

export interface HeroBudgetProps {
  budget: BudgetStats
}

function toNum(v: unknown): number {
  if (typeof v === 'number') return isNaN(v) ? 0 : v
  if (typeof v === 'string') { const n = parseFloat(v); return isNaN(n) ? 0 : n }
  return 0
}

const MOIS_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

export function HeroBudget({ budget }: HeroBudgetProps) {
  const { t } = useTranslation('common')
  const { formatShort, formatMontant } = useFormatNumber()
  const navigate = useNavigate()
  const gid = useId().replace(/:/g, '')
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const montantEnCours = toNum(budget.montantMarchesEnCours)
  const montantTotal = toNum(budget.montantTotalMarches)
  const caPrevCumule = toNum(budget.caPrevisionnelCumule)
  const caRealCumule = toNum(budget.caRealiseCumule)
  const tauxPct = Math.min(toNum(budget.tauxRealisation), 100)

  const evolution: EvolutionCA[] = (budget.evolutionMensuelle ?? []).map(e => ({
    mois: e.mois, annee: e.annee,
    previsionnel: toNum(e.previsionnel),
    realise: toNum(e.realise),
  }))

  const lastRealiseIdx = useMemo(() => {
    for (let i = evolution.length - 1; i >= 0; i--) {
      if (evolution[i].realise > 0) return i
    }
    return -1
  }, [evolution])

  const hasEvolution = evolution.length >= 1

  const slotW = 68
  const barW = 24
  const gap = 6
  const totalW = evolution.length * slotW
  const H = 200, padTop = 10, padBot = 28

  const mx = useMemo(() => {
    if (!hasEvolution) return 1
    const allValues = evolution.flatMap(e => [e.previsionnel, e.realise]).filter(v => v > 0)
    return allValues.length > 0 ? Math.max(...allValues) * 1.12 : 1
  }, [evolution, hasEvolution])

  const yAt = (v: number) => padTop + (1 - v / mx) * (H - padTop - padBot)
  const baseline = H - padBot

  const yTicks = [0, 1, 2, 3].map(g => ({
    y: padTop + (g / 3) * (H - padTop - padBot),
    val: mx * (1 - g / 3),
  }))

  const hoveredData = hoverIdx !== null && hoverIdx < evolution.length ? evolution[hoverIdx] : null

  useEffect(() => {
    if (scrollRef.current && lastRealiseIdx > 0) {
      const targetX = Math.max(0, (lastRealiseIdx - 8) * slotW)
      scrollRef.current.scrollLeft = targetX
    }
  }, [lastRealiseIdx])

  return (
    <div
      className="col-span-12 lg:col-span-8 rounded-2xl p-5 relative overflow-hidden"
      style={{ background: 'var(--db-card)', animation: 'db-rise 380ms ease-out 120ms both' }}
    >
      {/* Accent top bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, var(--db-teal), var(--db-orange))' }} />

      <div className="flex items-center gap-2.5 mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--db-t3)' }}>
          {t('db.premium.budgetEngage')}
        </span>
        <span onClick={() => navigate('/budget')} className="ml-auto text-[11px] cursor-pointer hover:text-[var(--db-t1)] transition-colors" style={{ color: 'var(--db-t3)' }}>
          {t('db.premium.detailBudget')} →
        </span>
      </div>

      {/* Montant principal */}
      <div className="flex items-end gap-4 mb-4">
        <div>
          <div className="text-[42px] font-bold db-tighter db-num leading-none" style={{ color: 'var(--db-t1)' }}>
            {formatShort(montantEnCours)}
            <span className="text-[15px] font-medium ml-1.5 tracking-tight" style={{ color: 'var(--db-t3)' }}>FCFA</span>
          </div>
          <div className="text-[12px] db-num mt-1" style={{ color: 'var(--db-t4)' }}>
            {t('db.premium.marchesEnCours')} · {t('db.premium.sur')} {formatShort(montantTotal)} {t('db.premium.totalMarches')}
          </div>
        </div>
        {/* Mini badge taux */}
        <div className="mb-1.5 ml-auto flex flex-col items-end gap-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-semibold db-num" style={{
            background: tauxPct >= 50 ? 'var(--db-success-bg)' : 'var(--db-subtle)',
            color: tauxPct >= 50 ? 'var(--db-success)' : 'var(--db-t2)',
          }}>
            {tauxPct.toFixed(1)}%
          </span>
          <span className="text-[10px]" style={{ color: 'var(--db-t4)' }}>{t('db.premium.tauxRealisationGlobal')}</span>
        </div>
      </div>

      {/* Graphique */}
      {hasEvolution ? (
        <div className="relative rounded-xl overflow-hidden" style={{ background: 'var(--db-subtle)', padding: '1px' }}>
          <div className="rounded-xl overflow-hidden" style={{ background: 'var(--db-card)' }}>
            {/* Labels Y fixes */}
            <div className="absolute left-0 top-0 bottom-0 z-10 w-[52px] pointer-events-none rounded-l-xl" style={{ background: 'var(--db-card)' }}>
              <svg width={52} height={H} viewBox={`0 0 52 ${H}`}>
                {yTicks.map((tick, g) => (
                  <text key={g} x={48} y={tick.y + 4} fontSize={9.5} fill="var(--db-t3)" textAnchor="end" fontWeight={500}>{formatShort(tick.val)}</text>
                ))}
              </svg>
            </div>

            {/* Zone scrollable */}
            <div ref={scrollRef} className="overflow-x-auto scrollbar-hide ml-[52px]" onMouseLeave={() => setHoverIdx(null)}>
              <svg width={totalW} height={H} viewBox={`0 0 ${totalW} ${H}`} className="block">
                <defs>
                  <linearGradient id={`g-teal-${gid}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--db-teal)" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="var(--db-teal)" stopOpacity={0.5} />
                  </linearGradient>
                  <linearGradient id={`g-orange-${gid}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--db-orange)" stopOpacity={1} />
                    <stop offset="100%" stopColor="var(--db-orange)" stopOpacity={0.6} />
                  </linearGradient>
                  <filter id={`glow-${gid}`}>
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>

                {/* Grille */}
                {yTicks.map((tick, g) => (
                  <line key={g} x1={0} x2={totalW} y1={tick.y} y2={tick.y} stroke="var(--db-border)" strokeWidth={0.6} />
                ))}

                {/* Barres */}
                {evolution.map((e, i) => {
                  const cx = slotW * i + slotW / 2
                  const isHovered = hoverIdx === i
                  const hasRealise = i <= lastRealiseIdx && e.realise > 0
                  const hPrev = Math.max(0, (e.previsionnel / mx) * (H - padTop - padBot))
                  const hReal = hasRealise ? Math.max(0, (e.realise / mx) * (H - padTop - padBot)) : 0
                  const isNewYear = i === 0 || evolution[i - 1].annee !== e.annee

                  return (
                    <g key={i}>
                      {/* Fond hover */}
                      {isHovered && (
                        <rect x={slotW * i + 2} y={padTop} width={slotW - 4} height={H - padTop - padBot}
                          fill="var(--db-subtle)" opacity={0.6} rx={4} />
                      )}

                      {/* Barre prévisionnel */}
                      <rect
                        x={cx - barW - gap / 2} y={baseline - hPrev} width={barW} height={hPrev} rx={4}
                        fill={`url(#g-teal-${gid})`} opacity={isHovered ? 1 : 0.7}
                        filter={isHovered ? `url(#glow-${gid})` : undefined}
                        style={{ transformOrigin: `${cx - barW / 2 - gap / 2}px ${baseline}px`, animation: `db-bar-grow 500ms ease-out ${i * 12}ms both`, transition: 'opacity 200ms' }}
                      />

                      {/* Barre réalisé */}
                      {hasRealise && (
                        <rect
                          x={cx + gap / 2} y={baseline - hReal} width={barW} height={hReal} rx={4}
                          fill={`url(#g-orange-${gid})`} opacity={isHovered ? 1 : 0.9}
                          filter={isHovered ? `url(#glow-${gid})` : undefined}
                          style={{ transformOrigin: `${cx + barW / 2 + gap / 2}px ${baseline}px`, animation: `db-bar-grow 500ms ease-out ${i * 12}ms both`, transition: 'opacity 200ms' }}
                        />
                      )}

                      {/* Valeur au-dessus des barres au hover */}
                      {isHovered && hPrev > 0 && (
                        <text x={cx - barW / 2 - gap / 2} y={baseline - hPrev - 6} fontSize={9} fill="var(--db-teal)" textAnchor="middle" fontWeight={700}>{formatShort(e.previsionnel)}</text>
                      )}
                      {isHovered && hReal > 0 && (
                        <text x={cx + barW / 2 + gap / 2} y={baseline - hReal - 6} fontSize={9} fill="var(--db-orange)" textAnchor="middle" fontWeight={700}>{formatShort(e.realise)}</text>
                      )}

                      {/* Label mois */}
                      <text x={cx} y={H - 6} fontSize={10} fill={isHovered ? 'var(--db-t1)' : isNewYear ? 'var(--db-t2)' : 'var(--db-t3)'} textAnchor="middle" fontWeight={isNewYear || isHovered ? 700 : 500}>
                        {MOIS_LABELS[(e.mois - 1) % 12]}
                      </text>

                      {/* Année */}
                      {isNewYear && (
                        <text x={cx} y={H + 7} fontSize={9} fill="var(--db-t2)" textAnchor="middle" fontWeight={600}>{e.annee}</text>
                      )}

                      {/* Zone de survol */}
                      <rect x={slotW * i} y={0} width={slotW} height={H}
                        fill="transparent" onMouseEnter={() => setHoverIdx(i)} />
                    </g>
                  )
                })}
              </svg>
            </div>
          </div>

          {/* Infobulle */}
          {hoveredData && hoverIdx !== null && (
            <div
              className="absolute z-20 pointer-events-none"
              style={{
                left: `calc(52px + ${slotW * hoverIdx + slotW / 2}px - ${scrollRef.current?.scrollLeft ?? 0}px)`,
                top: -4,
                transform: 'translateX(-50%)',
              }}
            >
              <div className="bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 rounded-xl shadow-2xl dark:shadow-black/40 px-4 py-3 text-[11.5px] min-w-[220px] backdrop-blur-sm" style={{ animation: 'db-rise 120ms ease-out both' }}>
                <div className="font-bold text-[13px] mb-2.5 pb-2 border-b" style={{ color: 'var(--db-t1)', borderColor: 'var(--db-border)' }}>
                  {MOIS_LABELS[(hoveredData.mois - 1) % 12]} {hoveredData.annee}
                </div>
                <div className="flex justify-between items-center gap-4 mb-1.5">
                  <span className="flex items-center gap-2" style={{ color: 'var(--db-t2)' }}>
                    <span className="w-3 h-3 rounded" style={{ background: 'var(--db-teal)', opacity: 0.6 }} />
                    {t('db.premium.caPrevisionnel')}
                  </span>
                  <span className="font-semibold db-num" style={{ color: 'var(--db-t1)' }}>{formatMontant(hoveredData.previsionnel)}</span>
                </div>
                <div className="flex justify-between items-center gap-4 mb-1">
                  <span className="flex items-center gap-2" style={{ color: 'var(--db-t2)' }}>
                    <span className="w-3 h-3 rounded" style={{ background: 'var(--db-orange)', opacity: 0.8 }} />
                    {t('db.premium.caRealise')}
                  </span>
                  <span className="font-semibold db-num" style={{ color: 'var(--db-t1)' }}>
                    {hoverIdx <= lastRealiseIdx && hoveredData.realise > 0 ? formatMontant(hoveredData.realise) : '—'}
                  </span>
                </div>
                {hoverIdx <= lastRealiseIdx && hoveredData.realise > 0 && hoveredData.previsionnel > 0 && (
                  <div className="flex justify-between items-center gap-4 pt-2 mt-2 border-t" style={{
                    borderColor: 'var(--db-border)',
                    color: hoveredData.realise >= hoveredData.previsionnel ? 'var(--db-success)' : 'var(--db-danger)'
                  }}>
                    <span className="text-[11px] font-medium">Écart</span>
                    <span className="font-bold db-num text-[11px]">
                      {hoveredData.realise >= hoveredData.previsionnel ? '+' : ''}{formatMontant(hoveredData.realise - hoveredData.previsionnel)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-[175px] text-[12px] rounded-xl" style={{ color: 'var(--db-t3)', background: 'var(--db-subtle)' }}>
          {t('db.operations.emptyWeekly')}
        </div>
      )}

      {/* Légende */}
      <div className="flex items-center gap-5 mt-3 mb-2.5 text-[10.5px]" style={{ color: 'var(--db-t3)' }}>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded" style={{ background: 'var(--db-teal)', opacity: 0.55 }} />
          {t('db.premium.caPrevisionnel')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded" style={{ background: 'var(--db-orange)', opacity: 0.8 }} />
          {t('db.premium.caRealise')}
        </span>
        <span className="ml-auto db-num font-medium" style={{ color: 'var(--db-t2)' }}>{formatShort(caRealCumule)} / {formatShort(caPrevCumule)}</span>
      </div>

      {/* Progress bar améliorée */}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--db-subtle)' }}>
        <div className="h-full rounded-full db-progress-fill" style={{ width: `${tauxPct}%`, background: 'linear-gradient(90deg, var(--db-orange), #FF8F5E)' }} />
      </div>
    </div>
  )
}
