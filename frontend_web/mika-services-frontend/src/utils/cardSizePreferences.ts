/**
 * Préférence de taille des cartes et vignettes (listes / tableaux).
 * Appliquée aux éléments avec la classe .mika-tile.
 */

export const MIKA_CARD_SIZE_KEY = 'mika-card-size'

export type CardSize = 'small' | 'medium' | 'large'

const VALID_CARD_SIZES: CardSize[] = ['small', 'medium', 'large']

const CARD_SIZE_SCALE: Record<CardSize, number> = {
  small: 0.9,
  medium: 1,
  large: 1.12,
}

export function getStoredCardSize(): CardSize {
  if (typeof window === 'undefined') return 'medium'
  const stored = localStorage.getItem(MIKA_CARD_SIZE_KEY)
  if (stored && VALID_CARD_SIZES.includes(stored as CardSize)) return stored as CardSize
  return 'medium'
}

export function applyCardSizeToDocument(cardSize: CardSize): void {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  html.setAttribute('data-card-size', cardSize)
  html.style.setProperty('--mika-card-scale', String(CARD_SIZE_SCALE[cardSize]))
}
