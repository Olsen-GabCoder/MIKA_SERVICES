import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchBudgetSummary } from '@/store/slices/budgetSlice'
import { fetchProjets } from '@/store/slices/projetSlice'
import { PageContainer } from '@/components/layout/PageContainer'

export const BudgetPage = () => {
  const { t, i18n } = useTranslation('budget')
  const dispatch = useAppDispatch()
  const { budgetSummary } = useAppSelector((state) => state.budget)
  const { projets } = useAppSelector((state) => state.projet)
  const [selectedProjetId, setSelectedProjetId] = useState<number | null>(null)
  const locale = i18n.language === 'en' ? 'en-GB' : 'fr-FR'
  const formatMontant = (montant?: number) => {
    if (!montant && montant !== 0) return '-'
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(montant)
  }

  useEffect(() => {
    dispatch(fetchProjets({ page: 0, size: 100 }))
  }, [dispatch])

  useEffect(() => {
    if (selectedProjetId) {
      dispatch(fetchBudgetSummary(selectedProjetId))
    }
  }, [dispatch, selectedProjetId])

  return (
    <PageContainer size="wide" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t('subtitle')}</p>
      </div>

      {/* Sélection du projet */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('selectProject')}</label>
        <select
          value={selectedProjetId || ''}
          onChange={(e) => setSelectedProjetId(e.target.value ? Number(e.target.value) : null)}
          className="w-full max-w-md px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">{t('chooseProject')}</option>
          {projets.map((p) => (
            <option key={p.id} value={p.id}>{p.nom}</option>
          ))}
        </select>
      </div>

      {!selectedProjetId ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">{t('selectProjectHint')}</div>
      ) : !budgetSummary ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">{t('loading')}</div>
      ) : (
        <div className="space-y-6">
          {/* Cards résumé */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-600 p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('budgetReference')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{formatMontant(budgetSummary.montantRevise || budgetSummary.montantHT)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-600 p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('totalDepenses')}</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{formatMontant(budgetSummary.totalDepenses)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-600 p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('budgetRestant')}</p>
              <p className={`text-2xl font-bold mt-1 ${budgetSummary.budgetRestant >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatMontant(budgetSummary.budgetRestant)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-600 p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('tauxConsommation')}</p>
              <div className="mt-2">
                <p className="text-2xl font-bold text-primary">{budgetSummary.tauxConsommation}%</p>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                  <div
                    className={`rounded-full h-2 ${budgetSummary.tauxConsommation > 90 ? 'bg-red-500' : budgetSummary.tauxConsommation > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(budgetSummary.tauxConsommation, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dépenses par type */}
          {Object.keys(budgetSummary.depensesParType).length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-600 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('repartitionTitle')}</h2>
              <div className="space-y-3">
                {Object.entries(budgetSummary.depensesParType).map(([type, montant]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{t(`type.${type}`) || type}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatMontant(montant)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  )
}
