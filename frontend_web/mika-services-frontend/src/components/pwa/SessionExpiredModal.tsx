import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

interface SessionExpiredModalProps {
  open: boolean
  pendingCount: number
  onReconnect: () => void
}

export function SessionExpiredModal({ open, pendingCount, onReconnect }: SessionExpiredModalProps) {
  const { t } = useTranslation('common')
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Focus auto sur le bouton à l'ouverture
  useEffect(() => {
    if (open && buttonRef.current) {
      buttonRef.current.focus()
    }
  }, [open])

  if (!open) return null

  // Focus trap : Tab et Shift+Tab restent sur le bouton unique
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      buttonRef.current?.focus()
    }
    // Bloquer Escape — modale non-dismissible
    if (e.key === 'Escape') {
      e.preventDefault()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
      aria-describedby="session-expired-desc"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 id="session-expired-title" className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {t('session.expiredTitle')}
          </h2>
        </div>

        <p id="session-expired-desc" className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          {t('session.expiredMessage')}
        </p>

        {pendingCount > 0 && (
          <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-4">
            {t('session.pendingMutations', { count: pendingCount })}
          </p>
        )}

        <div className="flex justify-end">
          <button
            ref={buttonRef}
            type="button"
            onClick={onReconnect}
            className="px-4 py-2 text-sm font-medium text-white bg-[#FF6B35] hover:bg-[#e55a2b] rounded-lg transition-colors"
          >
            {t('session.reconnect')}
          </button>
        </div>
      </div>
    </div>
  )
}
