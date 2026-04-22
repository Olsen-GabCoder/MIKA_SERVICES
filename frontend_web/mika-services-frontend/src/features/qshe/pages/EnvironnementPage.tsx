import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchProjets } from '@/store/slices/projetSlice'
import { qsheEnvApi } from '@/api/qsheEnvironnementApi'
import type { SuiviEnvResponse, DechetResponse, EnvironnementSummaryResponse } from '@/types/qsheEnvironnement'
import { PageContainer } from '@/components/layout/PageContainer'

const CARD = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm overflow-hidden'
const BODY = 'p-4 sm:p-5'

export default function EnvironnementPage() {
  const { t } = useTranslation('qshe')
  const dispatch = useAppDispatch()
  const projets = useAppSelector(s => s.projet.projets)

  const [projetId, setProjetId] = useState<number | null>(null)
  const [tab, setTab] = useState<'mesures' | 'dechets'>('mesures')
  const [mesures, setMesures] = useState<SuiviEnvResponse[]>([])
  const [dechets, setDechets] = useState<DechetResponse[]>([])
  const [summary, setSummary] = useState<EnvironnementSummaryResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { dispatch(fetchProjets({ page: 0, size: 200 })) }, [dispatch])
  useEffect(() => {
    if (!projetId) return
    setLoading(true)
    Promise.all([
      qsheEnvApi.getMesuresByProjet(projetId), qsheEnvApi.getDechetsByProjet(projetId), qsheEnvApi.getSummary(projetId)
    ]).then(([m, d, s]) => { setMesures(m.content); setDechets(d.content); setSummary(s) }).finally(() => setLoading(false))
  }, [projetId])

  const KpiCard = ({ value, label, accent = '' }: { value: number | string; label: string; accent?: string }) => (
    <div className={CARD}><div className={`${BODY} text-center`}>
      <p className={`text-xl sm:text-2xl font-bold tabular-nums ${accent || 'text-gray-900 dark:text-gray-100'}`}>{value}</p>
      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </div></div>
  )

  return (
    <PageContainer size="full" className="space-y-4 sm:space-y-6 bg-gray-50/80 dark:bg-gray-900/80">
      <div><h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Suivi environnemental</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Mesures, déchets, PGES</p></div>

      <div className={CARD}><div className={BODY}>
        <select value={projetId ?? ''} onChange={e => setProjetId(e.target.value ? Number(e.target.value) : null)}
          className="w-full sm:max-w-md border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary">
          <option value="">{t('incidents.chooseProject')}</option>
          {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
        </select>
      </div></div>

      {!projetId && <p className="text-center text-gray-400 py-8">{t('incidents.noProject')}</p>}

      {projetId && summary && (
        <>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <KpiCard value={summary.totalMesures} label="Mesures" />
            <KpiCard value={summary.totalDechets} label="Enregistrements déchets" />
            <KpiCard value={summary.depassements} label="Dépassements" accent={summary.depassements > 0 ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-green-600'} />
          </div>

          <div className="flex gap-2">
            {(['mesures', 'dechets'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                {t === 'mesures' ? `Mesures (${mesures.length})` : `Déchets (${dechets.length})`}
              </button>
            ))}
          </div>

          <div className={CARD}>
            {loading ? <div className="p-8 text-center text-gray-400">Chargement...</div>
            : tab === 'mesures' ? (
              mesures.length === 0 ? <div className="p-8 text-center text-gray-400">Aucune mesure.</div> :
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {mesures.map(m => (
                  <div key={m.id} className={`px-4 py-3 sm:px-5 sm:py-4 ${m.depassement ? 'border-l-4 border-l-red-500' : ''}`}>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{m.parametre}</span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-900/30 text-purple-700">{m.typeMesure.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      {m.valeur !== null && <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600">{m.valeur} {m.unite}</span>}
                      {m.limiteReglementaire !== null && <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500">Limite: {m.limiteReglementaire} {m.unite}</span>}
                      {m.depassement && <span className="px-2 py-0.5 rounded-md bg-red-600 text-white font-bold">Dépassement</span>}
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500">{m.dateMesure}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              dechets.length === 0 ? <div className="p-8 text-center text-gray-400">Aucun déchet enregistré.</div> :
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {dechets.map(d => (
                  <div key={d.id} className="px-4 py-3 sm:px-5 sm:py-4">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{d.designation}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${d.typeDechet === 'DANGEREUX' ? 'bg-red-100 text-red-700' : d.typeDechet === 'NON_DANGEREUX' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>{d.typeDechet}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      {d.quantite !== null && <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700">{d.quantite} {d.unite}</span>}
                      {d.transporteur && <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700">{d.transporteur}</span>}
                      {d.numeroBsd && <span className="px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-900/30 text-orange-700">BSD: {d.numeroBsd}</span>}
                      {d.dateEnlevement && <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500">{d.dateEnlevement}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </PageContainer>
  )
}
