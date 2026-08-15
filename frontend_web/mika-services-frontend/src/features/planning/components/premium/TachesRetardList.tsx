import { useTranslation } from 'react-i18next'
import { Priorite } from '@/types/planning'
import type { Tache } from '@/types/planning'

export interface TachesRetardListProps {
  taches: Tache[]
  selectedProjetId: number | null
}

const PRIO_COLORS: Record<Priorite, { color: string; soft: string }> = {
  [Priorite.BASSE]: { color: '#8FA3AD', soft: 'rgba(143,163,173,.16)' },
  [Priorite.NORMALE]: { color: '#6B7280', soft: 'var(--db-subtle)' },
  [Priorite.HAUTE]: { color: 'var(--db-orange)', soft: 'var(--db-orange-soft)' },
  [Priorite.URGENTE]: { color: '#E4572E', soft: 'rgba(228,87,46,.14)' },
  [Priorite.CRITIQUE]: { color: 'var(--db-danger)', soft: 'var(--db-danger-bg2)' },
}

function fmtDate(d: string | null): string {
  if (!d) return '—'
  const parts = d.split('-')
  if (parts.length !== 3) return d
  return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`
}

function lateDays(tache: Tache): number {
  if (!tache.dateEcheance) return 0
  const diff = Math.floor((Date.now() - new Date(tache.dateEcheance).getTime()) / 86400000)
  return diff > 0 ? diff : 0
}

export function TachesRetardList({ taches, selectedProjetId }: TachesRetardListProps) {
  const { t } = useTranslation('planning')

  const filtered = selectedProjetId
    ? taches.filter((tr) => tr.projetId === selectedProjetId)
    : taches

  if (filtered.length === 0) {
    return (
      <div style={{
        background: 'var(--db-card)',
        border: '1px solid var(--db-border)',
        borderRadius: 'var(--db-radius)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '13px 16px',
          display: 'flex', alignItems: 'center', gap: 8,
          borderBottom: '1px solid var(--db-border)',
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--db-success)',
          }} />
          <span style={{ fontSize: 13.5, fontWeight: 800 }}>Tâches en retard</span>
          <span style={{
            fontSize: 11, fontWeight: 700, color: '#fff',
            background: 'var(--db-success)',
            borderRadius: 20, padding: '2px 8px',
          }}>0</span>
        </div>
        <div style={{ padding: '22px 16px', textAlign: 'center', fontSize: 12, color: 'var(--db-t2)' }}>
          Aucun retard sur ce projet — toutes les échéances sont respectées.
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--db-card)',
      border: '1px solid var(--db-border)',
      borderRadius: 'var(--db-radius)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '13px 16px',
        display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: '1px solid var(--db-border)',
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--db-danger)',
          animation: 'mkPulse 1.8s ease-in-out infinite',
        }} />
        <span style={{ fontSize: 13.5, fontWeight: 800 }}>Tâches en retard</span>
        <span style={{
          fontSize: 11, fontWeight: 700, color: '#fff',
          background: 'var(--db-danger)',
          borderRadius: 20, padding: '2px 8px',
        }}>{filtered.length}</span>
      </div>

      {filtered.slice(0, 4).map((tr) => {
        const days = lateDays(tr)
        const pc = PRIO_COLORS[tr.priorite]
        return (
          <div
            key={tr.id}
            style={{
              padding: '11px 16px',
              borderBottom: '1px solid var(--db-border)',
              cursor: 'default',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--db-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              {days > 0 && (
                <span style={{
                  fontSize: 9.5, fontWeight: 800, color: '#fff',
                  background: 'var(--db-danger)',
                  borderRadius: 3, padding: '2px 5px',
                }}>J+{days}</span>
              )}
              <span style={{
                fontSize: 12, fontWeight: 600, flex: 1,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{tr.titre}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 11, fontWeight: 700,
                color: pc.color, background: pc.soft,
                border: `1px solid ${pc.color}`,
                borderRadius: 'var(--db-radius-xs)',
                padding: '3px 7px', whiteSpace: 'nowrap',
              }}>{t(`priorite.${tr.priorite}`)}</span>
              {tr.semaine != null && (
                <span style={{ fontSize: 11, color: 'var(--db-t3)', fontVariantNumeric: 'tabular-nums' }}>
                  S{tr.semaine}·{String(tr.annee ?? '').slice(2)}
                </span>
              )}
              <span style={{
                fontSize: 11, fontWeight: 700, color: 'var(--db-danger)',
                marginLeft: 'auto', fontVariantNumeric: 'tabular-nums',
              }}>éch. {fmtDate(tr.dateEcheance)}</span>
            </div>
          </div>
        )
      })}

      {filtered.length > 0 && (
        <div style={{
          padding: '10px 16px', fontSize: 11.5, color: 'var(--db-t2)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>{Math.min(filtered.length, 4)} affichées</span>
          <a href="#" onClick={(e) => e.preventDefault()} style={{ fontWeight: 700, color: 'var(--db-orange)', textDecoration: 'none' }}>Tout parcourir →</a>
        </div>
      )}
    </div>
  )
}
