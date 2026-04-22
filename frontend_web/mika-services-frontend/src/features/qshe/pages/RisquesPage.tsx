import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useConfirm } from '@/contexts/ConfirmContext'
import { fetchProjets } from '@/store/slices/projetSlice'
import { fetchRisquesByProjet, createRisque, deleteRisque, fetchRisqueSummary } from '@/store/slices/qsheRisqueSlice'
import { CategorieRisque, NiveauRisque } from '@/types/qsheRisque'
import type { RisqueCreateRequest, RisqueResponse } from '@/types/qsheRisque'
import { PageContainer } from '@/components/layout/PageContainer'

const CARD = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm overflow-hidden'
const BODY = 'p-4 sm:p-5'

const niveauColors: Record<string, string> = {
  FAIBLE: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200',
  MOYEN: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-200',
  ELEVE: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-200',
  CRITIQUE: 'bg-red-200 text-red-900 dark:bg-red-900/70 dark:text-red-100',
}

export default function RisquesPage() {
  const { t } = useTranslation('qshe')
  const dispatch = useAppDispatch()
  const confirm = useConfirm()
  const { risques, summary, loading, totalPages, currentPage } = useAppSelector(s => s.qsheRisque)
  const projets = useAppSelector(s => s.projet.projets)

  const [projetId, setProjetId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [page, setPage] = useState(0)

  const [fTitre, setFTitre] = useState('')
  const [fCat, setFCat] = useState<CategorieRisque | ''>('')
  const [fUnite, setFUnite] = useState('')
  const [fDanger, setFDanger] = useState('')
  const [fProb, setFProb] = useState(3)
  const [fGrav, setFGrav] = useState(3)
  const [fZone, setFZone] = useState('')

  useEffect(() => { dispatch(fetchProjets({ page: 0, size: 200 })) }, [dispatch])
  useEffect(() => {
    if (projetId) { dispatch(fetchRisquesByProjet({ projetId, page })); dispatch(fetchRisqueSummary(projetId)) }
  }, [dispatch, projetId, page])

  const handleCreate = async () => {
    if (!projetId || !fTitre.trim()) return
    const req: RisqueCreateRequest = {
      projetId, titre: fTitre.trim(), categorie: fCat || undefined,
      uniteTravail: fUnite.trim() || undefined, dangerIdentifie: fDanger.trim() || undefined,
      probabiliteBrute: fProb, graviteBrute: fGrav, zoneConcernee: fZone.trim() || undefined,
    }
    await dispatch(createRisque(req))
    setShowForm(false); setFTitre(''); setFCat(''); setFUnite(''); setFDanger(''); setFProb(3); setFGrav(3); setFZone('')
    dispatch(fetchRisquesByProjet({ projetId })); dispatch(fetchRisqueSummary(projetId))
  }

  const handleDelete = async (id: number) => {
    if (await confirm({ messageKey: 'incidents.confirm.delete' })) {
      await dispatch(deleteRisque(id)); if (projetId) dispatch(fetchRisqueSummary(projetId))
    }
  }

  const scoreLabel = (p: number, g: number) => `${p}×${g}=${p * g}`

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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Évaluation des risques</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">DUERP — Matrice probabilité × gravité, risque brut et résiduel</p>
        </div>
        {projetId && (
          <button onClick={() => setShowForm(true)}
            className="bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary-dark font-medium shadow-sm transition flex items-center gap-2 self-start sm:self-auto">
            <span className="text-lg leading-none">+</span> Nouveau risque
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <KpiCard value={summary.risquesActifs} label="Risques actifs" />
            <KpiCard value={summary.critiquesOuEleves} label="Critiques / Élevés" accent={summary.critiquesOuEleves > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600'} />
            {Object.entries(summary.parNiveauBrut).map(([k, v]) => (
              <KpiCard key={k} value={v} label={k} accent={niveauColors[k]?.includes('red') ? 'text-red-600' : ''} />
            ))}
          </div>

          <div className={CARD}>
            {loading ? <div className="p-8 text-center text-gray-400">{t('incidents.loading')}</div>
            : risques.length === 0 ? <div className="p-8 text-center text-gray-400">Aucun risque identifié.</div>
            : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {risques.map((r: RisqueResponse) => (
                  <div key={r.id} className="px-4 py-3 sm:px-5 sm:py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-mono text-gray-400">{r.reference}</span>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">{r.titre}</h3>
                        </div>
                        <div className="flex flex-wrap gap-1.5 text-xs mt-1">
                          <span className={`px-2 py-0.5 rounded-md font-bold ${niveauColors[r.niveauBrut]}`}>Brut: {r.niveauBrut} ({scoreLabel(r.probabiliteBrute, r.graviteBrute)})</span>
                          {r.niveauResiduel && (
                            <span className={`px-2 py-0.5 rounded-md font-bold ${niveauColors[r.niveauResiduel]}`}>
                              Résiduel: {r.niveauResiduel} ({scoreLabel(r.probabiliteResiduelle!, r.graviteResiduelle!)})
                            </span>
                          )}
                          {r.categorie && <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-200">{r.categorie.replace(/_/g, ' ')}</span>}
                          {r.uniteTravail && <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200">{r.uniteTravail}</span>}
                          {r.zoneConcernee && <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500">{r.zoneConcernee}</span>}
                        </div>
                      </div>
                      <button onClick={() => handleDelete(r.id)}
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Nouveau risque</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre *</label>
                <input type="text" value={fTitre} onChange={e => setFTitre(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catégorie</label>
                  <select value={fCat} onChange={e => setFCat(e.target.value as CategorieRisque)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100">
                    <option value="">—</option>
                    {Object.values(CategorieRisque).map(v => <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unité de travail</label>
                  <input type="text" value={fUnite} onChange={e => setFUnite(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Danger identifié</label>
                <textarea value={fDanger} onChange={e => setFDanger(e.target.value)} rows={2}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Probabilité (1-5)</label>
                  <input type="range" min={1} max={5} value={fProb} onChange={e => setFProb(Number(e.target.value))}
                    className="w-full accent-primary" />
                  <div className="text-center text-sm font-bold text-gray-700 dark:text-gray-200">{fProb}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gravité (1-5)</label>
                  <input type="range" min={1} max={5} value={fGrav} onChange={e => setFGrav(Number(e.target.value))}
                    className="w-full accent-primary" />
                  <div className="text-center text-sm font-bold text-gray-700 dark:text-gray-200">{fGrav}</div>
                </div>
              </div>
              <div className="text-center text-sm">
                Score brut : <span className="font-bold">{fProb} × {fGrav} = {fProb * fGrav}</span>
                {' → '}
                <span className={`font-bold px-2 py-0.5 rounded ${niveauColors[fProb * fGrav <= 4 ? 'FAIBLE' : fProb * fGrav <= 9 ? 'MOYEN' : fProb * fGrav <= 15 ? 'ELEVE' : 'CRITIQUE']}`}>
                  {fProb * fGrav <= 4 ? 'FAIBLE' : fProb * fGrav <= 9 ? 'MOYEN' : fProb * fGrav <= 15 ? 'ÉLEVÉ' : 'CRITIQUE'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zone concernée</label>
                <input type="text" value={fZone} onChange={e => setFZone(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">Annuler</button>
              <button onClick={handleCreate} disabled={!fTitre.trim()}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 text-sm font-medium">Créer</button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
