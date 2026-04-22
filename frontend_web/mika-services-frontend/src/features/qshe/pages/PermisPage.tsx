import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useConfirm } from '@/contexts/ConfirmContext'
import { fetchProjets } from '@/store/slices/projetSlice'
import { fetchPermisByProjet, createPermis, deletePermis, fetchPermisSummary } from '@/store/slices/qshePermisSlice'
import { TypePermis, StatutPermis } from '@/types/qshePermis'
import type { PermisTravailCreateRequest, PermisTravailResponse } from '@/types/qshePermis'
import { PageContainer } from '@/components/layout/PageContainer'

const CARD = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm overflow-hidden'
const BODY = 'p-4 sm:p-5'

const statutColors: Record<StatutPermis, string> = {
  DEMANDE: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  APPROUVE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200',
  ACTIF: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200',
  EXPIRE: 'bg-red-200 text-red-900 dark:bg-red-900/70 dark:text-red-100',
  ANNULE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-200',
  CLOTURE: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
}

export default function PermisPage() {
  const { t } = useTranslation('qshe')
  const dispatch = useAppDispatch()
  const confirm = useConfirm()
  const { permis, summary, loading, totalPages, currentPage } = useAppSelector(s => s.qshePermis)
  const projets = useAppSelector(s => s.projet.projets)

  const [projetId, setProjetId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [page, setPage] = useState(0)

  const [fType, setFType] = useState<TypePermis>(TypePermis.PERMIS_FEU)
  const [fDesc, setFDesc] = useState('')
  const [fZone, setFZone] = useState('')
  const [fDateDebut, setFDateDebut] = useState('')
  const [fDateFin, setFDateFin] = useState('')
  const [fMesures, setFMesures] = useState('')

  useEffect(() => { dispatch(fetchProjets({ page: 0, size: 200 })) }, [dispatch])
  useEffect(() => {
    if (projetId) { dispatch(fetchPermisByProjet({ projetId, page })); dispatch(fetchPermisSummary(projetId)) }
  }, [dispatch, projetId, page])

  const handleCreate = async () => {
    if (!projetId || !fDesc.trim()) return
    const req: PermisTravailCreateRequest = {
      projetId, typePermis: fType, descriptionTravaux: fDesc.trim(),
      zoneTravail: fZone.trim() || undefined,
      dateDebutValidite: fDateDebut || undefined, dateFinValidite: fDateFin || undefined,
      mesuresSecurite: fMesures.trim() || undefined,
    }
    await dispatch(createPermis(req))
    setShowForm(false); setFDesc(''); setFZone(''); setFDateDebut(''); setFDateFin(''); setFMesures('')
    dispatch(fetchPermisByProjet({ projetId })); dispatch(fetchPermisSummary(projetId))
  }

  const handleDelete = async (id: number) => {
    if (await confirm({ messageKey: 'incidents.confirm.delete' })) {
      await dispatch(deletePermis(id)); if (projetId) dispatch(fetchPermisSummary(projetId))
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Permis de travail</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Feu, espace confiné, hauteur, fouille, électrique, LOTO</p>
        </div>
        {projetId && (
          <button onClick={() => setShowForm(true)}
            className="bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary-dark font-medium shadow-sm transition flex items-center gap-2 self-start sm:self-auto">
            <span className="text-lg leading-none">+</span> Nouveau permis
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
            <KpiCard value={summary.totalPermis} label="Total permis" />
            <KpiCard value={summary.actifs} label="Actifs" accent="text-green-600 dark:text-green-400" />
            <KpiCard value={summary.expires} label="Expirés" accent={summary.expires > 0 ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-green-600'} />
          </div>

          <div className={CARD}>
            {loading ? <div className="p-8 text-center text-gray-400">{t('incidents.loading')}</div>
            : permis.length === 0 ? <div className="p-8 text-center text-gray-400">Aucun permis de travail.</div>
            : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {permis.map((p: PermisTravailResponse) => (
                  <div key={p.id} className={`px-4 py-3 sm:px-5 sm:py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${p.estExpire ? 'border-l-4 border-l-red-500' : p.estActif ? 'border-l-4 border-l-green-500' : ''}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-mono text-gray-400">{p.reference}</span>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{p.descriptionTravaux}</h3>
                        </div>
                        <div className="flex flex-wrap gap-1.5 text-xs mt-1">
                          <span className={`px-2 py-0.5 rounded-md font-medium ${statutColors[p.statut]}`}>{p.statut}</span>
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-200">{p.typePermis.replace(/_/g, ' ')}</span>
                          {p.dateDebutValidite && <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500">Du {p.dateDebutValidite}</span>}
                          {p.dateFinValidite && <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500">Au {p.dateFinValidite}</span>}
                          {p.zoneTravail && <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700">{p.zoneTravail}</span>}
                          {p.demandeurNom && <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500">{p.demandeurNom}</span>}
                          {p.autorisateurNom && <span className="px-2 py-0.5 rounded-md bg-green-50 dark:bg-green-900/30 text-green-700">Autorisé: {p.autorisateurNom}</span>}
                          {p.estExpire && <span className="px-2 py-0.5 rounded-md bg-red-600 text-white font-bold">Expiré</span>}
                        </div>
                      </div>
                      <button onClick={() => handleDelete(p.id)}
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Nouveau permis de travail</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type *</label>
                <select value={fType} onChange={e => setFType(e.target.value as TypePermis)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100">
                  {Object.values(TypePermis).map(v => <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description des travaux *</label>
                <textarea value={fDesc} onChange={e => setFDesc(e.target.value)} rows={2}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zone de travail</label>
                <input type="text" value={fZone} onChange={e => setFZone(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date début</label>
                  <input type="date" value={fDateDebut} onChange={e => setFDateDebut(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date fin</label>
                  <input type="date" value={fDateFin} onChange={e => setFDateFin(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mesures de sécurité</label>
                <textarea value={fMesures} onChange={e => setFMesures(e.target.value)} rows={2}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 text-sm">Annuler</button>
              <button onClick={handleCreate} disabled={!fDesc.trim()} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 text-sm font-medium">Créer</button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
