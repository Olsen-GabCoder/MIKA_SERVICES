import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/store/hooks'
import { useConnectivity } from '@/hooks/useConnectivity'
import type { ConnectivityStatus } from '@/hooks/useConnectivity'

const RECONNECTED_DISMISS_MS = 3000

export function ConnectivityBanner() {
  const { t } = useTranslation('common')
  const offlineModeEnabled = useAppSelector((state) => state.ui.offlineModeEnabled)
  const { status } = useConnectivity()

  const prevStatusRef = useRef<ConnectivityStatus>(status)
  const [showReconnected, setShowReconnected] = useState(false)
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const prev = prevStatusRef.current
    prevStatusRef.current = status

    if (status === 'online' && (prev === 'offline' || prev === 'reconnecting')) {
      setShowReconnected(true)
      dismissTimerRef.current = setTimeout(() => setShowReconnected(false), RECONNECTED_DISMISS_MS)
    }

    if (status === 'offline' || status === 'reconnecting') {
      setShowReconnected(false)
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current)
        dismissTimerRef.current = null
      }
    }

    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current)
        dismissTimerRef.current = null
      }
    }
  }, [status])

  if (!offlineModeEnabled) return null
  if (status === 'online' && !showReconnected) return null

  const isOffline = status === 'offline'
  const isReconnecting = status === 'reconnecting'
  const isReconnected = status === 'online' && showReconnected

  const bgClass = isReconnected ? 'bg-emerald-500' : 'bg-amber-500'

  return (
    <div
      role="status"
      aria-live="polite"
      className={`sticky top-0 z-[100] ${bgClass} text-white text-sm font-medium`}
    >
      <div className="flex items-center justify-center gap-2 px-4 py-2 min-h-[40px]">
        {isOffline && (
          <>
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
            </svg>
            {t('connectivity.offline')}
          </>
        )}
        {isReconnecting && (
          <>
            <svg className="w-4 h-4 shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {t('connectivity.reconnecting')}
          </>
        )}
        {isReconnected && (
          <>
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {t('connectivity.reconnected')}
          </>
        )}
      </div>
    </div>
  )
}
