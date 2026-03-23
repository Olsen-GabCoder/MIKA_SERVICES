import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect, useRef, useState } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { useDeleteBaremeArticle, useBaremeArticle } from '../hooks/useBaremeQueries'
import { TypeLigneBareme } from '../types'
import { useFormatNumber } from '@/hooks/useFormatNumber'
import type { BaremeListParams } from '../hooks/useBaremeListParams'
import { useAppSelector } from '@/store/hooks'
import { handleApiError } from '@/utils/errorHandler'

function buildListSearchParams(params: BaremeListParams): string {
  const sp = new URLSearchParams()
  if (params.page > 0) sp.set('page', String(params.page))
  if (params.size !== 20) sp.set('size', String(params.size))
  if (params.recherche.trim()) sp.set('recherche', params.recherche.trim())
  if (params.article.trim()) sp.set('article', params.article.trim())
  if (params.fournisseur.trim()) sp.set('fournisseur', params.fournisseur.trim())
  if (params.unite.trim()) sp.set('unite', params.unite.trim())
  if (params.famille.trim()) sp.set('famille', params.famille.trim())
  if (params.categorie.trim()) sp.set('categorie', params.categorie.trim())
  const q = sp.toString()
  return q ? `?${q}` : ''
}

function toNum(v: number | string | null | undefined): number | null {
  if (v == null) return null
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  const n = typeof v === 'string' ? parseFloat(v) : Number(v)
  return Number.isNaN(n) ? null : n
}

