/**
 * Bon de transfert — QR plein écran présenté par le convoyeur au receveur.
 * Le token est rendu côté client (canvas), non téléchargeable : affichage écran seulement.
 * Le code manuel 6 chiffres est le mode dégradé (réception tracée « par code manuel »).
 */
import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { terrainApi, type Transfert, type TransfertBon } from '@/api/terrainApi'
import { F, FC, INK, MUTED, ORANGE, card, errMsg } from '../theme'
import { Skeleton, SubHeader, TrajetBlock } from '../components/ui'

export function BonTransfertScreen({ transfert, onBack, onError }: {
  transfert: Transfert
  onBack: () => void
  onError: (m: string) => void
}) {
  const [bon, setBon] = useState<TransfertBon | null>(null)
  const [loading, setLoading] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let alive = true
    terrainApi.transfertBon(transfert.id)
      .then((b) => { if (alive) setBon(b) })
      .catch((e) => { if (alive) { onError(errMsg(e)); onBack() } })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [transfert.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!bon || !canvasRef.current) return
    void QRCode.toCanvas(canvasRef.current, bon.qrToken, {
      width: Math.min(window.innerWidth - 96, 300),
      margin: 1,
      color: { dark: '#0F1B26', light: '#FFFFFF' },
    })
  }, [bon])

  return (
    <div>
      <SubHeader titre="Bon de transfert" onBack={onBack} />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, fontFamily: F }}>

        <div style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontFamily: FC, fontSize: 19, fontWeight: 700, color: INK }}>
            {transfert.enginCode} — {transfert.enginNom}
          </div>
          <TrajetBlock origine={transfert.projetOrigineNom ?? 'Dépôt / parc'} destination={transfert.projetDestinationNom} />
        </div>

        <div style={{ ...card, padding: '22px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          {loading && <Skeleton height={280} />}
          {bon && (
            <>
              <div style={{ fontSize: 13.5, color: MUTED, textAlign: 'center', fontWeight: 600 }}>
                Présentez ce QR au receveur à l'arrivée — il le scanne pour confirmer la réception.
              </div>
              <canvas ref={canvasRef} style={{ borderRadius: 12 }} />
              <div style={{ width: '100%', borderTop: '1px solid #EAEEF2', paddingTop: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 12.5, color: MUTED, fontWeight: 600 }}>Code de réception (si le scan est impossible)</div>
                <div style={{ fontFamily: FC, fontSize: 34, fontWeight: 700, color: ORANGE, letterSpacing: 6, marginTop: 4 }}>
                  {bon.codeReception}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
