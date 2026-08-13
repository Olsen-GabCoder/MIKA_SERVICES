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
import { StatutTache } from '@/types/planning'

interface KanbanBoardProps {
  taches: Tache[]
  canEdit: boolean
  onStatusChange: (tache: Tache, statut: StatutTache) => void
  onEdit: (tache: Tache) => void
}

const COLUMNS: { id: StatutTache; color: string }[] = [
  { id: StatutTache.A_FAIRE, color: '#94a3b8' },
  { id: StatutTache.EN_COURS, color: '#3b82f6' },
  { id: StatutTache.EN_ATTENTE, color: '#f59e0b' },
  { id: StatutTache.TERMINEE, color: '#22c55e' },
]

const PRIORITE_DOTS: Record<string, string> = {
  BASSE: '#94a3b8',
  NORMALE: '#3b82f6',
  HAUTE: '#f59e0b',
  URGENTE: '#f97316',
  CRITIQUE: '#ef4444',
}

function KanbanCard({ tache, onEdit }: { tache: Tache; onEdit: (t: Tache) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tache.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="rounded-lg p-3 mb-2 border cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md"
      onClick={(e) => { e.stopPropagation(); onEdit(tache) }}
      onPointerDown={(e) => { listeners?.onPointerDown?.(e) }}
    >
      <div className="flex items-start gap-2">
        <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: PRIORITE_DOTS[tache.priorite] || '#94a3b8' }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--db-t1)' }}>
            {tache.estJalon ? '\u25C6 ' : ''}{tache.titre}
          </p>
          {tache.assigneA && (
            <p className="text-[11px] mt-1 truncate" style={{ color: 'var(--db-t4)' }}>
              {tache.assigneA.prenom} {tache.assigneA.nom}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            {tache.dateEcheance && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${tache.enRetard ? 'bg-red-100 text-red-700' : ''}`} style={!tache.enRetard ? { color: 'var(--db-t4)' } : undefined}>
                {tache.dateEcheance}
              </span>
            )}
            <div className="flex-1" />
            <span className="text-[10px] font-bold db-num" style={{ color: 'var(--db-t3)' }}>
              {tache.pourcentageAvancement}%
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1 rounded-full mt-1.5" style={{ background: 'var(--db-border)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${tache.pourcentageAvancement}%`, background: 'var(--db-teal)' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function KanbanColumn({ statut, color, taches, onEdit }: { statut: StatutTache; color: string; taches: Tache[]; onEdit: (t: Tache) => void }) {
  const { t } = useTranslation('planning')
  const { setNodeRef, isOver } = useDroppable({ id: statut })

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col rounded-xl border min-h-[300px] transition-colors"
      style={{
        background: isOver ? 'color-mix(in srgb, var(--db-subtle) 80%, var(--db-teal))' : 'var(--db-subtle)',
        borderColor: isOver ? 'var(--db-teal)' : 'var(--db-border)',
        flex: '1 1 0',
        minWidth: 240,
      }}
    >
      <div className="flex items-center gap-2 px-3 py-2.5 border-b" style={{ borderColor: 'var(--db-border)' }}>
        <div className="w-3 h-3 rounded-full" style={{ background: color }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--db-t2)' }}>
          {t(`statut.${statut}`)}
        </span>
        <span className="ml-auto text-[10px] font-bold db-num px-1.5 py-0.5 rounded-full" style={{ background: 'var(--db-border)', color: 'var(--db-t3)' }}>
          {taches.length}
        </span>
      </div>
      <div className="flex-1 p-2 overflow-y-auto">
        <SortableContext items={taches.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {taches.map((tache) => (
            <KanbanCard key={tache.id} tache={tache} onEdit={onEdit} />
          ))}
        </SortableContext>
        {taches.length === 0 && (
          <div className="text-center py-8 text-xs" style={{ color: 'var(--db-t5)' }}>
            {t('kanbanEmpty', { defaultValue: 'Glissez une tache ici' })}
          </div>
        )}
      </div>
    </div>
  )
}

export function KanbanBoard({ taches, canEdit, onStatusChange, onEdit }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(Number(event.active.id))
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over || !canEdit) return

    const tache = taches.find((t) => t.id === Number(active.id))
    if (!tache) return

    // Determine target column
    const targetStatut = COLUMNS.find((c) => c.id === over.id)?.id
      || taches.find((t) => t.id === Number(over.id))?.statut

    if (targetStatut && targetStatut !== tache.statut) {
      onStatusChange(tache, targetStatut)
    }
  }, [canEdit, taches, onStatusChange])

  const activeTache = activeId ? taches.find((t) => t.id === activeId) : null

  return (
    <div className="col-span-12">
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              statut={col.id}
              color={col.color}
              taches={taches.filter((t) => t.statut === col.id)}
              onEdit={onEdit}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTache && (
            <div className="rounded-lg p-3 border shadow-lg" style={{ background: 'var(--db-card)', borderColor: 'var(--db-border)', width: 260 }}>
              <p className="text-sm font-medium" style={{ color: 'var(--db-t1)' }}>{activeTache.titre}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
