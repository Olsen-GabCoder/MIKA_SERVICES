/**
 * Préférences typographiques (taille et famille de police).
 * Même pattern que themeStorage : clé localStorage, application au document, pas de flash au chargement (script dans index.html).
 */

export const MIKA_FONT_SIZE_KEY = 'mika-font-size'
export const MIKA_FONT_FAMILY_KEY = 'mika-font-family'

export type FontSize = 'small' | 'default' | 'medium' | 'large'
export type FontFamily = 'inter' | 'system' | 'open-sans'

const FONT_SIZE_PERCENT: Record<FontSize, string> = {
  small: '87.5%',
  default: '112.5%',
  medium: '118.75%',
  large: '125%',
}

const VALID_FONT_SIZES: FontSize[] = ['small', 'default', 'medium', 'large']
const VALID_FONT_FAMILIES: FontFamily[] = ['inter', 'system', 'open-sans']

export function getStoredFontSize(): FontSize {
  if (typeof window === 'undefined') return 'default'
  const stored = localStorage.getItem(MIKA_FONT_SIZE_KEY)
  if (stored && VALID_FONT_SIZES.includes(stored as FontSize)) return stored as FontSize
  return 'default'
}

export function getStoredFontFamily(): FontFamily {
  if (typeof window === 'undefined') return 'system'
  const stored = localStorage.getItem(MIKA_FONT_FAMILY_KEY)
  if (stored && VALID_FONT_FAMILIES.includes(stored as FontFamily)) return stored as FontFamily
  return 'system'
}

export function applyFontSizeToDocument(size: FontSize): void {
  if (typeof document === 'undefined') return
  const value = FONT_SIZE_PERCENT[size]
  document.documentElement.style.setProperty('--mika-font-size', value)
}

export function applyFontFamilyToDocument(family: FontFamily): void {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-font', family)
}
