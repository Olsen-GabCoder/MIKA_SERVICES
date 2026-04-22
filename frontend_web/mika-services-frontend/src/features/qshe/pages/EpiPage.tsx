import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useConfirm } from '@/contexts/ConfirmContext'
import { fetchEpis, createEpi, deleteEpi, fetchExpires, fetchStockBas, fetchEpiSummary } from '@/store/slices/qsheEpiSlice'
import { TypeEpi, EtatEpi } from '@/types/qsheEpi'
import type { EpiCreateRequest, EpiResponse } from '@/types/qsheEpi'
import { PageContainer } from '@/components/layout/PageContainer'

const CARD = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm overflow-hidden'
const BODY = 'p-4 sm:p-5'

const etatColors: Record<EtatEpi, string> = {
  NEUF: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200',
  EN_SERVICE: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200',
  USE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-200',
  ENDOMMAGE: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-200',
  RETIRE: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
}

export default function EpiPage() {
  const { t } = useTranslation('qshe')
  const dispatch = useAppDispatch()
  const confirm = useConfirm()
  const { epis, summary, loading, totalPages } = useAppSelector(s => s.qsheEpi)

  const [showForm, setShowForm] = useState(false)
  const [page, setPage] = useState(0)
  const [viewMode, setViewMode] = useState<'all' | 'expires' | 'stockBas'>('all')

  const [fCode, setFCode] = useState('')
  const [fType, setFType] = useState<TypeEpi>(TypeEpi.CASQUE)
  const [fDesign, setFDesign] = useState('')
  const [fMarque, setFMarque] = useState('')
  const [fDateExp, setFDateExp] = useState('')
  const [fStock, setFStock] = useState(0)
  const [fStockMin, setFStockMin] = useState(0)

  useEffect(() => { dispatch(fetchEpis({ page })); dispatch(fetchEpiSummary()); dispatch(fetchExpires()); dispatch(fetchStockBas()) }, [dispatch, page])

  const handleCreate = async () => {
    if (!fCode.trim() || !fDesign.trim()) return
    const req: EpiCreateRequest = {
      code: fCode.trim(), typeEpi: fType, designation: fDesign.trim(),
      marque: fMarque.trim() || undefined, dateExpiration: fDateExp || undefined,
      quantiteStock: fStock, stockMinimum: fStockMin,
    }
    await dispatch(createEpi(req))
    setShowForm(false); setFCode(''); setFDesign(''); setFMarque(''); setFDateExp(''); setFStock(0); setFStockMin(0)
    dispatch(fetchEpis({ page: 0 })); dispatch(fetchEpiSummary())
  }

  const handleDelete = async (id: number) => {
    if (await confirm({ messageKey: 'incidents.confirm.delete' })) {
      await dispatch(deleteEpi(id)); dispatch(fetchEpiSummary())
    }
  }

  const KpiCard = ({ value, label, accent = '' }: { value: number | string; label: string; accent?: string }) => (
    <div className={CARD}><div className={`${BODY} text-center`}>
      <p className={`text-xl sm:text-2xl font-bold tabular-nums ${accent || 'text-gray-900 dark:text-gray-100'}`}>{value}</p>
      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </div></div>
  )

  return (
    <PageContainer size="full" className="space-y-4 sm:space-y-6 bg-gray-50/80 dark:bg-gray-900/80">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Équipements de Protection Individuelle</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Inventaire, dotation, expiration, stock</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary-dark font-medium shadow-sm transition flex items-center gap-2 self-start sm:self-auto">
          <span className="text-lg leading-none">+</span> Nouvel EPI
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard value={summary.totalEpi} label="Total EPI" />
          <KpiCard value={summary.enService} label="En service" accent="text-green-600 dark:text-green-400" />
          <KpiCard value={summary.expires} label="Expirés" accent={summary.expires > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600'} />
          <KpiCard value={summary.stocksBas} label="Stocks bas" accent={summary.stocksBas > 0 ? 'text-orange-600 dark:text-orange-400 animate-pulse' : 'text-green-600'} />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(['all', 'expires', 'stockBas'] as const).map(m => (
          <button key={m} onClick={() => setViewMode(m)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${viewMode === m ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
            {m === 'all' ? `Tous (${epis.length})` : m === 'expires' ? 'Expirés' : 'Stock bas'}
          </button>
        ))}
      </div>

      <div className={CARD}>
        {loading ? <div className="p-8 text-center text-gray-400">{t('incidents.loading')}</div>
        : epis.length === 0 ? <div className="p-8 text-center text-gray-400">Aucun EPI enregistré.</div>
        : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {epis.map((e: EpiResponse) => (
              <div key={e.id} className={`px-4 py-3 sm:px-5 sm:py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${e.expire ? 'border-l-4 border-l-red-500' : e.stockBas ? 'border-l-4 border-l-orange-400' : ''}`}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono text-gray-400">{e.code}</span>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">{e.designation}</h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-xs mt-1">
                      <span className={`px-2 py-0.5 rounded-md font-medium ${etatColors[e.etat]}`}>{e.etat.replace(/_/g, ' ')}</span>
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-200">{e.typeEpi.replace(/_/g, ' ')}</span>
                      {e.taille && <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500">T.{e.taille}</span>}
                      <span className={`px-2 py-0.5 rounded-md ${e.stockBas ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 font-bold' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                        Stock: {e.quantiteStock}/{e.stockMinimum}
                      </span>
                      {e.expire && <span className="px-2 py-0.5 rounded-md bg-red-600 text-white font-bold">Expiré</span>}
                      {e.affecteANom && <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200">{e.affecteANom}</span>}
                      {e.marque && <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500">{e.marque}</span>}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(e.id)}
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

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-3 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:border dark:border-gray-600 w-full max-w-lg p-5 sm:p-6 my-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Nouvel EPI</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code *</label>
                  <input type="text" value={fCode} onChange={e => setFCode(e.target.value)} placeholder="EPI-001"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type *</label>
                  <select value={fType} onChange={e => setFType(e.target.value as TypeEpi)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100">
                    {Object.values(TypeEpi).map(v => <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Désignation *</label>
                <input type="text" value={fDesign} onChange={e => setFDesign(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Marque</label>
                  <input type="text" value={fMarque} onChange={e => setFMarque(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date expiration</label>
                  <input type="date" value={fDateExp} onChange={e => setFDateExp(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantité stock</label>
                  <input type="number" min={0} value={fStock} onChange={e => setFStock(Number(e.target.value))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock minimum</label>
                  <input type="number" min={0} value={fStockMin} onChange={e => setFStockMin(Number(e.target.value))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 text-sm">Annuler</button>
              <button onClick={handleCreate} disabled={!fCode.trim() || !fDesign.trim()} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 text-sm font-medium">Créer</button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
