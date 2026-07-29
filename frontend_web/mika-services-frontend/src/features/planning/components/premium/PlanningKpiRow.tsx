import { useTranslation } from 'react-i18next'
import { useCountUp } from '@/features/dashboard/hooks/useCountUp'

export interface PlanningKpiRowProps {
  total: number
  aFaire: number
  enCours: number
  terminees: number
  enRetard: number
  /** Nombre de projets concernes (vue globale) */
  projetsCount?: number
}

function AnimatedValue({ n }: { n: number }) {
  const v = useCountUp(n)
  return <>{v}</>
}

const kpis = [
  { key: 'total',     color: 'var(--db-t1)',      accent: false, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { key: 'aFaire',    color: 'var(--db-t2)',      accent: false, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { key: 'enCours',   color: 'var(--db-teal)',    accent: false, icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'terminees', color: 'var(--db-success)', accent: false, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'enRetard',  color: 'var(--db-danger)',  accent: true,  icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
]

export function PlanningKpiRow({ total, aFaire, enCours, terminees, enRetard, projetsCount }: PlanningKpiRowProps) {
  const { t } = useTranslation('planning')

  const values: Record<string, number> = { total, aFaire, enCours, terminees, enRetard }

  const labels: Record<string, string> = {
    total: t('kpiTotal'),
    aFaire: t('kpiAFaire'),
    enCours: t('kpiEnCours'),
    terminees: t('kpiTerminees'),
    enRetard: t('kpiEnRetard'),
  }

  return (
    <div className="col-span-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {kpis.map((kpi, i) => (
        <div
          key={kpi.key}
          className="rounded-xl p-5 flex flex-col transition-all duration-200 hover:scale-[1.015] hover:shadow-lg relative overflow-hidden"
          style={{ background: 'var(--db-card)', animation: `db-rise 380ms ease-out ${i * 30}ms both` }}
        >
          {kpi.accent && values[kpi.key] > 0 && (
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: kpi.color }} />
          )}

          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg grid place-items-center" style={{ background: 'var(--db-subtle)' }}>
              <svg className="w-4 h-4" style={{ color: kpi.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d={kpi.icon} />
              </svg>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--db-t3)' }}>
              {labels[kpi.key]}
            </span>
          </div>

          <div className="text-3xl font-bold db-tighter db-num leading-none" style={{ color: kpi.accent && values[kpi.key] > 0 ? kpi.color : kpi.color }}>
            <AnimatedValue n={values[kpi.key]} />
          </div>

          {kpi.key === 'total' && projetsCount !== undefined && (
            <p className="text-xs mt-2" style={{ color: 'var(--db-t4)' }}>
              sur {projetsCount} projet{projetsCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
