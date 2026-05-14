import { useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useIsOnline } from '@/hooks/useConnectivity'
import type { AsyncThunk } from '@reduxjs/toolkit'

/**
 * Hook custom pour polling periodique de Redux thunks.
 *
 * Comportement :
 * - Au mount : dispatch immediat si enabled && online && immediate
 * - setInterval(intervalMs) qui dispatch si conditions valides
 * - Suspend si enabled=false, ou si onlineOnly && offline, ou si PWA replay en cours
 * - A la reconnexion (offline->online) : dispatch immediat + reprise polling
 * - Cleanup au unmount : clearInterval
 *
 * @param thunkActionCreator - factory retournant le thunk (ex: () => fetchGlobalDashboard())
 * @param intervalMs - intervalle de polling en ms
 * @param options - enabled, onlineOnly, immediate
 */
export function usePollDispatch<Returned, ThunkArg>(
  thunkActionCreator: () => ReturnType<AsyncThunk<Returned, ThunkArg, Record<string, never>>>,
  intervalMs: number,
  options?: {
    enabled?: boolean
    onlineOnly?: boolean
    immediate?: boolean
  },
): void {
  const { enabled = true, onlineOnly = true, immediate = true } = options ?? {}

  const dispatch = useAppDispatch()
  const isOnline = useIsOnline()
  const isReplaying = useAppSelector(s => s.sync.isReplaying)

  // Track previous online state for reconnection detection
  const prevOnlineRef = useRef(isOnline)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasMountedRef = useRef(false)

  const canPoll = enabled && (!onlineOnly || isOnline) && !isReplaying

  // Stable reference to the thunk creator to avoid re-renders
  const thunkRef = useRef(thunkActionCreator)
  thunkRef.current = thunkActionCreator

  const doDispatch = () => {
    dispatch(thunkRef.current())
  }

  // Clear any existing interval
  const clearPoll = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  // Start/stop polling based on canPoll
  useEffect(() => {
    if (!canPoll) {
      clearPoll()
      return
    }

    // Immediate dispatch on mount
    if (!hasMountedRef.current && immediate) {
      doDispatch()
      hasMountedRef.current = true
    }

    // Set up interval
    clearPoll()
    intervalRef.current = setInterval(doDispatch, intervalMs)

    return clearPoll
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canPoll, intervalMs])

  // Handle reconnection: offline -> online transition
  useEffect(() => {
    const wasOffline = !prevOnlineRef.current
    prevOnlineRef.current = isOnline

    if (wasOffline && isOnline && enabled && !isReplaying) {
      // Just reconnected — immediate dispatch
      doDispatch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, enabled, isReplaying])
}
