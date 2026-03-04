import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { toggleMobileMenu } from '@/store/slices/uiSlice'
import { getBreadcrumbs, getSectionTitleKey } from './headerConfig'

export const Header = () => {
  const { t } = useTranslation('layout')
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const location = useLocation()
  const pathname = location.pathname
  const breadcrumbs = getBreadcrumbs(pathname)
  const sectionTitleKey = getSectionTitleKey(pathname)
  const sectionTitle = t(sectionTitleKey)

  if (!isAuthenticated) return null

  return (
    <header className="relative shrink-0 isolate overflow-hidden h-[var(--layout-header-height,4.5rem)]" style={{ minHeight: 'var(--layout-header-height, 4.5rem)' }}>
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-gray-50/60 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/80" aria-hidden />
      <div className="absolute inset-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)]" aria-hidden />

      <div className="relative h-full flex items-center justify-between gap-3 sm:gap-6 px-3 sm:px-6 md:px-8">
        {/* Gauche : hamburger (mobile) + logo + tagline */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={() => dispatch(toggleMobileMenu())}
            className="p-2 -ml-1 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors md:hidden"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link
            to="/"
            className="group flex items-center gap-3 sm:gap-4 min-w-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/25 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            aria-label={t('header.homeAria')}
          >
            <img
              src="/Logo_mika_services.png"
              alt=""
              className="h-9 sm:h-12 w-auto object-contain transition-all duration-200 group-hover:opacity-90 group-active:opacity-95"
            />
            <span className="hidden sm:block w-px h-5 bg-gray-200 dark:bg-gray-600 rounded-full" aria-hidden />
            <span className="hidden sm:block text-sm font-medium text-secondary/80 dark:text-gray-300 tracking-wide antialiased">
              {t('header.tagline')}
            </span>
          </Link>
        </div>

        {/* Droite : fil d'Ariane + titre de section */}
        <div className="hidden sm:flex items-center gap-4 min-w-0 max-w-[60%] md:max-w-[50%]">
          <nav aria-label="Fil d'Ariane" className="flex items-center min-w-0">
            <ol className="flex items-center gap-1.5 text-sm md:text-base flex-wrap justify-end">
              {breadcrumbs.map((item, index) => {
                const isLast = index === breadcrumbs.length - 1
                return (
                  <li key={item.path} className="flex items-center gap-1.5 shrink-0 min-w-0">
                    {index > 0 && (
                      <span className="text-gray-300 dark:text-gray-500 select-none" aria-hidden>
                        <ChevronIcon />
                      </span>
                    )}
                    {isLast ? (
                      <span className="font-medium text-secondary dark:text-gray-200 truncate" title={t(item.labelKey)}>
                        {t(item.labelKey)}
                      </span>
                    ) : (
                      <Link
                        to={item.path}
                        className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light transition-colors truncate focus:outline-none focus:ring-2 focus:ring-primary/25 focus:ring-offset-1 dark:focus:ring-offset-gray-900 rounded"
                      >
                        {t(item.labelKey)}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>
          <span className="hidden lg:block w-px h-5 bg-gray-200 dark:bg-gray-600 shrink-0" aria-hidden />
          <p className="hidden lg:block text-xs md:text-sm font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider truncate shrink-0 max-w-[140px]" title={sectionTitle}>
            {sectionTitle}
          </p>
        </div>
      </div>

      {/* Ligne de séparation + accent marque en dégradé */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-100 dark:bg-gray-700" aria-hidden />
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-primary-dark"
        aria-hidden
      />
    </header>
  )
}

function ChevronIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}
