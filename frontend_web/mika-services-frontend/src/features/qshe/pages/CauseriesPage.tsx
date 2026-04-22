import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useConfirm } from '@/contexts/ConfirmContext'
import { fetchProjets } from '@/store/slices/projetSlice'
import { fetchCauseriesByProjet, createCauserie, deleteCauserie, fetchCauserieSummary } from '@/store/slices/qsheCauserieSlice'
import type { CauserieCreateRequest, CauserieResponse } from '@/types/qsheCauserie'
import { PageContainer } from '@/components/layout/PageContainer'

const CARD = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm overflow-hidden'
const BODY = 'p-4 sm:p-5'

export default function CauseriesPage() {
  const { t } = useTranslation('qshe')
  const dispatch = useAppDispatch()
  const confirm = useConfirm()
  const { causeries, summary, loading, totalPages } = useAppSelector(s => s.qsheCauserie)
  const projets = useAppSelector(s => s.projet.projets)

  const [projetId, setProjetId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [page, setPage] = useState(0)

  const [fSujet, setFSujet] = useState('')
  const [fDate, setFDate] = useState(new Date().toISOString().slice(0, 10))
  const [fHeure, setFHeure] = useState('')
  const [fDuree, setFDuree] = useState(15)
  const [fLieu, setFLieu] = useState('')
  const [fDesc, setFDesc] = useState('')

  useEffect(() => { dispatch(fetchProjets({ page: 0, size: 200 })) }, [dispatch])
  useEffect(() => {
    if (projetId) { dispatch(fetchCauseriesByProjet({ projetId, page })); dispatch(fetchCauserieSummary(projetId)) }
  }, [dispatch, projetId, page])

  const handleCreate = async () => {
    if (!projetId || !fSujet.trim() || !fDate) return
    const req: CauserieCreateRequest = {
      projetId, sujet: fSujet.trim(), dateCauserie: fDate,
      heureDebut: fHeure || undefined, dureeMinutes: fDuree || undefined,
      lieu: fLieu.trim() || undefined, description: fDesc.trim() || undefined,
    }
    await dispatch(createCauserie(req))
    setShowForm(false); setFSujet(''); setFDate(new Date().toISOString().slice(0, 10)); setFHeure(''); setFDuree(15); setFLieu(''); setFDesc('')
    dispatch(fetchCauseriesByProjet({ projetId })); dispatch(fetchCauserieSummary(projetId))
  }

  const handleDelete = async (id: number) => {
    if (await confirm({ messageKey: 'incidents.confirm.delete' })) {
      await dispatch(deleteCauserie(id)); if (projetId) dispatch(fetchCauserieSummary(projetId))
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Causeries sécurité</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Toolbox talks, quart d'heure sécurité, présence</p>
        </div>
        {projetId && (
          <button onClick={() => setShowForm(true)}
            className="bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary-dark font-medium shadow-sm transition flex items-center gap-2 self-start sm:self-auto">
            <span className="text-lg leading-none">+</span> Nouvelle causerie
          </button>
        )}
      </div>

      <div className={CARD}><div className={BODY}>
        <select value={projetId ?? ''} onChange={e => { setProjetId(e.target.value ? Number(e.target.value) : null); setPage(0) }}
          className="w-full sm:max-w-md border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary">
          <option value="">{t('incidents.chooseProject')}</option>
          {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
        </select>
      </div></div>

      {!projetId && <p className="text-center text-gray-400 py-8">{t('incidents.noProject')}</p>}

      {projetId && summary && (
        <>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <KpiCard value={summary.totalCauseries} label="Total causeries" />
            <KpiCard value={summary.causeriesCeMois} label="Ce mois" accent="text-blue-600 dark:text-blue-400" />
            <KpiCard value={summary.participantsMoyens} label="Participants moy." accent="text-green-600 dark:text-green-400" />
          </div>

          <div className={CARD}>
            {loading ? <div className="p-8 text-center text-gray-400">{t('incidents.loading')}</div>
            : causeries.length === 0 ? <div className="p-8 text-center text-gray-400">Aucune causerie sécurité enregistrée.</div>
            : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {causeries.map((c: CauserieResponse) => (
                  <div key={c.id} className="px-4 py-3 sm:px-5 sm:py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-mono text-gray-400">{c.reference}</span>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">{c.sujet}</h3>
                        </div>
                        <div className="flex flex-wrap gap-1.5 text-xs mt-1">
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200">{c.dateCauserie}</span>
                          {c.heureDebut && <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500">{c.heureDebut}</span>}
                          {c.dureeMinutes && <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500">{c.dureeMinutes} min</span>}
                          <span className="px-2 py-0.5 rounded-md bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200 font-medium">{c.nbParticipants} participant(s)</span>
                          {c.animateurNom && <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-200">{c.animateurNom}</span>}
                          {c.lieu && <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500">{c.lieu}</span>}
                        </div>
                      </div>
                      <button onClick={() => handleDelete(c.id)}
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

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-3 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:border dark:border-gray-600 w-full max-w-lg p-5 sm:p-6 my-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Nouvelle causerie sécurité</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sujet *</label>
                <input type="text" value={fSujet} onChange={e => setFSujet(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-primary" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date *</label>
                  <input type="date" value={fDate} onChange={e => setFDate(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Heure</label>
                  <input type="time" value={fHeure} onChange={e => setFHeure(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Durée (min)</label>
                  <input type="number" min={5} value={fDuree} onChange={e => setFDuree(Number(e.target.value))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lieu</label>
                <input type="text" value={fLieu} onChange={e => setFLieu(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description / contenu</label>
                <textarea value={fDesc} onChange={e => setFDesc(e.target.value)} rows={3}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 text-sm">Annuler</button>
              <button onClick={handleCreate} disabled={!fSujet.trim() || !fDate} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 text-sm font-medium">Créer</button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
