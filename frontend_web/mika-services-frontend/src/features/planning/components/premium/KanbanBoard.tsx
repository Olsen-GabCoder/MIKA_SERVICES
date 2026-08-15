import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDroppable } from '@dnd-kit/core'
import type { Tache } from '@/types/planning'
import { StatutTache, Priorite } from '@/types/planning'

interface KanbanBoardProps {
  taches: Tache[]
  canEdit: boolean
  onStatusChange: (tache: Tache, statut: StatutTache) => void
  onEdit: (tache: Tache) => void
}

const COLUMNS: { id: StatutTache; color: string; soft: string }[] = [
  { id: StatutTache.A_FAIRE, color: '#6B7280', soft: 'var(--db-subtle)' },
  { id: StatutTache.EN_COURS, color: 'var(--db-info)', soft: 'var(--db-info-bg2)' },
  { id: StatutTache.EN_ATTENTE, color: 'var(--db-warn)', soft: 'var(--db-warn-bg)' },
  { id: StatutTache.TERMINEE, color: 'var(--db-success)', soft: 'var(--db-success-bg)' },
]

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

function initials(name: string | null): string {
  if (!name) return '?'
  return name.split(/[\s.]+/).filter(Boolean).slice(0, 2).map((x) => x[0].toUpperCase()).join('')
}

function lateDays(tache: Tache): number {
  if (!tache.dateEcheance) return 0
  if (tache.statut !== StatutTache.A_FAIRE && tache.statut !== StatutTache.EN_COURS) return 0
  const diff = Math.floor((Date.now() - new Date(tache.dateEcheance).getTime()) / 86400000)
  return diff > 0 ? diff : 0
}

