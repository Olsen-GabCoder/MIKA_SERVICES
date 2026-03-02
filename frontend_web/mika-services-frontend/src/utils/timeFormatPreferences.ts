/**
 * Préférence d'affichage de l'heure (12h ou 24h).
 * Persistance localStorage, utilisée à chaque formatage date+heure.
 */

export const MIKA_TIME_FORMAT_KEY = 'mika-time-format'

export type TimeFormatPreference = '24h' | '12h'

const VALID_TIME_FORMATS: TimeFormatPreference[] = ['24h', '12h']

export function getStoredTimeFormat(): TimeFormatPreference {
  if (typeof window === 'undefined') return '24h'
  const stored = localStorage.getItem(MIKA_TIME_FORMAT_KEY)
  if (stored && VALID_TIME_FORMATS.includes(stored as TimeFormatPreference)) return stored as TimeFormatPreference
  return '24h'
}
