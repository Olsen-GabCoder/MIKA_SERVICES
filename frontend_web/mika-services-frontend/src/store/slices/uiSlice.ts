import { createSlice } from '@reduxjs/toolkit'
import type { Locale } from '../../i18n'
import { getInitialLocale, applyLocaleToDocument, LOCALE_KEY, i18n } from '../../i18n'
import {
  getStoredFontSize,
  getStoredFontFamily,
  applyFontSizeToDocument,
  applyFontFamilyToDocument,
  MIKA_FONT_SIZE_KEY,
  MIKA_FONT_FAMILY_KEY,
} from '../../utils/fontPreferences'
import type { FontSize, FontFamily } from '../../utils/fontPreferences'
import {
  getStoredDensity,
  applyDensityToDocument,
  MIKA_DENSITY_KEY,
} from '../../utils/densityPreferences'
import type { Density } from '../../utils/densityPreferences'
import { getStoredDateFormat, MIKA_DATE_FORMAT_KEY } from '../../utils/dateFormatPreferences'
import type { DateFormatPreference } from '../../utils/dateFormatPreferences'
import { getStoredTimeFormat, MIKA_TIME_FORMAT_KEY } from '../../utils/timeFormatPreferences'
import type { TimeFormatPreference } from '../../utils/timeFormatPreferences'
import { getStoredNumberFormat, MIKA_NUMBER_FORMAT_KEY } from '../../utils/numberFormatPreferences'
import type { NumberFormatPreference } from '../../utils/numberFormatPreferences'
import { getStoredTimezone, MIKA_TIMEZONE_KEY } from '../../utils/timezonePreferences'
import { getStoredCardSize, MIKA_CARD_SIZE_KEY, applyCardSizeToDocument } from '../../utils/cardSizePreferences'
import type { CardSize } from '../../utils/cardSizePreferences'
import { getStoredAnimationPreference, MIKA_ANIMATIONS_KEY, applyAnimationsToDocument } from '../../utils/animationPreferences'
import type { AnimationPreference } from '../../utils/animationPreferences'
import { getStoredHighContrastText, getStoredHighContrastCards, applyHighContrastToDocument } from '../../utils/highContrastPreferences'

const THEME_KEY = 'mika-theme'
const SIDEBAR_KEY = 'mika-sidebar-collapsed'
const MIKA_HOME_PAGE_KEY = 'mika-home-page'
const MIKA_ITEMS_PER_PAGE_KEY = 'mika-items-per-page'
const MIKA_AUTO_REFRESH_LISTS_KEY = 'mika-auto-refresh-lists'
const MIKA_OFFLINE_MODE_KEY = 'mika-offline-mode'
const MIKA_CACHE_ENABLED_KEY = 'mika-cache-enabled'
const MIKA_CACHE_DURATION_KEY = 'mika-cache-duration'
const MIKA_PRELOAD_DATA_KEY = 'mika-preload-data'
const MIKA_OFFLINE_QUEUE_KEY = 'mika-offline-queue'
const MIKA_CONNECTION_QUALITY_KEY = 'mika-connection-quality'
const MIKA_HIGH_CONTRAST_TEXT_KEY = 'mika-high-contrast-text'
const MIKA_HIGH_CONTRAST_CARDS_KEY = 'mika-high-contrast-cards'

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 25, 50, 100] as const

function getStoredOfflineMode(): boolean {
  if (typeof window === 'undefined') return true
  const stored = localStorage.getItem(MIKA_OFFLINE_MODE_KEY)
  if (stored === null) return true
  return stored === 'true'
}

export type CacheDuration = 'short' | 'medium' | 'long'

function getStoredCacheEnabled(): boolean {
  if (typeof window === 'undefined') return true
  const stored = localStorage.getItem(MIKA_CACHE_ENABLED_KEY)
  if (stored === null) return true
  return stored === 'true'
}

function getStoredCacheDuration(): CacheDuration {
  if (typeof window === 'undefined') return 'medium'
  const stored = localStorage.getItem(MIKA_CACHE_DURATION_KEY)
  if (stored === 'short' || stored === 'medium' || stored === 'long') return stored
  return 'medium'
}

