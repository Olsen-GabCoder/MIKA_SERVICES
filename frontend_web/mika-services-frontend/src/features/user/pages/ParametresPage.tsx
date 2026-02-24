import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/layout/PageContainer'

export const ParametresPage = () => {
  const { t } = useTranslation('parametres')
  return (
    <PageContainer size="wide" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t('subtitle')}</p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 p-6">
        <p className="text-gray-600 dark:text-gray-300">{t('themeHint')}</p>
      </div>
    </PageContainer>
  )
}