function KanbanCard({ tache, onEdit, canEdit: canDrag }: { tache: Tache; onEdit: (t: Tache) => void; canEdit: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tache.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }
  const { t } = useTranslation('planning')

  const pm = PRIO_META[tache.priorite]
  const ld = lateDays(tache)
  const assigneeName = tache.assigneA ? `${tache.assigneA.prenom} ${tache.assigneA.nom}` : 'Non assignée'
  const ini = initials(tache.assigneA ? `${tache.assigneA.prenom} ${tache.assigneA.nom}` : null)
  const dateRange = tache.dateDebut ? `${fmtDate(tache.dateDebut)} → ${fmtDate(tache.dateFin)}` : 'sans dates'
  const progColor = tache.statut === StatutTache.TERMINEE ? 'var(--db-success)' : 'var(--db-teal)'

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: 'var(--db-card)',
        border: '1px solid var(--db-border)',
        borderRadius: 'var(--db-radius-sm)',
        padding: '11px 12px',
        cursor: canDrag ? 'grab' : 'default',
        boxShadow: '0 1px 2px rgba(0,0,0,.04)',
        marginBottom: 9,
      }}
      {...(canDrag ? { ...attributes, ...listeners } : {})}
      onClick={(e) => { e.stopPropagation(); onEdit(tache) }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 11, fontWeight: tache.priorite === Priorite.CRITIQUE ? 800 : 700,
          color: tache.priorite === Priorite.CRITIQUE ? '#fff' : pm.color,
          background: tache.priorite === Priorite.CRITIQUE ? pm.color : pm.soft,
          border: `1px solid ${pm.color}`,
          borderRadius: 'var(--db-radius-xs)',
          padding: '3px 7px', whiteSpace: 'nowrap',
        }}>{t(`priorite.${tache.priorite}`)}</span>
        {ld > 0 && (
          <span style={{
            fontSize: 10.5, fontWeight: 800, color: '#fff',
            background: 'var(--db-danger)',
            borderRadius: 3, padding: '2px 5px',
          }}>⚠ J+{ld}</span>
        )}
        {tache.estJalon && (
          <span style={{
            marginLeft: 'auto', width: 9, height: 9,
            background: 'var(--db-teal-dk)', transform: 'rotate(45deg)',
          }} />
        )}
      </div>

      <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.4, marginTop: 8 }}>
        {tache.titre}
      </div>

      <div style={{ fontSize: 11, color: 'var(--db-t3)', marginTop: 7, fontVariantNumeric: 'tabular-nums' }}>
        {dateRange}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 9 }}>
        <span style={{
          width: 20, height: 20, minWidth: 20,
          borderRadius: '50%',
          background: tache.assigneA ? 'var(--db-teal-dk)' : 'var(--db-subtle)',
          color: tache.assigneA ? '#fff' : 'var(--db-t3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 800,
        }}>{ini}</span>
        <span style={{
          fontSize: 11, color: 'var(--db-t2)', flex: 1,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{assigneeName}</span>
        <span style={{ fontSize: 11, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
          {tache.pourcentageAvancement}%
        </span>
      </div>

      <div style={{ height: 5, borderRadius: 3, background: 'var(--db-subtle)', overflow: 'hidden', marginTop: 6 }}>
        <div style={{
          width: `${tache.pourcentageAvancement}%`, height: '100%',
          borderRadius: 3, background: progColor,
        }} />
      </div>
    </div>
  )
}

function KanbanColumn({ statut, color, soft, taches, onEdit, canEdit, isOver }: {
  statut: StatutTache; color: string; soft: string; taches: Tache[]
  onEdit: (t: Tache) => void; canEdit: boolean; isOver: boolean
}) {
  const { t } = useTranslation('planning')
  const { setNodeRef } = useDroppable({ id: statut })

  return (
    <div
      ref={setNodeRef}
      style={{
        background: isOver ? soft : 'var(--db-subtle)',
        border: `1px ${isOver ? 'solid ' + color : 'solid var(--db-border)'}`,
        borderRadius: 'var(--db-radius)',
        padding: 12,
        minHeight: 260,
        transition: 'background .15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 4px 10px' }}>
        <span style={{ width: 9, height: 9, borderRadius: 3, background: color }} />
        <span style={{ fontSize: 12.5, fontWeight: 800 }}>{t(`statut.${statut}`)}</span>
        <span style={{
          fontSize: 10.5, fontWeight: 800,
          color: color, background: soft,
          border: `1px solid ${color}`,
          borderRadius: 20, padding: '1px 7px',
        }}>{taches.length}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 120 }}>
        <SortableContext items={taches.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {taches.map((tache) => (
            <KanbanCard key={tache.id} tache={tache} onEdit={onEdit} canEdit={canEdit} />
          ))}
        </SortableContext>
        {taches.length === 0 && (
          <div style={{
            border: '1px dashed var(--db-border-str)',
            borderRadius: 'var(--db-radius-sm)',
            padding: '22px 10px',
            textAlign: 'center',
            fontSize: 11.5, color: 'var(--db-t3)',
          }}>
            {canEdit ? 'Déposez une tâche ici' : 'Aucune tâche'}
          </div>
        )}
      </div>
    </div>
  )
}

export function KanbanBoard({ taches, canEdit, onStatusChange, onEdit }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<number | null>(null)
  const [overCol, setOverCol] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(Number(event.active.id))
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null)
    setOverCol(null)
    const { active, over } = event
    if (!over || !canEdit) return

    const tache = taches.find((t) => t.id === Number(active.id))
    if (!tache) return

    const targetStatut = COLUMNS.find((c) => c.id === over.id)?.id
      || taches.find((t) => t.id === Number(over.id))?.statut

    if (targetStatut && targetStatut !== tache.statut) {
      onStatusChange(tache, targetStatut)
    }
  }, [canEdit, taches, onStatusChange])

  const handleDragOver = useCallback((event: { over: { id: string | number } | null }) => {
    if (!event.over) { setOverCol(null); return }
    const col = COLUMNS.find((c) => c.id === event.over!.id)
    if (col) setOverCol(col.id)
    else {
      const t = taches.find((t) => t.id === Number(event.over!.id))
      if (t) setOverCol(t.statut)
    }
  }, [taches])

  const activeTache = activeId ? taches.find((t) => t.id === activeId) : null

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(220px, 1fr))',
          gap: 12,
          alignItems: 'start',
          overflowX: 'auto',
        }}>
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              statut={col.id}
              color={col.color}
              soft={col.soft}
              taches={taches.filter((t) => t.statut === col.id && (!activeId || t.id !== activeId))}
              onEdit={onEdit}
              canEdit={canEdit}
              isOver={overCol === col.id && !!activeId}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTache && (
            <div style={{
              background: 'var(--db-card)',
              border: '1px solid var(--db-orange)',
              borderRadius: 'var(--db-radius-sm)',
              padding: '9px 12px',
              fontSize: 12.5, fontWeight: 700,
              color: 'var(--db-t1)',
              boxShadow: '0 12px 28px rgba(0,0,0,.26)',
              transform: 'rotate(-1.5deg)',
              maxWidth: 220,
            }}>
              {activeTache.titre}
            </div>
          )}
        </DragOverlay>
      </DndContext>
      <div style={{ fontSize: 11.5, color: 'var(--db-t3)', marginTop: 8 }}>
        {canEdit
          ? 'Glissez une carte vers une autre colonne pour changer son statut — le passage en « Terminée » fixe l\'avancement à 100 %.'
          : 'Glisser-déposer désactivé en lecture seule.'}
      </div>
    </div>
  )
}
