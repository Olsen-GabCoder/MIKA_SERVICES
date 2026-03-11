import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useCorpsEtat } from '../hooks/useBaremeQueries'
import type { TypeLigneBareme } from '../types'
import { TypeLigneBareme as TypeEnum } from '../types'
import { DEBOUNCE_MS } from '../hooks/useBaremeListParams'

interface BaremeFiltersProps {
  corpsEtatId: number | null
  type: TypeLigneBareme | null
  recherche: string
  onCorpsEtatIdChange: (id: number | null) => void
  onTypeChange: (type: TypeLigneBareme | null) => void
  onRechercheChange: (q: string) => void
  onReset: () => void
}

export function BaremeFilters({
  corpsEtatId,
  type,
  recherche,
  onCorpsEtatIdChange,
  onTypeChange,
  onRechercheChange,
  onReset,
}: BaremeFiltersProps) {
  const { t } = useTranslation('bareme')
  const { data: corpsEtatList = [], isLoading: loadingCorps } = useCorpsEtat()
  const [searchInput, setSearchInput] = useState(recherche)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setSearchInput(recherche)
  }, [recherche])

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => onRechercheChange(value), DEBOUNCE_MS)
    },
    [onRechercheChange]
  )

  const hasActiveFilters = corpsEtatId != null || type != null || recherche.trim() !== ''

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 p-4">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
        {t('list.filtersLabel')}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{t('list.filtersByLibelle')}</p>
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-end">
        <div className="min-w-0 flex-1 sm:min-w-[220px]">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
            {t('list.searchLibelle')}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={t('list.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
            />
          </div>
        </div>
        <div className="min-w-0 flex-1 sm:max-w-[200px]">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
            {t('list.corpsEtat')}
          </label>
          <select
            value={corpsEtatId ?? ''}
            onChange={(e) => onCorpsEtatIdChange(e.target.value ? Number(e.target.value) : null)}
            disabled={loadingCorps}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">{t('list.all')}</option>
            {corpsEtatList.map((ce) => (
              <option key={ce.id} value={ce.id}>
                {ce.code ? `${ce.code} – ${ce.libelle}` : ce.libelle}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0 w-full sm:w-auto">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
            {t('list.type')}
          </label>
          <select
            value={type ?? ''}
            onChange={(e) => {
              const v = e.target.value
              onTypeChange(v === 'MATERIAU' || v === 'PRESTATION_ENTETE' ? v : null)
            }}
            className="w-full sm:w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">{t('list.all')}</option>
            <option value={TypeEnum.MATERIAU}>{t('list.typeMateriau')}</option>
            <option value={TypeEnum.PRESTATION_ENTETE}>{t('list.typePrestation')}</option>
          </select>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
          >
            {t('list.resetFilters')}
          </button>
        )}
      </div>
    </div>
  )
}
