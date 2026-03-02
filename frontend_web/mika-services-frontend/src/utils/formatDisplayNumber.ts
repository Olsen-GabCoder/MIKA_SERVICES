/**
 * Formatage des nombres selon la préférence utilisateur (FR : 1 234,56 / EN : 1,234.56).
 */
import type { NumberFormatPreference } from './numberFormatPreferences'

const LOCALE_BY_PREF: Record<NumberFormatPreference, string> = {
  FR: 'fr-FR',
  EN: 'en-GB',
}

/**
 * Retourne la locale Intl à utiliser pour les nombres à partir de la préférence.
 */
export function getNumberFormatLocale(numberFormat: NumberFormatPreference): string {
  return LOCALE_BY_PREF[numberFormat]
}

export interface FormatDisplayNumberOptions {
  numberFormat: NumberFormatPreference
  style?: 'currency' | 'decimal' | 'percent'
  currency?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

/**
 * Formate un nombre selon la préférence (séparateurs milliers/décimaux).
 */
export function formatDisplayNumber(
  value: number | undefined | null,
  options: FormatDisplayNumberOptions
): string {
  if (value == null || !Number.isFinite(value)) return '—'
  const locale = getNumberFormatLocale(options.numberFormat)
  const opts: Intl.NumberFormatOptions = {
    style: options.style ?? 'decimal',
    minimumFractionDigits: options.minimumFractionDigits,
    maximumFractionDigits: options.maximumFractionDigits ?? (options.style === 'currency' ? 0 : 2),
  }
  if (options.style === 'currency') opts.currency = options.currency ?? 'XAF'
  return new Intl.NumberFormat(locale, opts).format(value)
}
