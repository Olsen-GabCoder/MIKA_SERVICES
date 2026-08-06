import { useCallback, useEffect, useRef, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useTranslation } from 'react-i18next'

const UPDATE_CHECK_INTERVAL = 60 * 1000       // Vérifier toutes les 60 s
const RE_SHOW_AFTER_DISMISS = 2 * 60 * 1000   // Ré-afficher 2 min après dismiss

export function PWAUpdatePrompt() {
  const { t } = useTranslation('common')
  const [dismissed, setDismissed] = useState(false)
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return
      // Vérification périodique de mise à jour
      setInterval(() => {
        if (!registration.installing) registration.update()
      }, UPDATE_CHECK_INTERVAL)
    },
  })

  // Auto-dismiss offlineReady après 4 secondes
  useEffect(() => {
    if (!offlineReady) return
    const timer = setTimeout(() => setOfflineReady(false), 4000)
    return () => clearTimeout(timer)
  }, [offlineReady, setOfflineReady])

  // Quand dismissed, ré-afficher après RE_SHOW_AFTER_DISMISS
  const handleDismiss = useCallback(() => {
    setDismissed(true)
    dismissTimerRef.current = setTimeout(() => setDismissed(false), RE_SHOW_AFTER_DISMISS)
  }, [])

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
    }
  }, [])

  // Reset dismissed quand needRefresh change (nouvelle update détectée)
  useEffect(() => {
    if (needRefresh) setDismissed(false)
  }, [needRefresh])

  const showUpdate = needRefresh && !dismissed
  const showOffline = offlineReady && !needRefresh

  if (!showUpdate && !showOffline) return null

  if (showOffline) {
    return (
      <div
        role="status"
        className="fixed bottom-4 right-4 z-[9999] max-w-sm animate-slide-in-right"
      >
        <div className="rounded-lg bg-gray-800 text-white shadow-xl border border-gray-700 px-4 py-3 text-sm">
          {t('pwa.offlineReady')}
        </div>
      </div>
    )
  }

  // Bannière plein écran en haut — impossible à rater
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-0 left-0 right-0 z-[9999] animate-slide-in-top"
    >
      <div className="bg-gradient-to-r from-[#FF6B35] to-[#e55a2b] text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          {/* Icône + message */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-white/20 animate-pulse-slow">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{t('pwa.updateAvailable')}</p>
              <p className="text-xs text-white/80">{t('pwa.updateHint')}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDismiss}
              className="px-3 py-1.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors rounded-md"
            >
              {t('pwa.dismiss')}
            </button>
            <button
              type="button"
              onClick={() => updateServiceWorker(true)}
              className="px-4 py-1.5 text-sm font-semibold bg-white text-[#FF6B35] hover:bg-white/90 transition-colors rounded-md shadow-sm"
            >
              {t('pwa.updateNow')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
