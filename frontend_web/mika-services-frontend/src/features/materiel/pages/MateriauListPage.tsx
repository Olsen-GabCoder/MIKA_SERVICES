import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useConfirm } from '@/contexts/ConfirmContext'
import { PageContainer } from '@/components/layout/PageContainer'
import { fetchMateriaux, deleteMateriau } from '@/store/slices/materiauSlice'

export const MateriauListPage = () => {
  const { t } = useTranslation('materiel')
  const dispatch = useAppDispatch()
  const confirm = useConfirm()
  const { materiaux, totalElements, totalPages, currentPage, loading } = useAppSelector((state) => state.materiau)

  useEffect(() => {
    dispatch(fetchMateriaux({ page: 0, size: 20 }))
  }, [dispatch])

  const handlePageChange = (page: number) => {
    dispatch(fetchMateriaux({ page, size: 20 }))
  }

  const handleDelete = async (id: number, nom: string) => {
    if (await confirm({ messageKey: 'confirm.deactivateMateriau', messageParams: { name: nom } })) {
      await dispatch(deleteMateriau(id))
      dispatch(fetchMateriaux({ page: currentPage, size: 20 }))
    }
  }

  return (
    <PageContainer size="wide" className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('materiau.title')}</h1>
          <p className="text-gray-500 mt-1">{t('materiau.totalCount', { count: totalElements })}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">{t('materiau.loading')}</div>
      ) : materiaux.length === 0 ? (
        <div className="text-center py-12 text-gray-500">{t('materiau.empty')}</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('materiau.columns.code')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('materiau.columns.nom')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('materiau.columns.type')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('materiau.columns.unite')}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">{t('materiau.columns.stockActuel')}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">{t('materiau.columns.stockMin')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('materiau.columns.alerte')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('materiau.columns.fournisseur')}</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">{t('materiau.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {materiaux.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono font-medium text-primary">{m.code}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{m.nom}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{m.type}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{m.unite}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{m.stockActuel}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600">{m.stockMinimum}</td>
                  <td className="px-4 py-3">
                    {m.stockBas ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">{t('materiau.alertStockBas')}</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">{t('materiau.alertOk')}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{m.fournisseur || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleDelete(m.id, m.nom)} className="text-red-600 hover:text-red-800 text-sm">{t('materiau.delete')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t">
              <p className="text-sm text-gray-700">{t('materiau.pageInfo', { current: currentPage + 1, total: totalPages })}</p>
              <div className="flex gap-2">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0} className="px-3 py-1 text-sm border rounded disabled:opacity-50">{t('materiau.prev')}</button>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages - 1} className="px-3 py-1 text-sm border rounded disabled:opacity-50">{t('materiau.next')}</button>
              </div>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  )
}
