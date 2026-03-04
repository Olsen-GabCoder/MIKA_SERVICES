import { useTranslation } from 'react-i18next'

export const Footer = () => {
  const { t } = useTranslation('layout')
  return (
    <footer className="bg-dark text-white dark:bg-gray-800 dark:text-gray-100 py-2 sm:py-5 px-4 sm:px-6 md:px-8 shrink-0" style={{ minHeight: 'var(--layout-footer-height, 3.5rem)' }}>
      <div className="text-center text-xs sm:text-sm md:text-base">
        {t('footer.copyright', { year: new Date().getFullYear() })}
      </div>
    </footer>
  )
}
