import { useState } from 'react'
import { terrainApi, type TerrainEngin } from '@/api/terrainApi'
import type { ReleveCompteur } from '@/types/materiel'
import { submitTerrainMutation } from '../offline/submitTerrainMutation'
import { AMBER, BLUE, FC, MUTED, bigBtn, card, errMsg, inputStyle, label13, today } from '../theme'
import { PhotoCapture, SubHeader } from '../components/ui'
import { IconAlert, IconGauge } from '../components/icons'

export function ReleveScreen({ engin, onBack, onDone, onQueued, onError }: {
  engin: TerrainEngin
  onBack: () => void
  onDone: () => void
  onQueued: () => void
  onError: (m: string) => void
}) {
  const [valeur, setValeur] = useState('')
  const [commentaire, setCommentaire] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const valNum = Number(valeur)
  const valide = valeur.trim() !== '' && !Number.isNaN(valNum) && valNum >= 0

  const submit = async () => {
    setBusy(true)
    try {
      let photoUrl: string | undefined
      if (photos.length > 0 && navigator.onLine) {
        try { const urls = await terrainApi.uploadOperationPhotos(engin.id, photos); photoUrl = urls[0] } catch { /* optionnel */ }
      }
      const res = await submitTerrainMutation<ReleveCompteur>('releve', {
        dateReleve: today(),
        valeurHeures: valNum,
        commentaire: commentaire.trim() || undefined,
        photoUrl,
      }, { enginId: engin.id, contexte: engin.code, photos: photos.length > 0 ? photos : undefined })
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
      <SubHeader titre={`Relevé compteur — ${engin.code}`} onBack={onBack} />
      <div style={{ padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ ...card, padding: 16 }}>
          <div style={{ fontSize: 13, color: MUTED }}>Dernier compteur connu</div>
          <div style={{ fontFamily: FC, fontSize: 30, fontWeight: 700 }}>{engin.heuresCompteur} h</div>
        </div>
        <div>
          <span style={label13}>Nouvelle valeur (heures)</span>
          <input
            type="number" inputMode="numeric" value={valeur} onChange={(e) => setValeur(e.target.value)}
            placeholder={`≥ ${engin.heuresCompteur}`} autoFocus
            style={{ ...inputStyle, fontSize: 22, fontWeight: 700, minHeight: 60 }}
          />
          {valide && valNum < engin.heuresCompteur && (
            <div style={{ fontSize: 12.5, color: AMBER, fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
              <IconAlert size={14} strokeWidth={2.2} /> Valeur inférieure au compteur actuel.
            </div>
          )}
        </div>
        <div>
          <span style={label13}>Commentaire (optionnel)</span>
          <input value={commentaire} onChange={(e) => setCommentaire(e.target.value)} style={inputStyle} />
        </div>
        <PhotoCapture
          max={1}
          photos={photos}
          onAdd={(files) => setPhotos(files.slice(0, 1))}
          onRemove={() => setPhotos([])}
          label="Photo du compteur (optionnel)"
        />
        <button onClick={() => void submit()} disabled={busy || !valide} className="tk-press" style={{ ...bigBtn(BLUE), opacity: busy || !valide ? 0.5 : 1 }}>
          <IconGauge size={20} strokeWidth={2} /> {busy ? 'Enregistrement…' : 'Enregistrer le relevé'}
        </button>
      </div>
    </div>
  )
}
