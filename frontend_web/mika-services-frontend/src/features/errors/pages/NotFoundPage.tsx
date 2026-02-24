import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'

export const NotFoundPage = () => {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-6xl font-bold text-gray-300 dark:text-gray-500">404</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mt-2">{t('notFound.title')}</p>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t('notFound.description')}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium"
        >
          {t('notFound.backHome')}
        </button>
      </div>
    </PageContainer>
  )
}
