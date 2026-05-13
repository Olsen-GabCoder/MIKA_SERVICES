import { useEffect, useRef } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useTranslation } from 'react-i18next'

export function PWAUpdatePrompt() {
  const { t } = useTranslation('common')
  const containerRef = useRef<HTMLDivElement>(null)
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW()

  // Auto-dismiss offlineReady après 4 secondes
  useEffect(() => {
    if (!offlineReady) return
    dismissTimerRef.current = setTimeout(() => setOfflineReady(false), 4000)
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
    }
  }, [offlineReady, setOfflineReady])

  // Focus le conteneur à l'apparition du prompt update
  useEffect(() => {
    if (needRefresh && containerRef.current) {
      containerRef.current.focus()
    }
  }, [needRefresh])

  if (!needRefresh && !offlineReady) return null

  return (
    <div
      ref={containerRef}
      role="alert"
      aria-live="polite"
      tabIndex={-1}
      className="fixed bottom-4 right-4 max-sm:bottom-0 max-sm:right-0 max-sm:left-0 z-[9999] max-w-sm max-sm:max-w-none"
    >
      <div className="mx-4 max-sm:mx-0 rounded-lg max-sm:rounded-none bg-gray-800 text-white shadow-2xl border border-gray-700 p-4">
        {needRefresh ? (
          <>
            <p className="text-sm font-medium mb-3">
              {t('pwa.updateAvailable')}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setNeedRefresh(false)}
                className="px-3 py-1.5 text-sm text-gray-300 hover:text-white transition-colors rounded-md hover:bg-gray-700"
              >
                {t('pwa.dismiss')}
              </button>
              <button
                type="button"
                onClick={() => updateServiceWorker(true)}
                className="px-3 py-1.5 text-sm font-medium text-white bg-[#FF6B35] hover:bg-[#e55a2b] transition-colors rounded-md"
              >
                {t('pwa.updateNow')}
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm">
            {t('pwa.offlineReady')}
          </p>
        )}
      </div>
    </div>
  )
}
