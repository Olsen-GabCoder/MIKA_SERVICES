import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { toggleSidebar, toggleTheme, setLocale, closeMobileMenu } from '@/store/slices/uiSlice'
import type { Locale } from '../../i18n'
import { logoutUser } from '@/store/slices/authSlice'
import { userApi } from '@/api/userApi'
import { SIDEBAR_ITEMS } from './sidebarConfig'
import type { User } from '@/types'

/** Affiche le drapeau (png ou svg) ou l’emoji en secours si l’image ne charge pas. */
function FlagImg({ loc, baseUrl }: { loc: 'fr' | 'gb'; baseUrl: string }) {
  const base = baseUrl.replace(/\/?$/, '/')
  const [src, setSrc] = useState(`${base}flags/${loc}.png`)
  const [fallback, setFallback] = useState(false)
  const emoji = loc === 'fr' ? '🇫🇷' : '🇬🇧'

  const handleError = () => {
    if (src.endsWith('.png')) {
      setSrc(`${base}flags/${loc}.svg`)
    } else {
      setFallback(true)
    }
  }

  if (fallback) {
    return <span className="leading-none" aria-hidden>{emoji}</span>
  }
  return (
    <img
      src={src}
      alt=""
      className="w-5 h-5 object-contain rounded-sm"
      aria-hidden
      onError={handleError}
    />
  )
}

function getInitials(u: User): string {
  const p = (u.prenom || '').trim()
  const n = (u.nom || '').trim()
  if (p && n) return `${p[0]}${n[0]}`.toUpperCase()
  if (n) return n.slice(0, 2).toUpperCase()
  if (u.email) return u.email.slice(0, 2).toUpperCase()
  return '?'
}

