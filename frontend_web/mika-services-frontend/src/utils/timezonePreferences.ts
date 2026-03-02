/**
 * Préférence de fuseau horaire pour l'affichage des dates et heures.
 * Chaîne vide = fuseau du navigateur ; sinon identifiant IANA (ex. Europe/Paris).
 * Persistance localStorage.
 */

export const MIKA_TIMEZONE_KEY = 'mika-timezone'

/** Valeur vide = utiliser le fuseau local du navigateur */
export const TIMEZONE_LOCAL = ''

/**
 * Fuseaux proposés dans Paramètres (ordre d'affichage).
 * '' = fuseau du navigateur ; autres = IANA (Intl supporté).
 */
export const TIMEZONE_OPTIONS: { value: string; labelKey: string }[] = [
  { value: TIMEZONE_LOCAL, labelKey: 'timezoneBrowser' },
  { value: 'Europe/Paris', labelKey: 'timezoneParis' },
  { value: 'Africa/Douala', labelKey: 'timezoneDouala' },
  { value: 'UTC', labelKey: 'timezoneUTC' },
  { value: 'Europe/London', labelKey: 'timezoneLondon' },
  { value: 'America/New_York', labelKey: 'timezoneNewYork' },
]

const VALID_VALUES = new Set(TIMEZONE_OPTIONS.map((o) => o.value))

export function getStoredTimezone(): string {
  if (typeof window === 'undefined') return TIMEZONE_LOCAL
  const stored = localStorage.getItem(MIKA_TIMEZONE_KEY)
  if (stored !== null && (stored === TIMEZONE_LOCAL || VALID_VALUES.has(stored))) return stored
  return TIMEZONE_LOCAL
}
