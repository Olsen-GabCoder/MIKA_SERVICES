import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useConfirm } from '@/contexts/ConfirmContext'
import { fetchLevees, createLevee, updateLevee, deleteLevee } from '@/store/slices/qualiteLeveeTopoSlice'
import { fetchProjets } from '@/store/slices/projetSlice'
import type { LeveeTopoResponse } from '@/types/qualiteLeveeTopo'
import { PageContainer } from '@/components/layout/PageContainer'

const CARD = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm overflow-hidden'
const BODY = 'p-4 sm:p-5'

function getCurrentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function LeveeTopoPage() {
  const { t } = useTranslation('qualite')
  const dispatch = useAppDispatch()
  const confirm = useConfirm()

  const { levees, totalPages, loading } = useAppSelector(s => s.qualiteLeveeTopo)
  const projets = useAppSelector(s => s.projet.projets)

  const [projetId, setProjetId] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  // Form state
  const [formMois, setFormMois] = useState(getCurrentMonth())
  const [formImplantes, setFormImplantes] = useState(0)
  const [formReceptionnes, setFormReceptionnes] = useState(0)
  const [formControles, setFormControles] = useState(0)
  const [formObs, setFormObs] = useState('')

  useEffect(() => {
    dispatch(fetchProjets({ page: 0, size: 200 }))
  }, [dispatch])

  const loadData = useCallback(() => {
    dispatch(fetchLevees({ projetId: projetId ?? undefined, page }))
  }, [dispatch, projetId, page])

  useEffect(() => { loadData() }, [loadData])

  const resetForm = () => {
    setFormMois(getCurrentMonth())
    setFormImplantes(0)
    setFormReceptionnes(0)
    setFormControles(0)
    setFormObs('')
    setEditingId(null)
  }

  const openCreate = () => { resetForm(); setShowModal(true) }
  const openEdit = (e: LeveeTopoResponse) => {
    setEditingId(e.id)
    setFormMois(e.moisReference)
    setFormImplantes(e.nbProfilsImplantes)
    setFormReceptionnes(e.nbProfilsReceptionnes)
    setFormControles(e.nbControlesRealises)
    setFormObs(e.observations ?? '')
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!projetId) return
    if (editingId) {
      await dispatch(updateLevee({
        id: editingId,
        req: {
          nbProfilsImplantes: formImplantes,
          nbProfilsReceptionnes: formReceptionnes,
          nbControlesRealises: formControles,
          observations: formObs || undefined,
        }
      }))
    } else {
      await dispatch(createLevee({
        projetId,
        moisReference: formMois,
        nbProfilsImplantes: formImplantes,
        nbProfilsReceptionnes: formReceptionnes,
        nbControlesRealises: formControles,
        observations: formObs || undefined,
      }))
    }
    setShowModal(false)
    resetForm()
    loadData()
  }

  const handleDelete = async (id: number) => {
    if (await confirm({ messageKey: 'leveeTopo.confirmDelete', ns: 'qualite' })) {
      await dispatch(deleteLevee(id))
      loadData()
    }
  }

  // KPI
  const totalLevees = levees.length
  const totalImplantes = levees.reduce((s, e) => s + e.nbProfilsImplantes, 0)
  const totalReceptionnes = levees.reduce((s, e) => s + e.nbProfilsReceptionnes, 0)
  const totalControles = levees.reduce((s, e) => s + e.nbControlesRealises, 0)

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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{t('leveeTopo.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('leveeTopo.subtitle')}</p>
        </div>
        {projetId && (
          <button
            onClick={openCreate}
            className="bg-[#FF6B35] text-white px-4 py-2.5 rounded-lg hover:bg-[#e55a2b] font-medium shadow-sm transition flex items-center gap-2 self-start sm:self-auto"
          >
            <span className="text-lg leading-none">+</span> {t('leveeTopo.create')}
          </button>
        )}
      </div>

      {/* Project filter + KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className={`${CARD} col-span-2 lg:col-span-1`}>
          <div className={`${BODY} flex flex-col justify-center h-full`}>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">{t('leveeTopo.projet')}</p>
            <select
              value={projetId ?? ''}
              onChange={e => { setProjetId(e.target.value ? Number(e.target.value) : null); setPage(0) }}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
            >
              <option value="">{t('leveeTopo.allProjets')}</option>
              {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          </div>
        </div>
        <KpiCard value={totalLevees} label={t('leveeTopo.kpi.totalMois')} accent="text-blue-600 dark:text-blue-400" />
        <KpiCard value={totalImplantes} label={t('leveeTopo.kpi.implantes')} accent="text-amber-600 dark:text-amber-400" />
        <KpiCard value={totalReceptionnes} label={t('leveeTopo.kpi.receptionnes')} accent="text-green-600 dark:text-green-400" />
        <KpiCard value={totalControles} label={t('leveeTopo.kpi.controles')} accent="text-purple-600 dark:text-purple-400" />
      </div>

      {/* Table */}
      <div className={CARD}>
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <div className="w-8 h-8 border-3 border-gray-300 dark:border-gray-600 border-t-[#FF6B35] rounded-full animate-spin mx-auto" />
          </div>
        ) : levees.length === 0 ? (
          <div className="p-8 text-center text-gray-400">{t('leveeTopo.empty')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-600 dark:text-gray-400">
                  {!projetId && <th className="py-3 px-4 font-medium">{t('leveeTopo.projet')}</th>}
                  <th className="py-3 px-4 font-medium">{t('leveeTopo.mois')}</th>
                  <th className="py-3 px-4 font-medium text-right">{t('leveeTopo.fields.implantes')}</th>
                  <th className="py-3 px-4 font-medium text-right">{t('leveeTopo.fields.receptionnes')}</th>
                  <th className="py-3 px-4 font-medium text-right">{t('leveeTopo.fields.controles')}</th>
                  <th className="py-3 px-4 font-medium">{t('leveeTopo.fields.observations')}</th>
                  <th className="py-3 px-4 font-medium">{t('leveeTopo.fields.saisiPar')}</th>
                  <th className="py-3 px-4 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {levees.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    {!projetId && <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{e.projetNom}</td>}
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{e.moisReference}</td>
                    <td className="py-3 px-4 text-right tabular-nums">{e.nbProfilsImplantes}</td>
                    <td className="py-3 px-4 text-right tabular-nums">{e.nbProfilsReceptionnes}</td>
                    <td className="py-3 px-4 text-right tabular-nums">{e.nbControlesRealises}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400 max-w-[200px] truncate">{e.observations ?? '\u2014'}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{e.saisiParNom ?? '\u2014'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(e)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-xs transition">
                          {t('leveeTopo.edit')}
                        </button>
                        <button onClick={() => handleDelete(e.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 text-xs transition">
                          {t('leveeTopo.delete')}
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
              {editingId ? t('leveeTopo.editTitle') : t('leveeTopo.create')}
            </h2>

            <div className="space-y-3">
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('leveeTopo.mois')}</label>
                  <input type="month" value={formMois} onChange={e => setFormMois(e.target.value)}
                    className={INPUT} />
                </div>
              )}

              {[
                { label: t('leveeTopo.fields.implantes'), value: formImplantes, set: setFormImplantes },
                { label: t('leveeTopo.fields.receptionnes'), value: formReceptionnes, set: setFormReceptionnes },
                { label: t('leveeTopo.fields.controles'), value: formControles, set: setFormControles },
              ].map(field => (
                <div key={field.label}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
                  <input type="number" min={0} value={field.value}
                    onChange={e => field.set(Math.max(0, parseInt(e.target.value) || 0))}
                    className={INPUT} />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('leveeTopo.fields.observations')}</label>
                <textarea value={formObs} onChange={e => setFormObs(e.target.value)} rows={2}
                  className={INPUT} />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => { setShowModal(false); resetForm() }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">
                {t('leveeTopo.cancel')}
              </button>
              <button onClick={handleSubmit}
                className="px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b] disabled:opacity-50 text-sm font-medium shadow-sm transition">
                {editingId ? t('leveeTopo.save') : t('leveeTopo.create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
