import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/store/hooks'
import { usePendingMutationsCount } from '@/hooks/usePendingMutationsCount'
import { Modal } from '@/components/ui/Modal'

const AUTO_DISMISS_MS = 4000

export function SyncStatusBadge() {
  const { t } = useTranslation('common')
  const { isReplaying, lastReplayResult } = useAppSelector((state) => state.sync)
  const pendingCount = usePendingMutationsCount()

  const [showSuccess, setShowSuccess] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-dismiss succès après 4s
  useEffect(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current)
      dismissTimerRef.current = null
    }

    if (
      !isReplaying &&
      lastReplayResult &&
      lastReplayResult.succeeded > 0 &&
      lastReplayResult.failed === 0
    ) {
      setShowSuccess(true)
      dismissTimerRef.current = setTimeout(() => setShowSuccess(false), AUTO_DISMISS_MS)
    } else {
      setShowSuccess(false)
    }

    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current)
        dismissTimerRef.current = null
      }
    }
  }, [isReplaying, lastReplayResult])

  // État : replay en cours
  if (isReplaying && pendingCount > 0) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-4 left-4 max-sm:bottom-16 max-sm:left-2 max-sm:right-2 z-[500]"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/95 text-white text-sm shadow-lg">
          <svg className="w-4 h-4 shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {t('sync.inProgress', { count: pendingCount })}
        </div>
      </div>
    )
  }

  // État : succès total
  if (showSuccess && lastReplayResult && lastReplayResult.succeeded > 0 && lastReplayResult.failed === 0) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-4 left-4 max-sm:bottom-16 max-sm:left-2 max-sm:right-2 z-[500]"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600/95 text-white text-sm shadow-lg">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {t('sync.succeeded', { count: lastReplayResult.succeeded })}
        </div>
      </div>
    )
  }

  // État : échec partiel
  if (!isReplaying && lastReplayResult && lastReplayResult.failed > 0) {
    return (
      <>
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-4 max-sm:bottom-16 max-sm:left-2 max-sm:right-2 z-[500]"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600/95 text-white text-sm shadow-lg">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>{t('sync.failed', { count: lastReplayResult.failed })}</span>
            <button
              type="button"
              onClick={() => setDetailsOpen(true)}
              className="underline underline-offset-2 hover:no-underline ml-1"
            >
              {t('sync.viewDetails')}
            </button>
          </div>
        </div>

        <Modal
          isOpen={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          title={t('sync.failedDetailsTitle')}
          size="md"
        >
          <div className="space-y-2">
            {lastReplayResult.failedMutations.map((m) => (
              <div
                key={m.idempotencyKey}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-sm"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    <span className="text-gray-500 dark:text-gray-400">{t('sync.failedType')}:</span>{' '}
                    {m.thunkType}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    <span className="text-gray-500 dark:text-gray-400">{t('sync.failedReason')}:</span>{' '}
                    {m.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      </>
    )
  }

  // Idle — ne rien afficher
  return null
}