export function BaremeArticleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation('bareme')
  const { formatMontant } = useFormatNumber()
  const currentUser = useAppSelector((state) => state.auth.user)
  const isAdmin = currentUser?.roles?.some((r) => r.code === 'ADMIN' || r.code === 'SUPER_ADMIN') ?? false
  const articleId = id != null ? parseInt(id, 10) : null
  const { data: article, isLoading, isError } = useBaremeArticle(articleId)
  const deleteMutation = useDeleteBaremeArticle()
  const fromListParams = location.state as { fromListParams?: BaremeListParams } | null
  const stickySentinelRef = useRef<HTMLDivElement | null>(null)
  const [isStickyPinned, setIsStickyPinned] = useState(false)

  useEffect(() => {
    const sentinel = stickySentinelRef.current
    if (sentinel == null) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When sentinel leaves viewport, sticky bar is visually pinned.
        setIsStickyPinned(entry.isIntersecting === false)
      },
      { threshold: 0 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  const goBack = () => {
    if (fromListParams?.fromListParams) {
      navigate(`/bareme${buildListSearchParams(fromListParams.fromListParams)}`)
    } else {
      navigate('/bareme')
    }
  }

  const onDelete = async () => {
    if (articleId == null || Number.isNaN(articleId)) return
    const ok = window.confirm(t('detail.confirmDelete'))
    if (!ok) return
    try {
      await deleteMutation.mutateAsync(articleId)
      navigate('/bareme')
    } catch (err) {
      window.alert(handleApiError(err))
    }
  }

  if (articleId == null || Number.isNaN(articleId)) {
    return (
      <PageContainer size="full" className="min-h-full bg-gray-50/80 dark:bg-gray-900/80 space-y-6">
        <p className="text-red-600 dark:text-red-400">{t('detail.invalidId')}</p>
        <button type="button" onClick={goBack} className="text-primary-600 dark:text-primary-400 hover:underline">
          {t('detail.backToList')}
        </button>
      </PageContainer>
    )
  }

  if (isError) {
    return (
      <PageContainer size="full" className="min-h-full bg-gray-50/80 dark:bg-gray-900/80 space-y-6">
        <p className="text-red-600 dark:text-red-400">{t('detail.errorLoad')}</p>
        <button type="button" onClick={goBack} className="text-primary-600 dark:text-primary-400 hover:underline">
          {t('detail.backToList')}
        </button>
      </PageContainer>
    )
  }

  if (isLoading || !article) {
    return (
      <PageContainer size="full" className="min-h-full bg-gray-50/80 dark:bg-gray-900/80 space-y-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
        <div className="h-4 w-full max-w-md bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
        <button type="button" onClick={goBack} className="text-primary-600 dark:text-primary-400 hover:underline">
          {t('detail.backToList')}
        </button>
      </PageContainer>
    )
  }

  const isMateriau = article.type === TypeLigneBareme.MATERIAU
  const typeLabel = isMateriau ? t('list.typeMateriau') : t('list.typePrestation')
  const prixFournisseurs = article.prixParFournisseur ?? []
  const lignesPrestation = article.lignesPrestation ?? []
  const prixMateriauxNumeriques = isMateriau
    ? prixFournisseurs
        .map((pf) => ({ pf, value: toNum(pf.prixTtc) }))
        .filter((x): x is { pf: (typeof prixFournisseurs)[number]; value: number } => x.value != null && Number.isFinite(x.value))
    : []
  const bestPrice = prixMateriauxNumeriques.length > 0 ? Math.min(...prixMateriauxNumeriques.map((x) => x.value)) : null
  const worstPrice = prixMateriauxNumeriques.length > 0 ? Math.max(...prixMateriauxNumeriques.map((x) => x.value)) : null
  const avgPrice =
    prixMateriauxNumeriques.length > 0
      ? prixMateriauxNumeriques.reduce((acc, cur) => acc + cur.value, 0) / prixMateriauxNumeriques.length
      : null
  const sortedPrixFournisseurs = [...prixFournisseurs].sort((a, b) => {
    const va = toNum(a.prixTtc)
    const vb = toNum(b.prixTtc)
    if (va == null && vb == null) return (a.fournisseurNom ?? '').localeCompare(b.fournisseurNom ?? '', 'fr')
    if (va == null) return 1
    if (vb == null) return -1
    return va - vb
  })

  return (
    <PageContainer size="full" className="min-h-full bg-gray-50/80 dark:bg-gray-900/80 space-y-6">
      <div ref={stickySentinelRef} className="h-px -mt-px" aria-hidden />
      <div className="sticky top-2 z-20">
        <div
          className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur rounded-xl border border-gray-200 dark:border-gray-600 p-3 transition-shadow duration-200 ${
            isStickyPinned ? 'shadow-md' : 'shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={goBack} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-1">
              ← {t('detail.backToList')}
            </button>
            {isAdmin && (
              <div className="hidden md:flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" disabled={deleteMutation.isPending} onClick={() => navigate('/bareme/articles/nouveau')}>
                  + {t('create.addArticle')}
                </Button>
                <Button type="button" variant="primary" size="sm" disabled={deleteMutation.isPending} onClick={() => navigate(`/bareme/articles/${articleId}/edit`)}>
                  {t('detail.edit')}
                </Button>
                <Button type="button" variant="danger" size="sm" isLoading={deleteMutation.isPending} onClick={onDelete}>
                  {t('detail.delete')}
                </Button>
              </div>
            )}
          </div>
          {isAdmin && (
            <div className="md:hidden mt-3 grid grid-cols-3 gap-2">
              <Button type="button" variant="outline" size="sm" disabled={deleteMutation.isPending} onClick={() => navigate('/bareme/articles/nouveau')}>
                + {t('create.addArticle')}
              </Button>
              <Button type="button" variant="primary" size="sm" disabled={deleteMutation.isPending} onClick={() => navigate(`/bareme/articles/${articleId}/edit`)}>
                {t('detail.edit')}
              </Button>
              <Button type="button" variant="danger" size="sm" isLoading={deleteMutation.isPending} onClick={onDelete}>
                {t('detail.delete')}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* En-tête */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {article.libelle ?? article.reference ?? `#${article.id}`}
        </h1>
        <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {article.reference != null && article.reference !== '' && (
            <>
              <dt className="text-gray-500 dark:text-gray-400">{t('detail.reference')}</dt>
              <dd className="font-mono text-gray-900 dark:text-gray-100">{article.reference}</dd>
            </>
          )}
          <dt className="text-gray-500 dark:text-gray-400">{t('detail.unite')}</dt>
          <dd className="text-gray-900 dark:text-gray-100">{article.unite ?? article.unitePrestation ?? '—'}</dd>
          <dt className="text-gray-500 dark:text-gray-400">{t('detail.corpsEtat')}</dt>
          <dd className="text-gray-900 dark:text-gray-100">{article.corpsEtat?.libelle ?? '—'}</dd>
          <dt className="text-gray-500 dark:text-gray-400">{t('detail.famille')}</dt>
          <dd className="text-gray-900 dark:text-gray-100">{article.famille ?? '—'}</dd>
          <dt className="text-gray-500 dark:text-gray-400">{t('detail.categorie')}</dt>
          <dd className="text-gray-900 dark:text-gray-100">{article.categorie ?? '—'}</dd>
          <dt className="text-gray-500 dark:text-gray-400">{t('detail.type')}</dt>
          <dd>
            <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200">
              {typeLabel}
            </span>
          </dd>
        </dl>
      </div>

      {isMateriau && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('detail.prixDisponibles')}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {prixMateriauxNumeriques.length} / {prixFournisseurs.length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('detail.meilleurPrix')}</p>
            <p className="mt-2 text-2xl font-semibold text-success">
              {bestPrice != null ? formatMontant(bestPrice) : '—'}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('detail.prixMoyen')}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {avgPrice != null ? formatMontant(avgPrice) : '—'}
            </p>
          </div>
        </div>
      )}

      {/* Matériau : prix par fournisseur */}
      {isMateriau && prixFournisseurs.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
          <h2 className="px-6 py-4 text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">
            {t('detail.prixParFournisseur')}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t('detail.colFournisseur')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t('detail.colContact')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t('detail.colPrixTtc')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t('detail.colDatePrix')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-600">
                {sortedPrixFournisseurs.map((pf, idx) => {
                  const numericPrice = toNum(pf.prixTtc)
                  const isBest = numericPrice != null && bestPrice != null && numericPrice === bestPrice
                  const isWorst = numericPrice != null && worstPrice != null && numericPrice === worstPrice && bestPrice !== worstPrice
                  const isEstimated = pf.prixEstime === true
                  const priceClass = isEstimated
                    ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                    : isBest
                      ? 'text-success font-semibold'
                      : isWorst
                        ? 'text-danger font-semibold'
                        : 'text-gray-900 dark:text-gray-100'
                  return (
                  <tr key={pf.fournisseurId ?? idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{pf.fournisseurNom ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{pf.fournisseurContact ?? '—'}</td>
                    <td className={`px-6 py-4 text-sm text-right font-medium ${priceClass}`}>
                      {numericPrice != null ? formatMontant(numericPrice) : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{pf.datePrix ?? '—'}</td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isMateriau && prixFournisseurs.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('detail.noPrixFournisseur')}</p>
        </div>
      )}

      {/* Prestation : décomposition + total */}
      {!isMateriau && (
        <>
          {lignesPrestation.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
              <h2 className="px-6 py-4 text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600">
                {t('detail.decomposition')}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        {t('detail.colLibelle')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        {t('detail.colQuantite')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        {t('detail.colPrixUnitaire')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        {t('detail.colUnite')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        {t('detail.colSomme')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-600">
                    {lignesPrestation.map((ligne, idx) => {
                      const estime = ligne.prixEstime === true
                      const cellClass = estime ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : ''
                      return (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{ligne.libelle ?? '—'}</td>
                          <td className={`px-6 py-4 text-sm text-right text-gray-700 dark:text-gray-300 ${estime ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : ''}`}>
                            {ligne.quantite != null ? String(ligne.quantite) : '—'}
                          </td>
                          <td className={`px-6 py-4 text-sm text-right ${cellClass || 'text-gray-700 dark:text-gray-300'}`}>
                            {formatMontant(toNum(ligne.prixUnitaire))}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{ligne.unite ?? '—'}</td>
                          <td className={`px-6 py-4 text-sm text-right font-medium ${cellClass || 'text-gray-900 dark:text-gray-100'}`}>
                            {formatMontant(toNum(ligne.somme))}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {(article.debourse != null || article.prixVente != null) && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('detail.totaux')}</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">{t('detail.debourse')}</dt>
                  <dd className={`text-lg font-semibold mt-1 ${article.totauxEstimes ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-1.5 py-0.5 rounded' : 'text-gray-900 dark:text-gray-100'}`}>
                    {formatMontant(toNum(article.debourse))} {article.unitePrestation ? `(${article.unitePrestation})` : ''}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">{t('detail.prixVente')}</dt>
                  <dd className={`text-lg font-semibold mt-1 ${article.totauxEstimes ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-1.5 py-0.5 rounded' : 'text-gray-900 dark:text-gray-100'}`}>
                    {formatMontant(toNum(article.prixVente))}
                  </dd>
                </div>
                {article.coefficientPv != null && (
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">{t('detail.coefficientPv')}</dt>
                    <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
                      {String(article.coefficientPv)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </>
      )}

    </PageContainer>
  )
}
