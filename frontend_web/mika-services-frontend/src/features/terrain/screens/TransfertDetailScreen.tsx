/**
 * Transferts — détail : trajet, jalons et actions selon le circuit de validation.
 * DEMANDE → validation/rejet logistique · EN_ATTENTE_DEPART → bon QR + départ ·
 * EN_TRANSIT → réception par scan (écran dédié, online only).
 */
import { useEffect, useState } from 'react'
import { terrainApi, type TerrainChantier, type Transfert } from '@/api/terrainApi'
import { peekCachedGet } from '@/api/axios'
import { submitTerrainMutation } from '../offline/submitTerrainMutation'
import { DISABLED, F, GREEN, INK, INK_SOFT, MUTED, ORANGE, RED, bigBtn, card, errMsg, inputStyle, label13 } from '../theme'
import { SubHeader, SheetSelect, TrajetBlock, TransfertStatutBadge } from '../components/ui'
import { canReceptionnerTransfert, canValiderTransfert, useTerrainMe } from '../me'

const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null

export function TransfertDetailScreen({ transfert, onBack, onUpdated, onQueued, onToast, onError, onOpenBon, onOpenReception }: {
  transfert: Transfert
  onBack: () => void
  onUpdated: (t: Transfert) => void
  onQueued: () => void
  onToast: (m: string) => void
  onError: (m: string) => void
  onOpenBon: (t: Transfert) => void
  onOpenReception: (t: Transfert) => void
}) {
  const me = useTerrainMe()
  const [commentaire, setCommentaire] = useState('')
  const [motif, setMotif] = useState('')
  const [destinationId, setDestinationId] = useState(String(transfert.projetDestinationId))
  const [chantiers, setChantiers] = useState<TerrainChantier[]>(
    () => peekCachedGet<TerrainChantier[]>('/terrain/chantiers') ?? [],
  )
  const [busy, setBusy] = useState(false)
  const [rejetOuvert, setRejetOuvert] = useState(false)

  const estValideur = canValiderTransfert(me)
  const estInitiateur = me !== null && me.id === transfert.initiateurUserId

  // Destinations pour la validation (modifiable par la logistique)
  useEffect(() => {
    if (transfert.statut !== 'DEMANDE' || !estValideur) return
    terrainApi.chantiers().then(setChantiers).catch(() => undefined)
  }, [transfert.statut, estValideur])

  /** Passe par l'outbox : hors ligne, l'action est mise en file et rejouée au retour du réseau. */
  const run = async (action: 'confirmer-depart' | 'annuler', msg: string) => {
    if (busy) return
    setBusy(true)
    try {
      const r = await submitTerrainMutation<Transfert>(
        'transfert-action',
        { id: transfert.id, action, commentaire: commentaire.trim() || undefined },
        { contexte: transfert.enginCode },
      )
      setCommentaire('')
      if (r.queued) { onQueued(); return }
      onUpdated(r.result)
      onToast(msg)
    } catch (e) {
      onError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const valider = async () => {
    if (busy) return
    setBusy(true)
    try {
      const destId = Number(destinationId)
      const r = await submitTerrainMutation<Transfert>(
        'transfert-valider',
        {
          id: transfert.id,
          projetDestinationId: destId !== transfert.projetDestinationId ? destId : undefined,
          commentaire: commentaire.trim() || undefined,
        },
        { contexte: transfert.enginCode },
      )
      setCommentaire('')
      if (r.queued) { onQueued(); return }
      onUpdated(r.result)
      onToast('Transfert validé — bon de transfert généré')
    } catch (e) {
      onError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const rejeter = async () => {
    if (busy) return
    if (!motif.trim()) { onError('Le motif de rejet est obligatoire'); return }
    setBusy(true)
    try {
      const r = await submitTerrainMutation<Transfert>(
        'transfert-rejeter',
        { id: transfert.id, motif: motif.trim() },
        { contexte: transfert.enginCode },
      )
      if (r.queued) { onQueued(); return }
      onUpdated(r.result)
      onToast('Demande de transfert rejetée')
    } catch (e) {
      onError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  // ── Jalons enrichis ──────────────────────────────────────────
  const rejete = transfert.statut === 'REJETE'
  const annule = transfert.statut === 'ANNULE'
  const jalons: { label: string; date: string | null; fait: boolean; alerte?: boolean }[] = [
    { label: 'Demande de transfert', date: fmt(transfert.dateDemande), fait: true },
    rejete
      ? { label: `Rejetée par la logistique${transfert.validePar ? ` — ${transfert.validePar}` : ''}`, date: fmt(transfert.dateValidation), fait: true, alerte: true }
      : { label: `Validation logistique${transfert.validePar ? ` — ${transfert.validePar}` : ''}`, date: fmt(transfert.dateValidation), fait: !!transfert.dateValidation },
    { label: 'Départ confirmé', date: fmt(transfert.dateDepartConfirmee), fait: !!transfert.dateDepartConfirmee },
    {
      label: transfert.receptionAvecReserves ? 'Réception AVEC RÉSERVES' : 'Réception confirmée',
      date: fmt(transfert.dateReceptionConfirmee),
      fait: !!transfert.dateReceptionConfirmee,
      alerte: transfert.receptionAvecReserves,
    },
  ]
  const jalonsVisibles = rejete ? jalons.slice(0, 2) : jalons

  return (
    <div>
      <SubHeader titre={transfert.enginCode} onBack={onBack} />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, fontFamily: F }}>

        {/* En-tête engin + statut */}
        <div style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: INK }}>{transfert.enginNom}</span>
            <TransfertStatutBadge statut={transfert.statut} />
          </div>

          <TrajetBlock origine={transfert.projetOrigineNom ?? 'Dépôt / parc'} destination={transfert.projetDestinationNom} />

          <div style={{ fontSize: 12.5, color: MUTED }}>
            Demandé par {transfert.initiateurNom} le {fmt(transfert.dateDemande)}
          </div>
          {transfert.commentaire && (
            <div style={{ fontSize: 13.5, color: INK_SOFT, background: '#F4F6F8', borderRadius: 10, padding: '10px 12px' }}>
              {transfert.commentaire}
            </div>
          )}
          {rejete && transfert.motifRejet && (
            <div style={{ fontSize: 13.5, color: RED, background: '#FDEAEA', borderRadius: 10, padding: '10px 12px', fontWeight: 600 }}>
              Motif du rejet : {transfert.motifRejet}
            </div>
          )}
          {transfert.receptionAvecReserves && (
            <div style={{ fontSize: 13.5, color: '#B45309', background: '#FDF3E2', borderRadius: 10, padding: '10px 12px', fontWeight: 600 }}>
              Réceptionné avec réserves — un incident a été créé et reste à qualifier.
            </div>
          )}
        </div>

        {/* Jalons */}
        <div style={{ ...card, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 12 }}>Suivi</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {jalonsVisibles.map((j, i) => (
              <div key={j.label} style={{ display: 'flex', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <span style={{
                    width: 10, height: 10, borderRadius: '50%', marginTop: 5, boxSizing: 'border-box',
                    background: j.fait ? (j.alerte ? RED : '#137A3D') : '#fff',
                    border: j.fait ? 'none' : `2px solid ${DISABLED}`,
                  }} />
                  {i < jalonsVisibles.length - 1 && <span style={{ width: 2, flex: 1, background: '#E5EAEF', margin: '4px 0' }} />}
                </div>
                <div style={{ paddingBottom: i < jalonsVisibles.length - 1 ? 16 : 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: j.fait ? (j.alerte ? RED : INK) : MUTED }}>{j.label}</div>
                  <div style={{ fontSize: 12.5, color: MUTED }}>{j.date ?? (annule ? '—' : 'En attente')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions — DEMANDE : validation logistique */}
        {transfert.statut === 'DEMANDE' && estValideur && (
          <div style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: INK }}>Validation logistique</div>
            <div>
              <label style={label13}>Chantier de destination (modifiable)</label>
              <SheetSelect
                value={destinationId}
                onChange={setDestinationId}
                placeholder="Choisir la destination"
                title="Chantier de destination"
                options={[
                  { value: String(transfert.projetDestinationId), label: transfert.projetDestinationNom, sub: 'Destination demandée' },
                  ...chantiers
                    .filter((c) => c.id !== transfert.projetDestinationId && c.id !== transfert.projetOrigineId)
                    .map((c) => ({ value: String(c.id), label: c.nom })),
                ]}
              />
            </div>
            {!rejetOuvert && (
              <>
                <div>
                  <label style={label13}>Commentaire (optionnel)</label>
                  <textarea
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    rows={2}
                    placeholder="Consignes de transport, transporteur…"
                    style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }}
                  />
                </div>
                <button onClick={() => void valider()} disabled={busy} className="tk-press" style={bigBtn(busy ? DISABLED : GREEN)}>
                  Valider le transfert
                </button>
                <button onClick={() => setRejetOuvert(true)} disabled={busy} className="tk-press" style={{ ...bigBtn('#FDEAEA'), color: RED }}>
                  Rejeter la demande
                </button>
              </>
            )}
            {rejetOuvert && (
              <>
                <div>
                  <label style={label13}>Motif du rejet (obligatoire)</label>
                  <textarea
                    value={motif}
                    onChange={(e) => setMotif(e.target.value)}
                    rows={2}
                    placeholder="Engin indisponible, priorité chantier…"
                    style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }}
                  />
                </div>
                <button
                  onClick={() => void rejeter()}
                  disabled={busy || !motif.trim()}
                  className="tk-press"
                  style={bigBtn(busy || !motif.trim() ? DISABLED : RED)}
                >
                  Confirmer le rejet
                </button>
                <button onClick={() => setRejetOuvert(false)} disabled={busy} className="tk-press" style={{ ...bigBtn('#F4F6F8'), color: INK_SOFT }}>
                  Retour
                </button>
              </>
            )}
          </div>
        )}

        {/* DEMANDE : annulation par l'initiateur */}
        {transfert.statut === 'DEMANDE' && !estValideur && estInitiateur && (
          <div style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 13, color: MUTED }}>
              La demande est en attente de validation par la logistique.
            </div>
            <button onClick={() => void run('annuler', 'Demande annulée')} disabled={busy} className="tk-press" style={{ ...bigBtn('#FDEAEA'), color: RED }}>
              Annuler ma demande
            </button>
          </div>
        )}

        {/* EN_ATTENTE_DEPART : bon de transfert + départ */}
        {transfert.statut === 'EN_ATTENTE_DEPART' && (
          <div style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button onClick={() => onOpenBon(transfert)} className="tk-press" style={{ ...bigBtn('#fff'), color: ORANGE, border: `1.5px solid ${ORANGE}` }}>
              Bon de transfert (QR)
            </button>
            <div>
              <label style={label13}>Observations (optionnel)</label>
              <textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                rows={2}
                placeholder="État de l'engin, écarts constatés…"
                style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }}
              />
            </div>
            <button
              onClick={() => void run('confirmer-depart', 'Départ confirmé — engin en transit')}
              disabled={busy}
              className="tk-press"
              style={bigBtn(busy ? DISABLED : ORANGE)}
            >
              Confirmer le départ
            </button>
            {estValideur && (
              <button onClick={() => void run('annuler', 'Transfert annulé')} disabled={busy} className="tk-press" style={{ ...bigBtn('#FDEAEA'), color: RED }}>
                Annuler le transfert
              </button>
            )}
          </div>
        )}

        {/* EN_TRANSIT : réception par scan (online only) */}
        {transfert.statut === 'EN_TRANSIT' && (
          <div style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button onClick={() => onOpenBon(transfert)} className="tk-press" style={{ ...bigBtn('#fff'), color: ORANGE, border: `1.5px solid ${ORANGE}` }}>
              Bon de transfert (QR)
            </button>
            {canReceptionnerTransfert(me) && (
              <>
                <div style={{ fontSize: 13, color: MUTED }}>
                  À l'arrivée, le receveur scanne le QR du bon présenté par le convoyeur (ou saisit le code de réception).
                </div>
                <button onClick={() => onOpenReception(transfert)} className="tk-press" style={bigBtn(GREEN)}>
                  Réceptionner l'engin
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
