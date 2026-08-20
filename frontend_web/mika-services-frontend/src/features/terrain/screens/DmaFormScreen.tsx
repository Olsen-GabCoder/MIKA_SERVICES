/**
 * DMA — création d'une demande de matériel depuis le terrain.
 */
import { useEffect, useState } from 'react'
import { terrainApi, type Dma, type PrioriteDma, type TerrainChantier } from '@/api/terrainApi'
import { peekCachedGet } from '@/api/axios'
import { submitTerrainMutation } from '../offline/submitTerrainMutation'
import { AMBER, DISABLED, DMA_PRIORITE_COLORS, F, INK, INK_SOFT, ORANGE, RED, bigBtn, card, errMsg, inputStyle, label13, today } from '../theme'
import { SheetSelect, SubHeader } from '../components/ui'
import { IconPlus, IconX } from '../components/icons'

type Ligne = {
  designation: string
  quantite: string
  unite: string
  /** Saisie libre quand unite === AUTRE. */
  uniteAutre: string
  prixUnitaireEst: string
  fournisseurSuggere: string
  /** Section « + détails » (prix / fournisseur) dépliée. */
  details: boolean
}
const UNITES = ['u', 'kg', 't', 'm', 'm2', 'm3', 'L', 'sac', 'palette', 'rouleau', 'boîte']
const AUTRE = '__autre'

const ligneVide = (): Ligne =>
  ({ designation: '', quantite: '', unite: 'u', uniteAutre: '', prixUnitaireEst: '', fournisseurSuggere: '', details: false })

/** Unité effective d'une ligne (préréglée ou saisie libre). */
const uniteDe = (l: Ligne) => (l.unite === AUTRE ? l.uniteAutre.trim() : l.unite)
// Aligné backend PrioriteDemandeMateriel (BASSE/HAUTE n'existent pas côté serveur → 400)
const PRIORITES: PrioriteDma[] = ['NORMALE', 'URGENTE']
const PRIORITE_LABELS: Partial<Record<PrioriteDma, string>> = { NORMALE: 'Normale', URGENTE: 'Urgente' }

