/**
 * Formatage des dates selon la locale et la préférence utilisateur (ordre jour/mois/année, 12h/24h).
 * Utilisé partout où une date est affichée (listes, fiches, exports reçus en payload).
 */
import type { DateFormatPreference } from './dateFormatPreferences'
import type { TimeFormatPreference } from './timeFormatPreferences'

export interface FormatDisplayDateOptions {
  /** Locale (fr, en) pour les noms de mois / jour */
  locale: string
  /** Préférence ordre date (Paramètres) */
  dateFormat: DateFormatPreference
  /** Préférence affichage heure (Paramètres) : 24h ou 12h */
  timeFormat?: TimeFormatPreference
  /** Inclure l'heure (2 chiffres heure:minute) */
  includeTime?: boolean
  /** Afficher uniquement l'heure (sans date). Utilise timeFormat (12h/24h). */
  timeOnly?: boolean
  /** Style du mois : short (janv.), long (janvier), numeric (01) */
  monthStyle?: 'short' | 'long' | 'numeric'
  /** Afficher le jour de la semaine */
  weekday?: boolean | 'short' | 'long'
  /** Fuseau horaire IANA (ex. Europe/Paris). Vide = fuseau du navigateur. */
  timeZone?: string
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

/**
 * Formate une date (ISO string ou Date) selon les options.
 * @param d - Date en ISO string ou objet Date
 * @param options - locale, dateFormat, et options d'affichage
 * @returns Chaîne formatée ou "—" si date invalide
 */
export function formatDisplayDate(
  d: string | Date | undefined | null,
  options: FormatDisplayDateOptions
): string {
  if (d == null || d === '') return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  if (Number.isNaN(date.getTime())) return '—'

  const { locale, dateFormat, timeFormat = '24h', includeTime, timeOnly, monthStyle = 'numeric', weekday, timeZone } = options
  const bcplocale = locale === 'en' ? 'en-GB' : 'fr-FR'
  const intlLocale = dateFormat === 'MM/DD/YYYY' ? 'en-US' : bcplocale
  const tzOpt = timeZone && timeZone !== '' ? { timeZone } : undefined

  if (timeOnly) {
    const opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: timeFormat === '12h' }
    if (tzOpt) opts.timeZone = timeZone
    return date.toLocaleTimeString(bcplocale, opts)
  }

  if (dateFormat === 'YYYY-MM-DD' && !includeTime && !weekday && monthStyle === 'numeric') {
    if (tzOpt) {
      const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date)
      const y = parts.find(p => p.type === 'year')!.value
      const m = parts.find(p => p.type === 'month')!.value
      const d = parts.find(p => p.type === 'day')!.value
      return `${y}-${m}-${d}`
    }
    const y = date.getFullYear()
    const m = date.getMonth() + 1
    const day = date.getDate()
    return `${y}-${pad(m)}-${pad(day)}`
  }

  const intlOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: monthStyle === 'short' ? 'short' : monthStyle === 'long' ? 'long' : '2-digit',
    year: 'numeric',
  }
  if (weekday) intlOptions.weekday = weekday === true ? 'long' : weekday
  if (includeTime) {
    intlOptions.hour = '2-digit'
    intlOptions.minute = '2-digit'
    intlOptions.hour12 = timeFormat === '12h'
  }
  if (tzOpt) intlOptions.timeZone = timeZone

  return date.toLocaleDateString(intlLocale, intlOptions)
}
