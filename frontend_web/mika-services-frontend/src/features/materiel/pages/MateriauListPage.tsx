import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useConfirm } from '@/contexts/ConfirmContext'
import { PageContainer } from '@/components/layout/PageContainer'
import { fetchMateriaux, deleteMateriau } from '@/store/slices/materiauSlice'
import {
  DEBOUNCE_MS,
  MaterielEmptyState,
  MaterielPagination,
  MaterielStatPill,
  IconGrid,
  IconClock,
  IconAlert,
} from '../components/MaterielListChrome'
import { MaterielModuleTabs } from '../components/MaterielModuleTabs'

function SkeletonRowMateriau() {
  return (
    <tr className="border-b border-gray-100 dark:border-gray-700/40">
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i} className="px-3 py-3">
          <div className="h-3.5 bg-gray-200 dark:bg-gray-600/60 rounded-full w-full max-w-[8rem] animate-pulse" />
        </td>
      ))}
    </tr>
  )
}

export const MateriauListPage = () => {
  const { t, i18n } = useTranslation('materiel')
  const dispatch = useAppDispatch()
  const confirm = useConfirm()
  const { materiaux, totalElements, totalPages, currentPage, loading, error } = useAppSelector((state) => state.materiau)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [pageSize, setPageSize] = useState(20)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedQ(searchInput), DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchInput])

  useEffect(() => {
    dispatch(fetchMateriaux({ page: 0, size: pageSize, q: debouncedQ.trim() || undefined }))
  }, [dispatch, debouncedQ, pageSize])

  const hasActiveFilters = debouncedQ.trim() !== ''

  const handlePageChange = (page: number) => {
    dispatch(fetchMateriaux({ page, size: pageSize, q: debouncedQ.trim() || undefined }))
  }

  const handleSizeChange = (size: number) => {
    setPageSize(size)
  }

  const resetFilters = () => {
    setSearchInput('')
    setDebouncedQ('')
  }

  const handleDelete = async (id: number, nom: string) => {
    if (await confirm({ messageKey: 'confirm.deactivateMateriau', messageParams: { name: nom } })) {
      await dispatch(deleteMateriau(id))
      dispatch(fetchMateriaux({ page: currentPage, size: pageSize, q: debouncedQ.trim() || undefined }))
    }
  }

  const paginationRangeLabel = t('list.paginationRange', {
    from: totalElements === 0 ? 0 : currentPage * pageSize + 1,
    to: Math.min((currentPage + 1) * pageSize, totalElements),
    total: totalElements,
  })

  const stockBasCount = !loading ? materiaux.filter((m) => m.stockBas).length : 0

  return (
    <PageContainer size="full" className="h-full flex flex-col min-h-0 bg-gray-50/80 dark:bg-gray-900/80">
      <div className="shrink-0 mb-6">
        <div className="relative overflow-hidden rounded-2xl shadow-xl shadow-primary/10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-secondary" />
          <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative z-10 px-6 py-7 md:py-9">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-lg flex-shrink-0 backdrop-blur-sm">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">{t('materiau.title')}</h1>
                  <p className="text-white/75 text-sm font-medium mt-1">{t('list.heroMateriau')}</p>
                  <MaterielModuleTabs />
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                <div className="flex flex-wrap gap-2 justify-end">
                  {totalElements > 0 && (
                    <MaterielStatPill label={t('list.statRecords')} value={totalElements.toLocaleString(i18n.language)} icon={<IconGrid />} />
                  )}
                  {!loading && materiaux.length > 0 && stockBasCount > 0 && (
                    <MaterielStatPill label={t('list.statStockBas')} value={stockBasCount} icon={<IconAlert />} />
                  )}
                  {totalPages > 1 && (
                    <MaterielStatPill
                      label={t('list.statPagination')}
                      value={`${currentPage + 1}/${totalPages}`}
                      icon={<IconClock />}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10" />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-5">
        <div className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light flex items-center justify-center">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
                  />
                </svg>
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{t('list.filters')}</p>
              {hasActiveFilters && (
                <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold">{t('list.active')}</span>
              )}
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-semibold text-primary dark:text-primary-light hover:text-primary-dark transition-colors duration-150 shrink-0"
              >
                {t('list.reset')} ×
              </button>
            )}
          </div>
          <div className="p-5">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 p-4">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{t('list.searchLabel')}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={t('list.searchPlaceholderMateriau')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                  autoComplete="off"
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 dark:border-red-700/60 bg-red-50 dark:bg-red-900/20 px-5 py-4 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-800/40 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-red-700 dark:text-red-300">{t('list.errorTitle')}</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {!error && (
          <div className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="w-7 h-7 rounded-lg bg-secondary/10 dark:bg-secondary/20 text-secondary dark:text-secondary-light flex items-center justify-center">
                  <IconGrid />
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{t('list.tableTitleMateriau')}</p>
                {!loading && materiaux.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-bold">
                    {totalElements}
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]" role="table">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-gray-700/50">
                    {(
                      [
                        t('materiau.columns.code'),
                        t('materiau.columns.nom'),
                        t('materiau.columns.type'),
                        t('materiau.columns.unite'),
                        t('materiau.columns.stockActuel'),
                        t('materiau.columns.stockMin'),
                        t('materiau.columns.alerte'),
                        t('materiau.columns.fournisseur'),
                        t('materiau.actions'),
                      ] as const
                    ).map((label, idx) => (
                      <th
                        key={label}
                        scope="col"
                        className={`px-3 py-3.5 border-b border-gray-100 dark:border-gray-700/60 ${
                          idx === 4 || idx === 5 ? 'text-right whitespace-nowrap' : idx === 8 ? 'text-center w-28' : 'text-left whitespace-nowrap'
                        }`}
                      >
                        <span className="text-[10px] font-black tracking-widest uppercase text-gray-500 dark:text-gray-400">{label}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
                  {loading && Array.from({ length: 8 }).map((_, i) => <SkeletonRowMateriau key={i} />)}
                  {!loading &&
                    materiaux.map((m) => (
                      <tr
                        key={m.id}
                        className="group hover:bg-primary/[0.02] dark:hover:bg-primary/[0.05] transition-colors duration-150"
                      >
                        <td className="px-3 py-3 align-middle font-mono text-xs text-primary dark:text-primary-light font-semibold border-b border-gray-100 dark:border-gray-700/40">
                          {m.code}
                        </td>
                        <td className="px-3 py-3 align-middle text-sm font-medium text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700/40">
                          {m.nom}
                        </td>
                        <td className="px-3 py-3 align-middle text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700/40">
                          {m.type}
                        </td>
                        <td className="px-3 py-3 align-middle border-b border-gray-100 dark:border-gray-700/40">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-400 text-xs font-bold font-mono">
                            {m.unite}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-middle text-sm text-right font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700/40">
                          {m.stockActuel}
                        </td>
                        <td className="px-3 py-3 align-middle text-sm text-right text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700/40">
                          {m.stockMinimum}
                        </td>
                        <td className="px-3 py-3 align-middle border-b border-gray-100 dark:border-gray-700/40">
                          {m.stockBas ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-900/25 border border-red-200 dark:border-red-700/50 text-red-600 dark:text-red-400 text-xs font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                              {t('materiau.alertStockBas')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 dark:bg-green-900/25 border border-green-200 dark:border-green-700/50 text-green-700 dark:text-green-400 text-xs font-bold">
                              <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                              {t('materiau.alertOk')}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 align-middle text-sm text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700/40 max-w-[14rem] truncate" title={m.fournisseur ?? undefined}>
                          {m.fournisseur || '—'}
                        </td>
                        <td className="px-3 py-3 text-center align-middle border-b border-gray-100 dark:border-gray-700/40">
                          <button
                            type="button"
                            onClick={() => handleDelete(m.id, m.nom)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-700/50 bg-red-50/80 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/35 transition-all duration-150"
                          >
                            {t('materiau.delete')}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {!loading && materiaux.length === 0 && (
              <MaterielEmptyState
                hasFilters={hasActiveFilters}
                onReset={resetFilters}
                labelNoData={t('list.emptyNoDataMateriau')}
                labelNoResults={t('list.emptyNoResults')}
                hintNoData={t('list.emptyNoDataHintMateriau')}
                hintNoResults={t('list.emptyNoResultsHint')}
                labelReset={t('list.resetFilters')}
              />
            )}

            {loading && (
              <div className="flex items-center gap-2.5 px-5 py-3 border-t border-gray-100 dark:border-gray-700/60">
                <svg className="w-4 h-4 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm text-gray-400 dark:text-gray-500 font-medium">{t('materiau.loading')}</span>
              </div>
            )}
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <MaterielPagination
            currentPage={currentPage}
            totalPages={totalPages}
            size={pageSize}
            onPageChange={handlePageChange}
            onSizeChange={handleSizeChange}
            labelRange={paginationRangeLabel}
            labelPrev={t('list.paginationPrev')}
            labelNext={t('list.paginationNext')}
            labelPerPage={t('list.perPage')}
          />
        )}

        <div className="h-4" />
      </div>
    </PageContainer>
  )
}
