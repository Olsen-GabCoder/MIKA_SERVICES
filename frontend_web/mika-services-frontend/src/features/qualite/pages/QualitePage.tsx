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
import { PageContainer } from '@/components/layout/PageContainer'
import {
  StatutControleQualite,
  TypeControle,
} from '../../../types/qualite'
import type { ControleQualiteCreateRequest, ControleQualiteUpdateRequest } from '../../../types/qualite'

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
    <PageContainer size="wide" className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
          <p className="text-gray-500 mt-1">{t('subtitle')}</p>
        </div>
        {selectedProjetId && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition flex items-center gap-2"
          >
            <span className="text-lg">+</span>
            {t('newControl')}
          </button>
        )}
      </div>

      {/* Sélection projet */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">{t('selectProject')}</label>
        <select
          value={selectedProjetId ?? ''}
          onChange={(e) => setSelectedProjetId(e.target.value ? Number(e.target.value) : null)}
          className="w-full md:w-1/2 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
        >
          <option value="">{t('chooseProject')}</option>
          {projets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nom}
            </option>
          ))}
        </select>
      </div>

      {/* KPI Qualité */}
      {summary && selectedProjetId && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-600 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{summary.totalControles}</p>
            <p className="text-sm text-gray-500">{t('totalControles')}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-600 p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{summary.tauxConformite}%</p>
            <p className="text-sm text-gray-500">{t('tauxConformite')}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-600 p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{summary.controlesNonConformes}</p>
            <p className="text-sm text-gray-500">{t('nonConformes')}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-600 p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{summary.ncOuvertes}</p>
            <p className="text-sm text-gray-500">{t('ncOuvertes')}</p>
          </div>
        </div>
      )}

      {/* Répartition NC par gravité */}
      {summary && summary.ncOuvertes > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-600 p-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('ncByGravite')}</h3>
          <div className="flex gap-4 flex-wrap">
            {Object.entries(summary.ncParGravite).map(([gravite, count]) => {
              const colors: Record<string, string> = {
                MINEURE: 'bg-yellow-100 text-yellow-800',
                MAJEURE: 'bg-orange-100 text-orange-800',
                CRITIQUE: 'bg-red-100 text-red-800',
                BLOQUANTE: 'bg-red-200 text-red-900',
              }
              return (
                <div key={gravite} className={`px-4 py-2 rounded-lg ${colors[gravite] || 'bg-gray-100 text-gray-800'}`}>
                  <span className="font-bold text-lg">{count}</span>
                  <span className="ml-2 text-sm">{gravite.toLowerCase()}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* NC en retard (alerte globale) */}
      {ncEnRetard.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="text-red-800 font-semibold mb-2">
            {t('ncEnRetard', { count: ncEnRetard.length })}
          </h3>
          <div className="space-y-2">
            {ncEnRetard.slice(0, 5).map((nc) => (
              <div key={nc.id} className="flex items-center justify-between bg-white dark:bg-gray-700/50 rounded-lg p-3 border border-red-100 dark:border-red-900/50">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{nc.reference} — {nc.titre}</p>
                  <p className="text-sm text-gray-500">
                    Contrôle : {nc.controleReference} — Échéance : {nc.dateEcheanceCorrection}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  nc.gravite === 'BLOQUANTE' ? 'bg-red-200 text-red-900' :
                  nc.gravite === 'CRITIQUE' ? 'bg-red-100 text-red-800' :
                  nc.gravite === 'MAJEURE' ? 'bg-orange-100 text-orange-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {nc.gravite.toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtres */}
      {selectedProjetId && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatut('')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition ${
              filterStatut === '' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('filterAll')}
          </button>
          {Object.values(StatutControleQualite).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatut(s)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                filterStatut === s ? 'bg-primary-600 text-white' : `${statutColors[s]} hover:opacity-80`
              }`}
            >
              {t(`statut.${s}`)}
            </button>
          ))}
        </div>
      )}

      {/* Liste des contrôles */}
      {selectedProjetId && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600">
          {loading ? (
            <div className="p-8 text-center text-gray-500">{t('loading')}</div>
          ) : filteredControles.length === 0 ? (
            <div className="p-8 text-center text-gray-500">{t('empty')}</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredControles.map((controle) => (
                <div key={controle.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-gray-400">{controle.reference}</span>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{controle.titre}</h3>
                      </div>
                      {controle.description && (
                        <p className="text-sm text-gray-500 line-clamp-2 mb-2">{controle.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className={`px-2 py-1 rounded-full font-medium ${statutColors[controle.statut]}`}>
                          {t(`statut.${controle.statut}`)}
                        </span>
                        <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700">
                          {t(`type.${controle.typeControle}`)}
                        </span>
                        {controle.inspecteur && (
                          <span className="px-2 py-1 rounded-full bg-purple-50 text-purple-700">
                            {controle.inspecteur.prenom} {controle.inspecteur.nom}
                          </span>
                        )}
                        {controle.datePlanifiee && (
                          <span className="px-2 py-1 rounded-full bg-gray-50 text-gray-600">
                            {t('statut.PLANIFIE')}: {controle.datePlanifiee}
                          </span>
                        )}
                        {controle.nbNonConformites > 0 && (
                          <span className="px-2 py-1 rounded-full bg-red-50 text-red-600">
                            {controle.nbNonConformites} NC
                          </span>
                        )}
                        {controle.noteGlobale != null && (
                          <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                            Note: {controle.noteGlobale}/100
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <select
                        value={controle.statut}
                        onChange={(e) => handleStatusChange(controle.id, e.target.value as StatutControleQualite)}
                        className="text-xs border border-gray-200 rounded px-2 py-1"
                      >
                        {Object.values(StatutControleQualite).map((s) => (
                          <option key={s} value={s}>{t(`statut.${s}`)}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDelete(controle.id)}
                        className="text-xs text-red-500 hover:text-red-700 transition"
                      >
                        {t('delete')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => selectedProjetId && dispatch(fetchControlesByProjet({ projetId: selectedProjetId, page: i }))}
                  className={`px-3 py-1 rounded text-sm ${
                    currentPage === i ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
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
