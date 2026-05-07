/**
 * Document PDF DQE Premium — MIKA Services
 * Page de garde portrait + tableau DQE en paysage A4.
 * Design aligné sur la charte graphique et le template PDF existant.
 */
import { Document, Page, View, Text, Image } from '@react-pdf/renderer'
import { StyleSheet } from '@react-pdf/renderer'
import type { DqeExportPayload } from './dqeExport'

const LOGO = '/Logo_mika_services.png'

// ── Palette (identique au template PDF projet existant) ──────────────
const C = {
  primary: '#2E5266',
  primaryLt: '#4A7491',
  primaryBg: '#EDF2F7',
  accent: '#FF6B35',
  success: '#059669',
  text: '#1A1A2E',
  textSec: '#4A5568',
  muted: '#94A3B8',
  border: '#E2E8F0',
  borderLt: '#F1F5F9',
  bg: '#F8FAFC',
  bgAlt: '#F1F5F9',
  white: '#FFFFFF',
}

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'] as const
const MOIS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'] as const
function dateFr() { const d = new Date(); return `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS_FR[d.getMonth()]} ${d.getFullYear()}` }
function heureFr() { return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }

/** Formater un nombre avec séparateur de milliers (espace) */
function fmtNum(n: number | undefined | null, decimals = 0): string {
  if (n == null || isNaN(n)) return ''
  const fixed = n.toFixed(decimals)
  const [int, dec] = fixed.split('.')
  const formatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return dec && parseInt(dec) !== 0 ? `${formatted},${dec}` : formatted
}

function fmtPct(n: number): string {
  if (n === 0) return '0'
  return n % 1 === 0 ? String(n) : String(Math.round(n * 100) / 100)
}

// ── Dimensions ───────────────────────────────────────────────────────
const PH = 36
const HEADER_H = 34
const FOOTER_H = 24

// Largeurs colonnes DQE (paysage A4 = 842pt, -2×36 = 770pt utilisable)
const W = { num: 56, unite: 44, qte: 68, pu: 86, montant: 96, avanc: 62 }
// Désignation = flex (reste ~358pt)

