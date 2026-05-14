import { useTranslation } from 'react-i18next'
import { NavLink, Outlet } from 'react-router-dom'

const linkBase = 'relative inline-flex items-center gap-2 px-1 py-3 text-[14px] font-medium transition-colors duration-150 min-h-[44px]'
const linkInactive = 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
const linkActive = 'text-[#FF6B35]'
const underline = 'absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#FF6B35]'

export function SalleMikaLayout() {
  const { t } = useTranslation('salleReunion')

  return (
    <>
      <nav className="flex items-center gap-6 border-b border-neutral-200/80 dark:border-neutral-800/80 mb-6">
        <NavLink
          to="/salle-mika"
          end
          className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
        >
          {({ isActive }) => (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49m11.31-2.82a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14"/></svg>
              {t('nav.laSalle')}
              {isActive && <span className={underline} />}
            </>
          )}
        </NavLink>
        <NavLink
          to="/salle-mika/pv"
          className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
        >
          {({ isActive }) => (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              {t('nav.procesVerbaux')}
              {isActive && <span className={underline} />}
            </>
          )}
        </NavLink>
      </nav>
      <Outlet />
    </>
  )
}
