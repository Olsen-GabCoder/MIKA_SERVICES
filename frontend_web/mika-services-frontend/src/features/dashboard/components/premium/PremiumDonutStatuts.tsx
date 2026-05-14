import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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

  const segments = useMemo(() => {
    const entries = Object.entries(parStatut).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
    const total = entries.reduce((s, [, v]) => s + v, 0)
    const circ = 2 * Math.PI * 40 // r=40
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
    <div className="col-span-12 lg:col-span-4 rounded-xl p-4" style={{ background: 'var(--db-card)', animation: 'db-rise 380ms ease-out 270ms both' }}>
      <div className="flex items-center gap-2.5 mb-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: 'var(--db-t3)' }}>{t('db.premium.statutsProjets')}</span>
      </div>
      <div className="grid grid-cols-2 items-center gap-2 h-full">
        {/* Donut SVG */}
        <div className="relative w-full" style={{ aspectRatio: '1' }}>
          <svg viewBox="0 0 100 100">
            {segments.map(seg => (
              <circle key={seg.key} cx={50} cy={50} r={40} fill="none" stroke={seg.color} strokeWidth={14}
                strokeDasharray={`${seg.dash} ${2 * Math.PI * 40}`} strokeDashoffset={seg.offset}
                transform="rotate(-90 50 50)" />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[28px] font-semibold db-tight db-num" style={{ color: 'var(--db-t1)' }}>{total}</div>
            <div className="text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--db-t3)' }}>{t('db.kpi.totalProjects')}</div>
          </div>
        </div>
        {/* Legend */}
        <div className="flex flex-col gap-2">
          {segments.map(seg => (
            <div key={seg.key} className="flex items-center gap-2.5 text-[12px]" style={{ color: 'var(--db-t2)' }}>
              <span className="w-[9px] h-[9px] rounded-sm shrink-0" style={{ background: seg.color }} />
              <span className="flex-1 truncate">{STATUT_LABELS[seg.key as StatutProjet] ?? seg.key}</span>
              <span className="font-medium db-num shrink-0" style={{ color: 'var(--db-t1)' }}>{seg.value}</span>
              <span className="text-[10.5px] db-num min-w-[30px] text-right shrink-0" style={{ color: 'var(--db-t4)' }}>{seg.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
