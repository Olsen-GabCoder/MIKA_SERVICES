import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useIsOnline } from '@/hooks/useConnectivity'
import {
  fetchDmaById,
  fetchDmaHistorique,
  clearDmaDetail,
  prendreEnChargeDma,
  demanderComplementDma,
  completerDma,
  commanderDma,
  livrerDma,
  cloturerDma,
  rejeterDma,
} from '@/store/slices/demandeMaterielSlice'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import type { StatutDemandeMateriel } from '@/types/materiel'

// ─── Style map (same as list) ────────────────────────────────────────────────

const STATUT_STYLE: Record<StatutDemandeMateriel, string> = {
  SOUMISE:                 'bg-gray-100 dark:bg-gray-700/60 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300',
  EN_VALIDATION_CHANTIER:  'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/40 text-amber-700 dark:text-amber-400',
  EN_VALIDATION_PROJET:    'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700/40 text-orange-700 dark:text-orange-400',
  PRISE_EN_CHARGE:         'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/40 text-blue-700 dark:text-blue-400',
  EN_ATTENTE_COMPLEMENT:   'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700/40 text-purple-700 dark:text-purple-400',
  EN_COMMANDE:             'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700/40 text-indigo-700 dark:text-indigo-400',
  LIVRE:                   'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-700/40 text-teal-700 dark:text-teal-400',
  REJETEE:                 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/40 text-red-600 dark:text-red-400',
  CLOTUREE:                'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/40 text-green-700 dark:text-green-400',
}

const STATUT_DOT: Record<StatutDemandeMateriel, string> = {
  SOUMISE: 'bg-slate-400',
  EN_VALIDATION_CHANTIER: 'bg-amber-500',
  EN_VALIDATION_PROJET: 'bg-orange-500',
  PRISE_EN_CHARGE: 'bg-sky-500',
  EN_ATTENTE_COMPLEMENT: 'bg-violet-500',
  EN_COMMANDE: 'bg-indigo-500',
  LIVRE: 'bg-teal-500',
  REJETEE: 'bg-rose-500',
  CLOTUREE: 'bg-emerald-500',
}

// ─── Action modal ────────────────────────────────────────────────────────────

type ActionKind =
  | 'prendre_en_charge'
  | 'demander_complement'
  | 'completer'
  | 'commander'
  | 'livrer'
  | 'cloturer'
  | 'rejeter'

interface ActionModalProps {
  kind: ActionKind
  onConfirm: (commentaire: string) => void
  onCancel: () => void
  loading: boolean
  t: (key: string) => string
}

