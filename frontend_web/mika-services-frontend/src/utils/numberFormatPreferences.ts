/**
 * Préférence d'affichage des nombres (séparateurs milliers et décimaux).
 * FR : 1 234,56 — EN : 1,234.56
 * Persistance localStorage, utilisée à chaque formatage.
 */

export const MIKA_NUMBER_FORMAT_KEY = 'mika-number-format'

export type NumberFormatPreference = 'FR' | 'EN'

const VALID_NUMBER_FORMATS: NumberFormatPreference[] = ['FR', 'EN']

export function getStoredNumberFormat(): NumberFormatPreference {
  if (typeof window === 'undefined') return 'FR'
  const stored = localStorage.getItem(MIKA_NUMBER_FORMAT_KEY)
  if (stored && VALID_NUMBER_FORMATS.includes(stored as NumberFormatPreference)) return stored as NumberFormatPreference
  return 'FR'
}
