import { useCallback } from 'react'
import { useAppSelector } from '@/store/hooks'
import { formatDisplayNumber, getNumberFormatLocale } from '@/utils/formatDisplayNumber'

/**
 * Hook qui retourne les formatters de nombres selon la préférence Paramètres (state.ui.numberFormat).
 */
export function useFormatNumber() {
  const numberFormat = useAppSelector((s) => s.ui.numberFormat)

  const formatMontant = useCallback(
    (value?: number | null): string => {
      return formatDisplayNumber(value, {
        numberFormat,
        style: 'currency',
        currency: 'XAF',
        maximumFractionDigits: 0,
      })
    },
    [numberFormat]
  )

  const formatNumber = useCallback(
    (value?: number | null, maxFractionDigits = 0): string => {
      return formatDisplayNumber(value, {
        numberFormat,
        style: 'decimal',
        maximumFractionDigits: maxFractionDigits,
      })
    },
    [numberFormat]
  )

  /** Format court pour grands nombres : 1,5 Mds / 120 M / 2 500 K (séparateur décimal selon préférence). */
  const formatShort = useCallback(
    (value: number): string => {
      const locale = getNumberFormatLocale(numberFormat)
      if (value >= 1e9) {
        const v = value / 1e9
        const s = new Intl.NumberFormat(locale, { maximumFractionDigits: 1, minimumFractionDigits: 0 }).format(v)
        return `${s} Mds`
      }
      if (value >= 1e6) {
        const v = value / 1e6
        const s = new Intl.NumberFormat(locale, { maximumFractionDigits: 1, minimumFractionDigits: 0 }).format(v)
        return `${s} M`
      }
      if (value >= 1e3) {
        const v = value / 1e3
        const s = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(v)
        return `${s} K`
      }
      return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value)
    },
    [numberFormat]
  )

  return { formatMontant, formatNumber, formatShort, numberFormatLocale: getNumberFormatLocale(numberFormat) }
}
