/**
 * Préférence de densité de l'interface (espacement listes/formulaires).
 * Même pattern que themeStorage / fontPreferences : clé localStorage, application au document.
 */

export const MIKA_DENSITY_KEY = 'mika-density'

export type Density = 'comfortable' | 'compact' | 'spacious'

const VALID_DENSITIES: Density[] = ['comfortable', 'compact', 'spacious']

const DENSITY_SCALE: Record<Density, number> = {
  comfortable: 1,
  compact: 0.85,
  spacious: 1.15,
}

export function getStoredDensity(): Density {
  if (typeof window === 'undefined') return 'comfortable'
  const stored = localStorage.getItem(MIKA_DENSITY_KEY)
  if (stored && VALID_DENSITIES.includes(stored as Density)) return stored as Density
  return 'comfortable'
}

export function applyDensityToDocument(density: Density): void {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  html.setAttribute('data-density', density)
  html.style.setProperty('--mika-density-scale', String(DENSITY_SCALE[density]))
}
