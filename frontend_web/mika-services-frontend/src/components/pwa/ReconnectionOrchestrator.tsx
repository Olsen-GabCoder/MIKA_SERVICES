import { useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { logoutUser } from '@/store/slices/authSlice'
import { useReconnectionFlow } from '@/hooks/useReconnectionFlow'
import { useConnectivity } from '@/hooks/useConnectivity'
import type { ConnectivityStatus } from '@/hooks/useConnectivity'
import { usePendingMutationsCount } from '@/hooks/usePendingMutationsCount'
import { getQueue } from '@/utils/offlineQueue'
import { SessionExpiredModal } from './SessionExpiredModal'

export function ReconnectionOrchestrator() {
  const dispatch = useAppDispatch()
  const { phase, trigger, reset } = useReconnectionFlow()
  const { status: connectivityStatus } = useConnectivity()
  const pendingCount = usePendingMutationsCount()
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const offlineModeEnabled = useAppSelector((state) => state.ui.offlineModeEnabled)
  const prevAuthRef = useRef(isAuthenticated)
  const prevConnectivityRef = useRef<ConnectivityStatus>(connectivityStatus)

  // Stratégie γ : détecter transition isAuthenticated false → true (post-login)
  useEffect(() => {
    const wasAuthenticated = prevAuthRef.current
    prevAuthRef.current = isAuthenticated

    if (!wasAuthenticated && isAuthenticated) {
      // Post-login : reset le flow, puis replay si queue non vide
      reset()
      const timer = setTimeout(() => {
        if (getQueue().length > 0) {
          void trigger()
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, reset, trigger])

  // Branchement automatique : useConnectivity reconnecting → online déclenche le flow
  useEffect(() => {
    const prev = prevConnectivityRef.current
    prevConnectivityRef.current = connectivityStatus

    if (prev === 'reconnecting' && connectivityStatus === 'online') {
      if (!isAuthenticated || !offlineModeEnabled) return
      void trigger()
    }
  }, [connectivityStatus, isAuthenticated, offlineModeEnabled, trigger])

  const handleReconnect = async () => {
    try {
      await dispatch(logoutUser({ preserveQueue: true })).unwrap()
    } catch {
      // Logout HTTP peut échouer (offline, tokens invalides) — on continue
    }
    window.location.href = '/login'
  }

  return (
    <SessionExpiredModal
      open={phase === 'session_expired'}
      pendingCount={pendingCount}
      onReconnect={handleReconnect}
    />
  )
}