function ActionModal({ kind, onConfirm, onCancel, loading, t }: ActionModalProps) {
  const [commentaire, setCommentaire] = useState('')
  const requiresComment = kind === 'rejeter' || kind === 'demander_complement'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
          {t(`dma.action.${kind}.title`)}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {t(`dma.action.${kind}.confirm`)}
        </p>
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            {t('dma.action.commentaire')}
            {requiresComment && <span className="text-red-500 ml-1">*</span>}
          </label>
          <textarea
            rows={3}
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            placeholder={t('dma.action.commentairePlaceholder')}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {t('dma.action.cancel')}
          </Button>
          <Button
            onClick={() => onConfirm(commentaire)}
            disabled={loading || (requiresComment && !commentaire.trim())}
          >
            {loading ? t('dma.action.processing') : t(`dma.action.${kind}.btn`)}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── InfoRow helper ───────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === '') return null
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700/40 last:border-0">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-right max-w-[60%]">{value}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DemandeMaterielDetailPage() {
  const { t, i18n } = useTranslation('materiel')
  const isOnline = useIsOnline()
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const { dmaDetail: dma, historique, loading, actionLoading, error } = useAppSelector((s) => s.demandeMateriel)

  const [activeAction, setActiveAction] = useState<ActionKind | null>(null)
  const actionBusy = actionLoading !== null

  useEffect(() => {
    if (!id) return
    const numId = Number(id)
    dispatch(fetchDmaById(numId))
    dispatch(fetchDmaHistorique(numId))
    return () => { dispatch(clearDmaDetail()) }
  }, [id, dispatch])

  // ── Dispatch action ──

  async function handleAction(kind: ActionKind, commentaire: string) {
    if (!dma) return
    const numId = dma.id

    const actionMap: Record<ActionKind, () => Promise<unknown>> = {
      prendre_en_charge:   () => dispatch(prendreEnChargeDma({ id: numId, commentaire: commentaire || undefined })).unwrap(),
      demander_complement: () => dispatch(demanderComplementDma({ id: numId, commentaire: commentaire || undefined })).unwrap(),
      completer:           () => dispatch(completerDma({ id: numId, commentaire: commentaire || undefined })).unwrap(),
      commander:           () => dispatch(commanderDma({ id: numId })).unwrap(),
      livrer:              () => dispatch(livrerDma({ id: numId, commentaire: commentaire || undefined })).unwrap(),
      cloturer:            () => dispatch(cloturerDma({ id: numId, commentaire: commentaire || undefined })).unwrap(),
      rejeter:             () => dispatch(rejeterDma({ id: numId, commentaire })).unwrap(),
    }

    try {
      await actionMap[kind]()
      setActiveAction(null)
      // Refresh historique
      dispatch(fetchDmaHistorique(numId))
    } catch {
      // error handled by slice
      setActiveAction(null)
    }
  }

  // ── Format date ──

  function fmtDate(d?: string) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString(i18n.language)
  }

  // ── Loading / Not found ──

  if (loading && !dma) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-3 border-gray-300 dark:border-gray-600 border-t-primary rounded-full animate-spin" />
        </div>
      </PageContainer>
    )
  }

  if (!dma) {
    return (
      <PageContainer>
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          {error || t('dma.detail.notFound')}
        </div>
      </PageContainer>
    )
  }

  // ── Workflow buttons by statut ──

  const workflowButtons: { kind: ActionKind; labelKey: string; variant?: 'primary' | 'secondary' | 'danger' }[] = (() => {
    switch (dma.statut) {
      // Circuit à une porte (réforme 2026-08-20) : SOUMISE = en attente logistique.
      // EN_VALIDATION_* = statuts legacy sans action (tombent dans default).
      case 'SOUMISE':
        return [
          { kind: 'prendre_en_charge', labelKey: 'dma.action.prendre_en_charge.btn' },
          { kind: 'rejeter', labelKey: 'dma.action.rejeter.btn', variant: 'danger' as const },
        ]
      case 'PRISE_EN_CHARGE':
        return [
          { kind: 'demander_complement', labelKey: 'dma.action.demander_complement.btn', variant: 'secondary' as const },
          { kind: 'commander', labelKey: 'dma.action.commander.btn' },
          { kind: 'rejeter', labelKey: 'dma.action.rejeter.btn', variant: 'danger' as const },
        ]
      case 'EN_ATTENTE_COMPLEMENT':
        return [
          { kind: 'completer', labelKey: 'dma.action.completer.btn' },
        ]
      case 'EN_COMMANDE':
        return [
          { kind: 'livrer', labelKey: 'dma.action.livrer.btn' },
        ]
      case 'LIVRE':
        return [
          { kind: 'cloturer', labelKey: 'dma.action.cloturer.btn' },
        ]
      default:
        return []
    }
  })()

  return (
    <PageContainer>
      {activeAction && (
        <ActionModal
          kind={activeAction}
          onConfirm={(c) => handleAction(activeAction, c)}
          onCancel={() => setActiveAction(null)}
          loading={actionBusy}
          t={t}
        />
      )}

      <div className="max-w-4xl mx-auto pb-12">
        {/* ── Header compact unifié — breadcrumb + identité + statut + actions ── */}
        <motion.div
          className="mb-6 bg-white dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="px-5 py-4">
            {/* Breadcrumb */}
            <button
              onClick={() => navigate('/dma')}
              className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors flex items-center gap-1 mb-3"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {t('dma.detail.backToList')}
            </button>

            {/* Identité + statut */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-md flex-shrink-0">
                  <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                  </svg>
                </div>
                <div>
                  <h1 className="font-mono text-base font-black text-gray-900 dark:text-white tracking-wide leading-tight">
                    {dma.reference}
                  </h1>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium truncate max-w-[20rem]">
                    {dma.projetNom} · {dma.createurNom}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {dma.priorite === 'URGENTE' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute h-full w-full rounded-full bg-rose-400 opacity-60" />
                      <span className="relative rounded-full h-1.5 w-1.5 bg-rose-500" />
                    </span>
                    {t('dma.priorite.URGENTE')}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-bold ${STATUT_STYLE[dma.statut]}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUT_DOT[dma.statut]}`} />
                  {t(`dma.statut.${dma.statut}`)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions workflow — intégrées au bandeau */}
          {workflowButtons.length > 0 && (
            <div className="px-5 py-3 bg-gray-50/80 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-700/40 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mr-1">
                Actions
              </span>
              {workflowButtons.map((wb) => (
                <Button
                  key={wb.kind}
                  variant={wb.variant ?? 'primary'}
                  onClick={() => setActiveAction(wb.kind)}
                  disabled={actionBusy || !isOnline}
                  title={!isOnline ? t('common:offline.actionUnavailable') : undefined}
                >
                  {t(wb.labelKey)}
                </Button>
              ))}
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Informations ──────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            <motion.section
              className="bg-white dark:bg-gray-800/60 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-6"
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="flex items-center gap-2 text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                <span className="w-1 h-3.5 rounded-full bg-primary" />
                {t('dma.detail.infoTitle')}
              </h2>
              <InfoRow label={t('dma.detail.reference')} value={dma.reference} />
              <InfoRow label={t('dma.detail.projet')} value={dma.projetNom} />
              <InfoRow label={t('dma.detail.createur')} value={dma.createurNom} />
              <InfoRow label={t('dma.detail.priorite')} value={t(`dma.priorite.${dma.priorite}`)} />
              <InfoRow label={t('dma.detail.dateSouhaitee')} value={fmtDate(dma.dateSouhaitee)} />
              <InfoRow label={t('dma.detail.montantEstime')} value={dma.montantEstime != null ? `${dma.montantEstime.toLocaleString()} FCFA` : null} />
              {dma.commandeReference && (
                <InfoRow label={t('dma.detail.commande')} value={dma.commandeReference} />
              )}
              {dma.commentaire && (
                <div className="pt-3 mt-2 border-t border-gray-100 dark:border-gray-700/40">
                  <p className="text-xs text-gray-400 mb-1">{t('dma.detail.commentaire')}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{dma.commentaire}</p>
                </div>
              )}
            </motion.section>

            {/* ── Lignes ────────────────────────────────────────────── */}
            <motion.section
              className="bg-white dark:bg-gray-800/60 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-6"
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="flex items-center gap-2 text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                <span className="w-1 h-3.5 rounded-full bg-primary" />
                {t('dma.detail.lignesTitle')}
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tabular-nums normal-case">({dma.lignes.length})</span>
              </h2>
              {dma.lignes.length === 0 ? (
                <p className="text-sm text-gray-400">{t('dma.detail.noLignes')}</p>
              ) : (
                <div className="overflow-x-auto -mx-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/60 dark:bg-gray-700/30">
                        {['designation', 'materiau', 'quantite', 'unite', 'prixUnit', 'fournisseur'].map((c) => (
                          <th key={c} className="px-6 py-2.5 text-left border-b border-gray-100 dark:border-gray-700/50">
                            <span className="text-[10px] font-black tracking-[0.08em] uppercase text-gray-400 dark:text-gray-500">
                              {t(`dma.detail.col.${c}`)}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dma.lignes.map((l) => (
                        <tr key={l.id} className="border-b border-gray-50 dark:border-gray-700/20 hover:bg-gray-50 dark:hover:bg-gray-700/20">
                          <td className="px-6 py-3 font-medium text-gray-800 dark:text-gray-200">{l.designation}</td>
                          <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{l.materiauCode ?? '—'}</td>
                          <td className="px-6 py-3 text-gray-700 dark:text-gray-300">{l.quantite}</td>
                          <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{t(`dma.unite.${l.unite}`)}</td>
                          <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                            {l.prixUnitaireEst != null ? l.prixUnitaireEst.toLocaleString() : '—'}
                          </td>
                          <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{l.fournisseurSuggere ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.section>
          </div>

          {/* ── Historique ────────────────────────────────────────── */}
          <aside className="space-y-6">
            <motion.section
              className="bg-white dark:bg-gray-800/60 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-6"
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="flex items-center gap-2 text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                <span className="w-1 h-3.5 rounded-full bg-primary" />
                {t('dma.detail.historiqueTitle')}
              </h2>
              {historique.length === 0 ? (
                <p className="text-sm text-gray-400">{t('dma.detail.noHistorique')}</p>
              ) : (
                <ol className="relative border-l border-gray-200 dark:border-gray-700 space-y-4 pl-4">
                  {historique.map((h) => (
                    <li key={h.id} className="relative">
                      <span className="absolute -left-[1.15rem] top-0.5 w-3 h-3 rounded-full bg-primary border-2 border-white dark:border-gray-800" />
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">{fmtDate(h.dateTransition)} · {h.userNom}</p>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {h.deStatut ? (
                            <>
                              <span className="text-gray-400">{t(`dma.statut.${h.deStatut}`)}</span>
                              <span className="mx-1.5 text-gray-300">→</span>
                            </>
                          ) : null}
                          {t(`dma.statut.${h.versStatut}`)}
                        </p>
                        {h.commentaire && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 italic">{h.commentaire}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </motion.section>

            {/* Meta */}
            <motion.section
              className="bg-white dark:bg-gray-800/60 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-6"
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="flex items-center gap-2 text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider mb-3">
                <span className="w-1 h-3.5 rounded-full bg-primary" />
                {t('dma.detail.metaTitle')}
              </h2>
              <InfoRow label={t('dma.detail.createdAt')} value={fmtDate(dma.createdAt)} />
              <InfoRow label={t('dma.detail.updatedAt')} value={fmtDate(dma.updatedAt)} />
            </motion.section>
          </aside>
        </div>
      </div>
    </PageContainer>
  )
}
