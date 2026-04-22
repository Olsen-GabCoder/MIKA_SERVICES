import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useConfirm } from '@/contexts/ConfirmContext'
import { fetchEssais, createEssai, updateEssai, deleteEssai } from '@/store/slices/qualiteEssaiLaboSlice'
import { fetchProjets } from '@/store/slices/projetSlice'
import type { EssaiLaboBetonResponse } from '@/types/qualiteEssaiLabo'
import { PageContainer } from '@/components/layout/PageContainer'

const CARD = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm overflow-hidden'
const BODY = 'p-4 sm:p-5'

function getCurrentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function EssaisLaboBetonPage() {
  const { t } = useTranslation('qualite')
  const dispatch = useAppDispatch()
  const confirm = useConfirm()

  const { essais, totalPages, loading } = useAppSelector(s => s.qualiteEssaiLabo)
  const projets = useAppSelector(s => s.projet.projets)

  const [projetId, setProjetId] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  // Form state
  const [formMois, setFormMois] = useState(getCurrentMonth())
  const [formCamions, setFormCamions] = useState(0)
  const [formSlump, setFormSlump] = useState(0)
  const [formJours, setFormJours] = useState(0)
  const [formPrelevements, setFormPrelevements] = useState(0)
  const [formObs, setFormObs] = useState('')

  useEffect(() => { dispatch(fetchProjets({ page: 0, size: 200 })) }, [dispatch])

  const loadData = useCallback(() => {
    dispatch(fetchEssais({
      projetId: projetId ?? undefined,
      page,
    }))
  }, [dispatch, projetId, page])

  useEffect(() => { loadData() }, [loadData])

  const resetForm = () => {
    setFormMois(getCurrentMonth())
    setFormCamions(0)
    setFormSlump(0)
    setFormJours(0)
    setFormPrelevements(0)
    setFormObs('')
    setEditingId(null)
  }

  const openCreate = () => { resetForm(); setShowModal(true) }
  const openEdit = (e: EssaiLaboBetonResponse) => {
    setEditingId(e.id)
    setFormMois(e.moisReference)
    setFormCamions(e.nbCamionsMalaxeursVolumeCoulee)
    setFormSlump(e.nbEssaisSlump)
    setFormJours(e.nbJoursCoulage)
    setFormPrelevements(e.nbPrelevements)
    setFormObs(e.observations ?? '')
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!projetId) return
    if (editingId) {
      await dispatch(updateEssai({
        id: editingId,
        req: {
          nbCamionsMalaxeursVolumeCoulee: formCamions,
          nbEssaisSlump: formSlump,
          nbJoursCoulage: formJours,
          nbPrelevements: formPrelevements,
          observations: formObs || undefined,
        }
      }))
    } else {
      await dispatch(createEssai({
        projetId,
        moisReference: formMois,
        nbCamionsMalaxeursVolumeCoulee: formCamions,
        nbEssaisSlump: formSlump,
        nbJoursCoulage: formJours,
        nbPrelevements: formPrelevements,
        observations: formObs || undefined,
      }))
    }
    setShowModal(false)
    resetForm()
    loadData()
  }

  const handleDelete = async (id: number) => {
    if (await confirm({ messageKey: 'essaisLabo.confirmDelete', ns: 'qualite' })) {
      await dispatch(deleteEssai(id))
      loadData()
    }
  }

  // KPI
  const totalEssais = essais.length
  const totalCamions = essais.reduce((s, e) => s + e.nbCamionsMalaxeursVolumeCoulee, 0)
  const totalSlump = essais.reduce((s, e) => s + e.nbEssaisSlump, 0)
  const totalPrelevements = essais.reduce((s, e) => s + e.nbPrelevements, 0)

  const KpiCard = ({ value, label, accent = '' }: { value: number; label: string; accent?: string }) => (
    <div className={CARD}>
      <div className={`${BODY} text-center`}>
        <p className={`text-xl sm:text-2xl font-bold tabular-nums ${accent || 'text-gray-900 dark:text-gray-100'}`}>{value}</p>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  )

  const INPUT = 'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent'

  return (
    <PageContainer size="full" className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{t('essaisLabo.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('essaisLabo.subtitle')}</p>
        </div>
        {projetId && (
          <button
            onClick={openCreate}
            className="bg-[#FF6B35] text-white px-4 py-2.5 rounded-lg hover:bg-[#e55a2b] font-medium shadow-sm transition flex items-center gap-2 self-start sm:self-auto"
          >
            <span className="text-lg leading-none">+</span> {t('essaisLabo.create')}
          </button>
        )}
      </div>

      {/* KPI cards + project filter */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className={`${CARD} col-span-2 lg:col-span-1`}>
          <div className={BODY}>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">{t('essaisLabo.projet')}</p>
            <select
              value={projetId ?? ''}
              onChange={e => { setProjetId(e.target.value ? Number(e.target.value) : null); setPage(0) }}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#FF6B35]"
            >
              <option value="">{t('essaisLabo.allProjets')}</option>
              {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          </div>
        </div>
        <KpiCard value={totalEssais} label={t('essaisLabo.kpi.totalMois')} accent="text-blue-600 dark:text-blue-400" />
        <KpiCard value={totalCamions} label={t('essaisLabo.kpi.camions')} accent="text-amber-600 dark:text-amber-400" />
        <KpiCard value={totalSlump} label={t('essaisLabo.kpi.slump')} accent="text-green-600 dark:text-green-400" />
        <KpiCard value={totalPrelevements} label={t('essaisLabo.kpi.prelevements')} accent="text-purple-600 dark:text-purple-400" />
      </div>

      {/* Table */}
      <div className={CARD}>
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <div className="w-8 h-8 border-3 border-gray-300 dark:border-gray-600 border-t-[#FF6B35] rounded-full animate-spin mx-auto" />
          </div>
        ) : essais.length === 0 ? (
          <div className="p-8 text-center text-gray-400">{t('essaisLabo.empty')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-600 dark:text-gray-400">
                  {!projetId && <th className="py-3 px-4 font-medium">{t('essaisLabo.projet')}</th>}
                  <th className="py-3 px-4 font-medium">{t('essaisLabo.mois')}</th>
                  <th className="py-3 px-4 font-medium text-right">{t('essaisLabo.fields.camions')}</th>
                  <th className="py-3 px-4 font-medium text-right">{t('essaisLabo.fields.slump')}</th>
                  <th className="py-3 px-4 font-medium text-right">{t('essaisLabo.fields.jours')}</th>
                  <th className="py-3 px-4 font-medium text-right">{t('essaisLabo.fields.prelevements')}</th>
                  <th className="py-3 px-4 font-medium">{t('essaisLabo.fields.observations')}</th>
                  <th className="py-3 px-4 font-medium">{t('essaisLabo.fields.saisiPar')}</th>
                  <th className="py-3 px-4 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {essais.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    {!projetId && <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{e.projetNom}</td>}
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{e.moisReference}</td>
                    <td className="py-3 px-4 text-right tabular-nums">{e.nbCamionsMalaxeursVolumeCoulee}</td>
                    <td className="py-3 px-4 text-right tabular-nums">{e.nbEssaisSlump}</td>
                    <td className="py-3 px-4 text-right tabular-nums">{e.nbJoursCoulage}</td>
                    <td className="py-3 px-4 text-right tabular-nums">{e.nbPrelevements}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400 max-w-[200px] truncate">{e.observations ?? '\u2014'}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{e.saisiParNom ?? '\u2014'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(e)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-xs transition">
                          {t('essaisLabo.edit')}
                        </button>
                        <button onClick={() => handleDelete(e.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 text-xs transition">
                          {t('essaisLabo.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 py-3 border-t border-gray-200 dark:border-gray-700">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 text-sm disabled:opacity-40">{'\u2190'}</button>
            <span className="text-sm text-gray-500 dark:text-gray-400 self-center">{page + 1} / {totalPages}</span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 text-sm disabled:opacity-40">{'\u2192'}</button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 overflow-y-auto p-3">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:border dark:border-gray-600 w-full max-w-lg p-5 sm:p-6 my-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {editingId ? t('essaisLabo.editTitle') : t('essaisLabo.create')}
            </h2>

            <div className="space-y-3">
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('essaisLabo.mois')}</label>
                  <input type="month" value={formMois} onChange={e => setFormMois(e.target.value)}
                    className={INPUT} />
                </div>
              )}

              {[
                { label: t('essaisLabo.fields.camions'), value: formCamions, set: setFormCamions },
                { label: t('essaisLabo.fields.slump'), value: formSlump, set: setFormSlump },
                { label: t('essaisLabo.fields.jours'), value: formJours, set: setFormJours },
                { label: t('essaisLabo.fields.prelevements'), value: formPrelevements, set: setFormPrelevements },
              ].map(field => (
                <div key={field.label}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
                  <input type="number" min={0} value={field.value}
                    onChange={e => field.set(Math.max(0, parseInt(e.target.value) || 0))}
                    className={INPUT} />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('essaisLabo.fields.observations')}</label>
                <textarea value={formObs} onChange={e => setFormObs(e.target.value)} rows={2}
                  className={INPUT} />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => { setShowModal(false); resetForm() }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">
                {t('essaisLabo.cancel')}
              </button>
              <button onClick={handleSubmit}
                className="px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b] disabled:opacity-50 text-sm font-medium shadow-sm transition">
                {editingId ? t('essaisLabo.save') : t('essaisLabo.create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
