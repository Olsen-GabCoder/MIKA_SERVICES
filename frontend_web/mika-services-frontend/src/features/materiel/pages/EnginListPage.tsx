import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useConfirm } from '@/contexts/ConfirmContext'
import { PageContainer } from '@/components/layout/PageContainer'
import { fetchEngins, deleteEngin } from '@/store/slices/enginSlice'

const STATUT_COLORS: Record<string, string> = {
  DISPONIBLE: 'bg-green-100 text-green-800',
  EN_SERVICE: 'bg-blue-100 text-blue-800',
  EN_MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  EN_PANNE: 'bg-red-100 text-red-800',
  HORS_SERVICE: 'bg-gray-100 text-gray-800',
  EN_TRANSIT: 'bg-indigo-100 text-indigo-800',
}

export const EnginListPage = () => {
  const { t } = useTranslation('materiel')
  const dispatch = useAppDispatch()
  const confirm = useConfirm()
  const { engins, totalElements, totalPages, currentPage, loading } = useAppSelector((state) => state.engin)

  const STATUT_LABELS = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(STATUT_COLORS).map((statut) => [
          statut,
          { label: t(`engin.statut.${statut}`), color: STATUT_COLORS[statut] },
        ])
      ) as Record<string, { label: string; color: string }>,
    [t]
  )

  useEffect(() => {
    dispatch(fetchEngins({ page: 0, size: 20 }))
  }, [dispatch])

  const handlePageChange = (page: number) => {
    dispatch(fetchEngins({ page, size: 20 }))
  }

  const handleDelete = async (id: number, nom: string) => {
    if (await confirm({ messageKey: 'confirm.deactivateEngin', messageParams: { name: nom } })) {
      await dispatch(deleteEngin(id))
      dispatch(fetchEngins({ page: currentPage, size: 20 }))
    }
  }

  return (
    <PageContainer size="wide" className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('engin.title')}</h1>
          <p className="text-gray-500 mt-1">{t('engin.totalCount', { count: totalElements })}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">{t('engin.loading')}</div>
      ) : engins.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">{t('engin.empty')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('engin.columns.code')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('engin.columns.nom')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('engin.columns.type')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('engin.columns.marque')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('engin.columns.immatriculation')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('engin.columns.statut')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('engin.columns.location')}</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">{t('engin.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {engins.map((engin) => (
                <tr key={engin.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono font-medium text-primary">{engin.code}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{engin.nom}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{engin.type}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{engin.marque || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{engin.immatriculation || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUT_LABELS[engin.statut]?.color || 'bg-gray-100'}`}>
                      {STATUT_LABELS[engin.statut]?.label || engin.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{engin.estLocation ? t('engin.yes') : t('engin.no')}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleDelete(engin.id, engin.nom)} className="text-red-600 hover:text-red-800 text-sm">{t('engin.delete')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t">
              <p className="text-sm text-gray-700">{t('engin.pageInfo', { current: currentPage + 1, total: totalPages })}</p>
              <div className="flex gap-2">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0} className="px-3 py-1 text-sm border rounded disabled:opacity-50">{t('engin.prev')}</button>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages - 1} className="px-3 py-1 text-sm border rounded disabled:opacity-50">{t('engin.next')}</button>
              </div>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  )
}
