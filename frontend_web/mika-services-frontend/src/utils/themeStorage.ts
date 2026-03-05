const THEME_KEY = 'mika-theme'
const HTML_DARK_CLASS = 'dark'

export type Theme = 'light' | 'dark'

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  return 'dark'
}

export function setStoredTheme(theme: Theme): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(THEME_KEY, theme)
  applyThemeToDocument(theme)
}

export function applyThemeToDocument(theme: Theme): void {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  html.setAttribute('data-theme', theme)
  if (theme === 'dark') {
    html.classList.add(HTML_DARK_CLASS)
  } else {
    html.classList.remove(HTML_DARK_CLASS)
  }
  const isDark = theme === 'dark'
  html.style.setProperty('--mika-bg-content', isDark ? 'rgb(17 24 39)' : 'rgba(237 242 244 / 0.8)')
  html.style.setProperty('--mika-bg-card', isDark ? 'rgb(31 41 55)' : 'rgb(255 255 255)')
  html.style.setProperty('--mika-border-card', isDark ? 'rgb(75 85 99)' : 'rgb(229 231 235)')
  html.style.setProperty('--mika-text-primary', isDark ? 'rgb(243 244 246)' : 'rgb(17 24 39)')
}
