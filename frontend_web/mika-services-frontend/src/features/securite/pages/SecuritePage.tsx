import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useConfirm } from '@/contexts/ConfirmContext'
import {
  fetchIncidentsByProjet,
  fetchRisquesByProjet,
  fetchSecuriteSummary,
  createIncident,
  updateIncident,
  deleteIncident,
  createRisque,
  deleteRisque,
} from '../../../store/slices/securiteSlice'
import {
  TypeIncident, GraviteIncident, StatutIncident, NiveauRisque,
} from '../../../types/securite'
import { PageContainer } from '@/components/layout/PageContainer'
import type { IncidentCreateRequest, IncidentUpdateRequest, RisqueCreateRequest } from '../../../types/securite'

const statutColors: Record<StatutIncident, string> = {
  [StatutIncident.DECLARE]: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200',
  [StatutIncident.EN_INVESTIGATION]: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-200',
  [StatutIncident.ANALYSE]: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-200',
  [StatutIncident.ACTIONS_EN_COURS]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200',
  [StatutIncident.CLOTURE]: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200',
}
const graviteColors: Record<GraviteIncident, string> = {
  [GraviteIncident.BENIN]: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  [GraviteIncident.LEGER]: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-200',
  [GraviteIncident.GRAVE]: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-200',
  [GraviteIncident.TRES_GRAVE]: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200',
  [GraviteIncident.MORTEL]: 'bg-red-200 text-red-900 dark:bg-red-900/70 dark:text-red-100',
}
const niveauColors: Record<NiveauRisque, string> = {
  [NiveauRisque.FAIBLE]: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200',
  [NiveauRisque.MOYEN]: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-200',
  [NiveauRisque.ELEVE]: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-200',
  [NiveauRisque.CRITIQUE]: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200',
}

