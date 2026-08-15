import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ProjetSummary } from '@/types/projet'

export interface PlanningHeaderProps {
  projets: ProjetSummary[]
  selectedProjetId: number | null
  onSelectProjet: (id: number | null) => void
  canEdit: boolean
  onNewTask: () => void
  readOnly?: boolean
  onExport?: () => void
  exporting?: boolean
}

export function PlanningHeader({ projets, selectedProjetId, onSelectProjet, canEdit, onNewTask, readOnly, onExport, exporting }: PlanningHeaderProps) {
  const { t } = useTranslation('planning')

  const uniqueProjets = useMemo(() => {
    const seen = new Set<number>()
    return projets
      .filter((p) => { if (seen.has(p.id)) return false; seen.add(p.id); return true })
      .sort((a, b) => (a.nom ?? '').localeCompare(b.nom ?? '', 'fr'))
  }, [projets])

  const selectedProjet = uniqueProjets.find((p) => p.id === selectedProjetId)

  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000)
  const currentWeek = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7)
  const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`

  const subtitle = selectedProjetId
    ? `${selectedProjet?.nom ?? ''} · semaine S${currentWeek} · ${dateStr}`
    : `Vue globale — ${uniqueProjets.length} projet${uniqueProjets.length > 1 ? 's' : ''} accessible${uniqueProjets.length > 1 ? 's' : ''} · semaine S${currentWeek} · ${dateStr}`

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 23, fontWeight: 800, letterSpacing: '-.02em', color: 'var(--db-t1)' }}>
            {t('title')}
          </h1>
          <div style={{ fontSize: 12, color: 'var(--db-t2)', marginTop: 5 }}>{subtitle}</div>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <select
            value={selectedProjetId ?? ''}
            onChange={(e) => onSelectProjet(e.target.value ? Number(e.target.value) : null)}
            style={{
              height: 38, minWidth: 330,
              border: '1px solid var(--db-border-str)',
              borderRadius: 'var(--db-radius-sm)',
              background: 'var(--db-card)',
              color: 'var(--db-t1)',
              fontSize: 13, fontWeight: 500,
              padding: '0 10px',
            }}
          >
            <option value="">— {t('selectProjectPlaceholder', { defaultValue: 'Aucun projet sélectionné (vue globale)' })}</option>
            {uniqueProjets.map((p) => (
              <option key={p.id} value={p.id}>{p.nom}</option>
            ))}
          </select>

          {canEdit && selectedProjetId && (
            <button
              type="button"
              onClick={onNewTask}
              style={{
                height: 38, padding: '0 16px',
                border: 0,
                borderRadius: 'var(--db-radius-sm)',
                background: 'var(--db-orange)',
                color: '#fff',
                fontSize: 13, fontWeight: 700,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 7,
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
              {t('newTask')}
            </button>
          )}

          {!selectedProjetId && onExport && (
            <button
              type="button"
              onClick={onExport}
              disabled={exporting}
              style={{
                height: 38, padding: '0 18px',
                border: '1.5px solid var(--db-border-str)',
                borderRadius: 'var(--db-radius-sm)',
                background: exporting ? 'var(--db-subtle)' : 'var(--db-card)',
                color: exporting ? 'var(--db-t3)' : 'var(--db-t1)',
                fontSize: 13, fontWeight: 700,
                cursor: exporting ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all .15s',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {exporting ? 'Export en cours...' : 'Exporter Excel'}
            </button>
          )}
        </div>
      </div>

      {readOnly && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'var(--db-info-bg2)',
          border: '1px solid var(--db-info)',
          borderRadius: 'var(--db-radius)',
          padding: '12px 16px',
          marginTop: 16,
        }}>
          <span style={{
            width: 22, height: 22, borderRadius: '50%',
            background: 'var(--db-info)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800,
          }}>i</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--db-info)' }}>
              Mode consultation — lecture seule
            </div>
            <div style={{ fontSize: 12, color: 'var(--db-t2)', marginTop: 2 }}>
              Vous consultez ce projet sans droits d'édition. Création, modification et suppression sont désactivées.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
