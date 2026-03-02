import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setUser } from '@/store/slices/authSlice'
import { toggleTheme, setLocale, setFontSize, setFontFamily, setDensity, setDateFormat, setTimeFormat, setNumberFormat, setTimezone, setCardSize, setSidebarCollapsed, setAnimationPreference, setDefaultHomePath, setItemsPerPage, setAutoRefreshListsEnabled, setOfflineModeEnabled, setHighContrastText, setHighContrastCards, setCacheEnabled, setCacheDuration, setPreloadDataEnabled, setOfflineQueueEnabled, setConnectionQuality, type CacheDuration, type ConnectionQuality } from '@/store/slices/uiSlice'
import { authApi } from '@/api/authApi'
import { userApi } from '@/api/userApi'
import type { LoginHistoryEntry } from '@/api/userApi'
import type { Locale } from '@/i18n'
import { formatDisplayDate } from '@/utils/formatDisplayDate'
import type { FontSize, FontFamily } from '@/utils/fontPreferences'
import type { Density } from '@/utils/densityPreferences'
import type { DateFormatPreference } from '@/utils/dateFormatPreferences'
import type { TimeFormatPreference } from '@/utils/timeFormatPreferences'
import type { NumberFormatPreference } from '@/utils/numberFormatPreferences'
import type { CardSize } from '@/utils/cardSizePreferences'
import type { AnimationPreference } from '@/utils/animationPreferences'
import { TIMEZONE_OPTIONS } from '@/utils/timezonePreferences'
import { setTokenStorageMode } from '@/utils/tokenStorage'
import { PageContainer } from '@/components/layout/PageContainer'

/* ══════════════════════════════════════════════════════════════════
   SECTION IDS
══════════════════════════════════════════════════════════════════ */
const SECTION_IDS = [
  'affichage', 'notifications', 'securite', 'compte',
  'general', 'accessibilite', 'donnees', 'reseau', 'raccourcis',
] as const
type SectionId = (typeof SECTION_IDS)[number]

/* ══════════════════════════════════════════════════════════════════
   ICONS
══════════════════════════════════════════════════════════════════ */
const Icons: Record<string, React.ReactNode> = {
  display: (
    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 7.409a2.25 2.25 0 01-1.07-1.916V5.25" />
    </svg>
  ),
  bell: (
    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  ),
  lock: (
    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  ),
  user: (
    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  ),
  cog: (
    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  eye: (
    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  shield: (
    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
  wifi: (
    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
    </svg>
  ),
  keyboard: (
    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  ),
  chevron: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  ),
  link: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  ),
}

/** Drapeau FR/GB comme dans la sidebar (png → svg → emoji). */
function FlagImg({ loc }: { loc: 'fr' | 'gb' }) {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/')
  const [src, setSrc] = useState(`${base}flags/${loc}.png`)
  const [fallback, setFallback] = useState(false)
  const emoji = loc === 'fr' ? '🇫🇷' : '🇬🇧'
  const handleError = () => {
    if (src.endsWith('.png')) setSrc(`${base}flags/${loc}.svg`)
    else setFallback(true)
  }
  if (fallback) return <span className="leading-none text-lg" aria-hidden>{emoji}</span>
  return <img src={src} alt="" className="w-5 h-5 object-contain rounded-sm" aria-hidden onError={handleError} />
}

/* Couleurs alignées sur la charte : primary #FF6B35, secondary #2E5266, success, warning, danger, info */
const SECTION_META: Record<SectionId, { icon: keyof typeof Icons; color: string; bg: string; dot: string }> = {
  affichage:    { icon: 'display',  color: 'text-primary dark:text-primary-light',     bg: 'bg-primary/10 dark:bg-primary/20',     dot: 'bg-primary' },
  notifications:{ icon: 'bell',    color: 'text-warning dark:text-warning',           bg: 'bg-warning/10 dark:bg-warning/20',   dot: 'bg-warning' },
  securite:     { icon: 'lock',    color: 'text-danger dark:text-danger',             bg: 'bg-danger/10 dark:bg-danger/20',     dot: 'bg-danger' },
  compte:       { icon: 'user',    color: 'text-secondary dark:text-secondary-light',  bg: 'bg-secondary/10 dark:bg-secondary/20', dot: 'bg-secondary' },
  general:      { icon: 'cog',     color: 'text-dark dark:text-medium',                bg: 'bg-gray-100 dark:bg-gray-700/50',    dot: 'bg-dark' },
  accessibilite:{ icon: 'eye',     color: 'text-info dark:text-info',                  bg: 'bg-info/10 dark:bg-info/20',         dot: 'bg-info' },
  donnees:      { icon: 'shield',  color: 'text-success dark:text-success',           bg: 'bg-success/10 dark:bg-success/20',   dot: 'bg-success' },
  reseau:       { icon: 'wifi',    color: 'text-info dark:text-info',                  bg: 'bg-info/10 dark:bg-info/20',         dot: 'bg-info' },
  raccourcis:   { icon: 'keyboard',color: 'text-primary dark:text-primary-light',     bg: 'bg-primary/10 dark:bg-primary/20',     dot: 'bg-primary' },
}

/* ══════════════════════════════════════════════════════════════════
   ATOMS
══════════════════════════════════════════════════════════════════ */

/** Badge "Bientôt" */
function SoonBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-600 tracking-wide uppercase">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-500" />
      Bientôt
    </span>
  )
}

