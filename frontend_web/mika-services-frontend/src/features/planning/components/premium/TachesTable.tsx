import { useTranslation } from 'react-i18next'
import { useFormatDate } from '@/hooks/useFormatDate'
import { StatutTache, Priorite } from '@/types/planning'
import type { Tache } from '@/types/planning'

export interface TachesTableProps {
  taches: Tache[]
  loading: boolean
  canEdit: boolean
  isOnline: boolean
  filterStatut: StatutTache | ''
  onFilterChange: (s: StatutTache | '') => void
  onStatusChange: (tache: Tache, statut: StatutTache) => void
  onEdit: (tache: Tache) => void
  onDelete: (id: number) => void
  totalPages: number
  currentPage: number
  onPageChange: (page: number) => void
  colSpanClass?: string
  title?: string
  filterStatuts?: StatutTache[]
}

const statutDot: Record<StatutTache, string> = {
  [StatutTache.A_FAIRE]: 'var(--db-t3)',
  [StatutTache.EN_COURS]: 'var(--db-teal)',
  [StatutTache.EN_ATTENTE]: 'var(--db-warn)',
  [StatutTache.TERMINEE]: 'var(--db-success)',
  [StatutTache.ANNULEE]: 'var(--db-danger)',
}

const prioriteColor: Record<Priorite, string> = {
  [Priorite.BASSE]: 'var(--db-t3)',
  [Priorite.NORMALE]: 'var(--db-teal)',
  [Priorite.HAUTE]: 'var(--db-orange)',
  [Priorite.URGENTE]: 'var(--db-danger)',
  [Priorite.CRITIQUE]: 'var(--db-danger)',
}

