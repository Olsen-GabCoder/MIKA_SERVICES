import { useCallback } from 'react'
import { useAppSelector } from '@/store/hooks'
import { formatDisplayDate } from '@/utils/formatDisplayDate'
import type { FormatDisplayDateOptions } from '@/utils/formatDisplayDate'

export interface UseFormatDateOptions {
  includeTime?: boolean
  /** Afficher uniquement l'heure (sans date), selon préférence 12h/24h */
  timeOnly?: boolean
  monthStyle?: 'short' | 'long' | 'numeric'
  weekday?: boolean | 'short' | 'long'
}

/**
 * Hook qui retourne une fonction de formatage des dates selon la locale et le format
 * configurés dans Paramètres (state.ui.locale, state.ui.dateFormat).
 */
export function useFormatDate() {
  const locale = useAppSelector((s) => s.ui.locale)
  const dateFormat = useAppSelector((s) => s.ui.dateFormat)
  const timeFormat = useAppSelector((s) => s.ui.timeFormat)
  const timeZone = useAppSelector((s) => s.ui.timezone)

  return useCallback(
    (d: string | Date | undefined | null, options?: UseFormatDateOptions): string => {
      const opts: FormatDisplayDateOptions = {
        locale,
        dateFormat,
        timeFormat,
        timeZone: timeZone || undefined,
        ...options,
      }
      return formatDisplayDate(d, opts)
    },
    [locale, dateFormat, timeFormat, timeZone]
  )
}
