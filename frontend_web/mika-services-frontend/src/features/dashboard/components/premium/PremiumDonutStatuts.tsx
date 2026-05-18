import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { STATUT_LABELS } from '../../constants/projetStatuts'
import type { StatutProjet } from '@/types/projet'

export interface PremiumDonutStatutsProps { parStatut: Record<string, number> }

const COLORS: Record<string, string> = {
  EN_COURS_EXECUTION: 'var(--db-teal)', EN_AVANCE: 'var(--db-teal)',
  SUSPENSION: 'var(--db-orange)', RECEPTION_PROVISOIRE: 'var(--db-teal-dk)',
  RECEPTION_DEFINITIVE: 'var(--db-teal-dk)', INITIALISATION: '#C5C8CC',
}

export function PremiumDonutStatuts({ parStatut }: PremiumDonutStatutsProps) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const [hoverKey, setHoverKey] = useState<string | null>(null)

  const segments = useMemo(() => {
    const entries = Object.entries(parStatut).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
    const total = entries.reduce((s, [, v]) => s + v, 0)
    const circ = 2 * Math.PI * 40
    let offset = 0
    return entries.map(([key, value]) => {
      const dash = (value / Math.max(total, 1)) * circ
      const seg = { key, value, pct: Math.round((value / Math.max(total, 1)) * 100), dash, offset, color: COLORS[key] ?? '#C5C8CC' }
      offset -= dash
      return seg
    })
  }, [parStatut])

  const total = segments.reduce((s, seg) => s + seg.value, 0)

  return (
    <div className="col-span-12 lg:col-span-4 rounded-2xl p-5 relative overflow-hidden" style={{ background: 'var(--db-card)', animation: 'db-rise 380ms ease-out 270ms both' }}>
      <div className="flex items-center gap-2.5 mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--db-t3)' }}>{t('db.premium.statutsProjets')}</span>
        <span onClick={() => navigate('/projets')} className="ml-auto text-[11px] cursor-pointer hover:text-[var(--db-t1)] transition-colors" style={{ color: 'var(--db-t3)' }}>
          {t('db.premium.voirTous')} →
        </span>
      </div>

      <div className="grid grid-cols-2 items-center gap-3">
        {/* Donut SVG */}
        <div className="relative w-full" style={{ aspectRatio: '1' }} onMouseLeave={() => setHoverKey(null)}>
          <svg viewBox="0 0 100 100">
            {/* Track de fond */}
            <circle cx={50} cy={50} r={40} fill="none" stroke="var(--db-subtle)" strokeWidth={14} />

            {/* Segments */}
            {segments.map((seg, i) => {
              const isHovered = hoverKey === seg.key
              return (
                <circle
                  key={seg.key} cx={50} cy={50} r={40} fill="none"
                  stroke={seg.color}
                  strokeWidth={isHovered ? 18 : 14}
                  strokeDasharray={`${seg.dash} ${2 * Math.PI * 40}`}
                  strokeDashoffset={seg.offset}
                  transform="rotate(-90 50 50)"
                  onMouseEnter={() => setHoverKey(seg.key)}
                  style={{
                    '--db-arc-circ': `${2 * Math.PI * 40}`,
                    animation: `db-arc-fill 1s cubic-bezier(0.22, 1, 0.36, 1) ${200 + i * 120}ms both`,
                    transition: 'stroke-width 200ms',
                    cursor: 'pointer',
                    filter: isHovered ? 'brightness(1.1)' : undefined,
                  } as React.CSSProperties}
                  onClick={e => { e.stopPropagation(); navigate('/projets') }}
                />
              )
            })}
          </svg>

          {/* Centre du donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {hoverKey ? (
              <>
                <div className="text-[26px] font-bold db-tight db-num" style={{ color: 'var(--db-t1)' }}>
                  {segments.find(s => s.key === hoverKey)?.value ?? 0}
                </div>
                <div className="text-[9px] uppercase tracking-[0.08em] text-center px-2 truncate max-w-[80px]" style={{ color: 'var(--db-t3)' }}>
                  {STATUT_LABELS[hoverKey as StatutProjet] ?? hoverKey}
                </div>
              </>
            ) : (
              <>
                <div className="text-[28px] font-bold db-tight db-num" style={{ color: 'var(--db-t1)' }}>{total}</div>
                <div className="text-[9px] uppercase tracking-[0.08em]" style={{ color: 'var(--db-t3)' }}>{t('db.kpi.totalProjects')}</div>
              </>
            )}
          </div>
        </div>

        {/* Légende interactive */}
        <div className="flex flex-col gap-1.5">
          {segments.map(seg => {
            const isHovered = hoverKey === seg.key
            return (
              <div
                key={seg.key}
                className="flex items-center gap-2 text-[11.5px] px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-150"
                style={{ background: isHovered ? 'var(--db-subtle)' : 'transparent', color: 'var(--db-t2)' }}
                onMouseEnter={() => setHoverKey(seg.key)}
                onMouseLeave={() => setHoverKey(null)}
                onClick={e => { e.stopPropagation(); navigate('/projets') }}
              >
                <span className="w-[10px] h-[10px] rounded shrink-0 transition-transform duration-150" style={{ background: seg.color, transform: isHovered ? 'scale(1.3)' : 'scale(1)' }} />
                <span className="flex-1 truncate" style={{ fontWeight: isHovered ? 600 : 400, color: isHovered ? 'var(--db-t1)' : undefined }}>
                  {STATUT_LABELS[seg.key as StatutProjet] ?? seg.key}
                </span>
                <span className="font-semibold db-num shrink-0" style={{ color: isHovered ? seg.color : 'var(--db-t1)' }}>{seg.value}</span>
                <span className="text-[10px] db-num min-w-[28px] text-right shrink-0" style={{ color: 'var(--db-t4)' }}>{seg.pct}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
