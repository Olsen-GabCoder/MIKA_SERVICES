import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useConfirm } from '@/contexts/ConfirmContext'
import { PageContainer } from '@/components/layout/PageContainer'
import {
  fetchMouvements,
  confirmerDepartMouvement,
  confirmerReceptionMouvement,
  annulerMouvement,
} from '@/store/slices/mouvementEnginSlice'
import { MaterielEmptyState, MaterielPagination } from '../components/MaterielListChrome'
import { MaterielModuleTabs } from '../components/MaterielModuleTabs'
import { MouvementEnginCreateModal } from '../components/MouvementEnginCreateModal'
import type { StatutMouvementEngin } from '@/types/materiel'

const ALL_STATUTS: StatutMouvementEngin[] = ['EN_ATTENTE_DEPART', 'EN_TRANSIT', 'RECU', 'ANNULE']

const STATUT_STYLE: Record<StatutMouvementEngin, string> = {
  EN_ATTENTE_DEPART: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/40 text-amber-700 dark:text-amber-400',
  EN_TRANSIT: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700/40 text-indigo-700 dark:text-indigo-400',
  RECU: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/40 text-green-700 dark:text-green-400',
  ANNULE: 'bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400',
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100 dark:border-gray-700/40">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-3 py-3">
          <div className="h-3.5 bg-gray-200 dark:bg-gray-600/60 rounded-full w-full max-w-[8rem] animate-pulse" />
        </td>
      ))}
    </tr>
  )
}

