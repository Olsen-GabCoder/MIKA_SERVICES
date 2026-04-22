import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchProjets } from '@/store/slices/projetSlice'
import { qualiteSyntheseApi } from '@/api/qualiteSyntheseApi'
import { PageContainer } from '@/components/layout/PageContainer'
import type { SyntheseMensuelleResponse, BlocReceptionSynthese } from '@/types/qualiteSynthese'

const CARD = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm overflow-hidden'
const BODY = 'p-4 sm:p-5'

function getCurrentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const natureLabels: Record<string, string> = {
  TOPOGRAPHIE: 'Topographie',
  GEOTECHNIQUE_LABORATOIRE: 'Geotechnique / Laboratoire',
  OUVRAGE: 'Ouvrage',
}

const sousTypeLabels: Record<string, string> = {
  TERRASSEMENT: 'Terrassement',
  GENIE_CIVIL: 'Genie Civil',
}

const statutReceptionLabels: Record<string, string> = {
  ETABLIE: 'Etablie',
  EN_ATTENTE_MDC: 'En attente MdC',
  ACCORDEE_SANS_RESERVE: 'Accordee sans reserve',
  ACCORDEE_AVEC_RESERVE: 'Accordee avec reserve',
  REJETEE: 'Rejetee',
}

const statutAgrementLabels: Record<string, string> = {
  PREVU_AU_MARCHE: 'Prevu au marche',
  ETABLI: 'Etabli',
  EN_ATTENTE_MDC: 'En attente MdC',
  ACCORDE_SANS_RESERVE: 'Accorde sans reserve',
  ACCORDE_AVEC_RESERVE: 'Accorde avec reserve',
  REJETE: 'Rejete',
}

const statutBarColors: Record<string, string> = {
  ETABLIE: 'bg-gray-400', EN_ATTENTE_MDC: 'bg-blue-400', ACCORDEE_SANS_RESERVE: 'bg-green-500',
  ACCORDEE_AVEC_RESERVE: 'bg-amber-400', REJETEE: 'bg-red-500',
  PREVU_AU_MARCHE: 'bg-gray-400', ETABLI: 'bg-blue-400', ACCORDE_SANS_RESERVE: 'bg-green-500',
  ACCORDE_AVEC_RESERVE: 'bg-amber-400', REJETE: 'bg-red-500',
}

function StatBar({ parStatut, total, labels }: { parStatut: Record<string, number>; total: number; labels: Record<string, string> }) {
  if (total === 0) return <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded" />
  return (
    <div className="flex h-4 rounded overflow-hidden">
      {Object.entries(parStatut).map(([s, count]) => (
        <div key={s} className={`${statutBarColors[s] ?? 'bg-gray-300'}`}
          style={{ width: `${(count / total) * 100}%` }}
          title={`${labels[s] ?? s}: ${count} (${((count / total) * 100).toFixed(0)}%)`} />
      ))}
    </div>
  )
}

const emptyData: SyntheseMensuelleResponse = {
  projetId: null,
  projetNom: null,
  moisReference: '',
  receptions: [],
  essaisLabo: null,
  leveeTopo: null,
  agrements: { total: 0, parStatut: {}, statistiques: {} },
  ncSynthese: { enregistrees: 0, traitees: 0, ouvertes: 0, parStatut: {} },
}

