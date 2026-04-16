import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function MaterielModuleTabs() {
  const { t } = useTranslation('materiel')

  const tabs = [
    { to: '/engins', label: t('module.navEngins') },
    { to: '/mouvements', label: t('module.navMouvements') },
    { to: '/dma', label: t('module.navDma') },
    { to: '/materiaux', label: t('module.navMateriaux') },
  ]

  return (
    <div className="flex flex-wrap gap-1.5 mt-4" role="tablist" aria-label={t('module.tabsAria')}>
      {tabs.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          role="tab"
          className={({ isActive }) =>
            `px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 border ${
              isActive
                ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20'
                : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </div>
  )
}
