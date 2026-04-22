import { useState } from 'react'
import { createPortal } from 'react-dom'
import { projetApi, pointBloquantApi } from '@/api/projetApi'
import type { RapportAnalyseResponse, SuiviMensuelExtrait, PrevisionExtraite, PointBloquantExtrait, AvancementEtudeExtrait, DoublonCA, DoublonPrevision, DoublonPB } from '@/types/rapportAnalyse'

// ── Types ────────────────────────────────────────────────────────────────────
interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  projetId: number
  data: RapportAnalyseResponse
}

type DoublonAction = 'remplacer' | 'ignorer' | 'creer'

const MOIS_LABELS = ['', 'Janv', 'Fév', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc']

const TYPE_PREVISION_LABELS: Record<string, string> = {
  PRODUCTION: 'Production',
  APPROVISIONNEMENT: 'Approvisionnement',
  RESSOURCES_HUMAINES: 'Ressources humaines',
  MATERIEL: 'Matériel',
  HEBDOMADAIRE: 'Hebdomadaire',
}

const PRIORITE_COLORS: Record<string, string> = {
  BASSE: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  NORMALE: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  HAUTE: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  CRITIQUE: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  URGENTE: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
}

// ── Section Toggle ───────────────────────────────────────────────────────────
function SectionToggle({ label, count, enabled, onToggle, children }: {
  label: string; count: number; enabled: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div className={`rounded-xl border transition-colors ${enabled ? 'border-gray-200 dark:border-gray-700' : 'border-gray-100 dark:border-gray-800 opacity-50'}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={enabled} onChange={onToggle} className="sr-only peer" />
            <div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary/30 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
          </label>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{label}</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">{count}</span>
        </div>
      </div>
      {enabled && <div className="p-4">{children}</div>}
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────
export function RapportValidationModal({ isOpen, onClose, onSuccess, projetId, data }: Props) {
  // Section toggles
  const [enableSuivi, setEnableSuivi] = useState(!!data.suiviMensuel?.length)
  const [enablePrevisions, setEnablePrevisions] = useState(!!data.previsions?.length)
  const [enablePB, setEnablePB] = useState(!!data.pointsBloquants?.length)
  const [enableEtudes, setEnableEtudes] = useState(!!data.avancementEtudes?.length)
  const [enableAvancement, setEnableAvancement] = useState(data.avancementPhysiquePct != null || data.avancementFinancierPct != null || data.delaiConsommePct != null)
  const [enableBesoins, setEnableBesoins] = useState(!!data.besoinsMateriel || !!data.besoinsHumain || !!data.observations || !!data.propositionsAmelioration)

  // Editable data
  const [suiviMensuel, setSuiviMensuel] = useState<SuiviMensuelExtrait[]>(data.suiviMensuel ?? [])
  const [previsions, setPrevisions] = useState<PrevisionExtraite[]>(data.previsions ?? [])
  const [pointsBloquants, setPointsBloquants] = useState<PointBloquantExtrait[]>(data.pointsBloquants ?? [])
  const [avancementEtudes] = useState<AvancementEtudeExtrait[]>(data.avancementEtudes ?? [])
  const [avancementPhysique, setAvancementPhysique] = useState(data.avancementPhysiquePct ?? 0)
  const [avancementFinancier, setAvancementFinancier] = useState(data.avancementFinancierPct ?? 0)
  const [delaiConsomme, setDelaiConsomme] = useState(data.delaiConsommePct ?? 0)
  const [besoinsMateriel, setBesoinsMateriel] = useState(data.besoinsMateriel ?? '')
  const [besoinsHumain, setBesoinsHumain] = useState(data.besoinsHumain ?? '')
  const [observations, setObservations] = useState(data.observations ?? '')
  const [propositions, setPropositions] = useState(data.propositionsAmelioration ?? '')

  // Doublon actions
  const [doublonCAActions, setDoublonCAActions] = useState<Record<string, DoublonAction>>({})
  const [doublonPrevActions, setDoublonPrevActions] = useState<Record<string, DoublonAction>>({})
  const [doublonPBActions, setDoublonPBActions] = useState<Record<string, DoublonAction>>({})

  // Submission state
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)

    try {
      // 1. Suivi mensuel
      if (enableSuivi && suiviMensuel.length > 0) {
        const toSave = suiviMensuel.filter(s => {
          const key = `${s.mois}-${s.annee}`
          return doublonCAActions[key] !== 'ignorer'
        }).map(s => ({
          mois: s.mois,
          annee: s.annee,
          caPrevisionnel: s.caPrevisionnel ?? undefined,
          caRealise: s.caRealise ?? undefined,
        }))
        if (toSave.length > 0) {
          await projetApi.saveSuiviMensuel(projetId, toSave)
        }
      }

      // 2. Prévisions
      if (enablePrevisions && previsions.length > 0) {
        for (const prev of previsions) {
          const key = `${prev.semaine}-${prev.annee}-${prev.description.slice(0, 20)}`
          if (doublonPrevActions[key] === 'ignorer') continue
          await projetApi.createPrevision(projetId, {
            semaine: prev.semaine,
            annee: prev.annee,
            description: prev.description,
            type: prev.type,
            avancementPct: prev.avancementPct ?? undefined,
          })
        }
      }

      // 3. Points bloquants
      if (enablePB && pointsBloquants.length > 0) {
        for (const pb of pointsBloquants) {
          const key = pb.titre.slice(0, 15).toLowerCase()
          if (doublonPBActions[key] === 'ignorer') continue
          await pointBloquantApi.create({
            projetId,
            titre: pb.titre,
            description: pb.description ?? undefined,
            priorite: pb.priorite,
          })
        }
      }

      // 4. Avancement études
      if (enableEtudes && avancementEtudes.length > 0) {
        await projetApi.saveAvancementEtudes(projetId, avancementEtudes.map(ae => ({
          phase: ae.phase,
          avancementPct: ae.avancementPct ?? undefined,
          etatValidation: ae.etatValidation ?? undefined,
        })))
      }

      // 5. Champs directs du projet (avancement + besoins)
      if (enableAvancement || enableBesoins) {
        const updateData: Record<string, unknown> = {}
        if (enableAvancement) {
          if (data.avancementPhysiquePct != null) updateData.avancementPhysiquePct = avancementPhysique
          if (data.avancementFinancierPct != null) updateData.avancementFinancierPct = avancementFinancier
          if (data.delaiConsommePct != null) updateData.delaiConsommePct = delaiConsomme
        }
        if (enableBesoins) {
          if (besoinsMateriel) updateData.besoinsMateriel = besoinsMateriel
          if (besoinsHumain) updateData.besoinsHumain = besoinsHumain
          if (observations) updateData.observations = observations
          if (propositions) updateData.propositionsAmelioration = propositions
        }
        if (Object.keys(updateData).length > 0) {
          await projetApi.update(projetId, updateData)
        }
      }

      onSuccess()
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? (e as { message: string }).message : 'Erreur lors de l\'enregistrement'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  const modal = (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Validation des données extraites</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Vérifiez et ajustez les données avant enregistrement</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Fermer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Avertissements */}
          {data.avertissements.length > 0 && (
            <div className="rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/50 p-4">
              <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 mb-1.5">Avertissements</p>
              <ul className="space-y-1">
                {data.avertissements.map((a, i) => (
                  <li key={i} className="text-xs text-orange-600 dark:text-orange-300 flex items-start gap-1.5">
                    <span className="mt-0.5 w-1 h-1 rounded-full bg-orange-400 flex-shrink-0" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suivi mensuel */}
          {data.suiviMensuel && data.suiviMensuel.length > 0 && (
            <SectionToggle label="Suivi mensuel (CA)" count={suiviMensuel.length} enabled={enableSuivi} onToggle={() => setEnableSuivi(!enableSuivi)}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left py-2 pr-3 font-medium">Mois</th>
                      <th className="text-right py-2 px-3 font-medium">CA Prévisionnel</th>
                      <th className="text-right py-2 pl-3 font-medium">CA Réalisé</th>
                      <th className="text-right py-2 pl-3 font-medium w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {suiviMensuel.map((s, idx) => {
                      const doublon = data.doublons?.suiviMensuel?.find(d => d.mois === s.mois && d.annee === s.annee)
                      const key = `${s.mois}-${s.annee}`
                      return (
                        <tr key={idx} className="border-b border-gray-50 dark:border-gray-800/50">
                          <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{MOIS_LABELS[s.mois]} {s.annee}</td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              value={s.caPrevisionnel ?? ''}
                              onChange={(e) => { const v = [...suiviMensuel]; v[idx] = { ...v[idx], caPrevisionnel: e.target.value ? Number(e.target.value) : null }; setSuiviMensuel(v) }}
                              className="w-28 text-right px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                            />
                          </td>
                          <td className="py-2 pl-3 text-right">
                            <input
                              type="number"
                              value={s.caRealise ?? ''}
                              onChange={(e) => { const v = [...suiviMensuel]; v[idx] = { ...v[idx], caRealise: e.target.value ? Number(e.target.value) : null }; setSuiviMensuel(v) }}
                              className="w-28 text-right px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                            />
                          </td>
                          <td className="py-2 pl-3">
                            {doublon && (
                              <DoublonBadge
                                action={doublonCAActions[key] ?? 'remplacer'}
                                onChange={(a) => setDoublonCAActions(prev => ({ ...prev, [key]: a }))}
                              />
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </SectionToggle>
          )}

          {/* Prévisions */}
          {data.previsions && data.previsions.length > 0 && (
            <SectionToggle label="Prévisions" count={previsions.length} enabled={enablePrevisions} onToggle={() => setEnablePrevisions(!enablePrevisions)}>
              <div className="space-y-2">
                {previsions.map((p, idx) => {
                  const doublon = data.doublons?.previsions?.find(d => d.semaine === p.semaine && d.annee === p.annee && d.descriptionNouvelle === p.description)
                  const key = `${p.semaine}-${p.annee}-${p.description.slice(0, 20)}`
                  return (
                    <div key={idx} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{p.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/10 text-secondary dark:text-secondary-light font-medium">{TYPE_PREVISION_LABELS[p.type] ?? p.type}</span>
                          <span className="text-[10px] text-gray-400">S{p.semaine}/{p.annee}</span>
                          {p.avancementPct != null && <span className="text-[10px] text-gray-400">{p.avancementPct}%</span>}
                        </div>
                      </div>
                      {doublon && (
                        <DoublonBadge
                          action={doublonPrevActions[key] ?? 'creer'}
                          onChange={(a) => setDoublonPrevActions(prev => ({ ...prev, [key]: a }))}
                        />
                      )}
                      <button onClick={() => setPrevisions(prev => prev.filter((_, i) => i !== idx))} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors" title="Supprimer">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            </SectionToggle>
          )}

          {/* Points bloquants */}
          {data.pointsBloquants && data.pointsBloquants.length > 0 && (
            <SectionToggle label="Points bloquants" count={pointsBloquants.length} enabled={enablePB} onToggle={() => setEnablePB(!enablePB)}>
              <div className="space-y-2">
                {pointsBloquants.map((pb, idx) => {
                  const doublon = data.doublons?.pointsBloquants?.find(d => d.titreNouveau === pb.titre)
                  const key = pb.titre.slice(0, 15).toLowerCase()
                  return (
                    <div key={idx} className="px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{pb.titre}</p>
                          {pb.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{pb.description}</p>}
                          {pb.actionCorrective && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 italic">Action : {pb.actionCorrective}</p>}
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${PRIORITE_COLORS[pb.priorite] ?? PRIORITE_COLORS.NORMALE}`}>
                          {pb.priorite}
                        </span>
                        {doublon && (
                          <DoublonBadge
                            action={doublonPBActions[key] ?? 'creer'}
                            onChange={(a) => setDoublonPBActions(prev => ({ ...prev, [key]: a }))}
                          />
                        )}
                        <button onClick={() => setPointsBloquants(prev => prev.filter((_, i) => i !== idx))} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors" title="Supprimer">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                      </div>
                      {doublon && (
                        <p className="mt-1.5 text-[10px] text-orange-600 dark:text-orange-400">
                          Doublon potentiel : "{doublon.titreExistant}" ({doublon.statutExistant})
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </SectionToggle>
          )}

          {/* Avancement études */}
          {data.avancementEtudes && data.avancementEtudes.length > 0 && (
            <SectionToggle label="Avancement des études" count={avancementEtudes.length} enabled={enableEtudes} onToggle={() => setEnableEtudes(!enableEtudes)}>
              <div className="grid grid-cols-2 gap-2">
                {avancementEtudes.map((ae, idx) => (
                  <div key={idx} className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{ae.phase}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {ae.avancementPct != null && <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{ae.avancementPct}%</span>}
                      {ae.etatValidation && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">{ae.etatValidation}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </SectionToggle>
          )}

          {/* Avancement global */}
          {(data.avancementPhysiquePct != null || data.avancementFinancierPct != null || data.delaiConsommePct != null) && (
            <SectionToggle label="Avancement" count={[data.avancementPhysiquePct, data.avancementFinancierPct, data.delaiConsommePct].filter(v => v != null).length} enabled={enableAvancement} onToggle={() => setEnableAvancement(!enableAvancement)}>
              <div className="grid grid-cols-3 gap-3">
                {data.avancementPhysiquePct != null && (
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Physique (%)</label>
                    <input type="number" min="0" max="100" value={avancementPhysique} onChange={(e) => setAvancementPhysique(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-center" />
                  </div>
                )}
                {data.avancementFinancierPct != null && (
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Financier (%)</label>
                    <input type="number" min="0" max="100" value={avancementFinancier} onChange={(e) => setAvancementFinancier(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-center" />
                  </div>
                )}
                {data.delaiConsommePct != null && (
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Délai consommé (%)</label>
                    <input type="number" min="0" max="100" value={delaiConsomme} onChange={(e) => setDelaiConsomme(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-center" />
                  </div>
                )}
              </div>
            </SectionToggle>
          )}

          {/* Besoins & observations */}
          {(data.besoinsMateriel || data.besoinsHumain || data.observations || data.propositionsAmelioration) && (
            <SectionToggle label="Besoins et observations" count={[data.besoinsMateriel, data.besoinsHumain, data.observations, data.propositionsAmelioration].filter(Boolean).length} enabled={enableBesoins} onToggle={() => setEnableBesoins(!enableBesoins)}>
              <div className="space-y-3">
                {data.besoinsMateriel && (
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Besoins matériel</label>
                    <input type="text" value={besoinsMateriel} onChange={(e) => setBesoinsMateriel(e.target.value)}
                      className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm" />
                  </div>
                )}
                {data.besoinsHumain && (
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Besoins humain</label>
                    <input type="text" value={besoinsHumain} onChange={(e) => setBesoinsHumain(e.target.value)}
                      className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm" />
                  </div>
                )}
                {data.observations && (
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Observations</label>
                    <textarea value={observations} onChange={(e) => setObservations(e.target.value)} rows={2}
                      className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm resize-none" />
                  </div>
                )}
                {data.propositionsAmelioration && (
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Propositions d'amélioration</label>
                    <textarea value={propositions} onChange={(e) => setPropositions(e.target.value)} rows={2}
                      className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm resize-none" />
                  </div>
                )}
              </div>
            </SectionToggle>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 rounded-b-2xl">
          {error && <p className="text-xs text-red-600 dark:text-red-400 flex-1 mr-4">{error}</p>}
          {!error && <div />}
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-dark disabled:opacity-50 transition-all shadow-sm hover:shadow-md"
            >
              {submitting ? 'Enregistrement...' : 'Valider et enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

// ── DoublonBadge ─────────────────────────────────────────────────────────────
function DoublonBadge({ action, onChange }: { action: DoublonAction; onChange: (a: DoublonAction) => void }) {
  return (
    <select
      value={action}
      onChange={(e) => onChange(e.target.value as DoublonAction)}
      className="text-[10px] px-1.5 py-0.5 rounded border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300 cursor-pointer"
    >
      <option value="remplacer">Remplacer</option>
      <option value="ignorer">Ignorer</option>
      <option value="creer">Garder les deux</option>
    </select>
  )
}
