import { useLayoutEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { getStoredTheme, applyThemeToDocument } from '@/utils/themeStorage'

/**
 * Réapplique le thème au document à chaque changement de route (sync avec le DOM
 * avant que la nouvelle page ne se peinte). Le script dans index.html + variables
 * CSS garantissent la bonne couleur dès la première frame.
 */
export function ThemeGate({ children }: { children: ReactNode }) {
  const location = useLocation()

  useLayoutEffect(() => {
    applyThemeToDocument(getStoredTheme())
  }, [location.pathname])

  return <>{children}</>
}