// ── Styles ───────────────────────────────────────────────────────────
const s = StyleSheet.create({
  /* ═══ PAGE DE GARDE (portrait) ═══ */
  coverPage: { fontFamily: 'Helvetica', backgroundColor: C.white },
  coverBar: { height: 6, backgroundColor: C.accent },
  coverBody: { flex: 1, paddingHorizontal: 60, paddingTop: 40, alignItems: 'center', justifyContent: 'center' },
  coverLogo: { width: 78, height: 78, marginBottom: 12, objectFit: 'contain' },
  coverBrand: { fontSize: 24, fontWeight: 'bold', color: C.accent, letterSpacing: 3, marginBottom: 2 },
  coverSub: { fontSize: 9.5, color: C.primary, letterSpacing: 1, marginBottom: 26 },
  coverSep: { width: 72, height: 2, backgroundColor: C.accent, marginBottom: 26 },
  coverDocType: { fontSize: 11, fontWeight: 'bold', color: C.primary, letterSpacing: 2, marginBottom: 16 },
  coverTitle: { fontSize: 17, fontWeight: 'bold', color: C.primary, textAlign: 'center', marginBottom: 6, maxWidth: 420 },
  coverRef: { fontSize: 9.5, color: C.textSec, marginBottom: 22 },
  coverMetaWrap: { width: '80%', marginBottom: 22, borderWidth: 0.5, borderColor: C.border, borderRadius: 3, overflow: 'hidden' },
  coverMetaRow: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 12, borderBottomWidth: 0.5, borderBottomColor: C.borderLt },
  coverMetaRowAlt: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 12, borderBottomWidth: 0.5, borderBottomColor: C.borderLt, backgroundColor: C.bgAlt },
  coverMetaLabel: { width: '40%', fontSize: 8, color: C.muted },
  coverMetaVal: { flex: 1, fontSize: 8, fontWeight: 'bold', color: C.text },
  coverDate: { fontSize: 8.5, color: C.textSec, marginBottom: 22 },
  coverConfBox: { borderWidth: 1, borderColor: C.border, borderRadius: 3, paddingVertical: 7, paddingHorizontal: 20 },
  coverConfText: { fontSize: 7, color: C.muted, textAlign: 'center', letterSpacing: 1 },
  coverBottom: { height: 4, backgroundColor: C.primary },

  /* ═══ PAGES DE CONTENU (paysage) ═══ */
  page: { paddingTop: HEADER_H + 10, paddingBottom: FOOTER_H + 8, paddingHorizontal: PH, fontFamily: 'Helvetica', fontSize: 8, color: C.text },

  /* En-tête fixe */
  hdr: { position: 'absolute', top: 0, left: 0, right: 0, height: HEADER_H },
  hdrBar: { height: 3, backgroundColor: C.accent },
  hdrRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: PH, paddingTop: 5, paddingBottom: 4, borderBottomWidth: 0.5, borderBottomColor: C.border },
  hdrLogo: { width: 13, height: 13, marginRight: 5, objectFit: 'contain' },
  hdrBrand: { fontSize: 7, fontWeight: 'bold', color: C.primary, flex: 1 },
  hdrRef: { fontSize: 6, color: C.muted },
  hdrPage: { fontSize: 6, color: C.muted, marginLeft: 8, textAlign: 'right', width: 36 },

  /* Pied de page fixe */
  ftr: { position: 'absolute', bottom: 0, left: 0, right: 0, height: FOOTER_H },
  ftrLine: { height: 0.5, backgroundColor: C.border, marginHorizontal: PH },
  ftrRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: PH, paddingTop: 4 },
  ftrText: { fontSize: 6, color: C.muted },
  ftrBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: C.primary },

  /* ═══ TABLEAU DQE ═══ */

  /* En-tête colonnes */
  tHead: { flexDirection: 'row', backgroundColor: C.primary, paddingVertical: 6, paddingHorizontal: 3, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  th: { fontSize: 7, fontWeight: 'bold', color: C.white },
  thR: { fontSize: 7, fontWeight: 'bold', color: C.white, textAlign: 'right' },
  thC: { fontSize: 7, fontWeight: 'bold', color: C.white, textAlign: 'center' },

  /* Ligne chapitre */
  chapRow: { flexDirection: 'row', backgroundColor: C.primaryBg, paddingVertical: 5, paddingHorizontal: 4, borderBottomWidth: 0.5, borderBottomColor: C.primary, borderLeftWidth: 3, borderLeftColor: C.accent },
  chapTxt: { fontSize: 8, fontWeight: 'bold', color: C.primary, letterSpacing: 0.3 },

  /* Ligne données */
  row: { flexDirection: 'row', paddingVertical: 3.5, paddingHorizontal: 3, borderBottomWidth: 0.5, borderBottomColor: C.borderLt },
  rowAlt: { flexDirection: 'row', paddingVertical: 3.5, paddingHorizontal: 3, borderBottomWidth: 0.5, borderBottomColor: C.borderLt, backgroundColor: C.bg },
  td: { fontSize: 7.5, color: C.text },
  tdR: { fontSize: 7.5, color: C.text, textAlign: 'right' },
  tdC: { fontSize: 7.5, color: C.text, textAlign: 'center' },
  tdBold: { fontSize: 7.5, fontWeight: 'bold', color: C.text, textAlign: 'right' },
  tdNum: { fontSize: 7.5, fontWeight: 'bold', color: C.primaryLt },

  /* Sous-total */
  stRow: { flexDirection: 'row', backgroundColor: '#E8EEF3', paddingVertical: 5, paddingHorizontal: 3, borderTopWidth: 1, borderTopColor: C.border, borderBottomWidth: 1, borderBottomColor: C.border },
  stTxt: { fontSize: 7.5, fontWeight: 'bold', color: C.primary },
  stVal: { fontSize: 8, fontWeight: 'bold', color: C.text, textAlign: 'right' },

  /* Total général */
  totalRow: { flexDirection: 'row', backgroundColor: C.primary, paddingVertical: 7, paddingHorizontal: 3, borderTopWidth: 3, borderTopColor: C.accent },
  totalTxt: { fontSize: 9, fontWeight: 'bold', color: C.white, letterSpacing: 0.5 },
  totalVal: { fontSize: 9.5, fontWeight: 'bold', color: C.white, textAlign: 'right' },

  /* Montant exécuté */
  execRow: { flexDirection: 'row', backgroundColor: C.primaryLt, paddingVertical: 5, paddingHorizontal: 3 },
  execTxt: { fontSize: 8, fontWeight: 'bold', color: C.white },
  execVal: { fontSize: 8, fontWeight: 'bold', color: '#6EE7B7', textAlign: 'right' },

  /* Reste */
  restRow: { flexDirection: 'row', backgroundColor: '#3D6A82', paddingVertical: 4, paddingHorizontal: 3, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  restTxt: { fontSize: 7, color: 'rgba(255,255,255,0.65)' },
  restVal: { fontSize: 7, color: 'rgba(255,255,255,0.65)', textAlign: 'right' },
})

// ── Composant PDF ────────────────────────────────────────────────────

