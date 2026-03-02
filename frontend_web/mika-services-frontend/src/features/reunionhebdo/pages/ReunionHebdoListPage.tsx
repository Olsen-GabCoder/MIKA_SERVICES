import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useConfirm } from '@/contexts/ConfirmContext'
import { PageContainer } from '@/components/layout/PageContainer'
import { reunionHebdoApi } from '@/api/reunionHebdoApi'
import type { ReunionHebdoSummary, StatutReunion } from '@/types/reunionHebdo'
import { useFormatDate } from '@/hooks/useFormatDate'

const STATUT_COLORS: Record<StatutReunion, string> = {
  BROUILLON: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200',
  VALIDE: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200',
}

export const ReunionHebdoListPage = () => {
  const { t } = useTranslation('reunionHebdo')
  const formatDate = useFormatDate()
  const navigate = useNavigate()
  const confirm = useConfirm()

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '-'
    const [h, m] = timeStr.split(':')
    return `${h}h${m || '00'}`
  }

  const STATUT_LABELS = useMemo(
    () =>
      Object.fromEntries(
        (['BROUILLON', 'VALIDE'] as StatutReunion[]).map((statut) => [
          statut,
          { label: t(`statut.${statut}`), color: STATUT_COLORS[statut] },
        ])
      ) as Record<StatutReunion, { label: string; color: string }>,
    [t]
  )
  const [reunions, setReunions] = useState<ReunionHebdoSummary[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    reunionHebdoApi
      .findAll(0, 20)
      .then((res) => {
        setReunions(res.content)
        setTotalElements(res.totalElements)
        setTotalPages(res.totalPages)
        setCurrentPage(res.number)
      })
      .catch(() => setReunions([]))
      .finally(() => setLoading(false))
  }, [])

  const handlePageChange = (page: number) => {
    setLoading(true)
    reunionHebdoApi
      .findAll(page, 20)
      .then((res) => {
        setReunions(res.content)
        setTotalElements(res.totalElements)
        setTotalPages(res.totalPages)
        setCurrentPage(res.number)
      })
      .finally(() => setLoading(false))
  }

  const handleDelete = async (id: number, dateStr: string) => {
    if (await confirm({ messageKey: 'confirm.deleteReunion', messageParams: { date: formatDate(dateStr, { weekday: 'short', monthStyle: 'short' }) } })) {
      await reunionHebdoApi.delete(id)
      setReunions((prev) => prev.filter((r) => r.id !== id))
      setTotalElements((prev) => Math.max(0, prev - 1))
    }
  }

  return (
    <PageContainer size="wide">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('list.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('list.totalCount', { count: totalElements })}</p>
        </div>
        <button
          onClick={() => navigate('/reunions-hebdo/nouveau')}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {t('list.newMeeting')}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">{t('list.loading')}</div>
      ) : reunions.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 p-8">
          <p className="text-lg dark:text-gray-100">{t('list.emptyTitle')}</p>
          <p className="text-sm mt-2 dark:text-gray-300">{t('list.emptyHint')}</p>
          <button
            onClick={() => navigate('/reunions-hebdo/nouveau')}
            className="mt-4 bg-primary text-white px-4 py-2 rounded-lg"
          >
            {t('list.createButton')}
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">{t('list.columns.date')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">{t('list.columns.lieu')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">{t('list.columns.heure')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">{t('list.columns.redacteur')}</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">{t('list.columns.participants')}</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">{t('list.columns.pointsProjet')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">{t('list.columns.statut')}</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">{t('list.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-600">
              {reunions.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/70 cursor-pointer"
                  onClick={() => navigate(`/reunions-hebdo/${r.id}`)}
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(r.dateReunion, { weekday: 'short', monthStyle: 'short' })}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{r.lieu || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {formatTime(r.heureDebut)} - {formatTime(r.heureFin)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{r.redacteurNom || '-'}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">{r.nombreParticipants}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">{r.nombrePointsProjet}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${STATUT_LABELS[r.statut]?.color || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
                    >
                      {STATUT_LABELS[r.statut]?.label || r.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(`/reunions-hebdo/${r.id}`)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm mr-3"
                    >
                      {t('list.viewPV')}
                    </button>
                    <button
                      onClick={() => navigate(`/reunions-hebdo/${r.id}/edit`)}
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm mr-3"
                    >
                      {t('list.edit')}
                    </button>
                    <button
                      onClick={() => handleDelete(r.id, r.dateReunion)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
                    >
                      {t('list.delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t dark:border-gray-600">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {t('list.pageInfo', { current: currentPage + 1, total: totalPages })}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  {t('list.prev')}
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700 dark:text-gray-100"
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
