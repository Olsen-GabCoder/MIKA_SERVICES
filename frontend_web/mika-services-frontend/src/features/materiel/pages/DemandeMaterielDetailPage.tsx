import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  fetchDmaById,
  fetchDmaHistorique,
  clearDmaDetail,
  validerChantierDma,
  validerProjetDma,
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

// ─── Action modal ────────────────────────────────────────────────────────────

type ActionKind =
  | 'valider_chantier'
  | 'refuser_chantier'
  | 'valider_projet'
  | 'refuser_projet'
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
  const requiresComment = kind === 'rejeter' || kind === 'demander_complement' || kind === 'refuser_chantier' || kind === 'refuser_projet'

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
      valider_chantier:    () => dispatch(validerChantierDma({ id: numId, approuve: true, commentaire: commentaire || undefined })).unwrap(),
      refuser_chantier:    () => dispatch(validerChantierDma({ id: numId, approuve: false, commentaire: commentaire || undefined })).unwrap(),
      valider_projet:      () => dispatch(validerProjetDma({ id: numId, approuve: true, commentaire: commentaire || undefined })).unwrap(),
      refuser_projet:      () => dispatch(validerProjetDma({ id: numId, approuve: false, commentaire: commentaire || undefined })).unwrap(),
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
      case 'SOUMISE':
        return [
          { kind: 'valider_chantier', labelKey: 'dma.action.valider_chantier.btn' },
          { kind: 'refuser_chantier', labelKey: 'dma.action.refuser_chantier.btn', variant: 'danger' as const },
        ]
      case 'EN_VALIDATION_CHANTIER':
        return [
          { kind: 'valider_chantier', labelKey: 'dma.action.valider_chantier.btn' },
          { kind: 'refuser_chantier', labelKey: 'dma.action.refuser_chantier.btn', variant: 'danger' as const },
        ]
      case 'EN_VALIDATION_PROJET':
        return [
          { kind: 'valider_projet', labelKey: 'dma.action.valider_projet.btn' },
          { kind: 'refuser_projet', labelKey: 'dma.action.refuser_projet.btn', variant: 'danger' as const },
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

  // If statut is SOUMISE, also offer "prendre en charge" after validation
  if (dma.statut === 'EN_VALIDATION_PROJET') {
    workflowButtons.splice(2, 0, { kind: 'prendre_en_charge', labelKey: 'dma.action.prendre_en_charge.btn' })
  }

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
        {/* ── Top bar ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/dma')}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('dma.detail.backToList')}
          </button>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{dma.reference}</span>

          {/* Statut badge */}
          <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold border ${STATUT_STYLE[dma.statut]}`}>
            {t(`dma.statut.${dma.statut}`)}
          </span>
          {/* Priorité */}
          {dma.priorite === 'URGENTE' && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/40 text-red-600 dark:text-red-400">
              {t('dma.priorite.URGENTE')}
            </span>
          )}
        </div>

        {/* ── Workflow actions ───────────────────────────────────── */}
        {workflowButtons.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {workflowButtons.map((wb) => (
              <Button
                key={wb.kind}
                variant={wb.variant ?? 'primary'}
                onClick={() => setActiveAction(wb.kind)}
                disabled={actionBusy}
              >
                {t(wb.labelKey)}
              </Button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Informations ──────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
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
            </section>

            {/* ── Lignes ────────────────────────────────────────────── */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                {t('dma.detail.lignesTitle')} ({dma.lignes.length})
              </h2>
              {dma.lignes.length === 0 ? (
                <p className="text-sm text-gray-400">{t('dma.detail.noLignes')}</p>
              ) : (
                <div className="overflow-x-auto -mx-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700/40">
                        {['designation', 'materiau', 'quantite', 'unite', 'prixUnit', 'fournisseur'].map((c) => (
                          <th key={c} className="px-6 py-2 text-left text-xs font-semibold text-gray-400 uppercase">
                            {t(`dma.detail.col.${c}`)}
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
            </section>
          </div>

          {/* ── Historique ────────────────────────────────────────── */}
          <aside className="space-y-6">
            <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
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
            </section>

            {/* Meta */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                {t('dma.detail.metaTitle')}
              </h2>
              <InfoRow label={t('dma.detail.createdAt')} value={fmtDate(dma.createdAt)} />
              <InfoRow label={t('dma.detail.updatedAt')} value={fmtDate(dma.updatedAt)} />
            </section>
          </aside>
        </div>
      </div>
    </PageContainer>
  )
}
