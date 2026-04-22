import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useConfirm } from '@/contexts/ConfirmContext'
import { fetchAgrements, createAgrement, updateAgrement, deleteAgrement } from '@/store/slices/qualiteAgrementSlice'
import { fetchProjets } from '@/store/slices/projetSlice'
import { StatutAgrement } from '@/types/qualiteAgrement'
import type { AgrementMarcheResponse } from '@/types/qualiteAgrement'
import { PageContainer } from '@/components/layout/PageContainer'

const CARD = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm overflow-hidden'
const BODY = 'p-4 sm:p-5'

const statutColors: Record<string, string> = {
  PREVU_AU_MARCHE: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  ETABLI: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200',
  EN_ATTENTE_MDC: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200',
  ACCORDE_SANS_RESERVE: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200',
  ACCORDE_AVEC_RESERVE: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-200',
  REJETE: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200',
}

export default function AgrementsPage() {
  const { t } = useTranslation('qualite')
  const dispatch = useAppDispatch()
  const confirm = useConfirm()

  const { agrements, totalPages, currentPage, loading } = useAppSelector(s => s.qualiteAgrement)
  const projets = useAppSelector(s => s.projet.projets)

  const [projetId, setProjetId] = useState<number | null>(null)
  const [filterStatut, setFilterStatut] = useState<StatutAgrement | ''>('')
  const [page, setPage] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<AgrementMarcheResponse | null>(null)

  // Form
  const [formObjet, setFormObjet] = useState('')
  const [formTitre, setFormTitre] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formStatut, setFormStatut] = useState<StatutAgrement>(StatutAgrement.PREVU_AU_MARCHE)

  useEffect(() => { dispatch(fetchProjets({ page: 0, size: 200 })) }, [dispatch])

  const loadData = useCallback(() => {
    dispatch(fetchAgrements({
      projetId: projetId ?? undefined,
      page,
      statut: filterStatut || undefined,
    }))
  }, [dispatch, projetId, page, filterStatut])

  useEffect(() => { loadData() }, [loadData])

  const resetForm = () => {
    setFormObjet(''); setFormTitre(''); setFormDescription('')
    setFormStatut(StatutAgrement.PREVU_AU_MARCHE); setEditingItem(null)
  }

  const openCreate = () => { resetForm(); setShowModal(true) }
  const openEdit = (a: AgrementMarcheResponse) => {
    setEditingItem(a)
    setFormObjet(a.objet); setFormTitre(a.titre)
    setFormDescription(a.description ?? ''); setFormStatut(a.statut)
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!projetId) return
    if (editingItem) {
      await dispatch(updateAgrement({
        id: editingItem.id,
        req: {
          objet: formObjet, titre: formTitre,
          description: formDescription || undefined,
          statut: formStatut,
        }
      }))
    } else {
      await dispatch(createAgrement({
        projetId, objet: formObjet, titre: formTitre,
        description: formDescription || undefined,
        statut: formStatut,
      }))
    }
    setShowModal(false); resetForm(); loadData()
  }

  const handleDelete = async (id: number) => {
    if (await confirm({ messageKey: 'agrements.confirmDelete', ns: 'qualite' })) {
      await dispatch(deleteAgrement(id)); loadData()
    }
  }

  // KPI
  const countByStatut = (s: StatutAgrement) => agrements.filter(a => a.statut === s).length

  const KpiCard = ({ value, label, accent = '' }: { value: number | string; label: string; accent?: string }) => (
    <div className={CARD}>
      <div className={`${BODY} text-center`}>
        <p className={`text-xl sm:text-2xl font-bold tabular-nums ${accent || 'text-gray-900 dark:text-gray-100'}`}>{value}</p>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  )

  return (
    <PageContainer size="full" className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{t('agrements.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('agrements.subtitle')}</p>
        </div>
        {projetId && (
          <button onClick={openCreate}
            className="bg-[#FF6B35] text-white px-4 py-2.5 rounded-lg hover:bg-[#e55a2b] font-medium shadow-sm transition flex items-center gap-2 self-start sm:self-auto">
            <span className="text-lg leading-none">+</span> {t('agrements.create')}
          </button>
        )}
      </div>

      {/* Project filter + KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className={`${CARD} col-span-2 lg:col-span-1`}>
          <div className={`${BODY} flex flex-col justify-center h-full`}>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">{t('agrements.projet')}</p>
            <select value={projetId ?? ''} onChange={e => { setProjetId(e.target.value ? Number(e.target.value) : null); setPage(0) }}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent">
              <option value="">{t('agrements.allProjets')}</option>
              {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          </div>
        </div>
        <KpiCard value={agrements.length} label={t('agrements.kpi.total')} accent="text-blue-600 dark:text-blue-400" />
        <KpiCard value={countByStatut(StatutAgrement.PREVU_AU_MARCHE)} label={t('agrements.kpi.prevus')} />
        <KpiCard value={countByStatut(StatutAgrement.EN_ATTENTE_MDC)} label={t('agrements.kpi.enAttente')} accent="text-amber-600 dark:text-amber-400" />
        <KpiCard value={countByStatut(StatutAgrement.ACCORDE_SANS_RESERVE) + countByStatut(StatutAgrement.ACCORDE_AVEC_RESERVE)} label={t('agrements.kpi.accordes')} accent="text-green-600 dark:text-green-400" />
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
            <button onClick={() => { setFilterStatut(''); setPage(0) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${!filterStatut ? 'bg-[#FF6B35] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
              {t('agrements.allStatuts')} ({agrements.length})
            </button>
            {Object.values(StatutAgrement).map(s => {
              const count = countByStatut(s)
              return (
                <button key={s} onClick={() => { setFilterStatut(s); setPage(0) }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filterStatut === s ? 'bg-[#FF6B35] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                  {t(`agrements.statuts.${s}`)} ({count})
                </button>
              )
            })}
          </div>

          {/* Table */}
          <div className={CARD}>
            {loading ? (
              <div className="p-8 text-center text-gray-400">
                <div className="inline-block w-8 h-8 border-3 border-gray-300 dark:border-gray-600 border-t-[#FF6B35] rounded-full animate-spin" />
              </div>
            ) : agrements.length === 0 ? (
              <div className="p-8 text-center text-gray-400">{t('agrements.empty')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                      <th className="py-3 px-4 font-medium text-xs uppercase tracking-wider">{t('agrements.reference')}</th>
                      <th className="py-3 px-4 font-medium text-xs uppercase tracking-wider">{t('agrements.objet')}</th>
                      <th className="py-3 px-4 font-medium text-xs uppercase tracking-wider">{t('agrements.titre')}</th>
                      <th className="py-3 px-4 font-medium text-xs uppercase tracking-wider">{t('agrements.statut')}</th>
                      <th className="py-3 px-4 font-medium text-xs uppercase tracking-wider">{t('agrements.dateSoumission')}</th>
                      <th className="py-3 px-4 font-medium text-xs uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {agrements.map(a => (
                      <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs text-gray-400">
                          {a.reference}
                          {!projetId && <span className="text-xs text-gray-400 dark:text-gray-500"> — {a.projetNom}</span>}
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100 max-w-[200px] truncate">{a.objet}</td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300 max-w-[200px] truncate">{a.titre}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${statutColors[a.statut] ?? ''}`}>
                            {t(`agrements.statuts.${a.statut}`)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500 dark:text-gray-400 tabular-nums">{a.dateSoumission ?? '—'}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button onClick={() => openEdit(a)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-xs transition">{t('agrements.edit')}</button>
                            <button onClick={() => handleDelete(a.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 text-xs transition">{t('agrements.delete')}</button>
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
                  className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 text-sm disabled:opacity-40 transition">&larr;</button>
                <span className="text-sm text-gray-500 dark:text-gray-400 self-center tabular-nums">{page + 1} / {totalPages}</span>
                <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 text-sm disabled:opacity-40 transition">&rarr;</button>
              </div>
            )}
          </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 overflow-y-auto p-3">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:border dark:border-gray-600 w-full max-w-lg p-5 sm:p-6 my-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {editingItem ? t('agrements.editTitle') : t('agrements.create')}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('agrements.objet')}</label>
                <input value={formObjet} onChange={e => setFormObjet(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('agrements.titre')}</label>
                <input value={formTitre} onChange={e => setFormTitre(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('agrements.statut')}</label>
                <select value={formStatut} onChange={e => setFormStatut(e.target.value as StatutAgrement)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent">
                  {Object.values(StatutAgrement).map(s => (
                    <option key={s} value={s}>{t(`agrements.statuts.${s}`)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('agrements.description')}</label>
                <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={2}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent" />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => { setShowModal(false); resetForm() }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition">
                {t('agrements.cancel')}
              </button>
              <button onClick={handleSubmit} disabled={!formObjet.trim() || !formTitre.trim()}
                className="px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b] disabled:opacity-50 text-sm font-medium shadow-sm transition">
                {editingItem ? t('agrements.save') : t('agrements.create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
