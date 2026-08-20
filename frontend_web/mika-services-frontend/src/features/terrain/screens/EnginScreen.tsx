import { useEffect, useState } from 'react'
import { terrainApi, type CarnetEntry, type TerrainEngin } from '@/api/terrainApi'
import { peekCachedGet } from '@/api/axios'
import { BLUE, BORDER, FC, GREEN, INK, MUTED, RED, bigBtn, card } from '../theme'
import { StatutBadge, SubHeader } from '../components/ui'
import { IconAlert, IconClipboard, IconFuel, IconGauge, IconPin, IconTransfer } from '../components/icons'
import type { Screen } from './shared'
import { canTransfert, isOperateur, useTerrainMe } from '../me'

const CARNET_LIMIT = 15

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function EnginScreen({ engin, onBack, onAction, onConfirmPosition }: {
  engin: TerrainEngin
  onBack: () => void
  onAction: (s: Screen) => void
  onConfirmPosition: () => Promise<void>
}) {
  const [confirming, setConfirming] = useState(false)
  // Actions conditionnées par le rôle (miroir des @PreAuthorize backend)
  const me = useTerrainMe()
  const operateur = isOperateur(me)

  // Timeline carnet : SWR (cache immédiat, réseau en arrière-plan, silencieux offline)
  const [carnet, setCarnet] = useState<CarnetEntry[] | null>(
    () => peekCachedGet<{ entries: CarnetEntry[] }>(`/terrain/engins/${engin.id}/carnet`)?.entries ?? null,
  )
  const [showAll, setShowAll] = useState(false)
  useEffect(() => {
    let alive = true
    terrainApi.carnet(engin.id).then((c) => { if (alive) setCarnet(c.entries) }).catch(() => { /* offline */ })
    return () => { alive = false }
  }, [engin.id])

  const tiles: { label: string; value: string; sub?: string; danger?: boolean }[] = [
    {
      label: 'Chantier',
      value: engin.chantierNom ?? '—',
      sub: engin.chantierNom && engin.chantierDepuis ? `depuis le ${fmtDate(engin.chantierDepuis)}` : undefined,
    },
    { label: 'Compteur', value: `${engin.heuresCompteur} h` },
    { label: 'Inspection', value: engin.inspectionFaiteAujourdhui ? 'Faite' : 'À faire', danger: !engin.inspectionFaiteAujourdhui },
    { label: 'Dernier plein', value: engin.dernierPlein ? new Date(engin.dernierPlein).toLocaleDateString('fr-FR') : '—' },
  ]

  return (
    <div>
      <SubHeader titre={engin.code} onBack={onBack} />
      <div style={{ padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Bandeau identité + statut */}
        <div style={{ ...card, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
            <div>
              <div style={{ fontFamily: FC, fontSize: 22, fontWeight: 700 }}>{engin.nom}</div>
              <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>
                {[engin.marque, engin.modele].filter(Boolean).join(' ') || engin.type}
              </div>
            </div>
            <StatutBadge statut={engin.statut} />
          </div>
        </div>

        {/* 4 tuiles infos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {tiles.map((t) => (
            <div key={t.label} style={{ ...card, padding: '12px 14px' }}>
              <div style={{ fontSize: 12.5, color: MUTED, fontWeight: 600 }}>{t.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2, color: t.danger ? RED : INK }}>{t.value}</div>
              {t.sub && <div style={{ fontSize: 12, color: MUTED, marginTop: 1 }}>{t.sub}</div>}
            </div>
          ))}
        </div>

        {/* Actions */}
        <button
          onClick={async () => { setConfirming(true); await onConfirmPosition(); setConfirming(false) }}
          disabled={confirming}
          className="tk-press"
          style={{ ...bigBtn(BLUE), opacity: confirming ? 0.6 : 1 }}
        >
          <IconPin size={20} strokeWidth={2} /> {confirming ? 'Localisation en cours…' : 'Confirmer ma position'}
        </button>
        {operateur && (
          <>
            <button onClick={() => onAction('inspection')} className="tk-press" style={bigBtn(GREEN)}>
              <IconClipboard size={20} strokeWidth={2} /> Inspection quotidienne
            </button>
            <button onClick={() => onAction('releve')} className="tk-press" style={{ ...bigBtn('#fff'), color: INK, border: `1.5px solid ${BORDER}` }}>
              <IconGauge size={20} strokeWidth={2} /> Relevé compteur
            </button>
            <button onClick={() => onAction('ravitaillement')} className="tk-press" style={{ ...bigBtn('#fff'), color: INK, border: `1.5px solid ${BORDER}` }}>
              <IconFuel size={20} strokeWidth={2} /> Ravitaillement
            </button>
          </>
        )}
        {canTransfert(me) && (
          <button onClick={() => onAction('transfert-form')} className="tk-press" style={{ ...bigBtn('#fff'), color: INK, border: `1.5px solid ${BORDER}` }}>
            <IconTransfer size={20} strokeWidth={2} /> Demander un transfert
          </button>
        )}
        <button onClick={() => onAction('signalement')} className="tk-press" style={{ ...bigBtn('#FEF3F3'), color: RED, border: '1.5px solid #F0B7B7' }}>
          <IconAlert size={20} strokeWidth={2} /> Signaler un problème
        </button>

        {/* Historique (carnet de l'engin) */}
        {carnet && carnet.length > 0 && (
          <div style={{ ...card, padding: 16 }}>
            <div style={{ fontFamily: FC, fontSize: 17, fontWeight: 700, marginBottom: 12 }}>Historique</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {(showAll ? carnet : carnet.slice(0, CARNET_LIMIT)).map((e, i, arr) => (
                <div key={`${e.type}-${e.date}-${i}`} style={{ display: 'flex', gap: 12 }}>
                  {/* Rail : point coloré + trait vertical */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 12 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 999, background: e.couleur, marginTop: 5, flexShrink: 0 }} />
                    {i < arr.length - 1 && <span style={{ width: 2, flex: 1, background: BORDER, marginTop: 3, marginBottom: 3 }} />}
                  </div>
                  <div style={{ paddingBottom: i < arr.length - 1 ? 14 : 0, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>{fmtDate(e.date)}</div>
                    <div style={{ fontSize: 14.5, fontWeight: 700, marginTop: 1 }}>{e.titre}</div>
                    {e.detail && <div style={{ fontSize: 13, color: MUTED, marginTop: 2, overflowWrap: 'break-word' }}>{e.detail}</div>}
                  </div>
                </div>
              ))}
            </div>
            {carnet.length > CARNET_LIMIT && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="tk-press"
                style={{ appearance: 'none', width: '100%', marginTop: 12, padding: '10px 0', background: 'transparent', border: `1.5px solid ${BORDER}`, borderRadius: 12, color: INK, fontFamily: FC, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                {showAll ? 'Réduire' : `Voir tout (${carnet.length})`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
