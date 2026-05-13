import { useTranslation } from 'react-i18next'
import { useIsOnline } from '@/hooks/useConnectivity'
import { useFormatDate } from '@/hooks/useFormatDate'

interface CacheTimestampBannerProps {
  lastFetched: string | null
}

/**
 * Bannière discrète affichée quand offline pour indiquer la date du cache.
 * Ne rend rien quand online ou si lastFetched est null.
 */
export function CacheTimestampBanner({ lastFetched }: CacheTimestampBannerProps) {
  const { t } = useTranslation('common')
  const isOnline = useIsOnline()
  const formatDate = useFormatDate()

  if (isOnline || !lastFetched) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-sm"
    >
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
      </svg>
      {t('offline.dataFromCache', { date: formatDate(lastFetched, { includeTime: true }) })}
    </div>
  )
}
