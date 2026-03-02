const MIKA_HIGH_CONTRAST_TEXT_KEY = 'mika-high-contrast-text'
const MIKA_HIGH_CONTRAST_CARDS_KEY = 'mika-high-contrast-cards'

const MIKA_HIGH_CONTRAST_LEGACY_KEY = 'mika-high-contrast'

export function getStoredHighContrastText(): boolean {
  if (typeof window === 'undefined') return false
  const v = localStorage.getItem(MIKA_HIGH_CONTRAST_TEXT_KEY)
  if (v === 'true') return true
  if (v === 'false') return false
  return localStorage.getItem(MIKA_HIGH_CONTRAST_LEGACY_KEY) === 'true'
}

export function getStoredHighContrastCards(): boolean {
  if (typeof window === 'undefined') return false
  const v = localStorage.getItem(MIKA_HIGH_CONTRAST_CARDS_KEY)
  if (v === 'true') return true
  if (v === 'false') return false
  return localStorage.getItem(MIKA_HIGH_CONTRAST_LEGACY_KEY) === 'true'
}

/** Applique les préférences contraste sur le document (data-high-contrast-text, data-high-contrast-cards). */
export function applyHighContrastToDocument(text: boolean, cards: boolean): void {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  if (text) {
    html.setAttribute('data-high-contrast-text', 'true')
  } else {
    html.removeAttribute('data-high-contrast-text')
  }
  if (cards) {
    html.setAttribute('data-high-contrast-cards', 'true')
  } else {
    html.removeAttribute('data-high-contrast-cards')
  }
}
