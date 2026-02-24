import { createSlice } from '@reduxjs/toolkit'
import type { Locale } from '../../i18n'
import { getInitialLocale, applyLocaleToDocument, LOCALE_KEY, i18n } from '../../i18n'

const THEME_KEY = 'mika-theme'
const SIDEBAR_KEY = 'mika-sidebar-collapsed'

function getStoredTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  return 'light'
}

function getStoredSidebarCollapsed(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(SIDEBAR_KEY) === 'true'
}

export type Theme = 'light' | 'dark'

interface UiState {
  sidebarCollapsed: boolean
  theme: Theme
  locale: Locale
}

const initialState: UiState = {
  sidebarCollapsed: getStoredSidebarCollapsed(),
  theme: getStoredTheme(),
  locale: getInitialLocale(),
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
  },
})

export const { setSidebarCollapsed, setTheme, toggleSidebar, toggleTheme, setLocale } = uiSlice.actions
export default uiSlice.reducer