export const Sidebar = () => {
  const { t } = useTranslation('layout')
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  const { messagesNonLusCount, notificationsNonLuesCount } = useAppSelector((state) => state.communication)
  const { sidebarCollapsed, mobileMenuOpen, theme, locale } = useAppSelector((state) => state.ui)

  const effectiveCollapsed = mobileMenuOpen ? false : sidebarCollapsed

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) dispatch(closeMobileMenu())
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [dispatch])

  const handleNavClick = () => {
    if (mobileMenuOpen) dispatch(closeMobileMenu())
  }

  const getRoleLabel = (u: User): string => {
    const role = u.roles?.[0]
    if (!role) return t('roles.utilisateur')
    const code = role.code?.toUpperCase()
    if (code === 'ADMIN' || code === 'SUPER_ADMIN') return t('roles.admin')
    if (code === 'CHEF_PROJET') return t('roles.chefDeProjet')
    if (code === 'MANAGER') return t('roles.manager')
    return role.nom || t('roles.employe')
  }

  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!user?.photo) {
      setProfilePhotoUrl(null)
      return () => {}
    }
    let objectUrl: string | null = null
    userApi.getPhotoBlob().then((blob) => {
      if (!blob) return
      objectUrl = URL.createObjectURL(blob)
      setProfilePhotoUrl(objectUrl)
    })
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [user?.photo])

  if (!isAuthenticated) {
    return null
  }

  const isAdmin = user?.roles?.some(
    (role: { code: string }) => role.code === 'ADMIN' || role.code === 'SUPER_ADMIN'
  )

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname === path || location.pathname.startsWith(path + '/')

  const linkClass = (path: string) => {
    const base = 'flex items-center rounded-lg text-base font-medium transition-colors w-full '
    const active = isActive(path) ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
    if (effectiveCollapsed) {
      return base + 'justify-center px-2 py-3 ' + active
    }
    return base + 'gap-3 px-3 py-3 ' + active
  }

  const getBadgeCount = (badgeKey: 'messages' | 'notifications') => {
    if (badgeKey === 'messages') return messagesNonLusCount
    if (user?.inAppNotificationsEnabled === false) return 0
    return notificationsNonLuesCount
  }

  const handleLogout = async () => {
    setUserMenuOpen(false)
    await dispatch(logoutUser())
    navigate('/login')
  }

  const items = SIDEBAR_ITEMS.filter((item) => !item.adminOnly || isAdmin)
  const fullName = user ? [user.prenom, user.nom].filter(Boolean).join(' ') || user.email || t('roles.utilisateur') : ''
  const avatarSrc = profilePhotoUrl
  const roleLabel = user ? getRoleLabel(user) : t('roles.utilisateur')

  return (
    <aside
      className={[
        'flex flex-col bg-secondary-dark text-white shrink-0',
        'fixed inset-y-0 left-0 z-40 w-64',
        'transition-transform duration-200 ease-out',
        mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
        'md:relative md:z-auto md:translate-x-0 md:transition-[width] md:duration-200 md:shadow-none',
        sidebarCollapsed ? 'md:w-16' : 'md:w-64',
      ].join(' ')}
    >
      <header
        className={`sidebar-header flex items-center border-b border-white/10 bg-white/5 px-3 py-4 ${
          effectiveCollapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        {!effectiveCollapsed && (
          <span className="text-base font-semibold text-white/90 tracking-wide">{t('sidebar.navigation')}</span>
        )}
        {/* Close button — mobile only */}
        <button
          type="button"
          onClick={() => dispatch(closeMobileMenu())}
          className="p-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors shrink-0 md:hidden"
          aria-label={t('sidebar.collapseSidebar')}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {/* Collapse / expand toggle — desktop only */}
        <button
          type="button"
          onClick={() => dispatch(toggleSidebar())}
          className="p-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors shrink-0 hidden md:block"
          title={sidebarCollapsed ? t('sidebar.expandSidebar') : t('sidebar.collapseSidebar')}
          aria-label={sidebarCollapsed ? t('sidebar.expandSidebar') : t('sidebar.collapseSidebar')}
        >
          {sidebarCollapsed ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          )}
        </button>
      </header>

      <nav className="sidebar-nav flex-1 min-h-0 overflow-y-auto scrollbar-hide py-4 px-2">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const badgeCount = item.badgeKey ? getBadgeCount(item.badgeKey) : 0
            return (
              <li key={item.to}>
                <Link to={item.to} className={linkClass(item.to)} title={effectiveCollapsed ? t(item.label) : undefined} onClick={handleNavClick}>
                  <span className="relative flex-shrink-0 [&>svg]:w-6 [&>svg]:h-6" aria-hidden>
                    {item.icon}
                    {effectiveCollapsed && badgeCount > 0 && (
                      <span
                        className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-danger border border-secondary-dark"
                        aria-hidden
                      />
                    )}
                  </span>
                  {!effectiveCollapsed && (
                    <>
                      <span className="truncate">{t(item.label)}</span>
                      {badgeCount > 0 && (
                        <span
                          className="ml-auto min-w-[1.5rem] h-6 px-2 flex items-center justify-center rounded-full bg-danger text-white text-sm font-semibold"
                          aria-label={t('sidebar.badgeUnread', { count: badgeCount })}
                        >
                          {badgeCount > 99 ? '99+' : badgeCount}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Section Paramètres : lien Paramètres + mode sombre */}
        <div className={`mt-6 pt-4 border-t border-white/10 ${effectiveCollapsed ? 'px-0' : 'px-2'}`}>
          {!effectiveCollapsed && (
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider px-3 mb-2">{t('sidebar.settingsSection')}</p>
          )}
          <ul className="space-y-0.5">
            <li>
              <Link
                to="/parametres"
                className={linkClass('/parametres')}
                title={effectiveCollapsed ? t('sidebar.parametres') : undefined}
                onClick={handleNavClick}
              >
                <SettingsIcon className="w-6 h-6 shrink-0" />
                {!effectiveCollapsed && <span className="truncate">{t('sidebar.parametres')}</span>}
              </Link>
            </li>
            <li>
              <Link
                to="/profile"
                className={linkClass('/profile')}
                title={effectiveCollapsed ? t('sidebar.monProfil') : undefined}
                onClick={handleNavClick}
              >
                <UserIcon className="w-6 h-6 shrink-0" />
                {!effectiveCollapsed && <span className="truncate">{t('sidebar.monProfil')}</span>}
              </Link>
            </li>
            <li>
              <button
                type="button"
                role="switch"
                aria-checked={theme === 'dark'}
                onClick={() => dispatch(toggleTheme())}
                className={`flex items-center rounded-lg text-base font-medium transition-colors w-full ${
                  effectiveCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-3'
                } text-white/90 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-secondary-dark`}
                title={effectiveCollapsed ? (theme === 'dark' ? t('sidebar.modeSombre') : t('sidebar.modeClair')) : undefined}
                aria-label={theme === 'dark' ? t('sidebar.modeSombre') : t('sidebar.modeClair')}
              >
                <span
                  className={`inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    theme === 'dark' ? 'bg-green-500' : 'bg-white/30'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform duration-200 ease-in-out mt-0.5 ${
                      theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                    aria-hidden
                  />
                </span>
                {!effectiveCollapsed && (
                  <span className="truncate text-left">{theme === 'dark' ? t('sidebar.modeSombre') : t('sidebar.modeClair')}</span>
                )}
              </button>
            </li>
            <li>
              <div
                className={`flex items-center rounded-lg text-base font-medium w-full ${
                  effectiveCollapsed ? 'justify-center gap-0 px-2 py-3' : 'gap-2 px-3 py-3'
                }`}
                role="group"
                aria-label={t('sidebar.language')}
              >
                {(['fr', 'en'] as Locale[]).map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => dispatch(setLocale(loc))}
                    title={loc === 'fr' ? t('sidebar.langFr') : t('sidebar.langEn')}
                    aria-label={loc === 'fr' ? t('sidebar.langFr') : t('sidebar.langEn')}
                    aria-pressed={locale === loc}
                    className={`flex items-center justify-center rounded-md border-2 transition-colors shrink-0 ${
                      locale === loc
                        ? 'bg-white/20 border-white/50 text-white'
                        : 'border-transparent text-white/60 hover:bg-white/10 hover:text-white'
                    } ${effectiveCollapsed ? 'w-9 h-9 text-base' : 'min-w-[2.25rem] h-9 px-2 text-base'}`}
                  >
                    {loc === 'fr' ? (
                      <FlagImg loc="fr" baseUrl={import.meta.env.BASE_URL} />
                    ) : (
                      <FlagImg loc="gb" baseUrl={import.meta.env.BASE_URL} />
                    )}
                  </button>
                ))}
                {!effectiveCollapsed && (
                  <span className="truncate text-left text-white/80 text-sm ml-0.5">{t('sidebar.language')}</span>
                )}
              </div>
            </li>
          </ul>
        </div>
      </nav>

      <footer className="sidebar-footer border-t border-white/10 p-3 relative" ref={userMenuRef}>
        {user ? (
          <>
            <button
              type="button"
              onClick={() => setUserMenuOpen((o) => !o)}
              className={`flex items-center w-full rounded-lg transition-colors text-left ${
                effectiveCollapsed ? 'justify-center p-2' : 'gap-3 p-3 hover:bg-white/10'
              }`}
              title={effectiveCollapsed ? fullName : undefined}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
              aria-label={t('sidebar.userMenu')}
            >
              <span className="relative shrink-0">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt=""
                    className={`rounded-full object-cover border-2 border-white/20 ${effectiveCollapsed ? 'w-9 h-9' : 'w-10 h-10'}`}
                  />
                ) : (
                  <span
                    className={`rounded-full bg-white/20 flex items-center justify-center text-white font-semibold border-2 border-white/20 ${effectiveCollapsed ? 'w-9 h-9 text-sm' : 'w-10 h-10 text-sm'}`}
                    aria-hidden
                  >
                    {getInitials(user)}
                  </span>
                )}
                <span
                  className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-success border-2 border-secondary-dark"
                  title={t('sidebar.connected')}
                  aria-hidden
                />
              </span>
              {!effectiveCollapsed && (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{fullName}</p>
                    <p className="text-xs text-white/70 truncate">{roleLabel}</p>
                  </div>
                  <svg
                    className={`w-4 h-4 text-white/60 shrink-0 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>

            {userMenuOpen && (
              <div
                role="menu"
                className={`absolute left-0 py-1 rounded-lg bg-secondary-dark border border-white/10 shadow-xl z-50 min-w-[12rem] ${
                  effectiveCollapsed ? 'bottom-full left-full mb-1 ml-1' : 'bottom-full mb-1 w-full'
                }`}
              >
                <Link
                  to="/profile"
                  onClick={() => { setUserMenuOpen(false); handleNavClick() }}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/90 hover:bg-white/10 transition-colors"
                  role="menuitem"
                >
                  <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {t('sidebar.monProfil')}
                </Link>
                {isAdmin && (
                  <Link
                    to="/users"
                    onClick={() => { setUserMenuOpen(false); handleNavClick() }}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/90 hover:bg-white/10 transition-colors"
                    role="menuitem"
                  >
                    <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {t('sidebar.gestionUtilisateurs')}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors text-left"
                  role="menuitem"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {t('sidebar.deconnexion')}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-2 text-center text-white/50 text-sm">{t('sidebar.loading')}</div>
        )}
      </footer>
    </aside>
  )
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}
