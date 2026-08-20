import { useState } from 'react'
import type { TerrainEngin } from '@/api/terrainApi'
import type { ConsommationCarburant } from '@/types/materiel'
import { submitTerrainMutation } from '../offline/submitTerrainMutation'
import { AMBER, MUTED, bigBtn, card, errMsg, inputStyle, label13, today } from '../theme'
import { SubHeader } from '../components/ui'
import { IconFuel } from '../components/icons'

export function RavitaillementScreen({ engin, onBack, onDone, onQueued, onError }: {
  engin: TerrainEngin
  onBack: () => void
  onDone: () => void
  onQueued: () => void
  onError: (m: string) => void
}) {
  const [litres, setLitres] = useState('')
  const [compteur, setCompteur] = useState(String(engin.heuresCompteur))
  const [commentaire, setCommentaire] = useState('')
  const [busy, setBusy] = useState(false)
  const litresNum = Number(litres)
  const valide = litres.trim() !== '' && !Number.isNaN(litresNum) && litresNum > 0

  const submit = async () => {
    setBusy(true)
    try {
      const res = await submitTerrainMutation<ConsommationCarburant>('ravitaillement', {
        datePlein: today(),
        quantiteLitres: litresNum,
        heuresCompteurAuPlein: compteur.trim() ? Number(compteur) : undefined,
        commentaire: commentaire.trim() || undefined,
      }, { enginId: engin.id, contexte: engin.code })
      if (res.queued) onQueued()
      else onDone()
    } catch (e) {
      onError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <SubHeader titre={`Ravitaillement — ${engin.code}`} onBack={onBack} />
      <div style={{ padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {engin.dernierPlein && (
          <div style={{ ...card, padding: 16 }}>
            <div style={{ fontSize: 13, color: MUTED }}>Dernier plein</div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{new Date(engin.dernierPlein).toLocaleDateString('fr-FR')}</div>
          </div>
        )}
        <div>
          <span style={label13}>Quantité (litres)</span>
          <input
            type="number" inputMode="decimal" value={litres} onChange={(e) => setLitres(e.target.value)}
            placeholder="0" autoFocus
            style={{ ...inputStyle, fontSize: 22, fontWeight: 700, minHeight: 60 }}
          />
        </div>
        <div>
          <span style={label13}>Compteur au plein (h)</span>
          <input type="number" inputMode="numeric" value={compteur} onChange={(e) => setCompteur(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <span style={label13}>Commentaire (optionnel)</span>
          <input value={commentaire} onChange={(e) => setCommentaire(e.target.value)} style={inputStyle} />
        </div>
        <button onClick={() => void submit()} disabled={busy || !valide} className="tk-press" style={{ ...bigBtn(AMBER), opacity: busy || !valide ? 0.5 : 1 }}>
          <IconFuel size={20} strokeWidth={2} /> {busy ? 'Enregistrement…' : 'Enregistrer le plein'}
        </button>
      </div>
    </div>
  )
}
