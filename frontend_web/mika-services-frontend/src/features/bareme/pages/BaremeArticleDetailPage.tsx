import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/layout/PageContainer'
import { useBaremeArticle, useCoefficientsEloignement } from '../hooks/useBaremeQueries'
import { TypeLigneBareme } from '../types'
import { useFormatNumber } from '@/hooks/useFormatNumber'
import type { BaremeListParams } from '../hooks/useBaremeListParams'

function buildListSearchParams(params: BaremeListParams): string {
  const sp = new URLSearchParams()
  if (params.page > 0) sp.set('page', String(params.page))
  if (params.size !== 20) sp.set('size', String(params.size))
  if (params.corpsEtatId != null) sp.set('corpsEtatId', String(params.corpsEtatId))
  if (params.type != null) sp.set('type', params.type)
  if (params.recherche.trim()) sp.set('recherche', params.recherche.trim())
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
  const articleId = id != null ? parseInt(id, 10) : null
  const { data: article, isLoading, isError } = useBaremeArticle(articleId)
  const { data: coefficientsList = [] } = useCoefficientsEloignement()
  const [selectedCoeffId, setSelectedCoeffId] = useState<number | null>(null)
  const fromListParams = location.state as { fromListParams?: BaremeListParams } | null
  const selectedCoeff = selectedCoeffId != null ? coefficientsList.find((c) => c.id === selectedCoeffId) : null

  const goBack = () => {
    if (fromListParams?.fromListParams) {
      navigate(`/bareme${buildListSearchParams(fromListParams.fromListParams)}`)
    } else {
      navigate('/bareme')
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

  return (
    <PageContainer size="full" className="min-h-full bg-gray-50/80 dark:bg-gray-900/80 space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={goBack}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-1"
        >
          ← {t('detail.backToList')}
        </button>
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
          <dt className="text-gray-500 dark:text-gray-400">{t('detail.type')}</dt>
          <dd>
            <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200">
              {typeLabel}
            </span>
          </dd>
        </dl>
      </div>

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
                {prixFournisseurs.map((pf, idx) => (
                  <tr key={pf.fournisseurId ?? idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{pf.fournisseurNom ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{pf.fournisseurContact ?? '—'}</td>
                    <td className={`px-6 py-4 text-sm text-right font-medium ${pf.prixEstime ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : 'text-gray-900 dark:text-gray-100'}`}>
                      {formatMontant(toNum(pf.prixTtc))}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{pf.datePrix ?? '—'}</td>
                  </tr>
                ))}
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

      {/* Coefficient d'éloignement : sélecteur + prix avec éloignement */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('detail.eloignementTitle')}</h2>
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-0 flex-1 sm:max-w-xs">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{t('detail.eloignementLocalite')}</label>
            <select
              value={selectedCoeffId ?? ''}
              onChange={(e) => setSelectedCoeffId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">{t('detail.eloignementNone')}</option>
              {coefficientsList.map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>
        </div>
        {selectedCoeff && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('detail.eloignementCoeff')}: <strong className="text-gray-900 dark:text-gray-100">{selectedCoeff.coefficient}</strong>
              {selectedCoeff.pourcentage != null && (
                <span className="ml-2">({t('detail.eloignementPourcent', { pct: selectedCoeff.pourcentage })})</span>
              )}
              {selectedCoeff.note && <span className="ml-2 text-gray-500 dark:text-gray-500">— {selectedCoeff.note}</span>}
            </p>
            {isMateriau && prixFournisseurs.length > 0 && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">{t('detail.colFournisseur')}</th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">{t('detail.colPrixTtc')}</th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">{t('detail.eloignementPrixCol')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-600">
                    {prixFournisseurs.map((pf, idx) => {
                      const prix = toNum(pf.prixTtc)
                      const avecEloignement = prix != null ? prix * selectedCoeff.coefficient : null
                      const estime = pf.prixEstime === true
                      const priceCellClass = estime ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : ''
                      return (
                        <tr key={pf.fournisseurId ?? idx}>
                          <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{pf.fournisseurNom ?? '—'}</td>
                          <td className={`px-4 py-2 text-right ${priceCellClass || 'text-gray-700 dark:text-gray-300'}`}>{formatMontant(prix)}</td>
                          <td className={`px-4 py-2 text-right font-medium ${priceCellClass || 'text-gray-900 dark:text-gray-100'}`}>{formatMontant(avecEloignement)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {!isMateriau && (() => {
              const pv = toNum(article.prixVente)
              if (pv == null) return null
              return (
                <p className="mt-3 text-sm">
                  {t('detail.eloignementPvLabel')}:{' '}
                  <strong className={article.totauxEstimes ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-1 rounded' : 'text-gray-900 dark:text-gray-100'}>
                    {formatMontant(pv * selectedCoeff.coefficient)}
                  </strong>
                </p>
              )
            })()}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
