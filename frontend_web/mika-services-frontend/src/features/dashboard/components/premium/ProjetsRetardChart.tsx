import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { ProjetSummary } from '@/types/projet'

export interface ProjetsRetardChartProps {
  projets: ProjetSummary[]
}

interface ProjetRetard {
  id: number
  nom: string
  dateDebut: string
  dateFin: string
  avancement: number
  joursRetard: number
  joursPrevus: number
  joursEcoules: number
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

export function ProjetsRetardChart({ projets }: ProjetsRetardChartProps) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const retards: ProjetRetard[] = useMemo(() => {
    return projets
      .filter(p =>
        ['EN_COURS_EXECUTION', 'EN_AVANCE'].includes(p.statut) &&
        p.dateFin && p.dateFin < today
      )
      .map(p => ({
        id: p.id,
        nom: p.nom,
        dateDebut: p.dateDebut ?? today,
        dateFin: p.dateFin!,
        avancement: p.avancementGlobal ?? 0,
        joursRetard: daysBetween(p.dateFin!, today),
        joursPrevus: p.dateDebut ? daysBetween(p.dateDebut, p.dateFin!) : 0,
        joursEcoules: p.dateDebut ? daysBetween(p.dateDebut, today) : 0,
      }))
      .sort((a, b) => b.joursRetard - a.joursRetard)
  }, [projets, today])

  // Échelle : le max est le plus grand joursEcoules
  const maxJours = useMemo(() => Math.max(...retards.map(r => r.joursEcoules), 1), [retards])

  if (retards.length === 0) {
    return (
      <div className="col-span-12 lg:col-span-6 rounded-2xl p-5" style={{ background: 'var(--db-card)', animation: 'db-rise 380ms ease-out 180ms both' }}>
        <div className="flex items-center gap-2.5 mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--db-t3)' }}>
            {t('db.premium.kpiRetard')}
          </span>
        </div>
        <div className="flex items-center justify-center h-[140px] text-[12px]" style={{ color: 'var(--db-success)' }}>
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          {t('db.premium.retardOk')}
        </div>
      </div>
    )
  }

  const barH = 32
  const gapY = 8
  const padL = 4
  const chartH = retards.length * (barH + gapY) - gapY + 8

  return (
    <div className="col-span-12 lg:col-span-6 rounded-2xl p-5 relative overflow-hidden" style={{ background: 'var(--db-card)', animation: 'db-rise 380ms ease-out 180ms both' }}>
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'var(--db-danger)' }} />

      <div className="flex items-center gap-2.5 mb-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--db-t3)' }}>
          {t('db.premium.kpiRetard')}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold" style={{ background: 'var(--db-danger-bg2)', color: 'var(--db-danger)' }}>
          {retards.length}
        </span>
      </div>

      {/* Légende */}
      <div className="flex items-center gap-4 mb-3 text-[10px]" style={{ color: 'var(--db-t4)' }}>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2.5 rounded-sm inline-block" style={{ background: 'var(--db-t1)', opacity: 0.15 }} />
          {t('db.premium.retardDureePrevue')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2.5 rounded-sm inline-block" style={{ background: 'var(--db-danger)', opacity: 0.7 }} />
          {t('db.premium.retardDepassement')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2.5 rounded-sm inline-block" style={{ background: 'var(--db-success)' }} />
          {t('db.premium.retardAvancement')}
        </span>
      </div>

      {/* Graphique Gantt horizontal */}
      <div className="space-y-0" onMouseLeave={() => setHoverIdx(null)}>
        {retards.map((r, i) => {
          const prevuPct = (r.joursPrevus / maxJours) * 100
          const ecoulesPct = (r.joursEcoules / maxJours) * 100
          const retardPct = (r.joursRetard / maxJours) * 100
          const avancPct = (r.avancement / 100) * prevuPct
          const isHovered = hoverIdx === i

          return (
            <div
              key={r.id}
              className="rounded-lg px-3 py-2 cursor-pointer transition-all duration-150"
              style={{ background: isHovered ? 'var(--db-subtle)' : 'transparent' }}
              onMouseEnter={() => setHoverIdx(i)}
              onClick={() => navigate(`/projets/${r.id}`)}
            >
              {/* Nom + jours retard */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium truncate flex-1 mr-2" style={{ color: 'var(--db-t1)' }}>{r.nom}</span>
                <span className="text-[10.5px] font-bold db-num shrink-0 px-1.5 py-0.5 rounded" style={{ background: 'var(--db-danger-bg2)', color: 'var(--db-danger)' }}>
                  +{r.joursRetard}j
                </span>
              </div>

              {/* Barre composite */}
              <div className="relative h-[14px] rounded-full overflow-hidden" style={{ background: 'var(--db-subtle)' }}>
                {/* Durée prévue (fond gris clair) */}
                <div className="absolute top-0 left-0 h-full rounded-full" style={{ width: `${prevuPct}%`, background: 'var(--db-t1)', opacity: 0.08 }} />

                {/* Avancement réel (vert, sur la durée prévue) */}
                <div className="absolute top-0 left-0 h-full rounded-full" style={{ width: `${avancPct}%`, background: 'var(--db-success)', opacity: 0.85 }} />

                {/* Dépassement (rouge, après la date de fin) */}
                <div className="absolute top-0 h-full rounded-r-full" style={{ left: `${prevuPct}%`, width: `${retardPct}%`, background: 'var(--db-danger)', opacity: 0.6 }} />

                {/* Marqueur date fin prévue */}
                <div className="absolute top-0 h-full w-[2px]" style={{ left: `${prevuPct}%`, background: 'var(--db-t1)', opacity: 0.3 }} />
              </div>

              {/* Détails sous la barre */}
              <div className="flex items-center justify-between mt-1 text-[9px]" style={{ color: 'var(--db-t4)' }}>
                <span>{r.avancement}% {t('db.premium.retardRealise')}</span>
                <span>{r.joursPrevus}j {t('db.premium.retardPrevus')} · {r.joursEcoules}j {t('db.premium.retardEcoules')}</span>
              </div>

              {/* Infobulle au hover */}
              {isHovered && (
                <div className="mt-2 p-2.5 rounded-lg text-[11px] border" style={{ background: 'var(--db-card)', borderColor: 'var(--db-border)' }}>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span style={{ color: 'var(--db-t3)' }}>{t('db.premium.retardDebut')}</span>
                    <span className="font-medium db-num" style={{ color: 'var(--db-t1)' }}>{r.dateDebut}</span>
                    <span style={{ color: 'var(--db-t3)' }}>{t('db.premium.retardFinPrevue')}</span>
                    <span className="font-medium db-num" style={{ color: 'var(--db-t1)' }}>{r.dateFin}</span>
                    <span style={{ color: 'var(--db-t3)' }}>{t('db.premium.retardJoursRetard')}</span>
                    <span className="font-bold db-num" style={{ color: 'var(--db-danger)' }}>+{r.joursRetard} jours</span>
                    <span style={{ color: 'var(--db-t3)' }}>{t('db.premium.retardAvancement')}</span>
                    <span className="font-medium db-num" style={{ color: r.avancement >= 70 ? 'var(--db-success)' : 'var(--db-warn)' }}>{r.avancement}%</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