export function DqeDocumentPdf({ payload }: { payload: DqeExportPayload }) {
  const { projet, chapitres, formatMontant } = payload

  const totalMontant = chapitres.reduce((acc, c) => acc + c.montantTotal, 0)
  const totalExecute = chapitres.reduce((acc, c) => acc + c.montantExecute, 0)
  const totalLignes = chapitres.reduce((acc, c) => acc + c.lignes.length, 0)
  const avGlobal = totalMontant > 0 ? Math.round((totalExecute / totalMontant) * 10000) / 100 : 0

  const dateExp = dateFr()
  const heureExp = heureFr()
  const ref = projet.numeroMarche ?? projet.codeProjet ?? String(projet.id)

  const coverMeta: [string, string][] = [
    ['Projet', projet.nom],
    ['Code projet', projet.codeProjet ?? '—'],
    ['Numéro de marché', projet.numeroMarche ?? '—'],
    ['Responsable', projet.responsableProjet ? `${projet.responsableProjet.prenom} ${projet.responsableProjet.nom}` : '—'],
    ['Montant total HT', formatMontant(totalMontant)],
    ['Montant exécuté', formatMontant(totalExecute)],
    ['Avancement global', `${fmtPct(avGlobal)} %`],
    ['Structure', `${chapitres.length} chapitres — ${totalLignes} lignes`],
  ]

  return (
    <Document>
      {/* ══════════════════════════════════════════════════════════════════
          PAGE DE GARDE — Portrait A4
      ══════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.coverPage}>
        <View style={s.coverBar} />
        <View style={s.coverBody}>
          <Image style={s.coverLogo} src={LOGO} />
          <Text style={s.coverBrand}>MIKA SERVICES</Text>
          <Text style={s.coverSub}>Bureau d&apos;Études Techniques</Text>
          <View style={s.coverSep} />
          <Text style={s.coverDocType}>DEVIS QUANTITATIF ET ESTIMATIF</Text>
          <Text style={s.coverTitle}>{projet.nom}</Text>
          {projet.numeroMarche && <Text style={s.coverRef}>Marché n° {projet.numeroMarche}</Text>}
          <Text style={[s.coverRef, projet.numeroMarche ? {} : { marginTop: 0 }]}>Réf. {ref}</Text>

          <View style={s.coverMetaWrap}>
            {coverMeta.map(([label, value], i) => (
              <View key={i} style={i % 2 === 1 ? s.coverMetaRowAlt : s.coverMetaRow}>
                <Text style={s.coverMetaLabel}>{label}</Text>
                <Text style={s.coverMetaVal}>{value}</Text>
              </View>
            ))}
          </View>

          <Text style={s.coverDate}>Exporté le {dateExp} à {heureExp}</Text>

          <View style={s.coverConfBox}>
            <Text style={s.coverConfText}>DOCUMENT CONFIDENTIEL</Text>
            <Text style={[s.coverConfText, { marginTop: 2 }]}>Usage interne et transmission officielle uniquement</Text>
          </View>
        </View>
        <View style={s.coverBottom} />
      </Page>

      {/* ══════════════════════════════════════════════════════════════════
          TABLEAU DQE — Paysage A4
      ══════════════════════════════════════════════════════════════════ */}
      <Page size="A4" orientation="landscape" style={s.page} wrap>
        {/* En-tête fixe */}
        <View style={s.hdr} fixed>
          <View style={s.hdrBar} />
          <View style={s.hdrRow}>
            <Image style={s.hdrLogo} src={LOGO} />
            <Text style={s.hdrBrand}>MIKA SERVICES — Devis Quantitatif et Estimatif</Text>
            <Text style={s.hdrRef}>{projet.nom} — Réf. {ref}</Text>
            <Text style={s.hdrPage} render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `${pageNumber} / ${totalPages}`} />
          </View>
        </View>

        {/* Pied de page fixe */}
        <View style={s.ftr} fixed>
          <View style={s.ftrLine} />
          <View style={s.ftrRow}>
            <Text style={s.ftrText}>Document confidentiel – MIKA Services – {projet.nom}</Text>
            <Text style={s.ftrText}>{dateExp}</Text>
          </View>
          <View style={s.ftrBar} />
        </View>

        {/* En-tête colonnes (répété sur chaque page) */}
        <View style={s.tHead} fixed>
          <Text style={[s.th, { width: W.num }]}>N° Prix</Text>
          <Text style={[s.th, { flex: 1 }]}>Désignation</Text>
          <Text style={[s.thC, { width: W.unite }]}>Unité</Text>
          <Text style={[s.thR, { width: W.qte }]}>Quantité</Text>
          <Text style={[s.thR, { width: W.pu }]}>Prix Unit.</Text>
          <Text style={[s.thR, { width: W.montant }]}>Montant HT</Text>
          <Text style={[s.thC, { width: W.avanc }]}>Avanc. %</Text>
        </View>

        {/* Corps du tableau */}
        {chapitres.map((chap) => (
          <View key={chap.id}>
            {/* ── Bandeau chapitre ── */}
            <View style={s.chapRow} wrap={false}>
              <Text style={[s.chapTxt, { flex: 1 }]}>
                CHAPITRE {chap.numero} — {chap.designation.toUpperCase()}
              </Text>
            </View>

            {/* ── Lignes / postes ── */}
            {chap.lignes.map((ligne, idx) => (
              <View key={ligne.id} style={idx % 2 === 0 ? s.row : s.rowAlt} wrap={false}>
                <Text style={[s.tdNum, { width: W.num }]}>{ligne.numeroPoste ?? ''}</Text>
                <Text style={[s.td, { flex: 1 }]}>{ligne.designation}</Text>
                <Text style={[s.tdC, { width: W.unite }]}>{ligne.unite ?? ''}</Text>
                <Text style={[s.tdR, { width: W.qte }]}>{ligne.quantite != null ? fmtNum(ligne.quantite, 2) : ''}</Text>
                <Text style={[s.tdR, { width: W.pu }]}>{ligne.prixUnitaire != null ? fmtNum(ligne.prixUnitaire) : ''}</Text>
                <Text style={[s.tdBold, { width: W.montant }]}>{ligne.montantTotal != null ? fmtNum(ligne.montantTotal) : ''}</Text>
                <Text style={[s.tdC, { width: W.avanc }]}>{fmtPct(ligne.avancementPct)}%</Text>
              </View>
            ))}

            {/* ── Sous-total chapitre ── */}
            <View style={s.stRow} wrap={false}>
              <Text style={[s.stTxt, { width: W.num }]} />
              <Text style={[s.stTxt, { flex: 1 }]}>Sous-total — Chapitre {chap.numero}</Text>
              <Text style={{ width: W.unite }} />
              <Text style={{ width: W.qte }} />
              <Text style={{ width: W.pu }} />
              <Text style={[s.stVal, { width: W.montant }]}>{fmtNum(chap.montantTotal)}</Text>
              <Text style={[s.stTxt, { width: W.avanc, textAlign: 'center' }]}>{fmtPct(chap.avancementPct)}%</Text>
            </View>
          </View>
        ))}

        {/* ═══ TOTAL GÉNÉRAL ═══ */}
        <View style={s.totalRow} wrap={false}>
          <Text style={[s.totalTxt, { width: W.num }]} />
          <Text style={[s.totalTxt, { flex: 1 }]}>TOTAL GÉNÉRAL HT</Text>
          <Text style={{ width: W.unite }} />
          <Text style={{ width: W.qte }} />
          <Text style={{ width: W.pu }} />
          <Text style={[s.totalVal, { width: W.montant }]}>{fmtNum(totalMontant)}</Text>
          <Text style={[s.totalVal, { width: W.avanc, textAlign: 'center', fontSize: 8 }]}>{fmtPct(avGlobal)}%</Text>
        </View>

        {/* Montant exécuté */}
        <View style={s.execRow} wrap={false}>
          <Text style={[s.execTxt, { width: W.num }]} />
          <Text style={[s.execTxt, { flex: 1 }]}>Montant exécuté</Text>
          <Text style={{ width: W.unite }} />
          <Text style={{ width: W.qte }} />
          <Text style={{ width: W.pu }} />
          <Text style={[s.execVal, { width: W.montant }]}>{fmtNum(totalExecute)}</Text>
          <Text style={{ width: W.avanc }} />
        </View>

        {/* Reste à exécuter */}
        <View style={s.restRow} wrap={false}>
          <Text style={[s.restTxt, { width: W.num }]} />
          <Text style={[s.restTxt, { flex: 1 }]}>Reste à exécuter</Text>
          <Text style={{ width: W.unite }} />
          <Text style={{ width: W.qte }} />
          <Text style={{ width: W.pu }} />
          <Text style={[s.restVal, { width: W.montant }]}>{fmtNum(totalMontant - totalExecute)}</Text>
          <Text style={{ width: W.avanc }} />
        </View>

        {/* Mention de clôture */}
        <View style={{ marginTop: 18, alignItems: 'center' }}>
          <Text style={{ fontSize: 7, color: C.muted }}>Document généré le {dateExp} à {heureExp}</Text>
          <Text style={{ fontSize: 7, color: C.muted, marginTop: 2 }}>Document confidentiel – MIKA Services – Usage interne et transmission officielle</Text>
          <Text style={{ fontSize: 6.5, color: C.muted, fontStyle: 'italic', marginTop: 2 }}>Réf. {ref} — {projet.nom}</Text>
        </View>
      </Page>
    </Document>
  )
}