function getStoredPreloadData(): boolean {
  if (typeof window === 'undefined') return true
  const stored = localStorage.getItem(MIKA_PRELOAD_DATA_KEY)
  if (stored === null) return true
  return stored === 'true'
}

function getStoredOfflineQueueEnabled(): boolean {
  if (typeof window === 'undefined') return true
  const stored = localStorage.getItem(MIKA_OFFLINE_QUEUE_KEY)
  if (stored === null) return true
  return stored === 'true'
}

export type ConnectionQuality = 'auto' | 'normal' | 'slow'

function getStoredConnectionQuality(): ConnectionQuality {
  if (typeof window === 'undefined') return 'auto'
  const stored = localStorage.getItem(MIKA_CONNECTION_QUALITY_KEY)
  if (stored === 'auto' || stored === 'normal' || stored === 'slow') return stored
  return 'auto'
}

function getStoredAutoRefreshLists(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(MIKA_AUTO_REFRESH_LISTS_KEY) === 'true'
}

function getStoredItemsPerPage(): number {
  if (typeof window === 'undefined') return 20
  const stored = localStorage.getItem(MIKA_ITEMS_PER_PAGE_KEY)
  const n = stored ? parseInt(stored, 10) : NaN
  return (ITEMS_PER_PAGE_OPTIONS as readonly number[]).includes(n) ? n : 20
}

function getStoredDefaultHomePath(): string {
  if (typeof window === 'undefined') return '/'
  const stored = localStorage.getItem(MIKA_HOME_PAGE_KEY)
  if (stored && ['/', '/projets', '/planning', '/messagerie', '/notifications'].includes(stored)) return stored
  return '/'
}

function getStoredTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark'
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  return 'dark'
}

function getStoredSidebarCollapsed(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(SIDEBAR_KEY) === 'true'
}

export type Theme = 'light' | 'dark'

export type DefaultHomePath = '/' | '/projets' | '/planning' | '/messagerie' | '/notifications'

interface UiState {
  sidebarCollapsed: boolean
  mobileMenuOpen: boolean
  theme: Theme
  /** Page d'accueil après connexion (quand on arrive depuis /login sans deep link). */
  defaultHomePath: string
  /** Nombre d'éléments par page dans les listes paginées (10, 25, 50, 100). */
  itemsPerPage: number
  /** Actualisation périodique des listes (projets, utilisateurs). */
  autoRefreshListsEnabled: boolean
  /** Mode hors ligne : cache local pour consulter les listes sans connexion. */
  offlineModeEnabled: boolean
  /** Contraste élevé pour les textes (accessibilité). */
  highContrastText: boolean
  /** Contraste élevé pour les cartes et bordures (accessibilité). */
  highContrastCards: boolean
  /** Cache des listes (projets, users) pour chargements plus rapides en ligne. */
  cacheEnabled: boolean
  /** Durée de validité du cache : short 5 min, medium 30 min, long 1 h. */
  cacheDuration: CacheDuration
  /** Précharger en arrière-plan les listes (projets, utilisateurs) au chargement de l'app. */
  preloadDataEnabled: boolean
  /** File d'attente hors ligne : rejouer les mutations (projets, users) à la reconnexion. */
  offlineQueueEnabled: boolean
  /** Qualité de connexion : auto (détection), normal, ou slow (intervalle refresh adapté). */
  connectionQuality: ConnectionQuality
  locale: Locale
  fontSize: FontSize
  fontFamily: FontFamily
  density: Density
  dateFormat: DateFormatPreference
  timeFormat: TimeFormatPreference
  numberFormat: NumberFormatPreference
  timezone: string
  cardSize: CardSize
  animationPreference: AnimationPreference
}

