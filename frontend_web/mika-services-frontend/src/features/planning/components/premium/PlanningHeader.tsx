import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ProjetSummary } from '@/types/projet'

export interface PlanningHeaderProps {
  projets: ProjetSummary[]
  selectedProjetId: number | null
  onSelectProjet: (id: number | null) => void
  canEdit: boolean
  onNewTask: () => void
}

export function PlanningHeader({ projets, selectedProjetId, onSelectProjet, canEdit, onNewTask }: PlanningHeaderProps) {
  const { t } = useTranslation('planning')

  // Dédupliquer par ID et trier par nom (évite les doublons JPA @ElementCollection)
  const uniqueProjets = useMemo(() => {
    const seen = new Set<number>()
    return projets
      .filter((p) => { if (seen.has(p.id)) return false; seen.add(p.id); return true })
      .sort((a, b) => (a.nom ?? '').localeCompare(b.nom ?? '', 'fr'))
  }, [projets])

  return (
    <header className="flex flex-col sm:flex-row sm:items-center gap-4 py-2 pb-4" style={{ animation: 'db-rise 380ms ease-out both' }}>
      <div>
        <h1 className="m-0 text-xl font-semibold db-tight" style={{ color: 'var(--db-t1)' }}>
          {t('title')}
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--db-t3)' }}>
          {t('headerDescription')}
        </p>
      </div>

      <div className="flex-1" />

      {/* Selecteur de projet + bouton */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
        <select
          value={selectedProjetId ?? ''}
          onChange={(e) => onSelectProjet(e.target.value ? Number(e.target.value) : null)}
          className="text-sm font-medium px-4 py-2.5 rounded-lg border transition-all hover:bg-[var(--db-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--db-teal)]/40 w-full sm:min-w-[220px]"
          style={{ background: 'var(--db-card)', borderColor: 'var(--db-border)', color: 'var(--db-t1)' }}
        >
          <option value="">{t('selectProjectPlaceholder')}</option>
          {uniqueProjets.map((p) => (
            <option key={p.id} value={p.id}>{p.nom}</option>
          ))}
        </select>

        {canEdit && selectedProjetId && (
          <button
            type="button"
            onClick={onNewTask}
            className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg text-white transition-all duration-150 hover:opacity-90 shadow-sm whitespace-nowrap"
            style={{ background: 'var(--db-teal)', animation: 'db-rise 380ms ease-out 60ms both' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {t('newTask')}
          </button>
        )}
      </div>
    </header>
  )
}
