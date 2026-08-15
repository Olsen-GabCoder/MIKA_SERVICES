import { useCountUp } from '@/features/dashboard/hooks/useCountUp'

export interface PlanningKpiRowProps {
  total: number
  aFaire: number
  enCours: number
  terminees: number
  enRetard: number
  projetsCount?: number
}

function AnimatedValue({ n }: { n: number }) {
  const v = useCountUp(n)
  return <>{v}</>
}

const kpiDefs = [
  { key: 'total', label: 'Total tâches', color: 'var(--db-teal-dk)' },
  { key: 'aFaire', label: 'À faire', color: '#6B7280' },
  { key: 'enCours', label: 'En cours', color: 'var(--db-teal)' },
  { key: 'terminees', label: 'Terminées', color: 'var(--db-success)' },
  { key: 'enRetard', label: 'En retard', color: 'var(--db-danger)' },
]

export function PlanningKpiRow({ total, aFaire, enCours, terminees, enRetard, projetsCount }: PlanningKpiRowProps) {
  const values: Record<string, number> = { total, aFaire, enCours, terminees, enRetard }

  const subs: Record<string, string> = {
    total: projetsCount ? `sur ${projetsCount} projets` : 'planning projet',
    aFaire: 'non démarrées',
    enCours: 'en production',
    terminees: total > 0 ? `${Math.round((terminees / total) * 100)}% du planning` : '—',
    enRetard: enRetard > 0 ? 'action requise' : 'aucun retard',
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
      {kpiDefs.map((kpi) => {
        const v = values[kpi.key]
        const isHot = kpi.key === 'enRetard' && v > 0
        return (
          <div
            key={kpi.key}
            style={{
              background: isHot ? 'var(--db-danger-bg2)' : 'var(--db-card)',
              border: `1px solid ${isHot ? 'var(--db-danger)' : 'var(--db-border)'}`,
              borderRadius: 'var(--db-radius)',
              padding: '14px 16px',
              cursor: 'default',
              boxShadow: isHot ? '0 2px 10px rgba(200,85,61,.14)' : undefined,
              transition: 'transform .18s ease, box-shadow .18s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: kpi.color,
                animation: isHot ? 'mkPulse 1.8s ease-in-out infinite' : undefined,
              }} />
              <span style={{
                fontSize: 11, fontWeight: 700,
                letterSpacing: '.09em', textTransform: 'uppercase' as const,
                color: 'var(--db-t2)',
              }}>
                {kpi.label}
              </span>
            </div>
            <div style={{
              fontSize: isHot ? 32 : 29, fontWeight: 800,
              lineHeight: 1, letterSpacing: '-.02em',
              fontVariantNumeric: 'tabular-nums',
              color: isHot ? 'var(--db-danger)' : 'var(--db-t1)',
              margin: '10px 0 6px',
            }}>
              <AnimatedValue n={v} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--db-t3)' }}>
              {subs[kpi.key]}
            </div>
          </div>
        )
      })}
    </div>
  )
}
