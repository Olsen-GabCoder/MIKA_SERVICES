import { useMemo } from 'react'
import { useAppSelector } from '@/store/hooks'
import { getQueue } from '@/utils/offlineQueue'

/**
 * Retourne le nombre de mutations en attente dans la file offline.
 * Se re-render quand lastReplayResult change (après chaque replay).
 */
export function usePendingMutationsCount(): number {
  const lastReplayResult = useAppSelector((state) => state.sync.lastReplayResult)
  // lastReplayResult sert de trigger de re-render — la source de vérité est localStorage
  return useMemo(() => getQueue().length, [lastReplayResult])
}
