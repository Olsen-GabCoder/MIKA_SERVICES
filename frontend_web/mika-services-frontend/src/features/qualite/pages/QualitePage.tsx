import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { useConfirm } from '@/contexts/ConfirmContext'
import {
  fetchControlesByProjet,
  fetchNcEnRetard,
  fetchQualiteSummary,
  createControle,
  updateControle,
  deleteControle,
} from '../../../store/slices/qualiteSlice'
import { fetchProjets } from '@/store/slices/projetSlice'
import { PageContainer } from '@/components/layout/PageContainer'
import {
  StatutControleQualite,
  TypeControle,
} from '../../../types/qualite'
import type { ControleQualiteCreateRequest, ControleQualiteUpdateRequest } from '../../../types/qualite'

const CARD = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm dark:shadow-none overflow-hidden'
const CARD_HEADER = 'px-5 py-3 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide'
const CARD_BODY = 'p-5'

const statutColors: Record<StatutControleQualite, string> = {
  [StatutControleQualite.PLANIFIE]: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200',
  [StatutControleQualite.EN_COURS]: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200',
  [StatutControleQualite.CONFORME]: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-200',
  [StatutControleQualite.NON_CONFORME]: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200',
  [StatutControleQualite.ANNULE]: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-200',
}

export default function QualitePage() {
  const { t } = useTranslation('qualite')
  const dispatch = useAppDispatch()
  const confirm = useConfirm()
  const { controles, ncEnRetard, summary, loading, error, totalPages, currentPage } = useAppSelector(
    (state) => state.qualite
  )
  const projets = useAppSelector((state) => state.projet.projets)

  const [selectedProjetId, setSelectedProjetId] = useState<number | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filterStatut, setFilterStatut] = useState<StatutControleQualite | ''>('')

  // Formulaire
  const [newTitre, setNewTitre] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newTypeControle, setNewTypeControle] = useState<TypeControle>(TypeControle.EN_COURS_EXECUTION)
  const [newDatePlanifiee, setNewDatePlanifiee] = useState('')
  const [newZoneControlee, setNewZoneControlee] = useState('')

  useEffect(() => {
    dispatch(fetchProjets({ page: 0, size: 100 }))
  }, [dispatch])

  useEffect(() => {
    dispatch(fetchNcEnRetard())
  }, [dispatch])

  useEffect(() => {
    if (selectedProjetId) {
      dispatch(fetchControlesByProjet({ projetId: selectedProjetId }))
      dispatch(fetchQualiteSummary(selectedProjetId))
    }
  }, [dispatch, selectedProjetId])

  const handleCreate = async () => {
    if (!selectedProjetId || !newTitre.trim()) return
    const request: ControleQualiteCreateRequest = {
      projetId: selectedProjetId,
      titre: newTitre.trim(),
      description: newDescription.trim() || undefined,
      typeControle: newTypeControle,
      datePlanifiee: newDatePlanifiee || undefined,
      zoneControlee: newZoneControlee.trim() || undefined,
    }
    await dispatch(createControle(request))
    setShowCreateModal(false)
    resetForm()
    dispatch(fetchControlesByProjet({ projetId: selectedProjetId }))
    dispatch(fetchQualiteSummary(selectedProjetId))
  }

  const handleStatusChange = async (controleId: number, newStatut: StatutControleQualite) => {
    const request: ControleQualiteUpdateRequest = { statut: newStatut }
    await dispatch(updateControle({ id: controleId, request }))
    if (selectedProjetId) {
      dispatch(fetchQualiteSummary(selectedProjetId))
    }
  }

  const handleDelete = async (id: number) => {
    if (await confirm({ messageKey: 'confirm.deleteControl' })) {
      await dispatch(deleteControle(id))
      if (selectedProjetId) dispatch(fetchQualiteSummary(selectedProjetId))
    }
  }

  const resetForm = () => {
    setNewTitre('')
    setNewDescription('')
    setNewTypeControle(TypeControle.EN_COURS_EXECUTION)
    setNewDatePlanifiee('')
    setNewZoneControlee('')
  }

  const filteredControles = filterStatut ? controles.filter((c) => c.statut === filterStatut) : controles

  return (
    <PageContainer size="full" className="space-y-6 bg-gray-50/80 dark:bg-gray-900/80">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('subtitle')}</p>
        </div>
        {selectedProjetId && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary font-medium shadow-sm transition flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span>
            {t('newControl')}
          </button>
        )}
      </div>

      {/* Filtres : sélection projet */}
      <section className={CARD}>
        <h2 className={CARD_HEADER}>{t('selectProject')}</h2>
        <div className={CARD_BODY}>
          <select
            value={selectedProjetId ?? ''}
            onChange={(e) => setSelectedProjetId(e.target.value ? Number(e.target.value) : null)}
            className="w-full max-w-md border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-primary transition"
          >
            <option value="">{t('chooseProject')}</option>
            {projets.map((p) => (
              <option key={p.id} value={p.id}>{p.nom}</option>
            ))}
          </select>
        </div>
      </section>

      {/* KPI Qualité */}
      {summary && selectedProjetId && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: summary.totalControles, label: t('totalControles'), className: 'text-gray-900 dark:text-gray-100' },
            { value: `${summary.tauxConformite}%`, label: t('tauxConformite'), className: 'text-green-600 dark:text-green-400' },
            { value: summary.controlesNonConformes, label: t('nonConformes'), className: 'text-red-600 dark:text-red-400' },
            { value: summary.ncOuvertes, label: t('ncOuvertes'), className: 'text-orange-600 dark:text-orange-400' },
          ].map((kpi, i) => (
            <div key={i} className={CARD}>
              <div className={`${CARD_BODY} text-center`}>
                <p className={`text-2xl font-bold tabular-nums ${kpi.className}`}>{kpi.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{kpi.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Répartition NC par gravité */}
      {summary && summary.ncOuvertes > 0 && (
        <section className={CARD}>
          <h2 className={CARD_HEADER}>{t('ncByGravite')}</h2>
          <div className={CARD_BODY}>
            <div className="flex gap-3 flex-wrap">
              {Object.entries(summary.ncParGravite).map(([gravite, count]) => {
                const colors: Record<string, string> = {
                  MINEURE: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200',
                  MAJEURE: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200',
                  CRITIQUE: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200',
                  BLOQUANTE: 'bg-red-200 dark:bg-red-900/60 text-red-900 dark:text-red-100',
                }
                return (
                  <div key={gravite} className={`px-4 py-2.5 rounded-lg font-medium ${colors[gravite] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                    <span className="text-lg tabular-nums">{count}</span>
                    <span className="ml-2 text-sm capitalize">{gravite.toLowerCase()}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* NC en retard (alerte globale) */}
      {ncEnRetard.length > 0 && (
        <section className={CARD}>
          <h2 className="px-5 py-3 border-b border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-sm font-semibold text-red-800 dark:text-red-200 uppercase tracking-wide">
            {t('ncEnRetard', { count: ncEnRetard.length })}
          </h2>
          <div className="p-5 space-y-3">
            {ncEnRetard.slice(0, 5).map((nc) => (
              <div key={nc.id} className="flex items-center justify-between rounded-lg p-3 bg-white dark:bg-gray-800 border border-red-100 dark:border-red-900/50">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{nc.reference} — {nc.titre}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Contrôle : {nc.controleReference} — Échéance : {nc.dateEcheanceCorrection}
                  </p>
                </div>
                <span className={`shrink-0 ml-3 px-2.5 py-1 rounded-md text-xs font-medium ${
                  nc.gravite === 'BLOQUANTE' ? 'bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100' :
                  nc.gravite === 'CRITIQUE' ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200' :
                  nc.gravite === 'MAJEURE' ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200' :
                  'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200'
                }`}>
                  {nc.gravite.toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Filtres par statut */}
      {selectedProjetId && (
        <section className={CARD}>
          <h2 className={CARD_HEADER}>{t('filterByStatus')}</h2>
          <div className={CARD_BODY}>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterStatut('')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm ${
                  filterStatut === ''
                    ? 'bg-primary text-white hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                }`}
              >
                {t('filterAll')}
              </button>
              {Object.values(StatutControleQualite).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatut(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm ${
                    filterStatut === s
                      ? 'bg-primary text-white hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary'
                      : `${statutColors[s]} hover:opacity-90 border border-transparent`
                  }`}
                >
                  {t(`statut.${s}`)}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Liste des contrôles */}
      {selectedProjetId && (
        <section className={CARD}>
          <h2 className={CARD_HEADER}>{t('controlsList')}</h2>
          {loading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t('loading')}</div>
          ) : filteredControles.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t('empty')}</div>
          ) : (
            <>
              <div className="divide-y divide-gray-200 dark:divide-gray-600">
                {filteredControles.map((controle) => (
                  <div key={controle.id} className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{controle.reference}</span>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{controle.titre}</h3>
                        </div>
                        {controle.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{controle.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className={`px-2.5 py-1 rounded-md font-medium ${statutColors[controle.statut]}`}>
                            {t(`statut.${controle.statut}`)}
                          </span>
                          <span className="px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200">
                            {t(`type.${controle.typeControle}`)}
                          </span>
                          {controle.inspecteur && (
                            <span className="px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-200">
                              {controle.inspecteur.prenom} {controle.inspecteur.nom}
                            </span>
                          )}
                          {controle.datePlanifiee && (
                            <span className="px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                              {t('statut.PLANIFIE')}: {controle.datePlanifiee}
                            </span>
                          )}
                          {controle.nbNonConformites > 0 && (
                            <span className="px-2.5 py-1 rounded-md bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-200">
                              {controle.nbNonConformites} NC
                            </span>
                          )}
                          {controle.noteGlobale != null && (
                            <span className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200">
                              Note: {controle.noteGlobale}/100
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <select
                          value={controle.statut}
                          onChange={(e) => handleStatusChange(controle.id, e.target.value as StatutControleQualite)}
                          className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary"
                        >
                          {Object.values(StatutControleQualite).map((s) => (
                            <option key={s} value={s}>{t(`statut.${s}`)}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleDelete(controle.id)}
                          className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition"
                        >
                          {t('delete')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-600">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => selectedProjetId && dispatch(fetchControlesByProjet({ projetId: selectedProjetId, page: i }))}
                      className={`min-w-[2.25rem] px-3 py-2 rounded-lg text-sm font-medium transition ${
                        currentPage === i
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* Modal de création */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-none dark:border dark:border-gray-600 w-full max-w-lg mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('modalTitle')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('modalTitre')}</label>
                <input
                  type="text"
                  value={newTitre}
                  onChange={(e) => setNewTitre(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                  placeholder={t('modalTitre')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('modalDescription')}</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('typeControle')} *</label>
                  <select
                    value={newTypeControle}
                    onChange={(e) => setNewTypeControle(e.target.value as TypeControle)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {Object.values(TypeControle).map((typeKey) => (
                      <option key={typeKey} value={typeKey}>{t(`type.${typeKey}`)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('datePlanifiee')}</label>
                  <input
                    type="date"
                    value={newDatePlanifiee}
                    onChange={(e) => setNewDatePlanifiee(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('zoneControlee')}</label>
                <input
                  type="text"
                  value={newZoneControlee}
                  onChange={(e) => setNewZoneControlee(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Ex: Fondations bloc A"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowCreateModal(false); resetForm() }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTitre.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {t('create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
      )}
    </PageContainer>
  )
}
