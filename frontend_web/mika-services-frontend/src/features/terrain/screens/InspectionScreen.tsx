import { useState } from 'react'
import type { TerrainEngin } from '@/api/terrainApi'
import type { ChecklistItem, EtatGeneralInspection, InspectionEngin } from '@/types/materiel'
import { submitTerrainMutation } from '../offline/submitTerrainMutation'
import { AMBER, F, FC, GREEN, INK, INK_SOFT, bigBtn, card, errMsg, inputStyle, label13, today, BORDER, RED } from '../theme'
import { SignatureCanvas, SubHeader } from '../components/ui'
import { IconCheck } from '../components/icons'
import { CHECKLIST_SECTIONS, TOTAL_ITEMS } from './shared'

export function InspectionScreen({ engin, onBack, onDone, onQueued, onError }: {
  engin: TerrainEngin
  onBack: () => void
  onDone: (anomalies: boolean) => void
  onQueued: () => void
  onError: (m: string) => void
}) {
  // état par code : undefined = non répondu, true = OK, false = NOK
  const [reponses, setReponses] = useState<Record<string, boolean | undefined>>({})
  const [commentaires, setCommentaires] = useState<Record<string, string>>({})
  const [compteur, setCompteur] = useState(String(engin.heuresCompteur))
  const [commentaire, setCommentaire] = useState('')
  const [signature, setSignature] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const answered = Object.values(reponses).filter((v) => v !== undefined).length
  const nokCount = Object.values(reponses).filter((v) => v === false).length
  const complete = answered === TOTAL_ITEMS

  const etatGeneral: EtatGeneralInspection = nokCount === 0 ? 'BON' : nokCount <= 2 ? 'CORRECT' : 'MAUVAIS'

  const submit = async () => {
    if (!complete) return
    setBusy(true)
    const checklist: ChecklistItem[] = CHECKLIST_SECTIONS.flatMap((s) =>
      s.items.map((it) => ({
        code: it.code,
        label: it.label,
        ok: reponses[it.code] === true,
        commentaire: reponses[it.code] === false ? commentaires[it.code]?.trim() || undefined : undefined,
      })),
    )
    try {
      const res = await submitTerrainMutation<InspectionEngin>('inspection', {
        dateInspection: today(),
        compteurHeures: compteur.trim() ? Number(compteur) : undefined,
        checklist,
        etatGeneral,
        commentaire: commentaire.trim() || undefined,
        signature: signature ?? undefined,
      }, { enginId: engin.id, contexte: engin.code })
      if (res.queued) onQueued()
      else onDone(nokCount > 0)
    } catch (e) {
      onError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <SubHeader titre={`Inspection — ${engin.code}`} onBack={onBack} />

      {/* Barre progression sticky */}
      <div style={{ position: 'sticky', top: 68, zIndex: 9, background: '#F4F6F8', padding: '10px 16px 8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
          <span>Progression</span>
          <span style={{ color: complete ? '#137A3D' : INK }}>{answered}/{TOTAL_ITEMS}</span>
        </div>
        <div style={{ height: 8, borderRadius: 999, background: '#E3E9EF', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(answered / TOTAL_ITEMS) * 100}%`, background: nokCount > 0 ? AMBER : GREEN, transition: 'width .2s' }} />
        </div>
      </div>

      <div style={{ padding: '10px 16px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {CHECKLIST_SECTIONS.map((section) => (
          <div key={section.titre} style={{ ...card, padding: 14 }}>
            <div style={{ fontFamily: FC, fontSize: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: INK_SOFT, marginBottom: 10 }}>
              {section.titre}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {section.items.map((it) => {
                const val = reponses[it.code]
                return (
                  <div key={it.code}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <span style={{ fontSize: 14.5, fontWeight: 600, flex: 1 }}>{it.label}</span>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button
                          onClick={() => setReponses((r) => ({ ...r, [it.code]: true }))}
                          style={{
                            appearance: 'none', width: 62, height: 44, borderRadius: 10, cursor: 'pointer', fontFamily: F, fontWeight: 700, fontSize: 14,
                            border: `2px solid ${val === true ? GREEN : BORDER}`,
                            background: val === true ? GREEN : '#fff', color: val === true ? '#fff' : INK,
                          }}
                        >
                          OK
                        </button>
                        <button
                          onClick={() => setReponses((r) => ({ ...r, [it.code]: false }))}
                          style={{
                            appearance: 'none', width: 62, height: 44, borderRadius: 10, cursor: 'pointer', fontFamily: F, fontWeight: 700, fontSize: 14,
                            border: `2px solid ${val === false ? RED : BORDER}`,
                            background: val === false ? RED : '#fff', color: val === false ? '#fff' : INK,
                          }}
                        >
                          NOK
                        </button>
                      </div>
                    </div>
                    {val === false && (
                      <input
                        value={commentaires[it.code] ?? ''}
                        onChange={(e) => setCommentaires((c) => ({ ...c, [it.code]: e.target.value }))}
                        placeholder="Préciser l'anomalie…"
                        style={{ ...inputStyle, minHeight: 44, marginTop: 8, borderColor: '#F0B7B7', background: '#FEF9F9' }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Compteur + commentaire */}
        <div style={{ ...card, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <span style={label13}>Compteur horaire (h)</span>
            <input type="number" inputMode="numeric" value={compteur} onChange={(e) => setCompteur(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <span style={label13}>Commentaire général (optionnel)</span>
            <textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
        </div>

        {/* Signature */}
        <div style={{ ...card, padding: 14 }}>
          <span style={label13}>Signature du conducteur</span>
          <SignatureCanvas onChange={setSignature} />
        </div>

        {nokCount > 0 && (
          <div style={{ background: '#FDF3E2', border: '1px solid #F0DCB0', borderRadius: 12, padding: '12px 14px', fontSize: 13, color: '#8A5A0B', lineHeight: 1.4 }}>
            {nokCount} point{nokCount > 1 ? 's' : ''} NOK — un incident sera créé automatiquement pour les anomalies détectées.
          </div>
        )}

        <button
          onClick={() => void submit()}
          disabled={busy || !complete}
          className="tk-press"
          style={{ ...bigBtn(GREEN), opacity: busy || !complete ? 0.5 : 1 }}
        >
          {complete && !busy && <IconCheck size={20} strokeWidth={2.2} />}
          {busy ? 'Enregistrement…' : complete ? "Valider l'inspection" : `Répondre aux ${TOTAL_ITEMS - answered} points restants`}
        </button>
      </div>
    </div>
  )
}