const initialState: UiState = {
  sidebarCollapsed: getStoredSidebarCollapsed(),
  mobileMenuOpen: false,
  theme: getStoredTheme(),
  defaultHomePath: getStoredDefaultHomePath(),
  itemsPerPage: getStoredItemsPerPage(),
  autoRefreshListsEnabled: getStoredAutoRefreshLists(),
  offlineModeEnabled: getStoredOfflineMode(),
  highContrastText: getStoredHighContrastText(),
  highContrastCards: getStoredHighContrastCards(),
  cacheEnabled: getStoredCacheEnabled(),
  cacheDuration: getStoredCacheDuration(),
  preloadDataEnabled: getStoredPreloadData(),
  offlineQueueEnabled: getStoredOfflineQueueEnabled(),
  connectionQuality: getStoredConnectionQuality(),
  locale: getInitialLocale(),
  fontSize: getStoredFontSize(),
  fontFamily: getStoredFontFamily(),
  density: getStoredDensity(),
  dateFormat: getStoredDateFormat(),
  timeFormat: getStoredTimeFormat(),
  numberFormat: getStoredNumberFormat(),
  timezone: getStoredTimezone(),
  cardSize: getStoredCardSize(),
  animationPreference: getStoredAnimationPreference(),
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSidebarCollapsed(state, action: { payload: boolean }) {
      state.sidebarCollapsed = action.payload
      if (typeof window !== 'undefined') {
        localStorage.setItem(SIDEBAR_KEY, String(action.payload))
      }
    },
    setTheme(state, action: { payload: Theme }) {
      state.theme = action.payload
      if (typeof window !== 'undefined') {
        localStorage.setItem(THEME_KEY, action.payload)
      }
    },
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed
      if (typeof window !== 'undefined') {
        localStorage.setItem(SIDEBAR_KEY, String(state.sidebarCollapsed))
      }
    },
    toggleMobileMenu(state) {
      state.mobileMenuOpen = !state.mobileMenuOpen
    },
    closeMobileMenu(state) {
      state.mobileMenuOpen = false
    },
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
      if (typeof window !== 'undefined') {
        localStorage.setItem(THEME_KEY, state.theme)
      }
    },
    setLocale(state, action: { payload: Locale }) {
      state.locale = action.payload
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCALE_KEY, action.payload)
        applyLocaleToDocument(action.payload)
        void i18n.changeLanguage(action.payload)
      }
    },
    setFontSize(state, action: { payload: FontSize }) {
      state.fontSize = action.payload
      if (typeof window !== 'undefined') {
        localStorage.setItem(MIKA_FONT_SIZE_KEY, action.payload)
        applyFontSizeToDocument(action.payload)
      }
    },
    setFontFamily(state, action: { payload: FontFamily }) {
      state.fontFamily = action.payload
      if (typeof window !== 'undefined') {
        localStorage.setItem(MIKA_FONT_FAMILY_KEY, action.payload)
        applyFontFamilyToDocument(action.payload)
      }
    },
    setDensity(state, action: { payload: Density }) {
      state.density = action.payload
      if (typeof window !== 'undefined') {
        localStorage.setItem(MIKA_DENSITY_KEY, action.payload)
        applyDensityToDocument(action.payload)
      }
    },
    setDateFormat(state, action: { payload: DateFormatPreference }) {
      state.dateFormat = action.payload
      if (typeof window !== 'undefined') {
        localStorage.setItem(MIKA_DATE_FORMAT_KEY, action.payload)
      }
    },
    setTimeFormat(state, action: { payload: TimeFormatPreference }) {
      state.timeFormat = action.payload
      if (typeof window !== 'undefined') {
        localStorage.setItem(MIKA_TIME_FORMAT_KEY, action.payload)
      }
    },
    setNumberFormat(state, action: { payload: NumberFormatPreference }) {
      state.numberFormat = action.payload
      if (typeof window !== 'undefined') {
        localStorage.setItem(MIKA_NUMBER_FORMAT_KEY, action.payload)
      }
    },
    setTimezone(state, action: { payload: string }) {
      state.timezone = action.payload
      if (typeof window !== 'undefined') {
        localStorage.setItem(MIKA_TIMEZONE_KEY, action.payload)
      }
    },
    setCardSize(state, action: { payload: CardSize }) {
      state.cardSize = action.payload
      if (typeof window !== 'undefined') {
        localStorage.setItem(MIKA_CARD_SIZE_KEY, action.payload)
        applyCardSizeToDocument(action.payload)
      }
    },
    setAnimationPreference(state, action: { payload: AnimationPreference }) {
      state.animationPreference = action.payload
      if (typeof window !== 'undefined') {
        localStorage.setItem(MIKA_ANIMATIONS_KEY, action.payload)
        applyAnimationsToDocument(action.payload)
      }
    },
    setDefaultHomePath(state, action: { payload: string }) {
      const path = action.payload
      if (['/', '/projets', '/planning', '/messagerie', '/notifications'].includes(path)) {
        state.defaultHomePath = path
        if (typeof window !== 'undefined') {
          localStorage.setItem(MIKA_HOME_PAGE_KEY, path)
        }
      }
    },
    setItemsPerPage(state, action: { payload: number }) {
      const n = action.payload
      if ((ITEMS_PER_PAGE_OPTIONS as readonly number[]).includes(n)) {
        state.itemsPerPage = n
        if (typeof window !== 'undefined') {
          localStorage.setItem(MIKA_ITEMS_PER_PAGE_KEY, String(n))
        }
      }
    },
    setAutoRefreshListsEnabled(state, action: { payload: boolean }) {
      state.autoRefreshListsEnabled = action.payload
      if (typeof window !== 'undefined') {
        localStorage.setItem(MIKA_AUTO_REFRESH_LISTS_KEY, String(action.payload))
      }
    },
    setOfflineModeEnabled(state, action: { payload: boolean }) {
      state.offlineModeEnabled = action.payload
      if (typeof window !== 'undefined') {
        localStorage.setItem(MIKA_OFFLINE_MODE_KEY, String(action.payload))
      }
    },
    setHighContrastText(state, action: { payload: boolean }) {
      state.highContrastText = action.payload
      if (typeof window !== 'undefined') {
        localStorage.setItem(MIKA_HIGH_CONTRAST_TEXT_KEY, String(action.payload))
        applyHighContrastToDocument(state.highContrastText, state.highContrastCards)
      }
    },
    setHighContrastCards(state, action: { payload: boolean }) {
      state.highContrastCards = action.payload
      if (typeof window !== 'undefined') {
        localStorage.setItem(MIKA_HIGH_CONTRAST_CARDS_KEY, String(action.payload))
        applyHighContrastToDocument(state.highContrastText, state.highContrastCards)
      }
    },
    setCacheEnabled(state, action: { payload: boolean }) {
      state.cacheEnabled = action.payload
      if (typeof window !== 'undefined') {
        localStorage.setItem(MIKA_CACHE_ENABLED_KEY, String(action.payload))
      }
    },
    setCacheDuration(state, action: { payload: CacheDuration }) {
      state.cacheDuration = action.payload
      if (typeof window !== 'undefined') {
        localStorage.setItem(MIKA_CACHE_DURATION_KEY, action.payload)
      }
    },
    setPreloadDataEnabled(state, action: { payload: boolean }) {
      state.preloadDataEnabled = action.payload
      if (typeof window !== 'undefined') {
        localStorage.setItem(MIKA_PRELOAD_DATA_KEY, String(action.payload))
      }
    },
    setOfflineQueueEnabled(state, action: { payload: boolean }) {
      state.offlineQueueEnabled = action.payload
      if (typeof window !== 'undefined') {
        localStorage.setItem(MIKA_OFFLINE_QUEUE_KEY, String(action.payload))
      }
    },
    setConnectionQuality(state, action: { payload: ConnectionQuality }) {
      state.connectionQuality = action.payload
      if (typeof window !== 'undefined') {
        localStorage.setItem(MIKA_CONNECTION_QUALITY_KEY, action.payload)
      }
    },
  },
})

export const { setSidebarCollapsed, setTheme, toggleSidebar, toggleTheme, toggleMobileMenu, closeMobileMenu, setDefaultHomePath, setItemsPerPage, setAutoRefreshListsEnabled, setOfflineModeEnabled, setHighContrastText, setHighContrastCards, setCacheEnabled, setCacheDuration, setPreloadDataEnabled, setOfflineQueueEnabled, setConnectionQuality, setLocale, setFontSize, setFontFamily, setDensity, setDateFormat, setTimeFormat, setNumberFormat, setTimezone, setCardSize, setAnimationPreference } = uiSlice.actions
export default uiSlice.reducer
