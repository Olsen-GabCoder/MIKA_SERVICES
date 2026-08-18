import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
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
  onDeleteMultiple?: (ids: number[]) => void
  title?: string
  filterStatuts?: StatutTache[]
}

// Libellés : i18n planning:statut.* / planning:priorite.* — ici uniquement les couleurs
const STATUT_META: Record<StatutTache, { color: string; soft: string }> = {
  [StatutTache.A_FAIRE]: { color: '#6B7280', soft: 'var(--db-subtle)' },
  [StatutTache.EN_COURS]: { color: 'var(--db-info)', soft: 'var(--db-info-bg2)' },
  [StatutTache.EN_ATTENTE]: { color: 'var(--db-warn)', soft: 'var(--db-warn-bg)' },
  [StatutTache.TERMINEE]: { color: 'var(--db-success)', soft: 'var(--db-success-bg)' },
  [StatutTache.ANNULEE]: { color: '#B08078', soft: 'var(--db-subtle)' },
}

const PRIO_META: Record<Priorite, { color: string; soft: string }> = {
  [Priorite.BASSE]: { color: '#8FA3AD', soft: 'rgba(143,163,173,.16)' },
  [Priorite.NORMALE]: { color: '#6B7280', soft: 'var(--db-subtle)' },
  [Priorite.HAUTE]: { color: 'var(--db-orange)', soft: 'var(--db-orange-soft)' },
  [Priorite.URGENTE]: { color: '#E4572E', soft: 'rgba(228,87,46,.14)' },
  [Priorite.CRITIQUE]: { color: 'var(--db-danger)', soft: 'var(--db-danger-bg2)' },
}

function fmtDate(d: string | null): string {
  if (!d) return '—'
  const p = d.split('-')
  if (p.length !== 3) return d
  return `${p[2]}/${p[1]}/${p[0].slice(2)}`
}

function initials(name: string | null | undefined): string {
  if (!name) return '?'
  return name.split(/[\s.]+/).filter(Boolean).slice(0, 2).map((x) => x[0].toUpperCase()).join('')
}

function lateDays(tache: Tache): number {
  if (!tache.dateEcheance) return 0
  if (tache.statut !== StatutTache.A_FAIRE && tache.statut !== StatutTache.EN_COURS) return 0
  const diff = Math.floor((Date.now() - new Date(tache.dateEcheance).getTime()) / 86400000)
  return diff > 0 ? diff : 0
}

