import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useConfirm } from '@/contexts/ConfirmContext'
import { PageContainer } from '@/components/layout/PageContainer'
import { fetchEquipes, deleteEquipe } from '@/store/slices/equipeSlice'
import type { TypeEquipe } from '@/types/chantier'

export const EquipeListPage = () => {
  const { t } = useTranslation('equipe')
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const confirm = useConfirm()
  const { equipes, totalElements, totalPages, currentPage, loading } = useAppSelector((state) => state.equipe)

  const TYPE_LABELS = useMemo(
    () =>
      Object.fromEntries(
        (['TERRASSEMENT', 'VOIRIE', 'ASSAINISSEMENT', 'GENIE_CIVIL', 'BATIMENT', 'PONT', 'TOPOGRAPHIE', 'LABORATOIRE', 'MECANIQUE', 'POLYVALENTE'] as TypeEquipe[]).map(
          (key) => [key, t(`type.${key}`)]
        )
      ) as Record<TypeEquipe, string>,
    [t]
  )

  useEffect(() => {
    dispatch(fetchEquipes({ page: 0, size: 20 }))
  }, [dispatch])

  const handlePageChange = (page: number) => {
    dispatch(fetchEquipes({ page, size: 20 }))
  }

  const handleDelete = async (id: number, nom: string) => {
    if (await confirm({ messageKey: 'confirm.deactivateEquipe', messageParams: { name: nom } })) {
      await dispatch(deleteEquipe(id))
      dispatch(fetchEquipes({ page: currentPage, size: 20 }))
    }
  }

  return (
    <PageContainer size="wide" className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('list.title')}</h1>
          <p className="text-gray-500 mt-1">{t('list.totalCount', { count: totalElements })}</p>
        </div>
        <button
          onClick={() => navigate('/equipes/nouveau')}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {t('list.newTeam')}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">{t('list.loading')}</div>
      ) : equipes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">{t('list.emptyTitle')}</p>
          <p className="text-sm mt-2">{t('list.emptyHint')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('list.columns.code')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('list.columns.nom')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('list.columns.type')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('list.columns.effectif')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('list.columns.chefEquipe')}</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">{t('list.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {equipes.map((equipe) => (
                <tr
                  key={equipe.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/equipes/${equipe.id}`)}
                >
                  <td className="px-4 py-3 text-sm font-mono font-medium text-primary">{equipe.code}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{equipe.nom}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{TYPE_LABELS[equipe.type] ?? equipe.type}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{equipe.effectif}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {equipe.chefEquipe ? `${equipe.chefEquipe.prenom} ${equipe.chefEquipe.nom}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleDelete(equipe.id, equipe.nom)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      {t('list.delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t">
              <p className="text-sm text-gray-700">
                {t('list.pageInfo', { current: currentPage + 1, total: totalPages })}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                >
                  {t('list.prev')}
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                >
                  {t('list.next')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  )
}
