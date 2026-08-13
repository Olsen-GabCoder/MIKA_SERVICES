import { useEffect, useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchBudgetSummary, fetchDepensesByProjet, fetchSituationsByProjet, createDepense, deleteDepense } from '@/store/slices/budgetSlice'
import { fetchProjets } from '@/store/slices/projetSlice'
import { PageContainer } from '@/components/layout/PageContainer'
import { useFormatNumber } from '@/hooks/useFormatNumber'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/contexts/ToastContext'
import { useConfirm } from '@/contexts/ConfirmContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import type { DepenseCreateRequest, Depense } from '@/types/budget'

const MONTHS = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec']

const TYPE_COLORS: Record<string, string> = {
  MAIN_OEUVRE: '#3b82f6', MATERIEL: '#f59e0b', MATERIAUX: '#22c55e', SOUS_TRAITANCE: '#8b5cf6',
  TRANSPORT: '#ef4444', CARBURANT: '#f97316', LOCATION_ENGIN: '#06b6d4', FRAIS_GENERAUX: '#64748b',
  ASSURANCE: '#ec4899', ETUDES: '#14b8a6', AUTRE: '#94a3b8',
}

const STATUT_BADGE: Record<string, { bg: string; text: string }> = {
  BROUILLON: { bg: 'var(--db-border)', text: 'var(--db-t3)' },
  SOUMISE: { bg: '#dbeafe', text: '#1d4ed8' },
  VALIDEE: { bg: '#dcfce7', text: '#166534' },
  REJETEE: { bg: '#fef2f2', text: '#991b1b' },
  PAYEE: { bg: '#f0fdf4', text: '#15803d' },
}

type BudgetView = 'overview' | 'depenses' | 'situations'

