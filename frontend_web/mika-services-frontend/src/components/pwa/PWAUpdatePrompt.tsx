import { useCallback, useEffect, useRef, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/store/hooks'

const UPDATE_CHECK_INTERVAL = 60 * 1000       // Vérifier toutes les 60 s
const RE_SHOW_AFTER_DISMISS = 5 * 60 * 1000   // Ré-afficher 5 min après dismiss
const MAX_DISMISSALS = 2                       // Après 2 reports, le bouton "Plus tard" disparaît

export function PWAUpdatePrompt() {
  const { t } = useTranslation('common')
  const pwaUpdateMode = useAppSelector((s) => s.ui.pwaUpdateMode)
  const [dismissed, setDismissed] = useState(false)
  const [dismissCount, setDismissCount] = useState(0)
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return
      setInterval(() => {
        if (!registration.installing) registration.update()
      }, UPDATE_CHECK_INTERVAL)
    },
  })

  // Mode auto : appliquer immédiatement sans popup
  useEffect(() => {
    if (needRefresh && pwaUpdateMode === 'auto') {
      updateServiceWorker(true)
    }
  }, [needRefresh, pwaUpdateMode, updateServiceWorker])

  // Auto-dismiss offlineReady après 4 secondes
  useEffect(() => {
    if (!offlineReady) return
    const timer = setTimeout(() => setOfflineReady(false), 4000)
    return () => clearTimeout(timer)
  }, [offlineReady, setOfflineReady])

  const handleDismiss = useCallback(() => {
    setDismissed(true)
    setDismissCount((c) => c + 1)
    dismissTimerRef.current = setTimeout(() => setDismissed(false), RE_SHOW_AFTER_DISMISS)
  }, [])

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
    }
  }, [])

  // Reset dismissed (mais pas le compteur) quand needRefresh change
  useEffect(() => {
    if (needRefresh) setDismissed(false)
  }, [needRefresh])

  const showUpdate = needRefresh && !dismissed && pwaUpdateMode === 'prompt'
  const showOffline = offlineReady && !needRefresh
  const canDismiss = dismissCount < MAX_DISMISSALS

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

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="pwa-update-title"
      aria-describedby="pwa-update-desc"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 salle-anim-fade"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

      {/* Popup */}
      <div
        className="relative z-10 w-full max-w-[420px] bg-[var(--db-bg-surface)] rounded-2xl shadow-2xl border border-[var(--db-border-default)] overflow-hidden salle-anim-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header orange */}
        <div className="relative bg-gradient-to-br from-[#FF6B35] to-[#e55a2b] px-7 pt-7 pb-6 text-center">
          <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
            </svg>
          </div>
          <h2 id="pwa-update-title" className="text-lg font-bold text-white">
            {t('pwa.updateAvailable')}
          </h2>
          {/* Courbe qui rejoint le body */}
          <div className="absolute bottom-[-1px] left-0 right-0 h-6 bg-[var(--db-bg-surface)] rounded-t-2xl" />
        </div>

        {/* Body */}
        <div id="pwa-update-desc" className="px-7 pt-5 pb-2 text-center">
          <p className="text-sm leading-relaxed text-[var(--db-text-muted)]">
            {t('pwa.updateDescription')}
          </p>
        </div>

        {/* Actions */}
        <div className="px-7 pt-4 pb-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => updateServiceWorker(true)}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-[10px] text-sm font-semibold text-white bg-[var(--db-accent)] hover:brightness-90 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t('pwa.updateNow')}
          </button>

          {canDismiss && (
            <>
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full px-5 py-2.5 rounded-[10px] text-[13px] font-medium border border-[var(--db-border-default)] text-[var(--db-text-muted)] bg-transparent hover:bg-[var(--db-accent-muted)] hover:text-[var(--db-text-primary)] hover:border-[var(--db-accent)] transition-all"
              >
                {t('pwa.dismiss')}
              </button>
              <p className="text-[11px] text-[var(--db-text-faint)] text-center -mt-1">
                {t('pwa.dismissHint')}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Expose la fonction pour déclencher manuellement une vérification de mise à jour
 * depuis la page Paramètres.
 */
export function useCheckForUpdate() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  const checkAndApply = useCallback(async (): Promise<'updated' | 'no-update'> => {
    // Force le SW à vérifier
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) await reg.update()
    // Petit délai pour laisser Workbox détecter le nouveau SW
    await new Promise((r) => setTimeout(r, 1500))
    // Re-check : si un nouveau SW est en attente, on l'applique
    const freshReg = await navigator.serviceWorker?.getRegistration()
    if (freshReg?.waiting) {
      await updateServiceWorker(true)
      return 'updated'
    }
    return 'no-update'
  }, [updateServiceWorker])

  return { needRefresh, checkAndApply, updateServiceWorker }
}
