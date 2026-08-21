/**
 * DMA — détail d'une demande : lignes, timeline d'historique et actions du workflow.
 */
import { useEffect, useState } from 'react'
import { terrainApi, type Dma, type DmaHistorique } from '@/api/terrainApi'
import { DISABLED, DMA_PRIORITE_COLORS, DMA_STATUT_COLORS, DMA_STATUT_LABELS, F, INK, INK_SOFT, MUTED, ORANGE, RED, bigBtn, card, errMsg, inputStyle, label13 } from '../theme'
import { DmaStatutBadge, ProgressTracker, Skeleton, SubHeader, type TrackerStep } from '../components/ui'
import { IconDownload } from '../components/icons'
import { useTerrainMe } from '../me'
import { actionsPour, type DmaAction } from '../dmaWorkflow'
import { submitTerrainMutation } from '../offline/submitTerrainMutation'
import type { DmaRejeterPayload, DmaTransitionPayload, TerrainAction } from '../offline/terrainMutations'

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export function DmaDetailScreen({ demande, onBack, onUpdated, onDupliquer, onQueued, onToast, onError }: {
  demande: Dma
  onBack: () => void
  onUpdated: (d: Dma) => void
  /** Repart sur le formulaire de création pré-rempli (nouvelle référence, nouveau workflow). */
  onDupliquer?: () => void
  onQueued: () => void
  onToast: (m: string) => void
  onError: (m: string) => void
}) {
  const [historique, setHistorique] = useState<DmaHistorique[] | null>(null)
  const [commentaire, setCommentaire] = useState('')
  const [rejetOuvert, setRejetOuvert] = useState(false)
  const [busy, setBusy] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)

  /** Téléchargement du bon PDF — ONLINE ONLY (pas d'outbox : c'est une lecture). */
  const telechargerPdf = async () => {
    if (pdfBusy) return
    if (!navigator.onLine) { onError('Connexion requise pour télécharger le PDF'); return }
    setPdfBusy(true)
    try {
      const blob = await terrainApi.demandePdf(demande.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${demande.reference}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      onError(errMsg(e))
    } finally {
      setPdfBusy(false)
    }
  }

  const loadHistorique = (id: number) => {
    terrainApi.demandeHistorique(id).then(setHistorique).catch((e) => onError(errMsg(e)))
  }
  useEffect(() => { loadHistorique(demande.id) }, [demande.id]) // eslint-disable-line react-hooks/exhaustive-deps

  /** Passe par l'outbox : hors ligne, l'action est mise en file et rejouée au retour du réseau. */
  const run = async (action: TerrainAction, payload: DmaTransitionPayload | DmaRejeterPayload, msg: string) => {
    if (busy) return
    setBusy(true)
    try {
      const r = await submitTerrainMutation<Dma>(action, payload, { contexte: demande.reference })
      setCommentaire('')
      setRejetOuvert(false)
      if (r.queued) {
        onQueued()
        return
      }
      onUpdated(r.result)
      onToast(msg)
      loadHistorique(r.result.id)
    } catch (e) {
      onError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const me = useTerrainMe()
  const actions = actionsPour(demande.statut, me, demande)
  const com = commentaire.trim() || undefined

  const trackerSteps: TrackerStep[] = (() => {
    const PIPELINE = ['SOUMISE', 'PRISE_EN_CHARGE', 'EN_COMMANDE', 'LIVRE', 'CLOTUREE'] as const
    const PIPELINE_LABELS = ['Soumise', 'Prise en charge', 'Commandée', 'Livrée', 'Clôturée']
    const statut = demande.statut

    if (statut === 'REJETEE') {
      // Trouve la dernière étape franchie avant rejet (SOUMISE ou PRISE_EN_CHARGE)
      const lastDone = statut === 'REJETEE' ? 0 : 0
      return [...PIPELINE.slice(0, lastDone + 1).map((_, i) => ({ label: PIPELINE_LABELS[i], status: 'done' as const })),
        { label: 'Rejetée', status: 'error' as const }]
    }
    if (statut === 'EN_ATTENTE_COMPLEMENT') {
      // Pareil que PRISE_EN_CHARGE mais avec marqueur complément
      return PIPELINE.map((s, i) => ({
        label: s === 'PRISE_EN_CHARGE' ? 'Complément' : PIPELINE_LABELS[i],
        status: i < 1 ? 'done' as const : i === 1 ? 'active' as const : 'future' as const,
      }))
    }
    // Legacy statuts : mapper vers SOUMISE (active)
    if (statut === 'EN_VALIDATION_CHANTIER' || statut === 'EN_VALIDATION_PROJET') {
      return PIPELINE.map((_, i) => ({
        label: PIPELINE_LABELS[i],
        status: i === 0 ? 'active' as const : 'future' as const,
      }))
    }
    const idx = PIPELINE.indexOf(statut as typeof PIPELINE[number])
    return PIPELINE.map((_, i) => ({
      label: PIPELINE_LABELS[i],
      status: i < idx ? 'done' as const : i === idx ? 'active' as const : 'future' as const,
    }))
  })()

  return (
    <div>
      <SubHeader titre={demande.reference} onBack={onBack} />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, fontFamily: F }}>

        {/* Tracker de progression */}
        <div style={{ ...card, padding: '16px 16px 12px' }}>
          <ProgressTracker steps={trackerSteps} />
        </div>

        {/* En-tête */}
        <div style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <DmaStatutBadge statut={demande.statut} />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: DMA_PRIORITE_COLORS[demande.priorite] ?? MUTED }}>
              Priorité {demande.priorite.toLowerCase()}
            </span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: INK }}>{demande.projetNom}</div>
          <div style={{ fontSize: 12.5, color: MUTED }}>
            Créée par {demande.createurNom} le {fmtDate(demande.createdAt)}
            {demande.dateSouhaitee ? ` · souhaitée le ${new Date(demande.dateSouhaitee).toLocaleDateString('fr-FR')}` : ''}
          </div>
          {demande.commentaire && (
            <div style={{ fontSize: 13.5, color: INK_SOFT, background: '#F4F6F8', borderRadius: 10, padding: '10px 12px' }}>
              {demande.commentaire}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => void telechargerPdf()}
              disabled={pdfBusy}
              className="tk-press"
              style={{
                flex: 1.3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                height: 44, borderRadius: 12, border: `1.5px solid ${ORANGE}`, background: '#fff',
                color: pdfBusy ? DISABLED : ORANGE, fontSize: 14, fontWeight: 700, fontFamily: F, cursor: 'pointer',
              }}
            >
              <IconDownload size={18} />
              {pdfBusy ? 'Génération…' : 'Télécharger le PDF'}
            </button>
            {onDupliquer && (
              <button
                onClick={onDupliquer}
                className="tk-press"
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: 44, borderRadius: 12, border: '1.5px solid #DDE3E9', background: '#fff',
                  color: INK, fontSize: 14, fontWeight: 700, fontFamily: F, cursor: 'pointer',
                }}
              >
                Dupliquer
              </button>
            )}
          </div>
        </div>

        {/* Lignes */}
        <div style={{ ...card, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 10 }}>
            Matériel demandé ({demande.lignes.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {demande.lignes.map((l, i) => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: i > 0 ? '1px solid #EEF1F4' : 'none' }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, color: INK }}>{l.designation}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: INK, whiteSpace: 'nowrap' }}>
                  {l.quantite} {l.unite}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={label13}>Commentaire {rejetOuvert ? '(motif obligatoire)' : '(optionnel)'}</label>
              <textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                rows={2}
                placeholder={rejetOuvert ? 'Motif du refus…' : 'Commentaire…'}
                style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }}
              />
            </div>
            {(() => {
              const rejet = actions.find((a) => a.kind === 'rejeter')
              const transitions = actions.filter((a): a is Extract<DmaAction, { kind: 'transition' }> => a.kind === 'transition')
              return (
                <>
                  {rejetOuvert ? (
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => setRejetOuvert(false)} className="tk-press" style={{ ...bigBtn('#EEF1F4'), color: INK, flex: 1 }}>Annuler</button>
                      <button
                        onClick={() => { if (com) void run('dma-rejeter', { id: demande.id, commentaire: com }, 'Demande rejetée') }}
                        disabled={busy || !com}
                        className="tk-press"
                        style={{ ...bigBtn(com && !busy ? RED : DISABLED), flex: 1 }}
                      >
                        Confirmer le rejet
                      </button>
                    </div>
                  ) : (
                    <>
                      {rejet && (
                        <button onClick={() => setRejetOuvert(true)} className="tk-press" style={{ ...bigBtn('#FDEAEA'), color: RED }}>Rejeter</button>
                      )}
                      {transitions.map((a) => (
                        <button
                          key={a.action}
                          onClick={() => void run('dma-transition', { id: demande.id, action: a.action, commentaire: com }, a.action === 'livrer' ? 'Livraison enregistrée' : 'Demande mise à jour')}
                          disabled={busy}
                          className="tk-press"
                          style={bigBtn(busy ? DISABLED : ORANGE)}
                        >
                          {a.label}
                        </button>
                      ))}
                    </>
                  )}
                </>
              )
            })()}
          </div>
        )}

        {/* Timeline */}
        <div style={{ ...card, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 12 }}>Historique</div>
          {historique === null && <Skeleton height={72} radius={12} />}
          {historique !== null && historique.length === 0 && (
            <div style={{ fontSize: 13.5, color: MUTED }}>Aucune transition enregistrée.</div>
          )}
          {historique !== null && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {historique.map((h, i) => {
                const c = DMA_STATUT_COLORS[h.versStatut] ?? { bg: '#EEF1F4', fg: '#5B6B79' }
                return (
                  <div key={h.id} style={{ display: 'flex', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: c.fg, marginTop: 5 }} />
                      {i < historique.length - 1 && <span style={{ width: 2, flex: 1, background: '#E5EAEF', margin: '4px 0' }} />}
                    </div>
                    <div style={{ paddingBottom: i < historique.length - 1 ? 16 : 0, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: INK }}>
                        {DMA_STATUT_LABELS[h.versStatut] ?? h.versStatut}
                      </div>
                      <div style={{ fontSize: 12.5, color: MUTED }}>{h.userNom} · {fmtDate(h.dateTransition)}</div>
                      {h.commentaire && <div style={{ fontSize: 13, color: INK_SOFT, marginTop: 4 }}>{h.commentaire}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
