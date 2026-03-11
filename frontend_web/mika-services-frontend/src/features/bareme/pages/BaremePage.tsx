import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/layout/PageContainer'
import { useDerniereMiseAJour, useBaremeArticles, useBaremeArticlesCompare, useCoefficientsEloignement } from '../hooks/useBaremeQueries'
import { useBaremeListParams } from '../hooks/useBaremeListParams'
import { BaremeFilters } from '../components/BaremeFilters'
import { TypeLigneBareme } from '../types'
import { useFormatNumber } from '@/hooks/useFormatNumber'

export function BaremePage() {
  const { t } = useTranslation('bareme')
  const navigate = useNavigate()
  const { formatMontant } = useFormatNumber()
  const {
    params,
    setPage,
    setSize,
    setCorpsEtatId,
    setType,
    setRecherche,
    resetFilters,
  } = useBaremeListParams()

  const apiParams = {
    corpsEtatId: params.corpsEtatId ?? undefined,
    type: params.type ?? undefined,
    recherche: params.recherche.trim() || undefined,
  }
  const hasActiveFilters =
    params.corpsEtatId != null || params.type != null || params.recherche.trim() !== ''

  const { data: version, isLoading: loadingVersion } = useDerniereMiseAJour()
  const { data: coefficientsList = [] } = useCoefficientsEloignement()
  const { data: pageData, isLoading, isError } = useBaremeArticlesCompare(apiParams, params.page, params.size)

  const content = pageData?.content ?? []
  const totalElements = pageData?.totalElements ?? 0
  const totalPages = pageData?.totalPages ?? 0
  const currentPage = pageData?.number ?? params.page

  const getTypeLabel = (type: string) => {
    if (type === TypeLigneBareme.MATERIAU) return t('list.typeMateriau')
    if (type === TypeLigneBareme.PRESTATION_ENTETE) return t('list.typePrestation')
    return type
  }

  /** Valeur numérique pour comparer les prix (min/max) : matériau = prixTtc, prestation = déboursé ou P.V */
  const getCompareValue = (row: (typeof content)[0]): number | null => {
    if (row.type === TypeLigneBareme.MATERIAU) return row.prixTtc ?? null
    const v = row.debourse ?? row.prixVente
    return v != null ? Number(v) : null
  }

  /** Normalise le nom fournisseur pour la correspondance (trim + minuscules). */
  const normFournisseur = (s: string | null | undefined) => (s?.trim() || '—').toLowerCase()

  /** Toujours au format compare : une ligne = un article, prixParFournisseur complet (backend complète les fournisseurs manquants). */
  const groupsByArticle = ((): Array<{ libelle: string; unit: string; rows: (typeof content)[0][]; isCompare: boolean }> => {
    if (content.length === 0) return []
    const compareContent = content as import('@/features/bareme/types').BaremeArticleCompare[]
    return compareContent.map((row) => ({
      libelle: row.libelle ?? row.reference ?? '—',
      unit: row.unite ?? row.unitePrestation ?? '—',
      rows: [row as (typeof content)[0]],
      isCompare: true,
    }))
  })()

  /** Tous les fournisseurs (union des prixParFournisseur de la page) pour les en-têtes de colonnes. Dédupliqué par nom normalisé. Toujours au moins une colonne pour que le tableau soit tracé. */
  const supplierColumnNames = ((): string[] => {
    if (groupsByArticle.length === 0) return []
    const seen = new Set<string>()
    const order: string[] = []
    for (const group of groupsByArticle) {
      const first = group.rows[0]
      if (first && 'prixParFournisseur' in first && Array.isArray(first.prixParFournisseur)) {
        for (const pf of first.prixParFournisseur) {
          const name = pf.fournisseurNom?.trim() || '—'
          const key = normFournisseur(name)
          if (!seen.has(key)) {
            seen.add(key)
            order.push(name)
          }
        }
      }
    }
    return order.length > 0 ? order : ['—']
  })()

  /** Affiche toujours une valeur (jamais de cellule vide) : montant ou "—". */
  const formatPrice = (row: (typeof content)[0]) => {
    if (row.type === TypeLigneBareme.MATERIAU) {
      const v = row.prixTtc ?? 0
      return formatMontant(Number.isFinite(v) ? v : 0)
    }
    const d = row.debourse ?? 0
    const pv = row.prixVente ?? 0
    return `${formatMontant(Number.isFinite(d) ? d : 0)} / ${formatMontant(Number.isFinite(pv) ? pv : 0)}`
  }

  const openDetail = (id: number) => {
    navigate(`/bareme/articles/${id}`, {
      state: { fromListParams: params },
    })
  }

  const lastUpdateText = loadingVersion
    ? t('loadingVersion')
    : version?.derniereMiseAJour
      ? t('lastUpdate', {
          date: new Date(version.derniereMiseAJour).toLocaleString(
            undefined,
            { dateStyle: 'medium', timeStyle: 'short' }
          ),
        })
      : t('noImportYet')

  return (
    <PageContainer size="full" className="h-full flex flex-col min-h-0 bg-gray-50/80 dark:bg-gray-900/80">
      {/* Zone fixe : carte header (ne défile pas) */}
      <div className="shrink-0 space-y-6">
        <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg overflow-hidden">
          <div className="px-6 py-6 md:py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{t('title')}</h1>
                <p className="text-white/90 text-sm mt-1 font-medium">{t('subtitle')}</p>
                <p className={`text-sm mt-1 ${version?.derniereMiseAJour ? 'text-white/80' : 'text-amber-200'}`}>
                  {lastUpdateText}
                </p>
                {content.length > 0 && (
                  <p className="text-white/80 text-sm mt-1">
                    {t('list.paginationRange', {
                      from: currentPage * params.size + 1,
                      to: Math.min((currentPage + 1) * params.size, totalElements),
                      total: totalElements,
                    })}
                    {totalPages > 1 && ` · ${t('list.pageInfo', { current: currentPage + 1, total: totalPages })}`}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zone défilable : filtres + liste + pagination */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="space-y-6">
      <BaremeFilters
        corpsEtatId={params.corpsEtatId}
        type={params.type}
        recherche={params.recherche}
        onCorpsEtatIdChange={setCorpsEtatId}
        onTypeChange={setType}
        onRechercheChange={setRecherche}
        onReset={resetFilters}
      />

      {isError && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200">
          {t('list.errorLoad')}
        </div>
      )}

      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('list.colArticle')}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('list.colReference')}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('list.colUnite')}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('list.colType')}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('list.colFournisseur')}</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('list.colPrix')}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('list.colDatePrix')}</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-28">{t('list.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-600">
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-48" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-12" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-28" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20 ml-auto" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24" /></td>
                    <td className="px-6 py-4"><div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-16 mx-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="px-6 py-3 text-sm text-gray-400 dark:text-gray-500">{t('list.loading')}</p>
        </div>
      ) : content.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 p-12">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {hasActiveFilters ? t('list.emptyNoResults') : t('list.emptyNoData')}
            </p>
            <p className="text-sm mt-2 dark:text-gray-300">
              {hasActiveFilters ? t('list.emptyNoResultsHint') : t('list.emptyNoDataHint')}
            </p>
          </div>
        </div>
      ) : (
        /* Tableau unique : une ligne par article, une colonne par fournisseur, montant dans chaque cellule (avec ou sans recherche) */
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" role="table">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">{t('list.colArticle')}</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">{t('list.colUnite')}</th>
                    {supplierColumnNames.map((name) => (
                      <th key={name} scope="col" className="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider min-w-[100px]">
                        {name}
                      </th>
                    ))}
                    <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-28">{t('list.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-600">
                  {groupsByArticle.map((group) => {
                    const first = group.rows[0]
                    const isCompareRow = group.isCompare && first && 'prixParFournisseur' in first && Array.isArray(first.prixParFournisseur)
                    const prixParFournisseur = isCompareRow ? (first as import('@/features/bareme/types').BaremeArticleCompare).prixParFournisseur : []
                    const values = isCompareRow
                      ? prixParFournisseur.map((pf) => (pf.prixTtc != null ? Number(pf.prixTtc) : null)).filter((v): v is number => v != null)
                      : group.rows.map(getCompareValue).filter((v): v is number => v != null)
                    const minVal = values.length > 0 ? Math.min(...values) : null
                    const maxVal = values.length > 0 ? Math.max(...values) : null
                    const rowBySupplier = new Map<string, (typeof group.rows)[0]>()
                    if (!isCompareRow) {
                      for (const row of group.rows) {
                        const name = (row as { fournisseurNom?: string }).fournisseurNom?.trim() || '—'
                        rowBySupplier.set(name, row)
                      }
                    }
                    const firstRowId = first?.id
                    return (
                      <tr
                        key={`${group.libelle}|${group.unit}`}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/70 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 align-top font-medium">{group.libelle}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 font-mono align-top">{group.unit}</td>
                        {supplierColumnNames.map((supplierName, colIndex) => {
                          if (isCompareRow) {
                            const isPrestation = first && (first as { type?: string }).type !== TypeLigneBareme.MATERIAU
                            const prestationTotals = isPrestation && first ? `${formatMontant(Number((first as { debourse?: number }).debourse ?? 0))} / ${formatMontant(Number((first as { prixVente?: number }).prixVente ?? 0))}` : null
                            if (isPrestation) {
                              const isEstime = (first as { prixEstime?: boolean }).prixEstime === true
                              const priceClass = isEstime ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 font-medium' : 'text-gray-900 dark:text-gray-100 font-medium'
                              const cellContent = colIndex === 0 ? (prestationTotals ?? '—') : '—'
                              return (
                                <td key={supplierName} className="px-4 py-4 align-top border-l border-gray-100 dark:border-gray-600">
                                  <button
                                    type="button"
                                    className="text-left w-full rounded focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset min-h-[2rem] w-full"
                                    onClick={() => firstRowId != null && openDetail(firstRowId)}
                                  >
                                    <span className={`text-sm whitespace-nowrap ${colIndex === 0 ? priceClass : 'text-gray-500 dark:text-gray-400'} ${colIndex === 0 && isEstime ? 'px-1.5 py-0.5 rounded' : ''}`}>
                                      {cellContent || '—'}
                                    </span>
                                  </button>
                                </td>
                              )
                            }
                            const pf = prixParFournisseur.find((p) => normFournisseur(p.fournisseurNom) === normFournisseur(supplierName))
                            const val = pf?.prixTtc != null ? Number(pf.prixTtc) : null
                            const isMin = val != null && minVal != null && val === minVal
                            const isMax = val != null && maxVal != null && val === maxVal && minVal !== maxVal
                            const isEstime = pf?.prixEstime === true
                            const priceClass = isEstime
                              ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 font-medium'
                              : isMin
                                ? 'text-success font-semibold'
                                : isMax
                                  ? 'text-danger font-semibold'
                                  : 'text-gray-900 dark:text-gray-100 font-medium'
                            const priceStr = pf != null && val != null ? formatMontant(val) : '—'
                            return (
                              <td key={supplierName} className="px-4 py-4 align-top border-l border-gray-100 dark:border-gray-600">
                                <button
                                  type="button"
                                  className="text-left w-full rounded focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset min-h-[2rem] w-full"
                                  onClick={() => firstRowId != null && openDetail(firstRowId)}
                                >
                                  <span className={`text-sm whitespace-nowrap ${priceClass} ${isEstime ? 'px-1.5 py-0.5 rounded' : ''}`}>{priceStr || '—'}</span>
                                </button>
                              </td>
                            )
                          }
                          const row = rowBySupplier.get(supplierName)
                          if (!row) {
                            return (
                              <td key={supplierName} className="px-4 py-4 align-top border-l border-gray-100 dark:border-gray-600">
                                <span className="text-sm text-gray-500 dark:text-gray-400">—</span>
                              </td>
                            )
                          }
                          const val = getCompareValue(row)
                          const isMin = val != null && minVal != null && val === minVal
                          const isMax = val != null && maxVal != null && val === maxVal && minVal !== maxVal
                          const isEstime = (row as { prixEstime?: boolean }).prixEstime === true
                          const priceClass = isEstime
                            ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 font-medium'
                            : isMin
                              ? 'text-success font-semibold'
                              : isMax
                                ? 'text-danger font-semibold'
                                : 'text-gray-900 dark:text-gray-100 font-medium'
                          return (
                            <td key={supplierName} className="px-4 py-4 align-top border-l border-gray-100 dark:border-gray-600">
                              <button
                                type="button"
                                className="text-left w-full rounded focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
                                onClick={() => openDetail(row.id)}
                              >
                                <span className={`text-sm whitespace-nowrap ${priceClass} ${isEstime ? 'px-1.5 py-0.5 rounded' : ''}`}>{formatPrice(row) || '—'}</span>
                              </button>
                            </td>
                          )
                        })}
                        <td className="px-6 py-4 text-center align-top">
                          {firstRowId != null && (
                            <button
                              type="button"
                              onClick={() => openDetail(firstRowId)}
                              className="text-primary-600 dark:text-primary-400 font-medium text-sm hover:underline"
                            >
                              {t('list.viewDetail')}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('list.paginationRange', {
                  from: totalElements === 0 ? 0 : currentPage * params.size + 1,
                  to: Math.min((currentPage + 1) * params.size, totalElements),
                  total: totalElements,
                })}
              </p>
              <div className="flex items-center gap-3">
                <select
                  value={params.size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-gray-100"
                >
                  {[10, 20, 50].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage(currentPage - 1)}
                    disabled={currentPage <= 0}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    ← {t('list.paginationPrev')}
                  </button>
                  <span className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300">
                    {currentPage + 1} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {t('list.paginationNext')} →
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

        {/* Coefficients d'éloignement (liste informative) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
          <h2 className="px-6 py-4 text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">
            {t('coefficients.title')}
          </h2>
          <p className="px-6 py-2 text-sm text-gray-500 dark:text-gray-400">{t('coefficients.subtitle')}</p>
          {coefficientsList.length === 0 ? (
            <p className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{t('coefficients.empty')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      {t('coefficients.colLocalite')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      {t('coefficients.colPourcent')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      {t('coefficients.colCoefficient')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      {t('coefficients.colNote')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-600">
                  {coefficientsList.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{c.nom}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-700 dark:text-gray-300">
                        {c.pourcentage != null ? `${c.pourcentage} %` : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-gray-900 dark:text-gray-100">{c.coefficient}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{c.note ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </div>
      </div>
    </PageContainer>
  )
}
