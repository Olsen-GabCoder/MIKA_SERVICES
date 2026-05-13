import { useState, useEffect, useRef, useCallback } from 'react'
import { pingHealth } from '@/utils/pingHealth'

export type ConnectivityStatus = 'online' | 'offline' | 'reconnecting'

interface ConnectivityState {
  status: ConnectivityStatus
  lastOnlineAt: Date | null
}

const PROBE_INTERVAL_MS = 15_000

export function useConnectivity(): ConnectivityState {
  const [status, setStatus] = useState<ConnectivityStatus>(
    typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline',
  )
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(null)

  const isMountedRef = useRef(true)
  const probeControllerRef = useRef<AbortController | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const cancelPendingProbe = useCallback(() => {
    if (probeControllerRef.current) {
      probeControllerRef.current.abort()
      probeControllerRef.current = null
    }
  }, [])

  const runProbe = useCallback(async (): Promise<boolean> => {
    cancelPendingProbe()
    const controller = new AbortController()
    probeControllerRef.current = controller

    const ok = await pingHealth(controller.signal)

    if (!isMountedRef.current) return false
    probeControllerRef.current = null
    return ok
  }, [cancelPendingProbe])

  const goOnline = useCallback(() => {
    if (!isMountedRef.current) return
    setStatus('online')
    setLastOnlineAt(new Date())
  }, [])

  const goOffline = useCallback(() => {
    if (!isMountedRef.current) return
    setStatus('offline')
  }, [])

  // Démarre/arrête la probe périodique selon le statut
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (status === 'online') return

    // Probe toutes les 15s quand offline ou reconnecting
    intervalRef.current = setInterval(async () => {
      if (!isMountedRef.current) return
      setStatus('reconnecting')
      const ok = await runProbe()
      if (!isMountedRef.current) return
      if (ok) {
        goOnline()
      } else {
        setStatus('offline')
      }
    }, PROBE_INTERVAL_MS)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [status, runProbe, goOnline])

  // Listeners window online/offline + probe initiale
  useEffect(() => {
    const handleOnline = async () => {
      if (!isMountedRef.current) return
      setStatus('reconnecting')
      const ok = await runProbe()
      if (!isMountedRef.current) return
      if (ok) {
        goOnline()
      } else {
        setStatus('offline')
      }
    }

    const handleOffline = () => {
      cancelPendingProbe()
      goOffline()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Probe initiale au mount : vérifier la connectivité réelle (portail captif, etc.)
    if (navigator.onLine) {
      runProbe().then((ok) => {
        if (!isMountedRef.current) return
        if (ok) {
          goOnline()
        } else {
          goOffline()
        }
      })
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [runProbe, cancelPendingProbe, goOnline, goOffline])

  // Cleanup au unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      cancelPendingProbe()
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [cancelPendingProbe])

  return { status, lastOnlineAt }
}

/**
 * Indique si la connexion est active.
 *
 * ⚠️ Appeler UNE SEULE FOIS par page (au niveau du composant racine de la page),
 * pas dans chaque bouton ou composant enfant. Chaque instance de useConnectivity
 * monte ses propres listeners et timers. Propager le booléen par props ou via
 * le contexte parent si plusieurs composants enfants en ont besoin.
 */
export function useIsOnline(): boolean {
  return useConnectivity().status === 'online'
}