export function TachesTable({
  taches, loading, canEdit, isOnline,
  filterStatut, onFilterChange,
  onStatusChange, onEdit, onDelete, onDeleteMultiple,
  title,
  filterStatuts,
}: TachesTableProps) {
  const { t } = useTranslation('planning')

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  useEffect(() => {
    setSelectedIds((prev) => {
      const validIds = new Set(taches.map((t) => t.id))
      const next = new Set([...prev].filter((id) => validIds.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [taches])

  const filtered = useMemo(
    () => filterStatut ? taches.filter((task) => task.statut === filterStatut) : taches,
    [taches, filterStatut]
  )

  const allSelected = filtered.length > 0 && filtered.every((t) => selectedIds.has(t.id))
  const hasSelection = selectedIds.size > 0 && canEdit

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(filtered.map((t) => t.id)))
  }

  const isHistory = filterStatuts?.includes(StatutTache.TERMINEE)

  const filterOptions = ['' as const, ...(filterStatuts || Object.values(StatutTache))]

  const chipStyle = (active: boolean) => ({
    height: 32, padding: '0 10px',
    borderRadius: 'var(--db-radius-xs)',
    border: `1px solid ${active ? 'var(--db-orange)' : 'var(--db-border)'}`,
    background: active ? 'var(--db-orange)' : 'var(--db-card)',
    color: active ? '#fff' : 'var(--db-t2)',
    fontSize: 11.5, fontWeight: 700,
    cursor: 'pointer', whiteSpace: 'nowrap' as const,
  })

  const gridCols = '34px 1fr 132px 96px 74px 104px 150px 120px'

  return (
    <div style={{
      background: 'var(--db-card)',
      border: '1px solid var(--db-border)',
      borderRadius: 'var(--db-radius)',
      overflow: 'hidden',
    }}>
      {/* Header with filters */}
      <div style={{
        padding: '13px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: '1px solid var(--db-border)',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 13.5, fontWeight: 800 }}>
          {title || t('tasksListTitle')}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 700, color: 'var(--db-t2)',
          background: 'var(--db-subtle)',
          borderRadius: 20, padding: '2px 8px',
        }}>
          {filtered.length} / {taches.length}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
          {filterOptions.map((s) => {
            const isActive = filterStatut === s
            const count = s ? taches.filter((task) => task.statut === s).length : taches.length
            const label = s === '' ? t('filterAll', { defaultValue: 'Toutes' }) : t(`statut.${s}`)
            return (
              <button key={s} type="button" onClick={() => onFilterChange(s)} style={chipStyle(isActive)}>
                {label} {count}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selection bar */}
      {hasSelection && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 16px',
          background: 'var(--db-orange-soft)',
          borderBottom: '1px solid var(--db-orange)',
        }}>
          <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--db-orange)' }}>
            {selectedIds.size} tâches sélectionnées
          </span>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            style={{
              height: 28, padding: '0 10px',
              border: '1px solid var(--db-border-str)',
              background: 'var(--db-card)', color: 'var(--db-t1)',
              borderRadius: 'var(--db-radius-xs)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >Tout désélectionner</button>
          <button
            type="button"
            onClick={() => onDeleteMultiple?.(Array.from(selectedIds))}
            disabled={!isOnline}
            style={{
              height: 28, padding: '0 10px',
              border: 0,
              background: 'var(--db-danger)', color: '#fff',
              borderRadius: 'var(--db-radius-xs)',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
              marginLeft: 'auto',
            }}
          >Supprimer la sélection</button>
        </div>
      )}

      {/* Column headers */}
      {!loading && filtered.length > 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: gridCols, gap: 10,
          padding: '9px 16px',
          background: 'var(--db-subtle)',
          borderBottom: '1px solid var(--db-border)',
          fontSize: 10, fontWeight: 700,
          letterSpacing: '.07em', textTransform: 'uppercase' as const,
          color: 'var(--db-t3)',
        }}>
          <span>
            {canEdit && onDeleteMultiple && (
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                style={{ width: 16, height: 16, accentColor: '#FF6B35', cursor: 'pointer' }}
              />
            )}
          </span>
          <span>Tâche</span>
          <span>Statut</span>
          <span>Priorité</span>
          <span>Sem.</span>
          <span>Échéance</span>
          <span>Avancement</span>
          <span>Assigné à</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ padding: '48px 0', textAlign: 'center' }}>
          <div style={{
            display: 'inline-block', width: 28, height: 28,
            border: '2px solid var(--db-teal)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ marginTop: 12, fontSize: 13, color: 'var(--db-t3)' }}>{t('loading')}</p>
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div style={{ padding: '48px 16px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--db-t2)' }}>{t('empty')}</p>
          <p style={{ fontSize: 11, color: 'var(--db-t3)', marginTop: 6 }}>{t('emptyHint')}</p>
        </div>
      )}

      {/* Rows */}
      {!loading && filtered.map((tache) => {
        const sel = selectedIds.has(tache.id)
        const sm = STATUT_META[tache.statut]
        const pm = PRIO_META[tache.priorite]
        const ld = lateDays(tache)
        const assigneeName = tache.assigneA ? `${tache.assigneA.prenom} ${tache.assigneA.nom}` : t('unassigned', { defaultValue: 'Non assignée' })
        const ini = initials(tache.assigneA ? `${tache.assigneA.prenom} ${tache.assigneA.nom}` : null)

        const progColor = tache.statut === StatutTache.TERMINEE
          ? 'var(--db-success)'
          : tache.statut === StatutTache.EN_COURS
            ? 'var(--db-teal)'
            : 'var(--db-orange)'

        return (
          <div
            key={tache.id}
            className="planning-row"
            style={{
              display: 'grid', gridTemplateColumns: gridCols, gap: 10,
              alignItems: 'center',
              padding: '0 16px', height: 44,
              borderBottom: '1px solid var(--db-border)',
              background: sel ? 'var(--db-orange-soft)' : 'transparent',
              opacity: isHistory ? 0.82 : 1,
              textDecoration: tache.statut === StatutTache.ANNULEE ? 'line-through' : undefined,
            }}
            onMouseEnter={(e) => { if (!sel) e.currentTarget.style.background = 'var(--db-subtle)' }}
            onMouseLeave={(e) => { if (!sel) e.currentTarget.style.background = 'transparent' }}
          >
            {/* Checkbox */}
            <span>
              {canEdit && onDeleteMultiple && (
                <input
                  type="checkbox"
                  checked={sel}
                  onChange={() => toggleSelect(tache.id)}
                  style={{ width: 16, height: 16, accentColor: '#FF6B35', cursor: 'pointer' }}
                />
              )}
            </span>

            {/* Task name + badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              {tache.estJalon && (
                <span style={{
                  width: 9, height: 9, minWidth: 9,
                  background: 'var(--db-teal-dk)',
                  transform: 'rotate(45deg)',
                }} />
              )}
              <span style={{
                fontSize: 13, fontWeight: 600,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{tache.titre}</span>
              {ld > 0 && (
                <span style={{
                  fontSize: 10.5, fontWeight: 800, color: '#fff',
                  background: 'var(--db-danger)',
                  borderRadius: 'var(--db-radius-xs)',
                  padding: '2px 6px', whiteSpace: 'nowrap',
                }}>⚠ J+{ld}</span>
              )}
            </div>

            {/* Status */}
            <div>
              {canEdit && !isHistory ? (
                <select
                  value={tache.statut}
                  disabled={!isOnline}
                  onChange={(e) => onStatusChange(tache, e.target.value as StatutTache)}
                  style={{
                    width: '100%', height: 30,
                    border: `1px solid ${sm.color}`,
                    borderRadius: 'var(--db-radius-xs)',
                    background: sm.soft,
                    color: sm.color,
                    fontSize: 11.5, fontWeight: 700,
                    padding: '0 5px',
                    cursor: 'pointer',
                  }}
                >
                  {Object.values(StatutTache).map((s) => (
                    <option key={s} value={s}>{t(`statut.${s}`)}</option>
                  ))}
                </select>
              ) : (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 11, fontWeight: 700,
                  color: sm.color, background: sm.soft,
                  border: `1px solid ${sm.color}`,
                  borderRadius: 'var(--db-radius-xs)',
                  padding: '3px 7px', whiteSpace: 'nowrap',
                }}>{t(`statut.${tache.statut}`)}</span>
              )}
            </div>

            {/* Priority */}
            <div>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 11, fontWeight: tache.priorite === Priorite.CRITIQUE ? 800 : 700,
                color: tache.priorite === Priorite.CRITIQUE ? '#fff' : pm.color,
                background: tache.priorite === Priorite.CRITIQUE ? pm.color : pm.soft,
                border: `1px solid ${pm.color}`,
                borderRadius: 'var(--db-radius-xs)',
                padding: '3px 7px', whiteSpace: 'nowrap',
              }}>{t(`priorite.${tache.priorite}`)}</span>
            </div>

            {/* Week */}
            <div style={{ fontSize: 12, color: 'var(--db-t2)', fontVariantNumeric: 'tabular-nums' }}>
              {tache.semaine ? `S${tache.semaine}·${String(tache.annee ?? '').slice(2)}` : '—'}
            </div>

            {/* Due date */}
            <div style={{
              fontSize: 12,
              fontWeight: ld > 0 ? 800 : 500,
              color: ld > 0 ? 'var(--db-danger)' : 'var(--db-t2)',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {fmtDate(tache.dateEcheance)}
            </div>

            {/* Progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 6, borderRadius: 4, background: 'var(--db-subtle)', overflow: 'hidden' }}>
                <div style={{
                  width: `${tache.pourcentageAvancement}%`, height: '100%',
                  borderRadius: 4, background: progColor,
                  transition: 'width .5s ease',
                }} />
              </div>
              <span style={{
                fontSize: 11.5, fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                minWidth: 32, textAlign: 'right' as const,
              }}>{tache.pourcentageAvancement}%</span>
            </div>

            {/* Assignee */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
              <span style={{
                width: 22, height: 22, minWidth: 22,
                borderRadius: '50%',
                background: tache.assigneA ? 'var(--db-teal-dk)' : 'var(--db-subtle)',
                color: tache.assigneA ? '#fff' : 'var(--db-t3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9.5, fontWeight: 800,
              }}>{ini}</span>
              <span style={{
                fontSize: 12, color: 'var(--db-t2)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{assigneeName}</span>
              {canEdit && !isHistory && (
                <span className="planning-row-actions" style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onEdit(tache) }}
                    style={{
                      width: 28, height: 28,
                      border: '1px solid var(--db-border)',
                      background: 'var(--db-card)',
                      color: 'var(--db-t2)',
                      borderRadius: 'var(--db-radius-xs)',
                      fontSize: 12, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >✎</button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDelete(tache.id) }}
                    style={{
                      width: 28, height: 28,
                      border: '1px solid var(--db-border)',
                      background: 'var(--db-card)',
                      color: 'var(--db-t2)',
                      borderRadius: 'var(--db-radius-xs)',
                      fontSize: 12, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >✕</button>
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
