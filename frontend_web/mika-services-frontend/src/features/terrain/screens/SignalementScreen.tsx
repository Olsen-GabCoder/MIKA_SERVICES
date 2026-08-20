import { useState } from 'react'
import type { TerrainEngin } from '@/api/terrainApi'
import type { GraviteIncident, IncidentEngin } from '@/types/materiel'
import { submitTerrainMutation } from '../offline/submitTerrainMutation'
import { BORDER, F, INK, MUTED, RED, bigBtn, card, errMsg, getGps, inputStyle, label13, today } from '../theme'
import { SubHeader } from '../components/ui'
import { IconAlert } from '../components/icons'
import { GRAVITES, TYPES_PANNE } from './shared'

export function SignalementScreen({ engin, onBack, onDone, onQueued, onError }: {
  engin: TerrainEngin
  onBack: () => void
  onDone: () => void
  onQueued: () => void
  onError: (m: string) => void
}) {
  const [type, setType] = useState<string | null>(null)
  const [gravite, setGravite] = useState<GraviteIncident | null>(null)
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    const t = TYPES_PANNE.find((x) => x.id === type)
    if (!t || !gravite) return
    setBusy(true)
    const gps = await getGps()
    try {
      const res = await submitTerrainMutation<IncidentEngin>('incident', {
        typeIncident: t.backend,
        gravite,
        dateIncident: today(),
        description: `[${t.label}] ${description}`.trim(),
        lieu: gps ? `GPS ${gps.latitude.toFixed(5)}, ${gps.longitude.toFixed(5)}` : engin.chantierNom ?? undefined,
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
      <SubHeader titre={`Signalement — ${engin.code}`} onBack={onBack} />
      <div style={{ padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Type de problème */}
        <div>
          <span style={label13}>Type de problème</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {TYPES_PANNE.map(({ id, Icon, label }) => (
              <button
                key={id}
                onClick={() => setType(id)}
                className="tk-press"
                style={{
                  ...card, appearance: 'none', minHeight: 58, padding: '10px 14px', cursor: 'pointer', fontFamily: F,
                  display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, fontWeight: 700, color: INK,
                  borderColor: type === id ? RED : BORDER,
                  borderWidth: 2, borderStyle: 'solid',
                  background: type === id ? '#FEF3F3' : '#fff',
                }}
              >
                <span style={{ color: type === id ? RED : MUTED, display: 'flex' }}><Icon size={21} /></span>{label}
              </button>
            ))}
          </div>
        </div>

        {/* Gravité */}
        <div>
          <span style={label13}>Gravité</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {GRAVITES.map((g) => (
              <button
                key={g.id}
                onClick={() => setGravite(g.id)}
                style={{
                  appearance: 'none', minHeight: 56, borderRadius: 12, cursor: 'pointer', fontFamily: F,
                  fontSize: 14.5, fontWeight: 700, padding: '8px 10px',
                  border: `2px solid ${gravite === g.id ? g.color : BORDER}`,
                  background: gravite === g.id ? g.color : '#fff',
                  color: gravite === g.id ? '#fff' : INK,
                }}
              >
                {g.label}
              </button>
            ))}
          </div>
          {(gravite === 'MAJEURE' || gravite === 'CRITIQUE') && (
            <div style={{ fontSize: 12.5, color: RED, fontWeight: 600, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconAlert size={15} strokeWidth={2.2} /> L'engin passera automatiquement en statut EN PANNE.
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <span style={label13}>Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez le problème constaté…"
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 96 }}
          />
          <div style={{ fontSize: 12.5, color: MUTED, marginTop: 4 }}>Votre position GPS sera jointe automatiquement au signalement.</div>
        </div>

        <button
          onClick={() => void submit()}
          disabled={busy || !type || !gravite}
          className="tk-press"
          style={{ ...bigBtn(RED), opacity: busy || !type || !gravite ? 0.5 : 1 }}
        >
          <IconAlert size={20} strokeWidth={2} /> {busy ? 'Envoi en cours…' : 'Envoyer le signalement'}
        </button>
      </div>
    </div>
  )
}
