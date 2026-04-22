import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useConfirm } from '@/contexts/ConfirmContext'
import { fetchProjets } from '@/store/slices/projetSlice'
import {
  fetchInspectionsByProjet, createInspection, deleteInspection, fetchTemplates,
} from '@/store/slices/qsheInspectionSlice'
import { TypeInspection, StatutInspection } from '@/types/qsheInspection'
import type { InspectionCreateRequest, InspectionResponse } from '@/types/qsheInspection'
import { PageContainer } from '@/components/layout/PageContainer'

const CARD = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm overflow-hidden'
const BODY = 'p-4 sm:p-5'

const statutColors: Record<StatutInspection, string> = {
  PLANIFIEE: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  EN_COURS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200',
  TERMINEE: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200',
  ANNULEE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-200',
}

const scoreColor = (s: number | null) => {
  if (s === null) return 'text-gray-400'
  if (s >= 80) return 'text-green-600 dark:text-green-400'
  if (s >= 50) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

export default function InspectionsPage() {
  const { t } = useTranslation('qshe')
  const dispatch = useAppDispatch()
  const confirm = useConfirm()
  const { inspections, templates, loading, totalPages, currentPage } = useAppSelector(s => s.qsheInspection)
  const projets = useAppSelector(s => s.projet.projets)

  const [projetId, setProjetId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [page, setPage] = useState(0)
  const [filterStatut, setFilterStatut] = useState<StatutInspection | ''>('')

  // Form
  const [fTitre, setFTitre] = useState('')
  const [fType, setFType] = useState<TypeInspection>(TypeInspection.HEBDOMADAIRE)
  const [fTemplateId, setFTemplateId] = useState<number | ''>('')
  const [fDate, setFDate] = useState('')
  const [fZone, setFZone] = useState('')

  useEffect(() => { dispatch(fetchProjets({ page: 0, size: 200 })); dispatch(fetchTemplates()) }, [dispatch])
  useEffect(() => { if (projetId) dispatch(fetchInspectionsByProjet({ projetId, page })) }, [dispatch, projetId, page])

  const filtered = useMemo(() => {
    if (!filterStatut) return inspections
    return inspections.filter(i => i.statut === filterStatut)
  }, [inspections, filterStatut])

  const handleCreate = async () => {
    if (!projetId || !fTitre.trim()) return
    const req: InspectionCreateRequest = {
      projetId, titre: fTitre.trim(), typeInspection: fType,
      datePlanifiee: fDate || undefined, zoneInspecte: fZone.trim() || undefined,
      checklistTemplateId: fTemplateId ? Number(fTemplateId) : undefined,
    }
    await dispatch(createInspection(req))
    setShowForm(false); setFTitre(''); setFType(TypeInspection.HEBDOMADAIRE); setFTemplateId(''); setFDate(''); setFZone('')
    dispatch(fetchInspectionsByProjet({ projetId }))
  }

  const handleDelete = async (id: number) => {
    if (await confirm({ messageKey: 'incidents.confirm.delete' })) {
      await dispatch(deleteInspection(id))
    }
  }

  return (
    <PageContainer size="full" className="space-y-4 sm:space-y-6 bg-gray-50/80 dark:bg-gray-900/80">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{t('inspections.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('inspections.subtitle')}</p>
        </div>
        {projetId && (
          <button onClick={() => setShowForm(true)}
            className="bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary-dark font-medium shadow-sm transition flex items-center gap-2 self-start sm:self-auto">
            <span className="text-lg leading-none">+</span> {t('inspections.createInspection')}
          </button>
        )}
      </div>

      {/* Project selector */}
      <div className={CARD}><div className={BODY}>
        <select value={projetId ?? ''} onChange={e => { setProjetId(e.target.value ? Number(e.target.value) : null); setPage(0) }}
          className="w-full sm:max-w-md border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary">
          <option value="">{t('incidents.chooseProject')}</option>
          {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
        </select>
      </div></div>

      {!projetId && <p className="text-center text-gray-400 py-8">{t('incidents.noProject')}</p>}

      {projetId && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setFilterStatut('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${!filterStatut ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
              Tous ({inspections.length})
            </button>
            {Object.values(StatutInspection).map(s => (
              <button key={s} onClick={() => setFilterStatut(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filterStatut === s ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                {t(`statutInspection.${s}`)} ({inspections.filter(i => i.statut === s).length})
              </button>
            ))}
          </div>

          {/* List */}
          <div className={CARD}>
            {loading ? (
              <div className="p-8 text-center text-gray-400">{t('inspections.loading')}</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-400">{t('inspections.empty')}</div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map((ins: InspectionResponse) => (
                  <div key={ins.id} className="px-4 py-3 sm:px-5 sm:py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-mono text-gray-400">{ins.reference}</span>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">{ins.titre}</h3>
                        </div>
                        <div className="flex flex-wrap gap-1.5 text-xs mt-1">
                          <span className={`px-2 py-0.5 rounded-md font-medium ${statutColors[ins.statut]}`}>{t(`statutInspection.${ins.statut}`)}</span>
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-200">{t(`typeInspection.${ins.typeInspection}`)}</span>
                          {ins.scoreGlobal !== null && (
                            <span className={`px-2 py-0.5 rounded-md font-bold ${scoreColor(ins.scoreGlobal)} bg-gray-50 dark:bg-gray-700`}>
                              {t('inspections.score')} {ins.scoreGlobal}%
                            </span>
                          )}
                          {ins.nbItems > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500">
                              {ins.nbConformes}/{ins.nbItems} {t('inspections.conformes')}
                            </span>
                          )}
                          {ins.datePlanifiee && <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500">{ins.datePlanifiee}</span>}
                          {ins.zoneInspecte && <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500">{ins.zoneInspecte}</span>}
                          {ins.inspecteurNom && <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200">{ins.inspecteurNom}</span>}
                        </div>
                      </div>
                      <button onClick={() => handleDelete(ins.id)}
                        className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 transition self-end sm:self-start">Supprimer</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 py-3 border-t border-gray-200 dark:border-gray-700">
                <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 text-sm disabled:opacity-40">←</button>
                <span className="text-sm text-gray-500 self-center">{page + 1} / {totalPages}</span>
                <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 text-sm disabled:opacity-40">→</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-3 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:border dark:border-gray-600 w-full max-w-lg p-5 sm:p-6 my-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('inspections.createInspection')}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('inspections.form.titre')}</label>
                <input type="text" value={fTitre} onChange={e => setFTitre(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('inspections.form.type')}</label>
                  <select value={fType} onChange={e => setFType(e.target.value as TypeInspection)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100">
                    {Object.values(TypeInspection).map(v => <option key={v} value={v}>{t(`typeInspection.${v}`)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('inspections.form.template')}</label>
                  <select value={fTemplateId} onChange={e => setFTemplateId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100">
                    <option value="">{t('inspections.form.noTemplate')}</option>
                    {templates.map(tpl => <option key={tpl.id} value={tpl.id}>{tpl.nom} ({tpl.nbItems} items)</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('inspections.form.datePlanifiee')}</label>
                  <input type="date" value={fDate} onChange={e => setFDate(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('inspections.form.zone')}</label>
                  <input type="text" value={fZone} onChange={e => setFZone(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">{t('inspections.form.cancel')}</button>
              <button onClick={handleCreate} disabled={!fTitre.trim()}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 text-sm font-medium">{t('inspections.form.submit')}</button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