export function TachesTable({
  taches, loading, canEdit, isOnline,
  filterStatut, onFilterChange,
  onStatusChange, onEdit, onDelete,
  totalPages, currentPage, onPageChange,
  colSpanClass = 'col-span-12 lg:col-span-6',
  title,
  filterStatuts,
}: TachesTableProps) {
  const { t } = useTranslation('planning')
  const formatDate = useFormatDate()

  const filtered = filterStatut ? taches.filter((task) => task.statut === filterStatut) : taches

  return (
    <div
      className={`${colSpanClass} rounded-xl p-5`}
      style={{ background: 'var(--db-card)', animation: 'db-rise 380ms ease-out 180ms both' }}
    >
      {/* Header + filtres */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
        <span className="text-sm font-semibold uppercase tracking-wider shrink-0" style={{ color: 'var(--db-t2)' }}>
          {title || t('tasksListTitle')}
          <span className="ml-2 text-xs font-bold db-num" style={{ color: 'var(--db-t4)' }}>
            {filtered.length}/{taches.length}
          </span>
        </span>

        <div className="sm:ml-auto flex items-center gap-1.5 flex-wrap">
          {['' as const, ...(filterStatuts || Object.values(StatutTache))].map((s) => {
            const isActive = filterStatut === s
            const count = s ? taches.filter((task) => task.statut === s).length : taches.length
            return (
              <button
                key={s}
                type="button"
                onClick={() => onFilterChange(s)}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-150"
                style={{
                  background: isActive ? 'var(--db-t1)' : 'var(--db-subtle)',
                  color: isActive ? 'var(--db-card)' : 'var(--db-t3)',
                }}
              >
                {s !== '' && <span className="w-1.5 h-1.5 rounded-full" style={{ background: isActive ? 'var(--db-card)' : statutDot[s] }} />}
                {s === '' ? t('filterAll') : t(`statut.${s}`)}
                <span className="text-[11px] font-bold db-num" style={{ opacity: 0.6 }}>{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Read-only banner */}
      {!canEdit && taches.length > 0 && (
        <div
          className="flex items-center gap-2.5 text-xs px-4 py-2.5 rounded-lg mb-3 font-medium"
          style={{ background: 'var(--db-subtle)', color: 'var(--db-t3)' }}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          {t('readOnlyBanner')}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="inline-block w-7 h-7 border-2 rounded-full border-t-transparent animate-spin" style={{ borderColor: 'var(--db-teal)', borderTopColor: 'transparent' }} />
          <p className="mt-3 text-sm" style={{ color: 'var(--db-t3)' }}>{t('loading')}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-12 h-12 mx-auto rounded-xl grid place-items-center mb-4" style={{ background: 'var(--db-subtle)' }}>
            <svg className="w-6 h-6" style={{ color: 'var(--db-t4)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--db-t2)' }}>{t('empty')}</p>
          <p className="text-xs mt-1.5" style={{ color: 'var(--db-t4)' }}>{t('emptyHint')}</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {filtered.map((tache, idx) => (
            <div
              key={tache.id}
              className="rounded-xl border p-4 transition-all duration-150 hover:shadow-sm group"
              style={{
                borderColor: tache.enRetard ? 'var(--db-danger)' : 'var(--db-border)',
                background: tache.enRetard ? 'color-mix(in srgb, var(--db-danger) 4%, var(--db-card))' : 'var(--db-card)',
                animation: `db-rise 280ms ease-out ${idx * 20}ms both`,
              }}
            >
              {/* Ligne 1 : Titre + actions */}
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-base leading-snug" style={{ color: 'var(--db-t1)' }}>
                      {tache.titre}
                    </span>
                    {tache.enRetard && (
                      <span
                        className="shrink-0 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--db-danger-bg2)', color: 'var(--db-danger)' }}
                      >
                        {t('enRetard')}
                      </span>
                    )}
                  </div>
                  {(tache.assigneA || tache.description) && (
                    <p className="text-sm mt-1" style={{ color: 'var(--db-t4)' }}>
                      {tache.assigneA ? `${tache.assigneA.prenom} ${tache.assigneA.nom}` : ''}
                      {tache.assigneA && tache.description ? ' · ' : ''}
                      {tache.description || ''}
                    </p>
                  )}
                </div>

                {/* Actions (visible au hover) */}
                {canEdit && (
                  <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <button
                      type="button"
                      onClick={() => onEdit(tache)}
                      disabled={!isOnline}
                      className="w-8 h-8 rounded-lg grid place-items-center transition-colors hover:bg-[var(--db-subtle)] disabled:opacity-40"
                      style={{ color: 'var(--db-t3)' }}
                      title={t('edit')}
                    >
                      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(tache.id)}
                      disabled={!isOnline}
                      className="w-8 h-8 rounded-lg grid place-items-center transition-colors hover:bg-[var(--db-subtle)] disabled:opacity-40"
                      style={{ color: 'var(--db-t3)' }}
                      title={t('delete')}
                    >
                      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Ligne 2 : Badges */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {/* Statut */}
                {canEdit ? (
                  <select
                    value={tache.statut}
                    disabled={!isOnline}
                    onChange={(e) => onStatusChange(tache, e.target.value as StatutTache)}
                    className="text-sm font-semibold px-3 py-1.5 rounded-full border-none cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--db-teal)]/40"
                    style={{ background: 'var(--db-subtle)', color: statutDot[tache.statut] }}
                  >
                    {Object.values(StatutTache).map((s) => (
                      <option key={s} value={s}>{t(`statut.${s}`)}</option>
                    ))}
                  </select>
                ) : (
                  <span
                    className="inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full font-semibold"
                    style={{ background: 'var(--db-subtle)', color: statutDot[tache.statut] }}
                  >
                    <span className="w-2 h-2 rounded-full bg-current" />
                    {t(`statut.${tache.statut}`)}
                  </span>
                )}

                {/* Priorite */}
                <span
                  className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full"
                  style={{ background: 'var(--db-subtle)', color: prioriteColor[tache.priorite] }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                  {t(`priorite.${tache.priorite}`)}
                </span>

                {/* Semaine */}
                {tache.semaine != null && (
                  <span className="text-sm font-semibold db-num px-3 py-1 rounded-full" style={{ background: 'var(--db-subtle)', color: 'var(--db-t2)' }}>
                    S{tache.semaine}/{tache.annee}
                  </span>
                )}

                {/* Echeance */}
                {tache.dateEcheance && (
                  <span className="text-sm db-num font-medium" style={{ color: tache.enRetard ? 'var(--db-danger)' : 'var(--db-t4)' }}>
                    {formatDate(tache.dateEcheance, { monthStyle: 'short' })}
                  </span>
                )}
              </div>

              {/* Ligne 3 : Barre d'avancement */}
              <div className="flex items-center gap-3 mt-3">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--db-subtle)' }}>
                  <div
                    className="h-full rounded-full db-progress-fill"
                    style={{
                      width: `${tache.pourcentageAvancement}%`,
                      background: tache.pourcentageAvancement === 100 ? 'var(--db-success)' : tache.pourcentageAvancement >= 50 ? 'var(--db-teal)' : 'var(--db-warn)',
                    }}
                  />
                </div>
                <span className="text-sm font-bold db-num shrink-0" style={{ color: 'var(--db-t1)' }}>
                  {tache.pourcentageAvancement}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1.5 pt-4 mt-4 border-t" style={{ borderColor: 'var(--db-border)' }}>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onPageChange(i)}
              className="min-w-[32px] h-8 px-2.5 rounded-lg text-xs font-semibold db-num transition-all duration-150"
              style={{
                background: currentPage === i ? 'var(--db-t1)' : 'transparent',
                color: currentPage === i ? 'var(--db-card)' : 'var(--db-t3)',
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
