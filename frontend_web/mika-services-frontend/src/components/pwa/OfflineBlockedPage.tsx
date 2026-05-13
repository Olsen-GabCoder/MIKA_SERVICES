import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface OfflineBlockedPageProps {
  /** Clé i18n du nom de la page (ex: 'offline.pages.messagerie') */
  pageNameKey: string
}

/**
 * Page pleine affichée quand une page de niveau C est inaccessible hors ligne.
 * S'affiche à la place du contenu de la page, dans le conteneur <main>.
 */
export function OfflineBlockedPage({ pageNameKey }: OfflineBlockedPageProps) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const pageName = t(pageNameKey)

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        {t('offline.pageBlockedTitle')}
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
        {t('offline.pageBlockedMessage', { pageName })}
      </p>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="px-4 py-2 text-sm font-medium text-white bg-[#FF6B35] hover:bg-[#e55a2b] rounded-lg transition-colors"
      >
        {t('offline.goBack')}
      </button>
    </div>
  )
}
