import { useTranslation } from 'react-i18next'
import { useIsOnline } from '@/hooks/useConnectivity'

interface OfflineWarningBannerProps {
  messageKey: string
}

/**
 * Bannière d'avertissement affichée quand offline pour signaler
 * que certaines actions ne seront pas sauvegardées côté serveur.
 */
export function OfflineWarningBanner({ messageKey }: OfflineWarningBannerProps) {
  const { t } = useTranslation('common')
  const isOnline = useIsOnline()

  if (isOnline) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg border-l-4 border-amber-500 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-sm"
    >
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      {t(messageKey)}
    </div>
  )
}