/** Lien vers profil (charte: primary) */
function ProfileLink({ label }: { label: string }) {
  return (
    <Link to="/profile"
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-dark dark:text-primary-light bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 px-3 py-1.5 rounded-lg border border-primary/30 dark:border-primary/40 transition-all duration-150">
      {label}
      <span className="text-primary-dark dark:text-primary">{Icons.link}</span>
    </Link>
  )
}

/** Toggle switch (charte: primary) */
function SettingSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800
        ${checked ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}>
      <span aria-hidden
        className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-md ring-0 transition-transform duration-200
          ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

/** Select */
function SettingSelect<T extends string>({ value, options, onChange, disabled, optionLabels }: {
  value: T; options: readonly T[]; onChange: (v: T) => void; disabled?: boolean; optionLabels: Record<T, string>
}) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value as T)} disabled={disabled}
        className={`appearance-none min-w-[10rem] rounded-xl border border-gray-200 dark:border-gray-600
          bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-3 py-2 pr-8 text-sm
          focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none
          shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}>
        {options.map(opt => <option key={opt} value={opt}>{optionLabels[opt]}</option>)}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-gray-400 dark:text-gray-500">
        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.755a.75.75 0 111.08 1.04l-4.25 4.3a.75.75 0 01-1.08 0l-4.25-4.3a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  )
}

/** Toggle thème — même UI que la sidebar (switch + libellé). */
function ThemeToggle() {
  const { t } = useTranslation('parametres')
  const dispatch = useAppDispatch()
  const theme = useAppSelector(s => s.ui.theme)
  return (
    <button
      type="button"
      role="switch"
      aria-checked={theme === 'dark'}
      onClick={() => dispatch(toggleTheme())}
      className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 px-4 py-2.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      aria-label={theme === 'dark' ? t('affichage.themeDark') : t('affichage.themeLight')}
    >
      <span
        className={`inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
          theme === 'dark' ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform duration-200 ease-in-out mt-0.5 ${
            theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'
          }`}
          aria-hidden
        />
      </span>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
        {theme === 'dark' ? t('affichage.themeDark') : t('affichage.themeLight')}
      </span>
    </button>
  )
}

/** Sélecteur de langue — même UI que la sidebar (boutons drapeaux). */
function LanguageSwitcher() {
  const { t } = useTranslation('parametres')
  const dispatch = useAppDispatch()
  const locale = useAppSelector(s => s.ui.locale)
  return (
    <div className="flex items-center gap-2" role="group" aria-label={t('affichage.language')}>
      {(['fr', 'en'] as Locale[]).map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => dispatch(setLocale(loc))}
          title={loc === 'fr' ? t('affichage.languageFr') : t('affichage.languageEn')}
          aria-label={loc === 'fr' ? t('affichage.languageFr') : t('affichage.languageEn')}
          aria-pressed={locale === loc}
          className={`flex items-center justify-center rounded-lg border-2 transition-colors shrink-0 h-9 min-w-[2.5rem] px-2 ${
            locale === loc
              ? 'bg-primary/15 dark:bg-primary/20 border-primary text-primary dark:text-primary-light'
              : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <FlagImg loc={loc === 'en' ? 'gb' : 'fr'} />
        </button>
      ))}
    </div>
  )
}

/** Setting row */
function SettingRow({ label, description, children, variant = 'default' }: {
  label: string; description: string; children: React.ReactNode; variant?: 'default' | 'danger'
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4
      border-b border-gray-100 dark:border-gray-700/60 last:border-b-0 group hover:bg-gray-50/60 dark:hover:bg-gray-700/20
      -mx-5 px-5 transition-colors duration-100 rounded-xl">
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${variant === 'danger' ? 'text-danger dark:text-danger' : 'text-gray-800 dark:text-gray-100'}`}>
          {label}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

/** Section card */
function SectionCard({ id, title, subtitle, children }: {
  id: SectionId; title: string; subtitle: string; children: React.ReactNode
}) {
  const meta = SECTION_META[id]
  return (
    <section id={id} className="scroll-mt-6 rounded-2xl border border-gray-100 dark:border-gray-700/80
      bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100 dark:border-gray-700/60
        bg-gradient-to-r from-gray-50/80 to-white dark:from-gray-800 dark:to-gray-800">
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${meta.bg} ${meta.color} shadow-sm shrink-0`}>
          {Icons[meta.icon]}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 tracking-tight">{title}</h2>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 leading-snug">{subtitle}</p>
        </div>
        {/* Section accent dot (charte) */}
        <div className={`w-2 h-2 rounded-full shrink-0 opacity-60 ${meta.dot}`} />
      </div>
      {/* Rows */}
      <div className="px-5 py-1">{children}</div>
    </section>
  )
}