export const BudgetPage = () => {
  const { t } = useTranslation('budget')
  const { formatMontant, formatShort } = useFormatNumber()
  const dispatch = useAppDispatch()
  const toast = useToast()
  const confirm = useConfirm()

  const { budgetSummary, depenses, situations } = useAppSelector((s) => s.budget)
  const { projets } = useAppSelector((s) => s.projet)

  const [searchParams, setSearchParams] = useSearchParams()
  const initialProjetId = searchParams.get('projet') ? Number(searchParams.get('projet')) : null
  const [selectedProjetId, setSelectedProjetIdRaw] = useState<number | null>(initialProjetId)
  const setSelectedProjetId = useCallback((id: number | null) => {
    setSelectedProjetIdRaw(id)
    setSearchParams(id ? { projet: String(id) } : {}, { replace: true })
  }, [setSearchParams])

  const [activeView, setActiveView] = useState<BudgetView>('overview')
  const [showDepenseModal, setShowDepenseModal] = useState(false)

  // Depense form
  const [formRef, setFormRef] = useState('')
  const [formLibelle, setFormLibelle] = useState('')
  const [formType, setFormType] = useState<string>('MATERIAUX')
  const [formMontant, setFormMontant] = useState('')
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10))
  const [formFournisseur, setFormFournisseur] = useState('')
  const [formNumFacture, setFormNumFacture] = useState('')

  useEffect(() => { dispatch(fetchProjets({ page: 0, size: 200 })) }, [dispatch])

  useEffect(() => {
    if (selectedProjetId) {
      dispatch(fetchBudgetSummary(selectedProjetId))
      dispatch(fetchDepensesByProjet({ projetId: selectedProjetId, size: 50 }))
      dispatch(fetchSituationsByProjet({ projetId: selectedProjetId }))
    }
  }, [dispatch, selectedProjetId])

  const bs = budgetSummary
  const budgetRef = bs ? (bs.montantRevise || bs.montantHT || 0) : 0

  // Evolution chart data
  const evolutionData = useMemo(() => {
    if (!bs?.evolutionMensuelle?.length) return []
    let cumul = 0
    return bs.evolutionMensuelle.map((e) => {
      cumul += e.montant
      return { label: `${MONTHS[e.mois - 1]} ${e.annee}`, mensuel: e.montant, cumule: cumul }
    })
  }, [bs])

  // Pie data
  const pieData = useMemo(() => {
    if (!bs) return []
    return Object.entries(bs.depensesParType).map(([type, montant]) => ({
      name: t(`type.${type}`, { defaultValue: type }), value: montant, color: TYPE_COLORS[type] || '#94a3b8',
    }))
  }, [bs, t])

  const handleCreateDepense = async () => {
    if (!selectedProjetId || !formLibelle.trim() || !formMontant) return
    const req: DepenseCreateRequest = {
      projetId: selectedProjetId,
      reference: formRef || `DEP-${Date.now()}`,
      libelle: formLibelle.trim(),
      type: formType as DepenseCreateRequest['type'],
      montant: Number(formMontant),
      dateDepense: formDate,
      fournisseur: formFournisseur || undefined,
      numeroFacture: formNumFacture || undefined,
    }
    await dispatch(createDepense(req))
    toast({ message: t('depenseCreated', { defaultValue: 'Depense creee avec succes' }), variant: 'success' })
    setShowDepenseModal(false)
    setFormRef(''); setFormLibelle(''); setFormMontant(''); setFormFournisseur(''); setFormNumFacture('')
    dispatch(fetchBudgetSummary(selectedProjetId))
    dispatch(fetchDepensesByProjet({ projetId: selectedProjetId, size: 50 }))
  }

  const handleDeleteDepense = async (id: number) => {
    if (!(await confirm({ messageKey: 'confirm.deleteDepense' }))) return
    await dispatch(deleteDepense(id))
    toast({ message: t('depenseDeleted', { defaultValue: 'Depense supprimee' }), variant: 'success' })
    if (selectedProjetId) dispatch(fetchBudgetSummary(selectedProjetId))
  }

  const alertColor = bs?.seuilAlerte === 'CRITIQUE' ? '#ef4444' : bs?.seuilAlerte === 'ATTENTION' ? '#f59e0b' : '#22c55e'

  return (
    <PageContainer size="full" className="pb-8" style={{ background: 'var(--db-page)' }}>
      <div className="px-1 sm:px-2">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4" style={{ animation: 'db-rise 380ms ease-out both' }}>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--db-t1)' }}>{t('title')}</h1>
            <p className="text-sm" style={{ color: 'var(--db-t4)' }}>{t('subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedProjetId || ''}
              onChange={(e) => setSelectedProjetId(e.target.value ? Number(e.target.value) : null)}
              className="px-4 py-2.5 border rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-[var(--db-teal)]/40"
              style={{ background: 'var(--db-card)', borderColor: 'var(--db-border)', color: 'var(--db-t1)', minWidth: 220 }}
            >
              <option value="">{t('chooseProject')}</option>
              {projets.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
            {selectedProjetId && (
              <button
                onClick={() => setShowDepenseModal(true)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: 'var(--db-teal)' }}
              >
                + {t('newDepense', { defaultValue: 'Depense' })}
              </button>
            )}
          </div>
        </div>

        {/* Alert bar */}
        {bs && bs.seuilAlerte !== 'NORMAL' && (
          <div
            className="rounded-xl px-4 py-3 mb-4 flex items-center gap-3 text-sm font-medium"
            style={{ background: `color-mix(in srgb, ${alertColor} 10%, var(--db-card))`, color: alertColor, border: `1px solid ${alertColor}30` }}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {bs.seuilAlerte === 'CRITIQUE'
              ? t('alertCritique', { defaultValue: `Consommation a ${bs.tauxConsommation}% — budget en zone critique !` })
              : t('alertAttention', { defaultValue: `Consommation a ${bs.tauxConsommation}% — surveillez les depenses.` })
            }
          </div>
        )}

        {!selectedProjetId ? (
          <div className="rounded-xl p-12 text-center" style={{ background: 'var(--db-card)', animation: 'db-rise 380ms ease-out 120ms both' }}>
            <div className="w-14 h-14 mx-auto rounded-xl grid place-items-center mb-4" style={{ background: 'var(--db-subtle)' }}>
              <svg className="w-7 h-7" style={{ color: 'var(--db-t4)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm" style={{ color: 'var(--db-t4)' }}>{t('selectProjectHint')}</p>
          </div>
        ) : !bs ? (
          <div className="text-center py-12 text-sm" style={{ color: 'var(--db-t4)' }}>{t('loading')}</div>
        ) : (
          <div className="grid grid-cols-12 gap-3">

            {/* KPI Row */}
            {[
              { label: t('budgetReference'), value: formatShort(budgetRef), color: 'var(--db-t1)' },
              { label: t('totalDepenses'), value: formatShort(bs.totalDepenses), color: '#ef4444' },
              { label: t('budgetRestant'), value: formatShort(bs.budgetRestant), color: bs.budgetRestant >= 0 ? '#22c55e' : '#ef4444' },
              { label: t('tauxConsommation'), value: `${bs.tauxConsommation}%`, color: alertColor },
            ].map((kpi, i) => (
              <div
                key={i}
                className="col-span-6 md:col-span-3 rounded-xl p-4 border"
                style={{ background: 'var(--db-card)', borderColor: 'var(--db-border)', animation: `db-rise 380ms ease-out ${i * 60}ms both` }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--db-t4)' }}>{kpi.label}</p>
                <p className="text-xl font-bold db-display-num" style={{ color: kpi.color }}>{kpi.value}</p>
                {kpi.label === t('tauxConsommation') && (
                  <div className="h-1.5 rounded-full mt-2" style={{ background: 'var(--db-border)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(bs.tauxConsommation, 100)}%`, background: alertColor }} />
                  </div>
                )}
              </div>
            ))}

            {/* View tabs */}
            <div className="col-span-12 flex items-center gap-1 rounded-xl p-1" style={{ background: 'var(--db-subtle)' }}>
              {([
                { id: 'overview' as BudgetView, label: t('viewOverview', { defaultValue: 'Vue d\'ensemble' }) },
                { id: 'depenses' as BudgetView, label: `${t('viewDepenses', { defaultValue: 'Depenses' })} (${bs.nbDepenses})` },
                { id: 'situations' as BudgetView, label: `${t('viewSituations', { defaultValue: 'Situations' })} (${bs.nbSituations})` },
              ]).map((v) => (
                <button
                  key={v.id}
                  onClick={() => setActiveView(v.id)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: activeView === v.id ? 'var(--db-card)' : 'transparent',
                    color: activeView === v.id ? 'var(--db-t1)' : 'var(--db-t4)',
                    boxShadow: activeView === v.id ? '0 1px 3px rgba(0,0,0,0.1)' : undefined,
                  }}
                >
                  {v.label}
                </button>
              ))}
              {bs.nbDepensesEnAttente > 0 && (
                <span className="ml-auto text-[10px] font-semibold px-2 py-1 rounded-md" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                  {bs.nbDepensesEnAttente} en attente
                </span>
              )}
            </div>

            {/* ===== OVERVIEW ===== */}
            {activeView === 'overview' && (
              <>
                {/* Evolution mensuelle */}
                <div className="col-span-12 lg:col-span-8 rounded-xl p-5 border" style={{ background: 'var(--db-card)', borderColor: 'var(--db-border)' }}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--db-t3)' }}>
                    {t('evolutionTitle', { defaultValue: 'Evolution mensuelle des depenses' })}
                  </h3>
                  {evolutionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={evolutionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--db-border)" />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--db-t4)' }} />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--db-t4)' }} tickFormatter={(v: number) => formatShort(v)} />
                        <Tooltip formatter={(v) => formatMontant(Number(v))} contentStyle={{ background: 'var(--db-card)', border: '1px solid var(--db-border)', borderRadius: 8, fontSize: 12 }} />
                        <Bar dataKey="mensuel" fill="var(--db-teal)" radius={[4, 4, 0, 0]} name={t('mensuel', { defaultValue: 'Mensuel' })} />
                        <Bar dataKey="cumule" fill="#94a3b8" radius={[4, 4, 0, 0]} opacity={0.4} name={t('cumule', { defaultValue: 'Cumule' })} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[260px] flex items-center justify-center text-sm" style={{ color: 'var(--db-t5)' }}>
                      {t('noEvolution', { defaultValue: 'Aucune depense enregistree' })}
                    </div>
                  )}
                </div>

                {/* Repartition donut */}
                <div className="col-span-12 lg:col-span-4 rounded-xl p-5 border" style={{ background: 'var(--db-card)', borderColor: 'var(--db-border)' }}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--db-t3)' }}>
                    {t('repartitionTitle')}
                  </h3>
                  {pieData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius="40%" outerRadius="70%" paddingAngle={2} dataKey="value" startAngle={90} endAngle={-270}>
                            {pieData.map((d, i) => <Cell key={i} fill={d.color} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />)}
                          </Pie>
                          <Tooltip formatter={(v) => formatMontant(Number(v))} contentStyle={{ background: 'var(--db-card)', border: '1px solid var(--db-border)', borderRadius: 8, fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-1.5 mt-2">
                        {pieData.map((d) => (
                          <div key={d.name} className="flex items-center gap-2 text-xs">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                            <span className="flex-1 truncate" style={{ color: 'var(--db-t2)' }}>{d.name}</span>
                            <span className="font-semibold db-num" style={{ color: 'var(--db-t1)' }}>{formatShort(d.value)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-[180px] flex items-center justify-center text-sm" style={{ color: 'var(--db-t5)' }}>—</div>
                  )}
                </div>
              </>
            )}

            {/* ===== DEPENSES LIST ===== */}
            {activeView === 'depenses' && (
              <div className="col-span-12 rounded-xl border overflow-hidden" style={{ background: 'var(--db-card)', borderColor: 'var(--db-border)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'var(--db-subtle)' }}>
                        {[t('ref', { defaultValue: 'Ref' }), t('modalTitre', { defaultValue: 'Libelle' }), t('typeLabel', { defaultValue: 'Type' }), t('montantLabel', { defaultValue: 'Montant' }), t('dateLabel', { defaultValue: 'Date' }), t('statutLabel', { defaultValue: 'Statut' }), ''].map((h, i) => (
                          <th key={i} className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--db-t4)', borderBottom: '1px solid var(--db-border)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {depenses.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-8" style={{ color: 'var(--db-t5)' }}>{t('noDepenses', { defaultValue: 'Aucune depense' })}</td></tr>
                      ) : depenses.map((d: Depense) => {
                        const badge = STATUT_BADGE[d.statut] || STATUT_BADGE.BROUILLON
                        return (
                          <tr key={d.id} className="transition-colors hover:bg-[var(--db-subtle)]" style={{ borderBottom: '1px solid var(--db-border)' }}>
                            <td className="px-3 py-2.5 font-mono text-xs" style={{ color: 'var(--db-t3)' }}>{d.reference}</td>
                            <td className="px-3 py-2.5 font-medium" style={{ color: 'var(--db-t1)' }}>{d.libelle}</td>
                            <td className="px-3 py-2.5">
                              <span className="inline-flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full" style={{ background: TYPE_COLORS[d.type] || '#94a3b8' }} />
                                <span style={{ color: 'var(--db-t2)' }}>{t(`type.${d.type}`, { defaultValue: d.type })}</span>
                              </span>
                            </td>
                            <td className="px-3 py-2.5 font-bold db-num" style={{ color: 'var(--db-t1)' }}>{formatMontant(d.montant)}</td>
                            <td className="px-3 py-2.5" style={{ color: 'var(--db-t3)' }}>{d.dateDepense}</td>
                            <td className="px-3 py-2.5">
                              <span className="text-[10px] font-semibold px-2 py-1 rounded-md" style={{ background: badge.bg, color: badge.text }}>{d.statut}</span>
                            </td>
                            <td className="px-3 py-2.5">
                              <button onClick={() => handleDeleteDepense(d.id)} className="text-xs px-2 py-1 rounded transition-colors hover:bg-red-50" style={{ color: '#ef4444' }}>
                                {t('delete', { defaultValue: 'Suppr.' })}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ===== SITUATIONS ===== */}
            {activeView === 'situations' && (
              <div className="col-span-12 rounded-xl border overflow-hidden" style={{ background: 'var(--db-card)', borderColor: 'var(--db-border)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'var(--db-subtle)' }}>
                        {['N', t('periodeLabel', { defaultValue: 'Periode' }), t('montantMoisLabel', { defaultValue: 'Mois' }), t('montantCumuleLabel', { defaultValue: 'Cumule' }), t('montantNetLabel', { defaultValue: 'Net' }), t('avancementLabel', { defaultValue: 'Avancement' }), t('statutLabel', { defaultValue: 'Statut' })].map((h, i) => (
                          <th key={i} className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--db-t4)', borderBottom: '1px solid var(--db-border)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {situations.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-8" style={{ color: 'var(--db-t5)' }}>{t('noSituations', { defaultValue: 'Aucune situation de travaux' })}</td></tr>
                      ) : situations.map((s) => {
                        const badge = STATUT_BADGE[s.statut] || STATUT_BADGE.BROUILLON
                        return (
                          <tr key={s.id} className="transition-colors hover:bg-[var(--db-subtle)]" style={{ borderBottom: '1px solid var(--db-border)' }}>
                            <td className="px-3 py-2.5 font-bold db-num" style={{ color: 'var(--db-t1)' }}>#{s.numero}</td>
                            <td className="px-3 py-2.5 text-xs" style={{ color: 'var(--db-t2)' }}>{s.periodeDebut} — {s.periodeFin}</td>
                            <td className="px-3 py-2.5 font-semibold db-num" style={{ color: 'var(--db-teal)' }}>{formatShort(s.montantTravauxMois)}</td>
                            <td className="px-3 py-2.5 font-semibold db-num" style={{ color: 'var(--db-t1)' }}>{formatShort(s.montantTravauxCumule)}</td>
                            <td className="px-3 py-2.5 font-bold db-num" style={{ color: '#22c55e' }}>{s.montantNet ? formatShort(s.montantNet) : '—'}</td>
                            <td className="px-3 py-2.5">
                              {s.avancementPhysiquePct != null ? (
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--db-border)' }}>
                                    <div className="h-full rounded-full" style={{ width: `${s.avancementPhysiquePct}%`, background: 'var(--db-teal)' }} />
                                  </div>
                                  <span className="text-xs font-bold db-num" style={{ color: 'var(--db-t3)' }}>{s.avancementPhysiquePct}%</span>
                                </div>
                              ) : <span style={{ color: 'var(--db-t5)' }}>—</span>}
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="text-[10px] font-semibold px-2 py-1 rounded-md" style={{ background: badge.bg, color: badge.text }}>{s.statut}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== Create Depense Modal ===== */}
      <Modal
        isOpen={showDepenseModal}
        onClose={() => setShowDepenseModal(false)}
        title={t('newDepenseTitle', { defaultValue: 'Nouvelle depense' })}
        size="lg"
        footer={
          <>
            <button onClick={() => setShowDepenseModal(false)} className="px-5 py-2.5 border rounded-xl text-sm font-medium transition hover:bg-[var(--db-subtle)]" style={{ borderColor: 'var(--db-border)', color: 'var(--db-t2)' }}>
              {t('cancel', { defaultValue: 'Annuler' })}
            </button>
            <button onClick={handleCreateDepense} disabled={!formLibelle.trim() || !formMontant} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 hover:opacity-90" style={{ background: 'var(--db-teal)' }}>
              {t('create', { defaultValue: 'Creer' })}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--db-t3)' }}>{t('ref', { defaultValue: 'Reference' })}</label>
              <input type="text" value={formRef} onChange={(e) => setFormRef(e.target.value)} placeholder="DEP-001" className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--db-teal)]/40" style={{ background: 'var(--db-subtle)', borderColor: 'var(--db-border)', color: 'var(--db-t1)' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--db-t3)' }}>{t('typeLabel', { defaultValue: 'Type' })}</label>
              <select value={formType} onChange={(e) => setFormType(e.target.value)} className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--db-teal)]/40" style={{ background: 'var(--db-subtle)', borderColor: 'var(--db-border)', color: 'var(--db-t1)' }}>
                {Object.keys(TYPE_COLORS).map((tp) => <option key={tp} value={tp}>{t(`type.${tp}`, { defaultValue: tp })}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--db-t3)' }}>{t('modalTitre', { defaultValue: 'Libelle' })}</label>
            <input type="text" value={formLibelle} onChange={(e) => setFormLibelle(e.target.value)} className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--db-teal)]/40" style={{ background: 'var(--db-subtle)', borderColor: 'var(--db-border)', color: 'var(--db-t1)' }} placeholder="Achat ciment CPA 45..." autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--db-t3)' }}>{t('montantLabel', { defaultValue: 'Montant (FCFA)' })}</label>
              <input type="number" value={formMontant} onChange={(e) => setFormMontant(e.target.value)} className="w-full px-4 py-2.5 border rounded-xl text-sm font-bold db-num focus:outline-none focus:ring-2 focus:ring-[var(--db-teal)]/40" style={{ background: 'var(--db-subtle)', borderColor: 'var(--db-border)', color: 'var(--db-t1)' }} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--db-t3)' }}>{t('dateLabel', { defaultValue: 'Date' })}</label>
              <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--db-teal)]/40" style={{ background: 'var(--db-subtle)', borderColor: 'var(--db-border)', color: 'var(--db-t1)' }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--db-t3)' }}>{t('fournisseurLabel', { defaultValue: 'Fournisseur' })}</label>
              <input type="text" value={formFournisseur} onChange={(e) => setFormFournisseur(e.target.value)} className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--db-teal)]/40" style={{ background: 'var(--db-subtle)', borderColor: 'var(--db-border)', color: 'var(--db-t1)' }} placeholder="(optionnel)" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--db-t3)' }}>{t('numFactureLabel', { defaultValue: 'N facture' })}</label>
              <input type="text" value={formNumFacture} onChange={(e) => setFormNumFacture(e.target.value)} className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--db-teal)]/40" style={{ background: 'var(--db-subtle)', borderColor: 'var(--db-border)', color: 'var(--db-t1)' }} placeholder="(optionnel)" />
            </div>
          </div>
        </div>
      </Modal>
    </PageContainer>
  )
}