// Modal léger de confirmation avec champ commentaire
function ActionConfirmModal({
  title,
  message,
  confirmLabel,
  confirmClass,
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  confirmLabel: string
  confirmClass: string
  onConfirm: (commentaire: string) => void
  onCancel: () => void
}) {
  const { t } = useTranslation('materiel')
  const [commentaire, setCommentaire] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <div className="px-6 py-4 space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{t('mouvement.commentaire')}</label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder={t('mouvement.commentairePlaceholder')}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            {t('form.cancel')}
          </button>
          <button type="button" onClick={() => onConfirm(commentaire)} className={`px-5 py-2 rounded-xl text-white text-sm font-bold transition-colors shadow-sm ${confirmClass}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

type PendingAction = { type: 'depart' | 'reception' | 'annuler'; mouvementId: number; label: string }

export function MouvementEnginListPage() {
  const { t, i18n } = useTranslation('materiel')
  const dispatch = useAppDispatch()
  const confirm = useConfirm()
  const { mouvements, totalElements, totalPages, currentPage, loading, actionLoading, error } = useAppSelector((s) => s.mouvementEngin)

  const [filterStatut, setFilterStatut] = useState<StatutMouvementEngin | ''>('')
  const [pageSize, setPageSize] = useState(20)
  const [showCreate, setShowCreate] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  const fetchPage = (page = 0) => {
    dispatch(fetchMouvements({ page, size: pageSize, statut: filterStatut || undefined }))
  }

  useEffect(() => { fetchPage(0) }, [filterStatut, pageSize]) // eslint-disable-line react-hooks/exhaustive-deps

  const hasActiveFilters = filterStatut !== ''

  const resetFilters = () => setFilterStatut('')

  const handleAction = async (commentaire: string) => {
    if (!pendingAction) return
    const { type, mouvementId } = pendingAction
    setPendingAction(null)
    const body = commentaire.trim() ? { commentaire: commentaire.trim() } : undefined
    if (type === 'depart') await dispatch(confirmerDepartMouvement({ id: mouvementId, body }))
    else if (type === 'reception') await dispatch(confirmerReceptionMouvement({ id: mouvementId, body }))
    else await dispatch(annulerMouvement({ id: mouvementId, body }))
  }

  const paginationRangeLabel = t('list.paginationRange', {
    from: totalElements === 0 ? 0 : currentPage * pageSize + 1,
    to: Math.min((currentPage + 1) * pageSize, totalElements),
    total: totalElements,
  })

  return (
    <PageContainer size="full" className="h-full flex flex-col min-h-0 bg-gray-50/80 dark:bg-gray-900/80">
      {/* Hero header */}
      <div className="shrink-0 mb-6">
        <div className="relative overflow-hidden rounded-2xl shadow-xl shadow-primary/10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-secondary" />
          <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="relative z-10 px-6 py-7 md:py-9">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-lg flex-shrink-0 backdrop-blur-sm">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 10-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 10-3 0m3 0h-9m-9-3h9m-9 3v-4.5m0 4.5h-.375a1.125 1.125 0 01-1.125-1.125V9.75m18 0v8.25m0 0h.375a1.125 1.125 0 001.125-1.125V9.75m-14.25 6.375h3m-3-4.5h9" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{t('mouvement.title')}</h1>
                  <p className="text-white/75 text-sm font-medium mt-1">{t('mouvement.hero')}</p>
                  <MaterielModuleTabs />
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                {totalElements > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15">
                    <p className="text-[10px] text-white/60 font-medium">{t('list.statRecords')}</p>
                    <p className="text-sm font-bold text-white">{totalElements.toLocaleString(i18n.language)}</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-primary font-bold text-sm shadow-md hover:bg-white/90 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  {t('mouvement.create')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-5">
        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{t('list.filters')}</p>
              {hasActiveFilters && <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold">{t('list.active')}</span>}
            </div>
            {hasActiveFilters && (
              <button type="button" onClick={resetFilters} className="text-xs font-semibold text-primary dark:text-primary-light hover:text-primary-dark transition-colors shrink-0">
                {t('list.reset')} ×
              </button>
            )}
          </div>
          <div className="p-5">
            <div className="max-w-xs">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{t('mouvement.filterStatut')}</label>
              <select
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value as StatutMouvementEngin | '')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">{t('engin.filterAll')}</option>
                {ALL_STATUTS.map((s) => (
                  <option key={s} value={s}>{t(`mouvement.statut.${s}`)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 dark:border-red-700/60 bg-red-50 dark:bg-red-900/20 px-5 py-4 shadow-sm">
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
          </div>
        )}

        {/* Tableau */}
        {!error && (
          <div className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60 flex items-center gap-2.5">
              <p className="text-sm font-bold text-gray-900 dark:text-white">{t('mouvement.tableTitle')}</p>
              {!loading && mouvements.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-bold">{totalElements}</span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]" role="table">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-gray-700/50">
                    {([
                      t('mouvement.col.engin'),
                      t('mouvement.col.origine'),
                      t('mouvement.col.destination'),
                      t('mouvement.col.statut'),
                      t('mouvement.col.date'),
                      t('mouvement.col.initiateur'),
                      t('engin.actions'),
                    ] as const).map((label) => (
                      <th key={label} scope="col" className="px-3 py-3.5 text-left border-b border-gray-100 dark:border-gray-700/60">
                        <span className="text-[10px] font-black tracking-widest uppercase text-gray-500 dark:text-gray-400">{label}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
                  {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
                  {!loading && mouvements.map((m) => {
                    const isActing = actionLoading === m.id
                    return (
                      <tr key={m.id} className="group hover:bg-primary/[0.02] dark:hover:bg-primary/[0.05] transition-colors duration-150">
                        {/* Engin */}
                        <td className="px-3 py-3 align-middle border-b border-gray-100 dark:border-gray-700/40">
                          <p className="font-mono text-xs text-primary dark:text-primary-light font-semibold">{m.enginCode}</p>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-[10rem]">{m.enginNom}</p>
                        </td>
                        {/* Origine */}
                        <td className="px-3 py-3 align-middle text-sm text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700/40">
                          {m.projetOrigineNom ?? <span className="italic text-gray-400 dark:text-gray-500">{t('detail.depot')}</span>}
                        </td>
                        {/* Destination */}
                        <td className="px-3 py-3 align-middle text-sm font-medium text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700/40">
                          {m.projetDestinationNom}
                        </td>
                        {/* Statut */}
                        <td className="px-3 py-3 align-middle border-b border-gray-100 dark:border-gray-700/40">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-bold ${STATUT_STYLE[m.statut]}`}>
                            {t(`mouvement.statut.${m.statut}`)}
                          </span>
                        </td>
                        {/* Date */}
                        <td className="px-3 py-3 align-middle text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700/40 whitespace-nowrap">
                          {new Date(m.dateDemande).toLocaleDateString()}
                          {m.dateDepartConfirmee && (
                            <p className="text-[10px] text-indigo-500 dark:text-indigo-400">{t('mouvement.depart')} {new Date(m.dateDepartConfirmee).toLocaleDateString()}</p>
                          )}
                          {m.dateReceptionConfirmee && (
                            <p className="text-[10px] text-green-600 dark:text-green-400">{t('mouvement.reception')} {new Date(m.dateReceptionConfirmee).toLocaleDateString()}</p>
                          )}
                        </td>
                        {/* Initiateur */}
                        <td className="px-3 py-3 align-middle text-sm text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700/40">
                          {m.initiateurNom}
                        </td>
                        {/* Actions */}
                        <td className="px-3 py-3 align-middle border-b border-gray-100 dark:border-gray-700/40">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {m.statut === 'EN_ATTENTE_DEPART' && (
                              <>
                                <button
                                  type="button"
                                  disabled={isActing}
                                  onClick={() => setPendingAction({ type: 'depart', mouvementId: m.id, label: t('mouvement.action.confirmDepart') })}
                                  className="px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-700/50 bg-indigo-50/80 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/35 disabled:opacity-50 transition-all"
                                >
                                  {t('mouvement.action.confirmDepart')}
                                </button>
                                <button
                                  type="button"
                                  disabled={isActing}
                                  onClick={() => setPendingAction({ type: 'annuler', mouvementId: m.id, label: t('mouvement.action.annuler') })}
                                  className="px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-700/50 bg-red-50/80 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/35 disabled:opacity-50 transition-all"
                                >
                                  {t('mouvement.action.annuler')}
                                </button>
                              </>
                            )}
                            {m.statut === 'EN_TRANSIT' && (
                              <button
                                type="button"
                                disabled={isActing}
                                onClick={() => setPendingAction({ type: 'reception', mouvementId: m.id, label: t('mouvement.action.confirmReception') })}
                                className="px-2.5 py-1.5 rounded-lg border border-green-200 dark:border-green-700/50 bg-green-50/80 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-bold hover:bg-green-100 dark:hover:bg-green-900/35 disabled:opacity-50 transition-all"
                              >
                                {isActing ? '…' : t('mouvement.action.confirmReception')}
                              </button>
                            )}
                            {(m.statut === 'RECU' || m.statut === 'ANNULE') && (
                              <span className="text-xs text-gray-400 dark:text-gray-500 italic">{t('mouvement.terminal')}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {!loading && mouvements.length === 0 && (
              <MaterielEmptyState
                hasFilters={hasActiveFilters}
                onReset={resetFilters}
                labelNoData={t('mouvement.emptyNoData')}
                labelNoResults={t('list.emptyNoResults')}
                hintNoData={t('mouvement.emptyNoDataHint')}
                hintNoResults={t('list.emptyNoResultsHint')}
                labelReset={t('list.resetFilters')}
              />
            )}
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <MaterielPagination
            currentPage={currentPage}
            totalPages={totalPages}
            size={pageSize}
            onPageChange={(p) => fetchPage(p)}
            onSizeChange={(s) => setPageSize(s)}
            labelRange={paginationRangeLabel}
            labelPrev={t('list.paginationPrev')}
            labelNext={t('list.paginationNext')}
            labelPerPage={t('list.perPage')}
          />
        )}

        <div className="h-4" />
      </div>

      {/* Modal création */}
      {showCreate && (
        <MouvementEnginCreateModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); fetchPage(0) }}
        />
      )}

      {/* Modal action */}
      {pendingAction && (
        <ActionConfirmModal
          title={pendingAction.label}
          message={
            pendingAction.type === 'annuler'
              ? t('mouvement.confirmAnnuler')
              : pendingAction.type === 'depart'
              ? t('mouvement.confirmDepart')
              : t('mouvement.confirmReception')
          }
          confirmLabel={pendingAction.label}
          confirmClass={
            pendingAction.type === 'annuler'
              ? 'bg-red-500 hover:bg-red-600'
              : pendingAction.type === 'depart'
              ? 'bg-indigo-600 hover:bg-indigo-700'
              : 'bg-green-600 hover:bg-green-700'
          }
          onConfirm={handleAction}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </PageContainer>
  )
}