/** Sidebar nav item */
function NavItem({ id, isActive, label, onClick }: {
  id: SectionId; isActive: boolean; label: string; onClick: () => void
}) {
  const meta = SECTION_META[id]
  return (
    <button type="button" onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group text-left
        ${isActive
          ? `${meta.bg} ${meta.color} shadow-sm`
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/60 hover:text-gray-700 dark:hover:text-gray-200'}`}>
      <span className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150
        ${isActive ? `${meta.bg} ${meta.color}` : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'}`}>
        {Icons[meta.icon]}
      </span>
      <span className="truncate">{label}</span>
      {isActive && (
        <span className={`ml-auto shrink-0 ${meta.color} opacity-60`}>{Icons.chevron}</span>
      )}
    </button>
  )
}

/* ══════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════ */
export const ParametresPage = () => {
  const { t, i18n } = useTranslation('parametres')
  const dispatch = useAppDispatch()
  const user = useAppSelector(s => s.auth.user)
  const { sidebarCollapsed, fontSize, fontFamily, density, dateFormat, timeFormat, numberFormat, timezone, cardSize, animationPreference, defaultHomePath, itemsPerPage, autoRefreshListsEnabled, offlineModeEnabled, highContrastText, highContrastCards, cacheEnabled, cacheDuration, preloadDataEnabled, offlineQueueEnabled, connectionQuality } = useAppSelector(s => s.ui)
  const [activeSection, setActiveSection] = useState<SectionId>('affichage')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [notificationPrefsSaving, setNotificationPrefsSaving] = useState(false)
  const [sessionPrefsSaving, setSessionPrefsSaving] = useState(false)
  const [passwordPolicyOpen, setPasswordPolicyOpen] = useState(false)
  const [loginHistoryOpen, setLoginHistoryOpen] = useState(false)
  const [loginHistoryList, setLoginHistoryList] = useState<LoginHistoryEntry[] | null>(null)
  const [loginHistoryLoading, setLoginHistoryLoading] = useState(false)
  const [lockoutPolicyOpen, setLockoutPolicyOpen] = useState(false)
  const [lockoutPolicy, setLockoutPolicy] = useState<{ lockoutMaxAttempts: number; lockoutDurationMinutes: number } | null>(null)
  const [lockoutPolicyLoading, setLockoutPolicyLoading] = useState(false)

  const emailNotificationsEnabled = user?.emailNotificationsEnabled ?? true
  const alertNewLoginEnabled = user?.alertNewLoginEnabled ?? true
  const dailyDigestEnabled = user?.dailyDigestEnabled ?? false
  const weeklyDigestEnabled = user?.weeklyDigestEnabled ?? false
  const digestTime = user?.digestTime ?? '18:00'
  const inAppNotificationsEnabled = user?.inAppNotificationsEnabled ?? true
  const notificationSoundEnabled = user?.notificationSoundEnabled ?? true

  const handleEmailNotificationsChange = async (checked: boolean) => {
    if (!user || notificationPrefsSaving) return
    setNotificationPrefsSaving(true)
    try {
      const updated = await userApi.updateNotificationPreferences({ emailNotificationsEnabled: checked })
      dispatch(setUser(updated))
    } finally {
      setNotificationPrefsSaving(false)
    }
  }

  const handleAlertNewLoginChange = async (checked: boolean) => {
    if (!user || notificationPrefsSaving) return
    setNotificationPrefsSaving(true)
    try {
      const updated = await userApi.updateNotificationPreferences({ alertNewLoginEnabled: checked })
      dispatch(setUser(updated))
    } finally {
      setNotificationPrefsSaving(false)
    }
  }

  const handleDailyDigestChange = async (checked: boolean) => {
    if (!user || notificationPrefsSaving) return
    setNotificationPrefsSaving(true)
    try {
      const updated = await userApi.updateNotificationPreferences({ dailyDigestEnabled: checked })
      dispatch(setUser(updated))
    } finally {
      setNotificationPrefsSaving(false)
    }
  }

  const handleWeeklyDigestChange = async (checked: boolean) => {
    if (!user || notificationPrefsSaving) return
    setNotificationPrefsSaving(true)
    try {
      const updated = await userApi.updateNotificationPreferences({ weeklyDigestEnabled: checked })
      dispatch(setUser(updated))
    } finally {
      setNotificationPrefsSaving(false)
    }
  }

  const handleDigestTimeChange = async (value: string) => {
    if (!user || notificationPrefsSaving) return
    if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) return
    setNotificationPrefsSaving(true)
    try {
      const updated = await userApi.updateNotificationPreferences({ digestTime: value })
      dispatch(setUser(updated))
    } finally {
      setNotificationPrefsSaving(false)
    }
  }

  const handleInAppNotificationsChange = async (checked: boolean) => {
    if (!user || notificationPrefsSaving) return
    setNotificationPrefsSaving(true)
    try {
      const updated = await userApi.updateNotificationPreferences({ inAppNotificationsEnabled: checked })
      dispatch(setUser(updated))
    } finally {
      setNotificationPrefsSaving(false)
    }
  }

  const handleNotificationSoundChange = async (checked: boolean) => {
    if (!user || notificationPrefsSaving) return
    setNotificationPrefsSaving(true)
    try {
      const updated = await userApi.updateNotificationPreferences({ notificationSoundEnabled: checked })
      dispatch(setUser(updated))
    } finally {
      setNotificationPrefsSaving(false)
    }
  }

  /* Charger l'historique des connexions à l'ouverture du bloc */
  useEffect(() => {
    if (!loginHistoryOpen) return
    setLoginHistoryLoading(true)
    userApi.getMyLoginHistory()
      .then(setLoginHistoryList)
      .catch(() => setLoginHistoryList([]))
      .finally(() => setLoginHistoryLoading(false))
  }, [loginHistoryOpen])

  /* Charger la politique de verrouillage à l'ouverture du bloc */
  useEffect(() => {
    if (!lockoutPolicyOpen) return
    setLockoutPolicyLoading(true)
    authApi.getLoginPolicy()
      .then(setLockoutPolicy)
      .catch(() => setLockoutPolicy(null))
      .finally(() => setLockoutPolicyLoading(false))
  }, [lockoutPolicyOpen])

  /* Scroll spy via IntersectionObserver */
  useEffect(() => {
    const observers: IntersectionObserver[] = []
    SECTION_IDS.forEach(id => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) setActiveSection(id)
      }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 })
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach(o => o.disconnect())
  }, [])

  const scrollTo = (id: SectionId) => {
    const el = document.getElementById(id)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <PageContainer size="full" className="h-full flex flex-col min-h-0">

      {/* ═══ HERO HEADER (charte: secondary + primary) ═══ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary-dark via-secondary to-secondary-dark px-6 sm:px-10 py-7 text-white shadow-2xl mb-6 shrink-0">
        <div className="pointer-events-none absolute -right-16 -top-16 w-72 h-72 rounded-full bg-white/[0.04] blur-3xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-10 w-56 h-56 rounded-full bg-primary/10 blur-2xl" />
        <div className="pointer-events-none absolute right-1/4 top-0 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1 h-8 rounded-full bg-gradient-to-b from-primary to-primary-dark" />
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{t('title')}</h1>
            </div>
            <p className="text-white/60 text-sm ml-4">{t('subtitle')}</p>
          </div>

          {/* Compteur sections */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-xl">
            <span className="text-white/60 text-xs">{SECTION_IDS.length} sections</span>
            <div className="w-px h-4 bg-white/20" />
            <div className="flex gap-1">
              {SECTION_IDS.map((id) => (
                <div key={id} className={`w-1.5 h-1.5 rounded-full transition-all duration-300
                  ${activeSection === id ? 'bg-white scale-125' : 'bg-white/30'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Mobile jump select */}
        <div className="relative z-10 mt-5 md:hidden">
          <div className="relative">
            <select
              className="w-full appearance-none rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 text-white placeholder-white/60 px-4 py-2.5 pr-10 text-sm focus:ring-2 focus:ring-white/40 focus:outline-none"
              value={activeSection}
              onChange={e => scrollTo(e.target.value as SectionId)}>
              {SECTION_IDS.map(id => (
                <option key={id} value={id} className="text-gray-900 bg-white">{t(`section.${id}`)}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/60">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.755a.75.75 0 111.08 1.04l-4.25 4.3a.75.75 0 01-1.08 0l-4.25-4.3a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ BODY: Sidebar + Scrollable content ═══ */}
      <div className="flex-1 min-h-0 flex gap-6">

        {/* ── Sidebar ── */}
        <aside className="hidden md:flex flex-col w-52 shrink-0 gap-1">
          {/* Active section preview */}
          <div className="mb-3 px-3 py-2.5 rounded-xl bg-gray-100/80 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600/50">
            <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Section active</p>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{t(`section.${activeSection}`)}</p>
          </div>

          <nav className="flex flex-col gap-0.5">
            {SECTION_IDS.map(id => (
              <NavItem key={id} id={id} isActive={activeSection === id} label={t(`section.${id}`)} onClick={() => scrollTo(id)} />
            ))}
          </nav>

          {/* Bottom card */}
          <div className="mt-auto pt-4">
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-600 p-3 text-center">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-snug">Des paramètres supplémentaires seront disponibles prochainement.</p>
            </div>
          </div>
        </aside>

        {/* ── Scrollable content ── */}
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto space-y-5 pb-8 pr-0.5">

          {/* ═══ AFFICHAGE ═══ */}
          <SectionCard id="affichage" title={t('section.affichage')} subtitle={t('section.affichageDesc')}>
            <SettingRow label={t('affichage.theme')} description={t('affichage.themeDesc')}>
              <ThemeToggle />
            </SettingRow>
            <SettingRow label={t('affichage.language')} description={t('affichage.languageDesc')}>
              <LanguageSwitcher />
            </SettingRow>
            <SettingRow label={t('affichage.fontSize')} description={t('affichage.fontSizeDesc')}>
              <SettingSelect<FontSize>
                value={fontSize}
                options={['small', 'default', 'medium', 'large'] as const}
                onChange={v => dispatch(setFontSize(v))}
                optionLabels={{
                  small: t('affichage.fontSizeSmall'),
                  default: t('affichage.fontSizeDefault'),
                  medium: t('affichage.fontSizeMedium'),
                  large: t('affichage.fontSizeLarge'),
                }}
              />
            </SettingRow>
            <SettingRow label={t('affichage.fontStyle')} description={t('affichage.fontStyleDesc')}>
              <SettingSelect<FontFamily>
                value={fontFamily}
                options={['inter', 'system', 'open-sans'] as const}
                onChange={v => dispatch(setFontFamily(v))}
                optionLabels={{
                  inter: t('affichage.fontFamilyInter'),
                  system: t('affichage.fontFamilySystem'),
                  'open-sans': t('affichage.fontFamilyOpenSans'),
                }}
              />
            </SettingRow>
            <SettingRow label={t('affichage.density')} description={t('affichage.densityDesc')}>
              <SettingSelect<Density>
                value={density}
                options={['comfortable', 'compact', 'spacious'] as const}
                onChange={v => dispatch(setDensity(v))}
                optionLabels={{
                  comfortable: t('affichage.densityComfortable'),
                  compact: t('affichage.densityCompact'),
                  spacious: t('affichage.densitySpacious'),
                }}
              />
            </SettingRow>
            <SettingRow label={t('affichage.dateFormat')} description={t('affichage.dateFormatDesc')}>
              <SettingSelect<DateFormatPreference>
                value={dateFormat}
                options={['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] as const}
                onChange={v => dispatch(setDateFormat(v))}
                optionLabels={{
                  'DD/MM/YYYY': t('affichage.dateFormatDDMMYYYY'),
                  'MM/DD/YYYY': t('affichage.dateFormatMMDDYYYY'),
                  'YYYY-MM-DD': t('affichage.dateFormatYYYYMMDD'),
                }}
              />
            </SettingRow>
            <SettingRow label={t('affichage.timeFormat')} description={t('affichage.timeFormatDesc')}>
              <SettingSelect<TimeFormatPreference>
                value={timeFormat}
                options={['24h', '12h'] as const}
                onChange={v => dispatch(setTimeFormat(v))}
                optionLabels={{
                  '24h': t('affichage.timeFormat24'),
                  '12h': t('affichage.timeFormat12'),
                }}
              />
            </SettingRow>
            <SettingRow label={t('affichage.numberFormat')} description={t('affichage.numberFormatDesc')}>
              <SettingSelect<NumberFormatPreference>
                value={numberFormat}
                options={['FR', 'EN'] as const}
                onChange={v => dispatch(setNumberFormat(v))}
                optionLabels={{
                  FR: t('affichage.numberFormatFR'),
                  EN: t('affichage.numberFormatEN'),
                }}
              />
            </SettingRow>
            <SettingRow label={t('affichage.timezone')} description={t('affichage.timezoneDesc')}>
              <SettingSelect<string>
                value={timezone}
                options={TIMEZONE_OPTIONS.map(o => o.value)}
                onChange={v => dispatch(setTimezone(v))}
                optionLabels={Object.fromEntries(TIMEZONE_OPTIONS.map(o => [o.value, t(`affichage.${o.labelKey}`)]))}
              />
            </SettingRow>
            <SettingRow label={t('affichage.cardSize')} description={t('affichage.cardSizeDesc')}>
              <SettingSelect<CardSize>
                value={cardSize}
                options={['small', 'medium', 'large'] as const}
                onChange={v => dispatch(setCardSize(v))}
                optionLabels={{
                  small: t('affichage.cardSizeSmall'),
                  medium: t('affichage.cardSizeMedium'),
                  large: t('affichage.cardSizeLarge'),
                }}
              />
            </SettingRow>
            <SettingRow label={t('affichage.showImagesByDefault')} description={t('affichage.showImagesByDefaultDesc')}>
              <SettingSwitch checked onChange={() => {}} disabled />
            </SettingRow>
            <SettingRow label={t('affichage.sidebarDefault')} description={t('affichage.sidebarDefaultDesc')}>
              <SettingSelect<'expanded' | 'collapsed'>
                value={sidebarCollapsed ? 'collapsed' : 'expanded'}
                options={['expanded', 'collapsed']}
                onChange={v => dispatch(setSidebarCollapsed(v === 'collapsed'))}
                optionLabels={{
                  expanded: t('affichage.sidebarExpanded'),
                  collapsed: t('affichage.sidebarCollapsed'),
                }}
              />
            </SettingRow>
            <SettingRow label={t('affichage.animations')} description={t('affichage.animationsDesc')}>
              <SettingSelect<AnimationPreference>
                value={animationPreference}
                options={['full', 'reduced', 'none']}
                onChange={v => dispatch(setAnimationPreference(v))}
                optionLabels={{
                  full: t('affichage.animationsFull'),
                  reduced: t('affichage.animationsReduced'),
                  none: t('affichage.animationsNone'),
                }}
              />
            </SettingRow>
            {[
              { k: 'imagePreviewQuality', dk: 'imagePreviewQualityDesc' },
            ].map(({ k, dk }) => (
              <SettingRow key={k} label={t(`affichage.${k}`)} description={t(`affichage.${dk}`)}>
                <SoonBadge />
              </SettingRow>
            ))}
          </SectionCard>

          {/* ═══ NOTIFICATIONS ═══ */}
          <SectionCard id="notifications" title={t('section.notifications')} subtitle={t('section.notificationsDesc')}>
            <SettingRow label={t('notifications.emailEnabled')} description={t('notifications.emailEnabledDesc')}>
              <SettingSwitch
                checked={emailNotificationsEnabled}
                onChange={handleEmailNotificationsChange}
                disabled={!user || notificationPrefsSaving}
              />
            </SettingRow>
            <SettingRow label={t('notifications.inAppEnabled')} description={t('notifications.inAppEnabledDesc')}>
              <SettingSwitch
                checked={inAppNotificationsEnabled}
                onChange={handleInAppNotificationsChange}
                disabled={!user || notificationPrefsSaving}
              />
            </SettingRow>
            <SettingRow label={t('notifications.soundEnabled')} description={t('notifications.soundEnabledDesc')}>
              <SettingSwitch
                checked={notificationSoundEnabled}
                onChange={handleNotificationSoundChange}
                disabled={!user || notificationPrefsSaving}
              />
            </SettingRow>
            {[
              'reminderFrequency', 'reminderTasks', 'reminderMeetings',
              'eventsProjects', 'eventsMeetings', 'eventsMessages', 'eventsDocuments',
            ].map(k => (
              <SettingRow key={k} label={t(`notifications.${k}`)} description={t(`notifications.${k}Desc`)}>
                <SoonBadge />
              </SettingRow>
            ))}
            <SettingRow label={t('notifications.dailyDigest')} description={t('notifications.dailyDigestDesc')}>
              <SettingSwitch
                checked={dailyDigestEnabled}
                onChange={handleDailyDigestChange}
                disabled={!user || notificationPrefsSaving}
              />
            </SettingRow>
            <SettingRow label={t('notifications.weeklyDigest')} description={t('notifications.weeklyDigestDesc')}>
              <SettingSwitch
                checked={weeklyDigestEnabled}
                onChange={handleWeeklyDigestChange}
                disabled={!user || notificationPrefsSaving}
              />
            </SettingRow>
            <SettingRow label={t('notifications.digestTime')} description={t('notifications.digestTimeDesc')}>
              <input
                type="time"
                value={digestTime}
                onChange={(e) => handleDigestTimeChange(e.target.value)}
                disabled={!user || notificationPrefsSaving}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </SettingRow>
            {['doNotDisturb', 'notificationTypes'].map(k => (
              <SettingRow key={k} label={t(`notifications.${k}`)} description={t(`notifications.${k}Desc`)}>
                <SoonBadge />
              </SettingRow>
            ))}
            <SettingRow label={t('notifications.alertNewLogin')} description={t('notifications.alertNewLoginDesc')}>
              <SettingSwitch
                checked={alertNewLoginEnabled}
                onChange={handleAlertNewLoginChange}
                disabled={!user || notificationPrefsSaving}
              />
            </SettingRow>
          </SectionCard>

          {/* ═══ SECURITE ═══ */}
          <SectionCard id="securite" title={t('section.securite')} subtitle={t('section.securiteDesc')}>
            <SettingRow label={t('securite.twoFactor')} description={t('securite.twoFactorDesc')}>
              <ProfileLink label={t('securite.goToProfile')} />
            </SettingRow>
            <SettingRow label={t('securite.sessionDuration')} description={t('securite.sessionDurationDesc')}>
              <SettingSelect<'' | 'SHORT' | 'LONG'>
                value={(user?.defaultSessionDuration === 'SHORT' || user?.defaultSessionDuration === 'LONG') ? user.defaultSessionDuration : ''}
                options={['', 'SHORT', 'LONG'] as const}
                onChange={async (v) => {
                  if (!user || sessionPrefsSaving) return
                  setSessionPrefsSaving(true)
                  try {
                    const updated = await userApi.updateSessionPreferences({
                      defaultSessionDuration: v === '' ? null : v,
                    })
                    dispatch(setUser(updated))
                  } finally {
                    setSessionPrefsSaving(false)
                  }
                }}
                disabled={!user || sessionPrefsSaving}
                optionLabels={{
                  '': t('securite.sessionDurationLogin'),
                  SHORT: t('securite.sessionDurationShort'),
                  LONG: t('securite.sessionDurationLong'),
                }}
              />
            </SettingRow>
            <SettingRow label={t('securite.logoutOnClose')} description={t('securite.logoutOnCloseDesc')}>
              <SettingSwitch
                checked={user?.logoutOnBrowserClose ?? false}
                onChange={async (checked) => {
                  if (!user || sessionPrefsSaving) return
                  setSessionPrefsSaving(true)
                  try {
                    const updated = await userApi.updateSessionPreferences({ logoutOnBrowserClose: checked })
                    setTokenStorageMode(checked)
                    dispatch(setUser(updated))
                  } finally {
                    setSessionPrefsSaving(false)
                  }
                }}
                disabled={!user || sessionPrefsSaving}
              />
            </SettingRow>
            <div className="border-b border-gray-100 dark:border-gray-700/60 last:border-b-0 group hover:bg-gray-50/60 dark:hover:bg-gray-700/20 -mx-5 px-5 transition-colors duration-100 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{t('securite.passwordPolicy')}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-relaxed">{t('securite.passwordPolicyDesc')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPasswordPolicyOpen((o) => !o)}
                  aria-expanded={passwordPolicyOpen}
                  className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  {passwordPolicyOpen ? t('securite.passwordPolicyHide') : t('securite.passwordPolicyShow')}
                  <svg className={`w-4 h-4 transition-transform duration-200 ${passwordPolicyOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              {passwordPolicyOpen && (
                <div className="pb-4 pt-0">
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1.5 list-none pl-0" role="list" aria-label={t('securite.passwordPolicy')}>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" aria-hidden />
                      {t('common:passwordRequirements.minLength')}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" aria-hidden />
                      {t('common:passwordRequirements.uppercase')}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" aria-hidden />
                      {t('common:passwordRequirements.lowercase')}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" aria-hidden />
                      {t('common:passwordRequirements.digit')}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" aria-hidden />
                      {t('common:passwordRequirements.special')}
                    </li>
                  </ul>
                </div>
              )}
            </div>
            <div className="border-b border-gray-100 dark:border-gray-700/60 last:border-b-0 group hover:bg-gray-50/60 dark:hover:bg-gray-700/20 -mx-5 px-5 transition-colors duration-100 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{t('securite.loginHistory')}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-relaxed">{t('securite.loginHistoryDesc')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setLoginHistoryOpen((o) => !o)}
                  aria-expanded={loginHistoryOpen}
                  className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  {loginHistoryOpen ? t('securite.loginHistoryHide') : t('securite.loginHistoryShow')}
                  <svg className={`w-4 h-4 transition-transform duration-200 ${loginHistoryOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              {loginHistoryOpen && (
                <div className="pb-4 pt-0">
                  {loginHistoryLoading ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('common:app.loading')}</p>
                  ) : loginHistoryList && loginHistoryList.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600">
                      <table className="min-w-full text-sm text-left text-gray-700 dark:text-gray-300">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400">
                          <tr>
                            <th scope="col" className="px-3 py-2 font-medium">{t('securite.loginHistoryDate')}</th>
                            <th scope="col" className="px-3 py-2 font-medium">{t('securite.loginHistoryIp')}</th>
                            <th scope="col" className="px-3 py-2 font-medium">{t('securite.loginHistoryDevice')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                          {loginHistoryList.map((entry, idx) => (
                            <tr key={idx} className="bg-white dark:bg-gray-800/50">
                              <td className="px-3 py-2 whitespace-nowrap">
                                {formatDisplayDate(entry.createdAt, {
                                  locale: i18n.language || 'fr',
                                  dateFormat,
                                  timeFormat,
                                  includeTime: true,
                                })}
                              </td>
                              <td className="px-3 py-2 font-mono text-xs">{entry.ipAddress ?? '—'}</td>
                              <td className="px-3 py-2">{entry.deviceSummary ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('securite.loginHistoryEmpty')}</p>
                  )}
                </div>
              )}
            </div>
            <div className="border-b border-gray-100 dark:border-gray-700/60 last:border-b-0 group hover:bg-gray-50/60 dark:hover:bg-gray-700/20 -mx-5 px-5 transition-colors duration-100 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{t('securite.lockoutAttempts')}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-relaxed">{t('securite.lockoutAttemptsDesc')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setLockoutPolicyOpen((o) => !o)}
                  aria-expanded={lockoutPolicyOpen}
                  className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  {lockoutPolicyOpen ? t('securite.lockoutPolicyHide') : t('securite.lockoutPolicyShow')}
                  <svg className={`w-4 h-4 transition-transform duration-200 ${lockoutPolicyOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              {lockoutPolicyOpen && (
                <div className="pb-4 pt-0">
                  {lockoutPolicyLoading ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('common:app.loading')}</p>
                  ) : lockoutPolicy ? (
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {t('securite.lockoutPolicyText', {
                        count: lockoutPolicy.lockoutMaxAttempts,
                        minutes: lockoutPolicy.lockoutDurationMinutes,
                      })}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('securite.lockoutPolicyUnavailable')}</p>
                  )}
                </div>
              )}
            </div>
            <SettingRow label={t('securite.activeSessions')} description={t('securite.activeSessionsDesc')}>
              <ProfileLink label={t('securite.goToProfile')} />
            </SettingRow>
            <SettingRow label={t('securite.alertNewLogin')} description={t('securite.alertNewLoginDesc')}>
              <SettingSwitch
                checked={alertNewLoginEnabled}
                onChange={handleAlertNewLoginChange}
                disabled={!user || notificationPrefsSaving}
              />
            </SettingRow>
          </SectionCard>

          {/* ═══ COMPTE ═══ */}
          <SectionCard id="compte" title={t('section.compte')} subtitle={t('section.compteDesc')}>
            {['displayName', 'contactEmail', 'signature', 'contactPreference', 'profileVisibility'].map(k => (
              <SettingRow key={k} label={t(`compte.${k}`)} description={t(`compte.${k}Desc`)}>
                <SoonBadge />
              </SettingRow>
            ))}
            <SettingRow label={t('compte.profilePhoto')} description={t('compte.profilePhotoDesc')}>
              <ProfileLink label={t('securite.goToProfile')} />
            </SettingRow>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 -mx-5 px-5 hover:bg-gray-50/60 dark:hover:bg-gray-700/20 rounded-xl transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{t('compte.profileLink')}</p>
              </div>
              <ProfileLink label={t('securite.goToProfile')} />
            </div>
          </SectionCard>

          {/* ═══ GENERAL ═══ */}
          <SectionCard id="general" title={t('section.general')} subtitle={t('section.generalDesc')}>
            <SettingRow label={t('general.homePage')} description={t('general.homePageDesc')}>
              <SettingSelect<string>
                value={defaultHomePath}
                options={['/', '/projets', '/planning', '/messagerie', '/notifications']}
                onChange={(v) => dispatch(setDefaultHomePath(v))}
                optionLabels={{
                  '/': t('general.homePageDashboard'),
                  '/projets': t('general.homePageProjects'),
                  '/planning': t('general.homePagePlanning'),
                  '/messagerie': t('general.homePageMessages'),
                  '/notifications': t('general.homePageNotifications'),
                }}
              />
            </SettingRow>
            <SettingRow label={t('general.itemsPerPage')} description={t('general.itemsPerPageDesc')}>
              <SettingSelect<string>
                value={String(itemsPerPage)}
                options={['10', '20', '25', '50', '100']}
                onChange={(v) => dispatch(setItemsPerPage(Number(v)))}
                optionLabels={{
                  '10': t('general.itemsPerPage10'),
                  '20': t('general.itemsPerPage20'),
                  '25': t('general.itemsPerPage25'),
                  '50': t('general.itemsPerPage50'),
                  '100': t('general.itemsPerPage100'),
                }}
              />
            </SettingRow>
            <SettingRow label={t('general.autoRefreshLists')} description={t('general.autoRefreshListsDesc')}>
              <SettingSwitch
                checked={autoRefreshListsEnabled}
                onChange={(checked) => dispatch(setAutoRefreshListsEnabled(checked))}
              />
            </SettingRow>
            {['defaultSort', 'savedFilters', 'keyboardShortcuts'].map(k => (
              <SettingRow key={k} label={t(`general.${k}`)} description={t(`general.${k}Desc`)}>
                <SoonBadge />
              </SettingRow>
            ))}
            <SettingRow label={t('general.confirmDelete')} description={t('general.confirmDeleteDesc')}>
              <SettingSwitch checked onChange={() => {}} disabled />
            </SettingRow>
            <SettingRow label={t('general.showTutorials')} description={t('general.showTutorialsDesc')}>
              <SettingSwitch checked onChange={() => {}} disabled />
            </SettingRow>
            <SettingRow label={t('general.offlineMode')} description={t('general.offlineModeDesc')}>
              <SettingSwitch
                checked={offlineModeEnabled}
                onChange={(checked) => dispatch(setOfflineModeEnabled(checked))}
              />
            </SettingRow>
          </SectionCard>

          {/* ═══ ACCESSIBILITE ═══ */}
          <SectionCard id="accessibilite" title={t('section.accessibilite')} subtitle={t('section.accessibiliteDesc')}>
            <SettingRow label={t('accessibilite.highContrastText')} description={t('accessibilite.highContrastTextDesc')}>
              <SettingSwitch
                checked={highContrastText}
                onChange={(checked) => dispatch(setHighContrastText(checked))}
              />
            </SettingRow>
            <SettingRow label={t('accessibilite.highContrastCards')} description={t('accessibilite.highContrastCardsDesc')}>
              <SettingSwitch
                checked={highContrastCards}
                onChange={(checked) => dispatch(setHighContrastCards(checked))}
              />
            </SettingRow>
            <SettingRow label={t('accessibilite.reduceMotion')} description={t('accessibilite.reduceMotionDesc')}>
              <SettingSwitch checked={false} onChange={() => {}} disabled />
            </SettingRow>
            <SettingRow label={t('accessibilite.focusVisible')} description={t('accessibilite.focusVisibleDesc')}>
              <SettingSwitch checked onChange={() => {}} disabled />
            </SettingRow>
            <SettingRow label={t('accessibilite.screenReaderOptimized')} description={t('accessibilite.screenReaderOptimizedDesc')}>
              <SettingSwitch checked={false} onChange={() => {}} disabled />
            </SettingRow>
            {['clickTargetSize', 'textSpacing', 'cursorSize'].map(k => (
              <SettingRow key={k} label={t(`accessibilite.${k}`)} description={t(`accessibilite.${k}Desc`)}>
                <SoonBadge />
              </SettingRow>
            ))}
          </SectionCard>

          {/* ═══ DONNEES ═══ */}
          <SectionCard id="donnees" title={t('section.donnees')} subtitle={t('section.donneesDesc')}>
            {['exportData', 'exportFormat', 'dataRetention', 'cookiesAndStorage', 'privacyPolicy'].map(k => (
              <SettingRow key={k} label={t(`donnees.${k}`)} description={t(`donnees.${k}Desc`)}>
                <SoonBadge />
              </SettingRow>
            ))}
            <SettingRow label={t('donnees.analyticsAnonymous')} description={t('donnees.analyticsAnonymousDesc')}>
              <SettingSwitch checked={false} onChange={() => {}} disabled />
            </SettingRow>
            <SettingRow label={t('donnees.deleteAccount')} description={t('donnees.deleteAccountDesc')} variant="danger">
              <SoonBadge />
            </SettingRow>
          </SectionCard>

          {/* ═══ RESEAU ═══ */}
          <SectionCard id="reseau" title={t('section.reseau')} subtitle={t('section.reseauDesc')}>
            <SettingRow label={t('reseau.cacheEnabled')} description={t('reseau.cacheEnabledDesc')}>
              <SettingSwitch
                checked={cacheEnabled}
                onChange={(checked) => dispatch(setCacheEnabled(checked))}
              />
            </SettingRow>
            {cacheEnabled && (
              <SettingRow label={t('reseau.cacheDuration')} description={t('reseau.cacheDurationDesc')}>
                <SettingSelect<CacheDuration>
                  value={cacheDuration}
                  options={['short', 'medium', 'long']}
                  onChange={(v) => dispatch(setCacheDuration(v))}
                  optionLabels={{
                    short: t('reseau.cacheShort'),
                    medium: t('reseau.cacheMedium'),
                    long: t('reseau.cacheLong'),
                  }}
                />
              </SettingRow>
            )}
            <SettingRow label={t('reseau.preloadData')} description={t('reseau.preloadDataDesc')}>
              <SettingSwitch
                checked={preloadDataEnabled}
                onChange={(checked) => dispatch(setPreloadDataEnabled(checked))}
              />
            </SettingRow>
            <SettingRow label={t('reseau.offlineQueue')} description={t('reseau.offlineQueueDesc')}>
              <SettingSwitch
                checked={offlineQueueEnabled}
                onChange={(checked) => dispatch(setOfflineQueueEnabled(checked))}
              />
            </SettingRow>
            <SettingRow label={t('reseau.connectionQuality')} description={t('reseau.connectionQualityDesc')}>
              <SettingSelect<ConnectionQuality>
                value={connectionQuality}
                options={['auto', 'normal', 'slow']}
                onChange={(v) => dispatch(setConnectionQuality(v))}
                optionLabels={{
                  auto: t('reseau.connectionQualityAuto'),
                  normal: t('reseau.connectionQualityNormal'),
                  slow: t('reseau.connectionQualitySlow'),
                }}
              />
            </SettingRow>
          </SectionCard>

          {/* ═══ RACCOURCIS ═══ */}
          <SectionCard id="raccourcis" title={t('section.raccourcis')} subtitle={t('section.raccourcisDesc')}>
            <SettingRow label={t('raccourcis.keyboardNav')} description={t('raccourcis.keyboardNavDesc')}>
              <SettingSwitch checked onChange={() => {}} disabled />
            </SettingRow>
            {['shortcutsList', 'customShortcuts', 'helpCenter', 'contactSupport', 'faq'].map(k => (
              <SettingRow key={k} label={t(`raccourcis.${k}`)} description={t(`raccourcis.${k}Desc`)}>
                <SoonBadge />
              </SettingRow>
            ))}
          </SectionCard>

        </div>
      </div>
    </PageContainer>
  )
}