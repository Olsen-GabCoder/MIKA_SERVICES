import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useConfirm } from '@/contexts/ConfirmContext'
import { fetchProjets } from '@/store/slices/projetSlice'
import {
  fetchIncidentsByProjet, fetchIncidentSummary,
  createIncident, deleteIncident, changeStatut,
} from '@/store/slices/qsheIncidentSlice'
import {
  TypeIncident, GraviteIncident, StatutIncident,
} from '@/types/qsheIncident'
import type { IncidentCreateRequest, IncidentResponse } from '@/types/qsheIncident'
import { PageContainer } from '@/components/layout/PageContainer'

const CARD = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm overflow-hidden'
const BODY = 'p-4 sm:p-5'

const graviteColors: Record<GraviteIncident, string> = {
  MINEURE: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  LEGERE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-200',
  GRAVE: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-200',
  MORTELLE: 'bg-red-200 text-red-900 dark:bg-red-900/70 dark:text-red-100',
}
const statutColors: Record<StatutIncident, string> = {
  BROUILLON: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  DECLARE: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200',
  EN_INVESTIGATION: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-200',
  INVESTIGATION_TERMINEE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200',
  CLOTURE: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200',
}

export default function IncidentsPage() {
  const { t } = useTranslation('qshe')
  const dispatch = useAppDispatch()
  const confirm = useConfirm()
  const { incidents, summary, loading, totalPages, currentPage } = useAppSelector(s => s.qsheIncident)
  const projets = useAppSelector(s => s.projet.projets)
  const userRoles: string[] = useAppSelector((s: any) => s.auth.user?.roles?.map((r: any) => r.code ?? r) ?? [])

  const canDeclare = useMemo(() =>
    ['SUPER_ADMIN', 'ADMIN', 'CHEF_PROJET', 'CHEF_CHANTIER'].some(r => userRoles.includes(r)),
  [userRoles])

  const [projetId, setProjetId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [filterStatut, setFilterStatut] = useState<StatutIncident | ''>('')
  const [page, setPage] = useState(0)

  // Form state
  const [fTitre, setFTitre] = useState('')
  const [fType, setFType] = useState<TypeIncident>(TypeIncident.ACCIDENT_TRAVAIL)
  const [fGravite, setFGravite] = useState<GraviteIncident>(GraviteIncident.LEGERE)
  const [fDate, setFDate] = useState(new Date().toISOString().slice(0, 10))
  const [fHeure, setFHeure] = useState('')
  const [fLieu, setFLieu] = useState('')
  const [fZone, setFZone] = useState('')
  const [fDesc, setFDesc] = useState('')
  const [fCirc, setFCirc] = useState('')
  const [fActivite, setFActivite] = useState('')
  const [fMesures, setFMesures] = useState('')

  useEffect(() => { dispatch(fetchProjets({ page: 0, size: 200 })) }, [dispatch])

  useEffect(() => {
    if (projetId) {
      dispatch(fetchIncidentsByProjet({ projetId, page }))
      dispatch(fetchIncidentSummary(projetId))
    }
  }, [dispatch, projetId, page])

  const filteredIncidents = useMemo(() => {
    if (!filterStatut) return incidents
    return incidents.filter(i => i.statut === filterStatut)
  }, [incidents, filterStatut])

  const resetForm = () => {
    setFTitre(''); setFType(TypeIncident.ACCIDENT_TRAVAIL); setFGravite(GraviteIncident.LEGERE)
    setFDate(new Date().toISOString().slice(0, 10)); setFHeure(''); setFLieu(''); setFZone('')
    setFDesc(''); setFCirc(''); setFActivite(''); setFMesures('')
  }

  const handleCreate = async () => {
    if (!projetId || !fTitre.trim() || !fDate) return
    const req: IncidentCreateRequest = {
      projetId, titre: fTitre.trim(), typeIncident: fType, gravite: fGravite,
      dateIncident: fDate,
      heureIncident: fHeure || undefined, lieu: fLieu.trim() || undefined,
      zoneChantier: fZone.trim() || undefined, description: fDesc.trim() || undefined,
      descriptionCirconstances: fCirc.trim() || undefined,
      activiteEnCours: fActivite.trim() || undefined,
      mesuresConservatoires: fMesures.trim() || undefined,
    }
    await dispatch(createIncident(req))
    setShowForm(false); resetForm()
    dispatch(fetchIncidentsByProjet({ projetId }))
    dispatch(fetchIncidentSummary(projetId))
  }

  const handleDelete = async (id: number) => {
    if (await confirm({ messageKey: 'incidents.confirm.delete' })) {
      await dispatch(deleteIncident(id))
      if (projetId) dispatch(fetchIncidentSummary(projetId))
    }
  }

  const handleStatut = async (id: number, statut: StatutIncident) => {
    await dispatch(changeStatut({ id, statut }))
    if (projetId) dispatch(fetchIncidentSummary(projetId))
  }

  const KpiCard = ({ value, label, accent = '' }: { value: number | string; label: string; accent?: string }) => (
    <div className={CARD}>
      <div className={`${BODY} text-center`}>
        <p className={`text-xl sm:text-2xl font-bold tabular-nums ${accent || 'text-gray-900 dark:text-gray-100'}`}>{value}</p>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  )

  const tauxCloture = summary && summary.totalIncidents > 0
    ? Math.round(((summary.incidentsParType ? Object.values(summary.incidentsParType).reduce((a, b) => a + b, 0) : summary.totalIncidents) > 0
      ? (incidents.filter(i => i.statut === StatutIncident.CLOTURE).length / Math.max(incidents.length, 1)) * 100
      : 0))
    : 0

  return (
    <PageContainer size="full" className="space-y-4 sm:space-y-6 bg-gray-50/80 dark:bg-gray-900/80">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{t('incidents.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('incidents.subtitle')}</p>
        </div>
        {projetId && canDeclare && (
          <button onClick={() => setShowForm(true)}
            className="bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary-dark font-medium shadow-sm transition flex items-center gap-2 self-start sm:self-auto">
            <span className="text-lg leading-none">+</span> {t('incidents.declareIncident')}
          </button>
        )}
      </div>

      {/* Project selector */}
      <div className={CARD}>
        <div className={BODY}>
          <select value={projetId ?? ''} onChange={e => { setProjetId(e.target.value ? Number(e.target.value) : null); setPage(0) }}
            className="w-full sm:max-w-md border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary">
            <option value="">{t('incidents.chooseProject')}</option>
            {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
        </div>
      </div>

      {!projetId && <p className="text-center text-gray-400 dark:text-gray-500 py-8">{t('incidents.noProject')}</p>}

      {projetId && summary && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <KpiCard value={summary.totalIncidents} label={t('incidents.kpi.total')} />
            <KpiCard value={summary.incidentsGraves} label={t('incidents.kpi.graves')} accent="text-red-600 dark:text-red-400" />
            <KpiCard value={summary.declarationsCnssEnRetard} label={t('incidents.kpi.cnssRetard')}
              accent={summary.declarationsCnssEnRetard > 0 ? 'text-red-600 dark:text-red-400 animate-pulse' : ''} />
            <KpiCard value={`${tauxCloture}%`} label={t('incidents.kpi.tauxCloture')} accent="text-green-600 dark:text-green-400" />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setFilterStatut('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${!filterStatut ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
              {t('incidents.filters.all')} ({incidents.length})
            </button>
            {Object.values(StatutIncident).map(s => {
              const count = incidents.filter(i => i.statut === s).length
              return (
                <button key={s} onClick={() => setFilterStatut(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filterStatut === s ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                  {t(`statutIncident.${s}`)} ({count})
                </button>
              )
            })}
          </div>

          {/* Incident list */}
          <div className={CARD}>
            {loading ? (
              <div className="p-8 text-center text-gray-400">{t('incidents.loading')}</div>
            ) : filteredIncidents.length === 0 ? (
              <div className="p-8 text-center text-gray-400">{t('incidents.empty')}</div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredIncidents.map((inc: IncidentResponse) => (
                  <div key={inc.id} className={`px-4 py-3 sm:px-5 sm:py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${inc.declarationCnssEnRetard ? 'border-l-4 border-l-red-500' : ''}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-mono text-gray-400">{inc.reference}</span>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">{inc.titre}</h3>
                        </div>
                        <div className="flex flex-wrap gap-1.5 text-xs mt-1.5">
                          <span className={`px-2 py-0.5 rounded-md font-medium ${statutColors[inc.statut]}`}>{t(`statutIncident.${inc.statut}`)}</span>
                          <span className={`px-2 py-0.5 rounded-md font-medium ${graviteColors[inc.gravite]}`}>{t(`graviteIncident.${inc.gravite}`)}</span>
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200">{t(`typeIncident.${inc.typeIncident}`)}</span>
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500">{inc.dateIncident}</span>
                          {inc.lieu && <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500">{inc.lieu}</span>}
                          {inc.nbVictimes > 0 && <span className="px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300">{inc.nbVictimes} victime(s)</span>}
                          {inc.declarationCnssEnRetard && (
                            <span className="px-2 py-0.5 rounded-md bg-red-600 text-white font-bold animate-pulse">{t('incidents.cnss.enRetard')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                        {canDeclare && (
                          <select value={inc.statut} onChange={e => handleStatut(inc.id, e.target.value as StatutIncident)}
                            className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                            {Object.values(StatutIncident).map(s => <option key={s} value={s}>{t(`statutIncident.${s}`)}</option>)}
                          </select>
                        )}
                        <button onClick={() => handleDelete(inc.id)}
                          className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 transition">{t('incidents.delete')}</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 py-3 border-t border-gray-200 dark:border-gray-700">
                <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 text-sm disabled:opacity-40">←</button>
                <span className="text-sm text-gray-500 dark:text-gray-400 self-center">{page + 1} / {totalPages}</span>
                <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 text-sm disabled:opacity-40">→</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-3 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:border dark:border-gray-600 w-full max-w-lg p-5 sm:p-6 my-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('incidents.form.title')}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('incidents.form.titre')}</label>
                <input type="text" value={fTitre} onChange={e => setFTitre(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('incidents.form.type')}</label>
                  <select value={fType} onChange={e => setFType(e.target.value as TypeIncident)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100">
                    {Object.values(TypeIncident).map(v => <option key={v} value={v}>{t(`typeIncident.${v}`)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('incidents.form.gravite')}</label>
                  <select value={fGravite} onChange={e => setFGravite(e.target.value as GraviteIncident)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100">
                    {Object.values(GraviteIncident).map(v => <option key={v} value={v}>{t(`graviteIncident.${v}`)}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('incidents.form.date')}</label>
                  <input type="date" value={fDate} onChange={e => setFDate(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('incidents.form.heure')}</label>
                  <input type="time" value={fHeure} onChange={e => setFHeure(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('incidents.form.lieu')}</label>
                  <input type="text" value={fLieu} onChange={e => setFLieu(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('incidents.form.zone')}</label>
                  <input type="text" value={fZone} onChange={e => setFZone(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('incidents.form.description')}</label>
                <textarea value={fDesc} onChange={e => setFDesc(e.target.value)} rows={2}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('incidents.form.circonstances')}</label>
                <textarea value={fCirc} onChange={e => setFCirc(e.target.value)} rows={2}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('incidents.form.activite')}</label>
                <input type="text" value={fActivite} onChange={e => setFActivite(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('incidents.form.mesures')}</label>
                <textarea value={fMesures} onChange={e => setFMesures(e.target.value)} rows={2}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => { setShowForm(false); resetForm() }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">{t('incidents.form.cancel')}</button>
              <button onClick={handleCreate} disabled={!fTitre.trim() || !fDate}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 text-sm font-medium">{t('incidents.form.submit')}</button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
