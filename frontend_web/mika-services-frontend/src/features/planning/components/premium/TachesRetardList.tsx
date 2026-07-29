import { useTranslation } from 'react-i18next'
import { useFormatDate } from '@/hooks/useFormatDate'
import { Priorite } from '@/types/planning'
import type { Tache } from '@/types/planning'

export interface TachesRetardListProps {
  taches: Tache[]
  selectedProjetId: number | null
}

const prioColor: Record<Priorite, string> = {
  [Priorite.BASSE]: 'var(--db-t3)',
  [Priorite.NORMALE]: 'var(--db-teal)',
  [Priorite.HAUTE]: 'var(--db-orange)',
  [Priorite.URGENTE]: 'var(--db-danger)',
  [Priorite.CRITIQUE]: 'var(--db-danger)',
}

export function TachesRetardList({ taches, selectedProjetId }: TachesRetardListProps) {
  const { t } = useTranslation('planning')
  const formatDate = useFormatDate()

  const filtered = selectedProjetId
    ? taches.filter((tr) => tr.projetId === selectedProjetId)
    : taches

  if (filtered.length === 0) return null

  return (
    <div
      className="col-span-12 lg:col-span-8 rounded-xl p-5"
      style={{ background: 'var(--db-card)', animation: 'db-rise 380ms ease-out 240ms both' }}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-2 h-2 rounded-full" style={{ background: 'var(--db-danger)', animation: 'db-pulse 2s infinite' }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--db-t3)' }}>
          {t('tasksLateTitle', { count: filtered.length })}
        </span>
      </div>

      <div className="space-y-0.5">
        {filtered.slice(0, 8).map((tr, idx) => (
          <div
            key={tr.id}
            className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-3 border-b last:border-b-0 transition-colors hover:bg-[var(--db-subtle)] rounded-lg px-2 -mx-2"
            style={{ borderColor: 'var(--db-border)', animation: `db-rise 280ms ease-out ${idx * 20}ms both` }}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--db-danger)' }} />
              <div className="min-w-0 flex-1">
                <span className="font-medium text-sm truncate block" style={{ color: 'var(--db-t1)' }}>
                  {tr.titre}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  {!selectedProjetId && tr.projetNom && (
                    <span className="text-[11px] truncate max-w-[140px]" style={{ color: 'var(--db-t4)' }}>
                      {tr.projetNom}
                    </span>
                  )}
                  {tr.semaine != null && (
                    <span className="text-[11px] db-num" style={{ color: 'var(--db-t4)' }}>
                      {!selectedProjetId && tr.projetNom ? '· ' : ''}S{tr.semaine}/{tr.annee}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pl-3.5 sm:pl-0">
              <span
                className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: 'var(--db-subtle)', color: prioColor[tr.priorite] }}
              >
                {t(`priorite.${tr.priorite}`)}
              </span>

              <span className="shrink-0 text-sm db-num font-semibold" style={{ color: 'var(--db-danger)' }}>
                {tr.dateEcheance ? formatDate(tr.dateEcheance, { monthStyle: 'short' }) : '—'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
