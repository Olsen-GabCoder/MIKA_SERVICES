import { useState, useRef, useCallback, useEffect } from 'react'
import { useStore } from 'react-redux'
import { useAppDispatch } from '@/store/hooks'
import type { RootState } from '@/store/store'
import { refreshToken } from '@/store/slices/authSlice'
import { replayStarted, replayFinished } from '@/store/slices/syncSlice'
import { pingHealth } from '@/utils/pingHealth'
import { replay } from '@/utils/offlineQueue'
import type { ReplayResult } from '@/utils/offlineQueue'

export type ReconnectionPhase = 'idle' | 'probing' | 'refreshing' | 'replaying' | 'done' | 'session_expired'

export interface ReconnectionFlow {
  phase: ReconnectionPhase
  replayResult: ReplayResult | null
  trigger: () => Promise<void>
  reset: () => void
}

const AUTO_RESET_MS = 3000

export function useReconnectionFlow(): ReconnectionFlow {
  const dispatch = useAppDispatch()
  const store = useStore<RootState>()

  const [phase, setPhase] = useState<ReconnectionPhase>('idle')
  const [replayResult, setReplayResult] = useState<ReplayResult | null>(null)

  const isMountedRef = useRef(true)
  const isRunningRef = useRef(false)
  const autoResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearAutoReset = useCallback(() => {
    if (autoResetTimerRef.current) {
      clearTimeout(autoResetTimerRef.current)
      autoResetTimerRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    clearAutoReset()
    isRunningRef.current = false
    if (isMountedRef.current) {
      setPhase('idle')
      setReplayResult(null)
    }
  }, [clearAutoReset])

  const trigger = useCallback(async () => {
    // Idempotence : no-op si un flow est déjà en cours
    if (isRunningRef.current) return
    isRunningRef.current = true
    clearAutoReset()

    if (!isMountedRef.current) { isRunningRef.current = false; return }
    setPhase('probing')

    // Phase 1 — Probe
    const isReachable = await pingHealth()
    if (!isMountedRef.current) { isRunningRef.current = false; return }
    if (!isReachable) {
      setPhase('idle')
      isRunningRef.current = false
      return
    }

    // Phase 2 — Refresh JWT
    setPhase('refreshing')
    try {
      await dispatch(refreshToken()).unwrap()
    } catch {
      if (!isMountedRef.current) { isRunningRef.current = false; return }
      setPhase('session_expired')
      isRunningRef.current = false
      return
    }
    if (!isMountedRef.current) { isRunningRef.current = false; return }

    // Phase 3 — Replay queue
    setPhase('replaying')
    dispatch(replayStarted())

    const result = await replay(
      (thunk) => (dispatch as (action: unknown) => unknown)(thunk) as Promise<{ type?: string; error?: { message?: string }; payload?: unknown }>,
      () => store.getState(),
    )

    if (!isMountedRef.current) { isRunningRef.current = false; return }
    dispatch(replayFinished(result))
    setReplayResult(result)

    // Phase 4 — Done
    setPhase('done')
    isRunningRef.current = false

    // Auto-reset to idle after 3s
    autoResetTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setPhase('idle')
        setReplayResult(null)
      }
    }, AUTO_RESET_MS)
  }, [dispatch, store, clearAutoReset])

  // Cleanup au unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      isRunningRef.current = false
      clearAutoReset()
    }
  }, [clearAutoReset])

  return { phase, replayResult, trigger, reset }
}
