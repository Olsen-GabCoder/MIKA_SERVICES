/**
 * Transferts — demander un transfert d'engin vers un autre chantier.
 * L'origine est résolue automatiquement côté backend (affectation EN_COURS).
 */
import { useEffect, useState } from 'react'
import { terrainApi, type TerrainChantier, type TerrainEngin, type Transfert } from '@/api/terrainApi'
import { peekCachedGet } from '@/api/axios'
import { submitTerrainMutation } from '../offline/submitTerrainMutation'
import { AMBER, DISABLED, ORANGE, bigBtn, card, errMsg, inputStyle, label13 } from '../theme'
import { SheetSelect, SubHeader, TrajetBlock } from '../components/ui'

export function TransfertFormScreen({ engins, enginInitial, onBack, onDone, onQueued, onError }: {
  engins: TerrainEngin[]
  enginInitial: TerrainEngin | null
  onBack: () => void
  onDone: (t: Transfert) => void
  onQueued: () => void
  onError: (m: string) => void
}) {
  // SWR : cache local immédiat (select utilisable hors ligne), puis refresh réseau.
  // contexte=transfert : tous les chantiers actifs comme destinations (exception unique matrice §2.4)
  const [chantiers, setChantiers] = useState<TerrainChantier[]>(() => peekCachedGet<TerrainChantier[]>('/terrain/chantiers', { contexte: 'transfert' }) ?? [])
  const [enginId, setEnginId] = useState(enginInitial ? String(enginInitial.id) : '')
  const [destinationId, setDestinationId] = useState('')
  const [commentaire, setCommentaire] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    terrainApi.chantiers('transfert').then(setChantiers).catch((e) => { if (navigator.onLine) onError(errMsg(e)) })
  }, [onError])

  const engin = engins.find((e) => String(e.id) === enginId) ?? enginInitial
  const valide = enginId !== '' && destinationId !== ''

  const submit = async () => {
    if (!valide || saving) return
    setSaving(true)
    try {
      const res = await submitTerrainMutation<Transfert>('transfert', {
        enginId: Number(enginId),
        projetDestinationId: Number(destinationId),
        commentaire: commentaire.trim() || undefined,
      }, { enginId: Number(enginId), contexte: engin?.code })
      if (res.queued) onQueued()
      else onDone(res.result)
    } catch (e) {
      onError(errMsg(e))
      setSaving(false)
    }
  }

  return (
    <div>
      <SubHeader titre="Demander un transfert" onBack={onBack} />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={label13}>Engin *</label>
            <SheetSelect
              value={enginId}
              onChange={setEnginId}
              placeholder="Sélectionner un engin…"
              title="Engin"
              options={engins.map((e) => ({
                value: String(e.id),
                label: e.nom,
                sub: `${e.code}${e.chantierNom ? ` · ${e.chantierNom}` : ''}`,
              }))}
            />
          </div>

          {/* Trajet : origine auto → destination */}
          <TrajetBlock
            origine={engin?.chantierNom ?? 'Dépôt / parc'}
            destination={chantiers.find((c) => String(c.id) === destinationId)?.nom ?? '—'}
          />

          <div>
            <label style={label13}>Chantier de destination *</label>
            <SheetSelect
              value={destinationId}
              onChange={setDestinationId}
              placeholder="Sélectionner la destination…"
              title="Chantier de destination"
              options={chantiers
                .filter((c) => c.nom !== engin?.chantierNom)
                .map((c) => ({ value: String(c.id), label: c.nom }))}
            />
          </div>

          <div>
            <label style={label13}>Motif / commentaire</label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={3}
              placeholder="Motif du transfert, contraintes de transport…"
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            />
          </div>
        </div>

        <button onClick={() => void submit()} disabled={!valide || saving} className="tk-press" style={{ ...bigBtn(valide && !saving ? ORANGE : DISABLED), cursor: valide && !saving ? 'pointer' : 'default' }}>
          {saving ? 'Envoi en cours…' : 'Demander le transfert'}
        </button>
        {!valide && (
          <div style={{ fontSize: 13, color: AMBER, fontWeight: 600, textAlign: 'center', marginTop: -8 }}>
            Choisissez l'engin et le chantier de destination.
          </div>
        )}
      </div>
    </div>
  )
}