export default function SecuritePage() {
  const { t } = useTranslation('securite')
  const dispatch = useAppDispatch()
  const confirm = useConfirm()
  const { incidents, risques, summary, loading, error } = useAppSelector((state) => state.securite)
  const projets = useAppSelector((state) => state.projet.projets)

  const [selectedProjetId, setSelectedProjetId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'incidents' | 'risques'>('incidents')
  const [showIncidentModal, setShowIncidentModal] = useState(false)
  const [showRisqueModal, setShowRisqueModal] = useState(false)

  // Incident form
  const [incTitre, setIncTitre] = useState('')
  const [incType, setIncType] = useState<TypeIncident>(TypeIncident.ACCIDENT_TRAVAIL)
  const [incGravite, setIncGravite] = useState<GraviteIncident>(GraviteIncident.LEGER)
  const [incDate, setIncDate] = useState('')
  const [incLieu, setIncLieu] = useState('')
  const [incDescription, setIncDescription] = useState('')

  // Risque form
  const [rTitre, setRTitre] = useState('')
  const [rNiveau, setRNiveau] = useState<NiveauRisque>(NiveauRisque.MOYEN)
  const [rDescription, setRDescription] = useState('')
  const [rZone, setRZone] = useState('')

  useEffect(() => {
    if (selectedProjetId) {
      dispatch(fetchIncidentsByProjet({ projetId: selectedProjetId }))
      dispatch(fetchRisquesByProjet({ projetId: selectedProjetId }))
      dispatch(fetchSecuriteSummary(selectedProjetId))
    }
  }, [dispatch, selectedProjetId])

  const handleCreateIncident = async () => {
    if (!selectedProjetId || !incTitre.trim() || !incDate) return
    const request: IncidentCreateRequest = {
      projetId: selectedProjetId, titre: incTitre.trim(), typeIncident: incType,
      gravite: incGravite, dateIncident: incDate, lieu: incLieu.trim() || undefined,
      description: incDescription.trim() || undefined,
    }
    await dispatch(createIncident(request))
    setShowIncidentModal(false)
    resetIncidentForm()
    dispatch(fetchIncidentsByProjet({ projetId: selectedProjetId }))
    dispatch(fetchSecuriteSummary(selectedProjetId))
  }

  const handleCreateRisque = async () => {
    if (!selectedProjetId || !rTitre.trim()) return
    const request: RisqueCreateRequest = {
      projetId: selectedProjetId, titre: rTitre.trim(), niveau: rNiveau,
      description: rDescription.trim() || undefined, zoneConcernee: rZone.trim() || undefined,
    }
    await dispatch(createRisque(request))
    setShowRisqueModal(false)
    resetRisqueForm()
    dispatch(fetchRisquesByProjet({ projetId: selectedProjetId }))
    dispatch(fetchSecuriteSummary(selectedProjetId))
  }

  const handleStatusChange = async (incidentId: number, newStatut: StatutIncident) => {
    const request: IncidentUpdateRequest = { statut: newStatut }
    await dispatch(updateIncident({ id: incidentId, request }))
    if (selectedProjetId) dispatch(fetchSecuriteSummary(selectedProjetId))
  }

  const handleDeleteIncident = async (id: number) => {
    if (await confirm({ messageKey: 'confirm.deleteIncident' })) {
      await dispatch(deleteIncident(id))
      if (selectedProjetId) dispatch(fetchSecuriteSummary(selectedProjetId))
    }
  }

  const handleDeleteRisque = async (id: number) => {
    if (await confirm({ messageKey: 'confirm.deleteRisk' })) {
      await dispatch(deleteRisque(id))
      if (selectedProjetId) dispatch(fetchSecuriteSummary(selectedProjetId))
    }
  }

  const resetIncidentForm = () => { setIncTitre(''); setIncType(TypeIncident.ACCIDENT_TRAVAIL); setIncGravite(GraviteIncident.LEGER); setIncDate(''); setIncLieu(''); setIncDescription('') }
  const resetRisqueForm = () => { setRTitre(''); setRNiveau(NiveauRisque.MOYEN); setRDescription(''); setRZone('') }

  return (
    <PageContainer size="wide" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('pageTitle')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('pageSubtitle')}</p>
        </div>
        {selectedProjetId && (
          <button
            onClick={() => activeTab === 'incidents' ? setShowIncidentModal(true) : setShowRisqueModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition flex items-center gap-2"
          >
            <span className="text-lg">+</span>
            {activeTab === 'incidents' ? t('declareIncident') : t('addRisk')}
          </button>
        )}
      </div>

      {/* Sélection projet */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 p-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('selectProject')}</label>
        <select
          value={selectedProjetId ?? ''}
          onChange={(e) => setSelectedProjetId(e.target.value ? Number(e.target.value) : null)}
          className="w-full md:w-1/2 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100"
        >
          <option value="">{t('chooseProject')}</option>
          {projets.map((p) => (
            <option key={p.id} value={p.id}>{p.nom}</option>
          ))}
        </select>
      </div>

      {/* KPI */}
      {summary && selectedProjetId && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-600 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{summary.totalIncidents}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('totalIncidents')}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-600 p-4 text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.incidentsGraves}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('seriousIncidents')}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-600 p-4 text-center">
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{summary.risquesCritiques}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('criticalRisks')}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-600 p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{summary.totalJoursArret}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('daysOff')}</p>
          </div>
        </div>
      )}

      {/* Onglets */}
      {selectedProjetId && (
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab('incidents')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'incidents' ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            {t('tabIncidents')} ({incidents.length})
          </button>
          <button
            onClick={() => setActiveTab('risques')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'risques' ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            {t('tabRisques')} ({risques.length})
          </button>
        </div>
      )}

      {/* Liste incidents */}
      {selectedProjetId && activeTab === 'incidents' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600">
          {loading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t('loading')}</div>
          ) : incidents.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t('noIncidentsDeclared')}</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-600">
              {incidents.map((inc) => (
                <div key={inc.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/70 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{inc.reference}</span>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{inc.titre}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs mt-2">
                        <span className={`px-2 py-1 rounded-full font-medium ${statutColors[inc.statut]}`}>{t(`statut.${inc.statut}`)}</span>
                        <span className={`px-2 py-1 rounded-full font-medium ${graviteColors[inc.gravite]}`}>{t(`gravite.${inc.gravite}`)}</span>
                        <span className="px-2 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200">{t(`type.${inc.typeIncident}`)}</span>
                        <span className="px-2 py-1 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{inc.dateIncident}</span>
                        {inc.lieu && <span className="px-2 py-1 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{inc.lieu}</span>}
                        {inc.nbBlesses > 0 && <span className="px-2 py-1 rounded-full bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-200">{inc.nbBlesses} {t('injured')}</span>}
                        {inc.arretTravail && <span className="px-2 py-1 rounded-full bg-orange-50 dark:bg-orange-900/40 text-orange-600 dark:text-orange-200">{inc.nbJoursArret} {t('daysOffShort')}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <select value={inc.statut} onChange={(e) => handleStatusChange(inc.id, e.target.value as StatutIncident)} className="text-xs border border-gray-200 dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-700 dark:text-gray-100">
                        {Object.values(StatutIncident).map((s) => (<option key={s} value={s}>{t(`statut.${s}`)}</option>))}
                      </select>
                      <button onClick={() => handleDeleteIncident(inc.id)} className="text-xs text-red-500 hover:text-red-700 transition">{t('delete')}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Liste risques */}
      {selectedProjetId && activeTab === 'risques' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600">
          {loading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t('loading')}</div>
          ) : risques.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t('noRisksIdentified')}</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-600">
              {risques.map((r) => (
                <div key={r.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/70 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate mb-1">{r.titre}</h3>
                      {r.description && <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{r.description}</p>}
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className={`px-2 py-1 rounded-full font-medium ${niveauColors[r.niveau]}`}>{t(`niveau.${r.niveau}`)}</span>
                        {r.zoneConcernee && <span className="px-2 py-1 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{r.zoneConcernee}</span>}
                        <span className={`px-2 py-1 rounded-full ${r.actif ? 'bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-200' : 'bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}>{r.actif ? t('active') : t('inactive')}</span>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteRisque(r.id)} className="text-xs text-red-500 hover:text-red-700 transition">{t('delete')}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal incident */}
      {showIncidentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-none dark:border dark:border-gray-600 w-full max-w-lg mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('modalDeclareTitle')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('labelTitle')}</label>
                <input type="text" value={incTitre} onChange={(e) => setIncTitre(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('labelType')}</label>
                  <select value={incType} onChange={(e) => setIncType(e.target.value as TypeIncident)} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-gray-100">
                    {Object.values(TypeIncident).map((typ) => (<option key={typ} value={typ}>{t(`type.${typ}`)}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('labelGravite')}</label>
                  <select value={incGravite} onChange={(e) => setIncGravite(e.target.value as GraviteIncident)} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-gray-100">
                    {Object.values(GraviteIncident).map((g) => (<option key={g} value={g}>{t(`gravite.${g}`)}</option>))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('labelDate')}</label>
                  <input type="date" value={incDate} onChange={(e) => setIncDate(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('labelLieu')}</label>
                  <input type="text" value={incLieu} onChange={(e) => setIncLieu(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-gray-100" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('labelDescription')}</label>
                <textarea value={incDescription} onChange={(e) => setIncDescription(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-gray-100" rows={3} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowIncidentModal(false); resetIncidentForm() }} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">{t('cancel')}</button>
              <button onClick={handleCreateIncident} disabled={!incTitre.trim() || !incDate} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">{t('declare')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal risque */}
      {showRisqueModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-none dark:border dark:border-gray-600 w-full max-w-lg mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('modalAddRiskTitle')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('labelTitle')}</label>
                <input type="text" value={rTitre} onChange={(e) => setRTitre(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('labelNiveau')}</label>
                  <select value={rNiveau} onChange={(e) => setRNiveau(e.target.value as NiveauRisque)} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-gray-100">
                    {Object.values(NiveauRisque).map((n) => (<option key={n} value={n}>{t(`niveau.${n}`)}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('labelZone')}</label>
                  <input type="text" value={rZone} onChange={(e) => setRZone(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-gray-100" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('labelDescription')}</label>
                <textarea value={rDescription} onChange={(e) => setRDescription(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-gray-100" rows={3} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowRisqueModal(false); resetRisqueForm() }} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">{t('cancel')}</button>
              <button onClick={handleCreateRisque} disabled={!rTitre.trim()} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">{t('add')}</button>
            </div>
          </div>
        </div>
      )}

      {error && <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4 text-red-700 dark:text-red-200">{error}</div>}
    </PageContainer>
  )
}
