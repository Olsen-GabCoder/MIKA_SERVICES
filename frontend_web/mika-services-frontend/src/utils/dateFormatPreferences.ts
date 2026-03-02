/**
 * Préférence d'affichage des dates (ordre jour / mois / année).
 * Persistance localStorage, pas d'application au DOM (utilisée à chaque formatage).
 */

export const MIKA_DATE_FORMAT_KEY = 'mika-date-format'

export type DateFormatPreference = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'

const VALID_DATE_FORMATS: DateFormatPreference[] = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']

export function getStoredDateFormat(): DateFormatPreference {
  if (typeof window === 'undefined') return 'DD/MM/YYYY'
  const stored = localStorage.getItem(MIKA_DATE_FORMAT_KEY)
  if (stored && VALID_DATE_FORMATS.includes(stored as DateFormatPreference)) return stored as DateFormatPreference
  return 'DD/MM/YYYY'
}
