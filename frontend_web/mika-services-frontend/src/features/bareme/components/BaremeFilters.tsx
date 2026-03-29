import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { DEBOUNCE_MS } from '../hooks/useBaremeListParams'
interface BaremeFiltersProps {
  recherche: string
  article: string
  fournisseur: string
  unite: string
  famille: string
  categorie: string
  articleOptions: string[]
  fournisseurOptions: string[]
  uniteOptions: string[]
  familleOptions: string[]
  categorieOptions: string[]
  onRechercheChange: (q: string) => void
  onArticleChange: (value: string) => void
  onFournisseurChange: (value: string) => void
  onUniteChange: (value: string) => void
  onFamilleChange: (value: string) => void
  onCategorieChange: (value: string) => void
  onReset: () => void
}

export function BaremeFilters({
  recherche,
  article,
  fournisseur,
  unite,
  famille,
  categorie,
  articleOptions,
  fournisseurOptions,
  uniteOptions,
  familleOptions,
  categorieOptions,
  onRechercheChange,
  onArticleChange,
  onFournisseurChange,
  onUniteChange,
  onFamilleChange,
  onCategorieChange,
  onReset,
}: BaremeFiltersProps) {
  const { t } = useTranslation('bareme')
  const [searchInput, setSearchInput] = useState(recherche)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setSearchInput(recherche)
  }, [recherche])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => onRechercheChange(value), DEBOUNCE_MS)
    },
    [onRechercheChange]
  )

  const handleClearSearch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSearchInput('')
    onRechercheChange('')
  }, [onRechercheChange])

  const searchTrimmed = searchInput.trim()
  const hasActiveFilters =
    recherche.trim() !== '' ||
    article.trim() !== '' ||
    fournisseur.trim() !== '' ||
    unite.trim() !== '' ||
    famille.trim() !== '' ||
    categorie.trim() !== ''

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 p-4">
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-end">
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
          {searchTrimmed ? (
            <div className="mt-1.5 flex justify-end">
              <button
                type="button"
                onClick={handleClearSearch}
                className="text-xs font-medium text-primary hover:text-primary-dark dark:text-secondary-light underline-offset-2 hover:underline"
              >
                {t('list.backToCatalog')}
              </button>
            </div>
          ) : null}
        </div>
        <div className="min-w-0 w-full sm:w-auto">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
            {t('list.articleCanonique')}
          </label>
          <select
            value={article}
            onChange={(e) => onArticleChange(e.target.value)}
            className="w-full sm:w-56 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">{t('list.all')}</option>
            {articleOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0 w-full sm:w-auto">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
            {t('list.fournisseur')}
          </label>
          <select
            value={fournisseur}
            onChange={(e) => onFournisseurChange(e.target.value)}
            className="w-full sm:w-56 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">{t('list.all')}</option>
            {fournisseurOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0 w-full sm:w-auto">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
            {t('list.uniteCanonique')}
          </label>
          <select
            value={unite}
            onChange={(e) => onUniteChange(e.target.value)}
            className="w-full sm:w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">{t('list.all')}</option>
            {uniteOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0 w-full sm:w-auto">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
            {t('list.corpsEtat')}
          </label>
          <select
            value={famille}
            onChange={(e) => onFamilleChange(e.target.value)}
            className="w-full sm:w-52 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">{t('list.all')}</option>
            {familleOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0 w-full sm:w-auto">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
            {t('list.categorie')}
          </label>
          <select
            value={categorie}
            onChange={(e) => onCategorieChange(e.target.value)}
            className="w-full sm:w-52 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">{t('list.all')}</option>
            {categorieOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="self-end sm:self-auto bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
          >
            {t('list.resetFilters')}
          </button>
        )}
      </div>
    </div>
  )
}
