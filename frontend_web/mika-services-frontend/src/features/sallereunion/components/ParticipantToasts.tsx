import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar } from './Primitives'
import { useSalleParticipants } from '../hooks/useSalleParticipants'
import type { SalleParticipant } from '@/types/salleReunion'

interface ParticipantToastsProps {
  enabled: boolean
  currentUserId: number | undefined
}

interface ToastItem {
  id: string
  name: string
  initials: string
  type: 'joined' | 'left'
}

export function ParticipantToasts({ enabled, currentUserId }: ParticipantToastsProps) {
  const { t } = useTranslation('salleReunion')
  const { participants } = useSalleParticipants(enabled)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const prevIdsRef = useRef<Set<number> | null>(null)

  const addToast = useCallback((item: ToastItem) => {
    setToasts(prev => [...prev.slice(-2), item])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== item.id))
    }, 3000)
  }, [])

  useEffect(() => {
    if (!enabled) {
      prevIdsRef.current = null
      return
    }

    const currentIds = new Set(participants.map(p => p.user.id))

    // Skip first load (initialize the set without generating toasts)
    if (prevIdsRef.current === null) {
      prevIdsRef.current = currentIds
      return
    }

    const prevIds = prevIdsRef.current

    // Detect joins
    currentIds.forEach(id => {
      if (!prevIds.has(id) && id !== currentUserId) {
        const p = participants.find(pp => pp.user.id === id) as SalleParticipant
        addToast({
          id: `join-${id}-${Date.now()}`,
          name: `${p.user.prenom} ${p.user.nom}`,
          initials: `${p.user.prenom[0]}${p.user.nom[0]}`,
          type: 'joined',
        })
      }
    })

    // Detect leaves
    prevIds.forEach(id => {
      if (!currentIds.has(id) && id !== currentUserId) {
        // We no longer have the participant data — use stored ref
        addToast({
          id: `leave-${id}-${Date.now()}`,
          name: `Participant #${id}`,
          initials: '??',
          type: 'left',
        })
      }
    })

    prevIdsRef.current = currentIds
  }, [participants, enabled, currentUserId, addToast])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-20 right-6 z-[90] flex flex-col gap-2 pointer-events-none">
      {toasts.map(item => (
        <div
          key={item.id}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-neutral-900/95 dark:bg-white/95 text-white dark:text-neutral-900 text-[13px] font-medium shadow-xl backdrop-blur-sm salle-anim-up pointer-events-auto"
        >
          <Avatar initials={item.initials} color={item.type === 'joined' ? '#10b981' : '#6b7280'} size={28} />
          <span>
            <span className="font-semibold">{item.name}</span>{' '}
            {item.type === 'joined' ? t('participants.joined') : t('participants.left')}
          </span>
        </div>
      ))}
    </div>
  )
}