export function DmaFormScreen({ modele, onBack, onDone, onQueued, onError }: {
  /** Duplication : DMA source pour pré-remplir le formulaire (nouvelle référence, nouveau workflow). */
  modele?: Dma | null
  onBack: () => void
  onDone: (d: Dma) => void
  onQueued: () => void
  onError: (m: string) => void
}) {
  // SWR : cache local immédiat (select utilisable hors ligne), puis refresh réseau
  const [chantiers, setChantiers] = useState<TerrainChantier[]>(() => peekCachedGet<TerrainChantier[]>('/terrain/chantiers') ?? [])
  const [projetId, setProjetId] = useState(() => (modele ? String(modele.projetId) : ''))
  const [priorite, setPriorite] = useState<PrioriteDma>(modele?.priorite ?? 'NORMALE')
  const [dateSouhaitee, setDateSouhaitee] = useState('') // jamais reprise : une date passée serait refusée
  const [commentaire, setCommentaire] = useState(modele?.commentaire ?? '')
  const [lignes, setLignes] = useState<Ligne[]>(() =>
    modele && modele.lignes.length > 0
      ? modele.lignes.map((l) => ({
          designation: l.designation,
          quantite: String(l.quantite),
          unite: UNITES.includes(l.unite) ? l.unite : AUTRE,
          uniteAutre: UNITES.includes(l.unite) ? '' : l.unite,
          prixUnitaireEst: l.prixUnitaireEst != null ? String(l.prixUnitaireEst) : '',
          fournisseurSuggere: l.fournisseurSuggere ?? '',
          details: l.prixUnitaireEst != null || !!l.fournisseurSuggere,
        }))
      : [ligneVide()])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    terrainApi.chantiers()
      .then((cs) => { setChantiers(cs); if (cs.length === 1) setProjetId(String(cs[0].id)) })
      .catch((e) => { if (navigator.onLine) onError(errMsg(e)) })
  }, [onError])

  const setLigne = (i: number, patch: Partial<Ligne>) =>
    setLignes((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)))

  const lignesValides = lignes.filter((l) => l.designation.trim() && Number(l.quantite) > 0 && uniteDe(l) !== '')
  const valide = projetId !== '' && lignesValides.length > 0

  const submit = async () => {
    if (!valide || saving) return
    setSaving(true)
    try {
      const res = await submitTerrainMutation<Dma>('dma', {
        projetId: Number(projetId),
        priorite,
        dateSouhaitee: dateSouhaitee || undefined,
        commentaire: commentaire.trim() || undefined,
        lignes: lignesValides.map((l) => ({
          designation: l.designation.trim(),
          quantite: Number(l.quantite),
          unite: uniteDe(l),
          prixUnitaireEst: Number(l.prixUnitaireEst) > 0 ? Number(l.prixUnitaireEst) : undefined,
          fournisseurSuggere: l.fournisseurSuggere.trim() || undefined,
        })),
      })
      if (res.queued) onQueued()
      else onDone(res.result)
    } catch (e) {
      onError(errMsg(e))
      setSaving(false)
    }
  }

  return (
    <div>
      <SubHeader titre={modele ? 'Nouvelle demande (copie)' : 'Nouvelle demande'} onBack={onBack} />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={label13}>Chantier *</label>
            <SheetSelect
              value={projetId}
              onChange={setProjetId}
              placeholder="Sélectionner un chantier…"
              title="Chantier"
              options={chantiers.map((c) => ({ value: String(c.id), label: c.nom }))}
            />
          </div>

          <div>
            <label style={label13}>Priorité</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {PRIORITES.map((p) => {
                const actif = priorite === p
                const color = DMA_PRIORITE_COLORS[p]
                return (
                  <button
                    key={p}
                    onClick={() => setPriorite(p)}
                    style={{
                      appearance: 'none', cursor: 'pointer', fontFamily: F, fontSize: 13, fontWeight: 700,
                      flex: 1, padding: '10px 4px', borderRadius: 10,
                      border: `1.5px solid ${actif ? color : '#DDE3E9'}`,
                      background: actif ? color : '#fff', color: actif ? '#fff' : INK_SOFT,
                    }}
                  >
                    {PRIORITE_LABELS[p]}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label style={label13}>Date souhaitée</label>
            <input type="date" min={today()} value={dateSouhaitee} onChange={(e) => setDateSouhaitee(e.target.value)} style={inputStyle} />
          </div>
        </div>

        {/* Lignes */}
        <div style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: INK }}>Matériel demandé *</div>
          {lignes.map((l, i) => (
            <div key={i} style={{ border: '1px solid #E5EAEF', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  value={l.designation}
                  onChange={(e) => setLigne(i, { designation: e.target.value })}
                  placeholder={`Désignation (ex. ciment CPJ 45)`}
                  style={{ ...inputStyle, minHeight: 46, flex: 1 }}
                />
                {lignes.length > 1 && (
                  <button
                    onClick={() => setLignes((ls) => ls.filter((_, j) => j !== i))}
                    aria-label="Supprimer la ligne"
                    style={{ appearance: 'none', border: 'none', background: '#FDEAEA', color: RED, width: 40, height: 40, borderRadius: 10, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <IconX size={16} strokeWidth={2.2} />
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={l.quantite}
                  onChange={(e) => setLigne(i, { quantite: e.target.value })}
                  placeholder="Quantité"
                  style={{ ...inputStyle, minHeight: 46, flex: 1 }}
                />
                <SheetSelect
                  value={l.unite}
                  onChange={(u) => setLigne(i, { unite: u })}
                  placeholder="Unité"
                  title="Unité"
                  options={[...UNITES.map((u) => ({ value: u, label: u })), { value: AUTRE, label: 'Autre…' }]}
                  style={{ minHeight: 46, width: 110 }}
                />
              </div>
              {l.unite === AUTRE && (
                <input
                  value={l.uniteAutre}
                  onChange={(e) => setLigne(i, { uniteAutre: e.target.value })}
                  placeholder="Unité (ex. bidon, fût…)"
                  maxLength={20}
                  style={{ ...inputStyle, minHeight: 46 }}
                />
              )}
              {l.details ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={l.prixUnitaireEst}
                    onChange={(e) => setLigne(i, { prixUnitaireEst: e.target.value })}
                    placeholder="P.U. estimé (FCFA)"
                    style={{ ...inputStyle, minHeight: 46, flex: 1 }}
                  />
                  <input
                    value={l.fournisseurSuggere}
                    onChange={(e) => setLigne(i, { fournisseurSuggere: e.target.value })}
                    placeholder="Fournisseur suggéré"
                    maxLength={100}
                    style={{ ...inputStyle, minHeight: 46, flex: 1.2 }}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setLigne(i, { details: true })}
                  style={{ appearance: 'none', cursor: 'pointer', fontFamily: F, fontSize: 13, fontWeight: 700, color: ORANGE, background: 'transparent', border: 'none', padding: 0, alignSelf: 'flex-start' }}
                >
                  + détails (prix, fournisseur)
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setLignes((ls) => [...ls, ligneVide()])}
            style={{ appearance: 'none', cursor: 'pointer', fontFamily: F, fontSize: 14, fontWeight: 700, color: ORANGE, background: 'transparent', border: `1.5px dashed ${ORANGE}`, borderRadius: 12, padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <IconPlus size={17} strokeWidth={2.2} /> Ajouter une ligne
          </button>
        </div>

        <div style={{ ...card, padding: 16 }}>
          <label style={label13}>Commentaire</label>
          <textarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            rows={3}
            placeholder="Précisions utiles (accès chantier, contact, urgence…)"
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
          />
        </div>

        <button onClick={() => void submit()} disabled={!valide || saving} className="tk-press" style={{ ...bigBtn(valide && !saving ? ORANGE : DISABLED), cursor: valide && !saving ? 'pointer' : 'default' }}>
          {saving ? 'Envoi en cours…' : 'Soumettre la demande'}
        </button>
        {!valide && (
          <div style={{ fontSize: 13, color: AMBER, fontWeight: 600, textAlign: 'center', marginTop: -8 }}>
            Choisissez un chantier et renseignez au moins une ligne (désignation + quantité).
          </div>
        )}
      </div>
    </div>
  )
}
