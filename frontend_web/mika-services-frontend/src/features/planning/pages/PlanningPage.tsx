import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useConfirm } from '@/contexts/ConfirmContext'
import {
  fetchTachesByProjet,
  fetchTachesEnRetard,
  createTache,
  updateTache,
  deleteTache,
} from '@/store/slices/planningSlice'
import { fetchProjetsByResponsable } from '@/store/slices/projetSlice'
import { PageContainer } from '@/components/layout/PageContainer'
import { StatutTache, Priorite } from '@/types/planning'
import type { TacheCreateRequest, TacheUpdateRequest, Tache } from '@/types/planning'
import { useFormatDate } from '@/hooks/useFormatDate'

const statutColors: Record<StatutTache, string> = {
  [StatutTache.A_FAIRE]: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-200 dark:border-slate-600',
  [StatutTache.EN_COURS]: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/50 dark:text-sky-200 dark:border-sky-600',
  [StatutTache.EN_ATTENTE]: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-200 dark:border-amber-600',
  [StatutTache.TERMINEE]: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-200 dark:border-emerald-600',
  [StatutTache.ANNULEE]: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-200 dark:border-red-600',
}

const statutBorderColors: Record<StatutTache, string> = {
  [StatutTache.A_FAIRE]: 'border-l-slate-400',
  [StatutTache.EN_COURS]: 'border-l-sky-500',
  [StatutTache.EN_ATTENTE]: 'border-l-amber-500',
  [StatutTache.TERMINEE]: 'border-l-emerald-500',
  [StatutTache.ANNULEE]: 'border-l-red-500',
}

const prioriteColors: Record<Priorite, string> = {
  [Priorite.BASSE]: 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300',
  [Priorite.NORMALE]: 'bg-sky-100 text-sky-600 dark:bg-sky-900/50 dark:text-sky-300',
  [Priorite.HAUTE]: 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-300',
  [Priorite.URGENTE]: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300',
  [Priorite.CRITIQUE]: 'bg-red-200 text-red-800 dark:bg-red-900/70 dark:text-red-100',
}


/** Carte KPI avec valeur, libellé et style distinct */
function KpiCard({
  value,
  label,
  subLabel,
  variant,
}: {
  value: number
  label: string
  subLabel?: string
  variant: 'total' | 'aFaire' | 'enCours' | 'terminees' | 'enRetard'
}) {
  const variants = {
    total: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 shadow-sm',
    aFaire: 'bg-white dark:bg-gray-800 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 shadow-sm',
    enCours: 'bg-white dark:bg-gray-800 border-sky-200 dark:border-sky-600 text-sky-800 dark:text-sky-200 shadow-sm',
    terminees: 'bg-white dark:bg-gray-800 border-emerald-200 dark:border-emerald-600 text-emerald-800 dark:text-emerald-200 shadow-sm',
    enRetard: 'bg-white dark:bg-gray-800 border-red-200 dark:border-red-600 text-red-800 dark:text-red-200 shadow-sm',
  }
  const valueColors = {
    total: 'text-gray-900 dark:text-gray-100',
    aFaire: 'text-slate-700 dark:text-slate-200',
    enCours: 'text-sky-600 dark:text-sky-300',
    terminees: 'text-emerald-600 dark:text-emerald-300',
    enRetard: 'text-red-600 dark:text-red-300',
  }
  return (
    <div className={`rounded-2xl border-2 p-6 transition hover:shadow-md ${variants[variant]}`}>
      <p className={`text-3xl font-bold tabular-nums tracking-tight ${valueColors[variant]}`}>{value}</p>
      <p className="mt-1 text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{label}</p>
      {subLabel && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{subLabel}</p>}
    </div>
  )
}