export default function SyntheseMensuellePage() {
  const { t } = useTranslation('qualite')
  const dispatch = useAppDispatch()
  const projets = useAppSelector(s => s.projet.projets)

  const [projetId, setProjetId] = useState<number | null>(null)
  const [mois, setMois] = useState(getCurrentMonth())
  const [data, setData] = useState<SyntheseMensuelleResponse>(emptyData)
  const [loading, setLoading] = useState(true)

  useEffect(() => { dispatch(fetchProjets({ page: 0, size: 200 })) }, [dispatch])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await qualiteSyntheseApi.get(mois, projetId ?? undefined)
      setData(res)
    } catch { setData(emptyData) }
    finally { setLoading(false) }
  }, [projetId, mois])

  useEffect(() => { loadData() }, [loadData])

  // Group receptions by nature
  const receptionsByNature: Record<string, BlocReceptionSynthese[]> = {}
  for (const r of data.receptions) {
    if (!receptionsByNature[r.nature]) receptionsByNature[r.nature] = []
    receptionsByNature[r.nature].push(r)
  }

  // Totaux globaux rapides pour les KPIs
  const totalReceptions = data.receptions.reduce((sum, r) => sum + r.total, 0)
  const totalAgrements = data.agrements.total

  return (
    <PageContainer size="full" className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('synthese.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {projetId ? projets.find(p => p.id === projetId)?.nom : t('synthese.allProjets')} — {mois}
          </p>
        </div>
      </div>

      {/* Filters + KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className={CARD}>
          <div className={`${BODY} flex flex-col justify-center h-full`}>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">{t('synthese.projet')}</p>
            <select value={projetId ?? ''} onChange={e => setProjetId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent">
              <option value="">{t('synthese.allProjets')}</option>
              {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          </div>
        </div>
        <div className={CARD}>
          <div className={`${BODY} flex flex-col justify-center h-full`}>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">{t('synthese.mois')}</p>
            <input type="month" value={mois} onChange={e => setMois(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent" />
          </div>
        </div>
        <div className={CARD}>
          <div className={`${BODY} text-center`}>
            <p className="text-xl sm:text-2xl font-bold tabular-nums text-blue-600 dark:text-blue-400">{loading ? '—' : totalReceptions}</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('synthese.receptions')}</p>
          </div>
        </div>
        <div className={CARD}>
          <div className={`${BODY} text-center`}>
            <p className="text-xl sm:text-2xl font-bold tabular-nums text-purple-600 dark:text-purple-400">{loading ? '—' : totalAgrements}</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('synthese.agrements')}</p>
          </div>
        </div>
        <div className={CARD}>
          <div className={`${BODY} text-center`}>
            <p className="text-xl sm:text-2xl font-bold tabular-nums text-red-600 dark:text-red-400">{loading ? '—' : data.ncSynthese.enregistrees}</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('synthese.ncEnregistrees')}</p>
          </div>
        </div>
        <div className={CARD}>
          <div className={`${BODY} text-center`}>
            <p className="text-xl sm:text-2xl font-bold tabular-nums text-green-600 dark:text-green-400">{loading ? '—' : data.ncSynthese.traitees}</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('synthese.ncTraitees')}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400">
          <div className="w-8 h-8 border-3 border-gray-300 dark:border-gray-600 border-t-[#FF6B35] rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* Blocs 1-3 : Receptions */}
          {Object.entries(receptionsByNature).length > 0 ? (
            Object.entries(receptionsByNature).map(([nature, blocs]) => (
              <div key={nature} className={CARD}>
                <div className={BODY}>
                  <h2 className="font-bold text-gray-900 dark:text-white mb-3">{natureLabels[nature] ?? nature}</h2>
                  {blocs.map(bloc => (
                    <div key={`${bloc.nature}-${bloc.sousType}`} className="mb-4 last:mb-0">
                      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{sousTypeLabels[bloc.sousType] ?? bloc.sousType}</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm mb-2">
                          <thead>
                            <tr className="text-gray-500 dark:text-gray-400 text-xs">
                              <th className="text-left py-1">{t('synthese.statut')}</th>
                              <th className="text-right py-1">{t('synthese.quantite')}</th>
                              <th className="text-right py-1">{t('synthese.statistique')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.keys(statutReceptionLabels).map(s => (
                              <tr key={s} className="border-t border-gray-100 dark:border-gray-700">
                                <td className="py-1 text-gray-700 dark:text-gray-300">{statutReceptionLabels[s]}</td>
                                <td className="text-right py-1 text-gray-700 dark:text-gray-300">{bloc.parStatut[s] ?? 0}</td>
                                <td className="text-right py-1 text-gray-700 dark:text-gray-300">{bloc.statistiques[s] ? `${bloc.statistiques[s]}%` : '\u2014'}</td>
                              </tr>
                            ))}
                            <tr className="border-t-2 border-gray-200 dark:border-gray-600 font-bold">
                              <td className="py-1 text-gray-900 dark:text-white">{t('synthese.total')}</td>
                              <td className="text-right py-1 text-gray-900 dark:text-white">{bloc.total}</td>
                              <td className="text-right py-1 text-gray-900 dark:text-white">100%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <StatBar parStatut={bloc.parStatut} total={bloc.total} labels={statutReceptionLabels} />
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className={CARD}>
              <div className={`${BODY} text-center text-gray-400 py-6`}>{t('synthese.noReceptions')}</div>
            </div>
          )}

          {/* Bloc 4 : Essais labo */}
          <div className={CARD}>
            <div className={BODY}>
              <h2 className="font-bold text-gray-900 dark:text-white mb-3">{t('synthese.essaisLabo')}</h2>
              {data.essaisLabo ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: t('essaisLabo.fields.camions'), value: data.essaisLabo.nbCamionsMalaxeursVolumeCoulee },
                    { label: t('essaisLabo.fields.slump'), value: data.essaisLabo.nbEssaisSlump },
                    { label: t('essaisLabo.fields.jours'), value: data.essaisLabo.nbJoursCoulage },
                    { label: t('essaisLabo.fields.prelevements'), value: data.essaisLabo.nbPrelevements },
                  ].map(item => (
                    <div key={item.label} className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.label}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-4">{t('synthese.noData')}</p>
              )}
            </div>
          </div>

          {/* Bloc 5 : Levee topo */}
          <div className={CARD}>
            <div className={BODY}>
              <h2 className="font-bold text-gray-900 dark:text-white mb-3">{t('synthese.leveeTopo')}</h2>
              {data.leveeTopo ? (
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: t('leveeTopo.fields.implantes'), value: data.leveeTopo.nbProfilsImplantes },
                    { label: t('leveeTopo.fields.receptionnes'), value: data.leveeTopo.nbProfilsReceptionnes },
                    { label: t('leveeTopo.fields.controles'), value: data.leveeTopo.nbControlesRealises },
                  ].map(item => (
                    <div key={item.label} className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.label}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-4">{t('synthese.noData')}</p>
              )}
            </div>
          </div>

          {/* Bloc 6 : Agrements */}
          <div className={CARD}>
            <div className={BODY}>
              <h2 className="font-bold text-gray-900 dark:text-white mb-3">{t('synthese.agrements')}</h2>
              {data.agrements.total > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm mb-2">
                      <thead>
                        <tr className="text-gray-500 dark:text-gray-400 text-xs">
                          <th className="text-left py-1">{t('synthese.statut')}</th>
                          <th className="text-right py-1">{t('synthese.quantite')}</th>
                          <th className="text-right py-1">{t('synthese.statistique')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys(statutAgrementLabels).map(s => (
                          <tr key={s} className="border-t border-gray-100 dark:border-gray-700">
                            <td className="py-1 text-gray-700 dark:text-gray-300">{statutAgrementLabels[s]}</td>
                            <td className="text-right py-1 text-gray-700 dark:text-gray-300">{data.agrements.parStatut[s] ?? 0}</td>
                            <td className="text-right py-1 text-gray-700 dark:text-gray-300">{data.agrements.statistiques[s] ? `${data.agrements.statistiques[s]}%` : '\u2014'}</td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-gray-200 dark:border-gray-600 font-bold">
                          <td className="py-1 text-gray-900 dark:text-white">{t('synthese.total')}</td>
                          <td className="text-right py-1 text-gray-900 dark:text-white">{data.agrements.total}</td>
                          <td className="text-right py-1 text-gray-900 dark:text-white">100%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <StatBar parStatut={data.agrements.parStatut} total={data.agrements.total} labels={statutAgrementLabels} />
                </>
              ) : (
                <p className="text-center text-gray-400 py-4">{t('synthese.noData')}</p>
              )}
            </div>
          </div>

          {/* Encart NC */}
          <div className={`${CARD} border-l-4 !border-l-red-500`}>
            <div className={BODY}>
              <h2 className="font-bold text-gray-900 dark:text-white mb-3">{t('synthese.nc')}</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-700 dark:text-red-300">{data.ncSynthese.enregistrees}</div>
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">{t('synthese.ncEnregistrees')}</div>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">{data.ncSynthese.traitees}</div>
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">{t('synthese.ncTraitees')}</div>
                </div>
                <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{data.ncSynthese.ouvertes}</div>
                  <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">{t('synthese.ncOuvertes')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