export default function PlanningPage() {
  const { t } = useTranslation('planning')
  const formatDate = useFormatDate()
  const dispatch = useAppDispatch()
  const confirm = useConfirm()
  const currentUser = useAppSelector((state) => state.auth.user)
  const { taches, tachesEnRetard, loading, error, totalPages, currentPage } = useAppSelector(
    (state) => state.planning
  )
  const mesProjets = useAppSelector((state) => state.projet.mesProjets)

  const [selectedProjetId, setSelectedProjetId] = useState<number | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filterStatut, setFilterStatut] = useState<StatutTache | ''>('')

  const [newTitre, setNewTitre] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newPriorite, setNewPriorite] = useState<Priorite>(Priorite.NORMALE)
  const [newDateEcheance, setNewDateEcheance] = useState('')

  useEffect(() => {
    if (currentUser?.id) {
      dispatch(fetchProjetsByResponsable(currentUser.id))
      dispatch(fetchTachesEnRetard())
    }
  }, [dispatch, currentUser?.id])

  useEffect(() => {
    if (selectedProjetId) {
      dispatch(fetchTachesByProjet({ projetId: selectedProjetId }))
    }
  }, [dispatch, selectedProjetId])

  const handleCreate = async () => {
    if (!selectedProjetId || !newTitre.trim()) return
    const request: TacheCreateRequest = {
      projetId: selectedProjetId,
      titre: newTitre.trim(),
      description: newDescription.trim() || undefined,
      priorite: newPriorite,
      dateEcheance: newDateEcheance || undefined,
    }
    await dispatch(createTache(request))
    setShowCreateModal(false)
    resetForm()
    dispatch(fetchTachesByProjet({ projetId: selectedProjetId }))
    dispatch(fetchTachesEnRetard())
  }

  const handleStatusChange = async (tache: Tache, newStatut: StatutTache) => {
    const request: TacheUpdateRequest = { statut: newStatut }
    await dispatch(updateTache({ id: tache.id, request }))
    if (selectedProjetId) dispatch(fetchTachesByProjet({ projetId: selectedProjetId }))
    dispatch(fetchTachesEnRetard())
  }

  const handleDelete = async (id: number) => {
    if (!(await confirm({ messageKey: 'confirm.deleteTask' }))) return
    await dispatch(deleteTache(id))
    if (selectedProjetId) dispatch(fetchTachesByProjet({ projetId: selectedProjetId }))
    dispatch(fetchTachesEnRetard())
  }

  const resetForm = () => {
    setNewTitre('')
    setNewDescription('')
    setNewPriorite(Priorite.NORMALE)
    setNewDateEcheance('')
  }

  const filteredTaches = filterStatut ? taches.filter((t) => t.statut === filterStatut) : taches

  const kpiCounts = {
    total: taches.length,
    aFaire: taches.filter((t) => t.statut === StatutTache.A_FAIRE).length,
    enCours: taches.filter((t) => t.statut === StatutTache.EN_COURS).length,
    terminees: taches.filter((t) => t.statut === StatutTache.TERMINEE).length,
    enRetard: tachesEnRetard.length,
  }

  return (
    <PageContainer size="full" className="bg-gray-50/80 dark:bg-transparent">
      {/* En-tête premium */}
      <header className="rounded-2xl bg-gradient-to-br from-primary to-primary-dark dark:from-gray-800 dark:to-gray-900 dark:ring-1 dark:ring-primary/40 text-white shadow-lg mb-6 overflow-hidden">
        <div className="px-6 py-6 md:py-8">
          <p className="text-white/90 text-sm uppercase tracking-wider font-medium">
            {t('headerSubtitle')}
          </p>
          <h1 className="text-2xl md:text-3xl font-bold mt-1 leading-tight">
            {t('title')}
          </h1>
          <p className="text-white/80 text-sm mt-2 max-w-2xl">
            {t('headerHint')}
          </p>
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 px-5 py-4 text-red-700 dark:text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Droits : accès réservé aux chefs de projet (projets dont l'utilisateur est responsable) */}
      {currentUser == null ? (
        <section className="rounded-2xl border-2 border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30 p-8 text-center">
          <p className="text-amber-800 dark:text-amber-200 font-medium">{t('loginRequired')}</p>
        </section>
      ) : mesProjets.length === 0 ? (
        <section className="rounded-2xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-gray-800 p-8 text-center shadow-sm">
          <p className="text-slate-700 dark:text-slate-200 font-medium">{t('noProjects')}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('noProjectsHint')}</p>
        </section>
      ) : (
        <>
          {/* Sélection projet — uniquement « mes projets » */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                {t('myProjectsTitle')}
              </h2>
            </div>
            <div className="p-5">
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={selectedProjetId ?? ''}
                  onChange={(e) => setSelectedProjetId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full sm:min-w-[280px] px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-primary transition"
                >
                  <option value="">{t('chooseProject')}</option>
                  {mesProjets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nom}
                    </option>
                  ))}
                </select>
                {selectedProjetId && (
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition shadow-sm"
                  >
                    <span className="text-lg leading-none">+</span>
                    {t('newTask')}
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Section Indicateurs — rendu ultra premium */}
          {selectedProjetId && (
            <section className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('indicatorsTitle')}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <KpiCard value={kpiCounts.total} label={t('kpiTotal')} variant="total" />
                <KpiCard value={kpiCounts.aFaire} label={t('kpiAFaire')} variant="aFaire" />
                <KpiCard value={kpiCounts.enCours} label={t('kpiEnCours')} variant="enCours" />
                <KpiCard value={kpiCounts.terminees} label={t('kpiTerminees')} variant="terminees" />
                <KpiCard
                  value={kpiCounts.enRetard}
                  label={t('kpiEnRetard')}
                  subLabel={kpiCounts.enRetard > 0 ? t('kpiEnRetardSub') : undefined}
                  variant="enRetard"
                />
              </div>
            </section>
          )}

          {/* Tâches en retard — alerte */}
          {tachesEnRetard.length > 0 && (
            <section className="rounded-2xl border-2 border-red-200 dark:border-red-800 bg-red-50/90 dark:bg-red-900/30 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-red-200 dark:border-red-800 bg-red-100/80 dark:bg-red-900/50">
                <h2 className="text-sm font-semibold text-red-900 dark:text-red-200 uppercase tracking-wide">
                  {t('tasksLateTitle', { count: tachesEnRetard.length })}
                </h2>
              </div>
              <div className="p-5">
                <div className="space-y-3">
                  {tachesEnRetard.slice(0, 5).map((tacheRetard) => (
                    <div
                      key={tacheRetard.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white dark:bg-gray-700/50 border border-red-100 dark:border-red-900/50 p-4 shadow-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{tacheRetard.titre}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {tacheRetard.projetNom} — {t('echeance')} {formatDate(tacheRetard.dateEcheance, { monthStyle: 'short' })}
                        </p>
                      </div>
                      <span className={`shrink-0 px-3 py-1 rounded-lg text-xs font-semibold ${prioriteColors[tacheRetard.priorite]}`}>
                        {t(`priorite.${tacheRetard.priorite}`)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Filtre par statut */}
          {selectedProjetId && taches.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">{t('filter')}</span>
              <button
                type="button"
                onClick={() => setFilterStatut('')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  filterStatut === '' ? 'bg-primary text-white shadow-sm' : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {t('filterAll')}
              </button>
              {Object.values(StatutTache).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilterStatut(s)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                    filterStatut === s ? 'bg-primary text-white shadow-sm' : `${statutColors[s]} hover:opacity-90 border`
                  }`}
                >
                  {t(`statut.${s}`)}
                </button>
              ))}
            </div>
          )}

          {/* Liste des tâches — rendu ultra premium */}
          {selectedProjetId && (
            <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                  {t('tasksListTitle')}
                </h2>
              </div>
              <div className="p-5">
                {loading ? (
                  <div className="py-16 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="mt-3 text-gray-500 dark:text-gray-400">{t('loading')}</p>
                  </div>
                ) : filteredTaches.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className="text-gray-600 dark:text-gray-300 font-medium">{t('empty')}</p>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('emptyHint')}</p>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {filteredTaches.map((tache) => (
                      <li
                        key={tache.id}
                        className={`rounded-xl border-l-4 border bg-white dark:bg-gray-800 shadow-sm overflow-hidden transition hover:shadow-md ${statutBorderColors[tache.statut]} border-gray-100 dark:border-gray-600`}
                      >
                        <div className="p-5 flex flex-col sm:flex-row sm:items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{tache.titre}</h3>
                              {tache.enRetard && (
                                <span className="shrink-0 text-xs font-semibold bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200 px-2.5 py-1 rounded-lg">
                                  {t('enRetard')}
                                </span>
                              )}
                            </div>
                            {tache.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{tache.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${statutColors[tache.statut]}`}>
                                {t(`statut.${tache.statut}`)}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${prioriteColors[tache.priorite]}`}>
                                {t(`priorite.${tache.priorite}`)}
                              </span>
                              {tache.assigneA && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-violet-50 dark:bg-violet-900/50 text-violet-700 dark:text-violet-200">
                                  {tache.assigneA.prenom} {tache.assigneA.nom}
                                </span>
                              )}
                              {tache.dateEcheance && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700">
                                  {t('echShort')} {formatDate(tache.dateEcheance, { monthStyle: 'short' })}
                                </span>
                              )}
                            </div>
                            <div className="mt-4 flex items-center gap-3">
                              <div className="flex-1 max-w-[200px] bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all duration-300"
                                  style={{ width: `${tache.pourcentageAvancement}%` }}
                                />
                              </div>
                              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 tabular-nums">{tache.pourcentageAvancement} %</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 sm:flex-col sm:items-stretch">
                            <select
                              value={tache.statut}
                              onChange={(e) => handleStatusChange(tache, e.target.value as StatutTache)}
                              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-primary w-full sm:min-w-[140px]"
                            >
                              {Object.values(StatutTache).map((s) => (
                                <option key={s} value={s}>{t(`statut.${s}`)}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleDelete(tache.id)}
                              className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                            >
                              {t('delete')}
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 pt-6 mt-6 border-t border-gray-200 dark:border-gray-600">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => selectedProjetId && dispatch(fetchTachesByProjet({ projetId: selectedProjetId, page: i }))}
                        className={`min-w-[40px] py-2 px-3 rounded-xl text-sm font-medium transition ${
                          currentPage === i
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Modal création */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-none dark:border dark:border-gray-600 w-full max-w-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('modalTitle')}</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('modalTitre')}</label>
                    <input
                      type="text"
                      value={newTitre}
                      onChange={(e) => setNewTitre(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-gray-100"
                      placeholder={t('modalTitrePlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('modalDescription')}</label>
                    <textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary resize-none dark:bg-gray-700 dark:text-gray-100"
                      rows={3}
                      placeholder={t('modalDescriptionPlaceholder')}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('modalPriorite')}</label>
                      <select
                        value={newPriorite}
                        onChange={(e) => setNewPriorite(e.target.value as Priorite)}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-primary"
                      >
                        {Object.values(Priorite).map((p) => (
                          <option key={p} value={p}>{t(`priorite.${p}`)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('modalDateEcheance')}</label>
                      <input
                        type="date"
                        value={newDateEcheance}
                        onChange={(e) => setNewDateEcheance(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-gray-100"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
                  <button
                    type="button"
                    onClick={() => { setShowCreateModal(false); resetForm() }}
                    className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                  >
                    {t('modalCancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={!newTitre.trim()}
                    className="px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark disabled:opacity-50 transition"
                  >
                    {t('modalCreate')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </PageContainer>
  )
}
