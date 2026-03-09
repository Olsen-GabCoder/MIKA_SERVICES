/**
 * Document PDF du procès-verbal — MIKA Services
 * Version corrigée : mise en page lisible, espacement généreux,
 * hiérarchie visuelle claire, tableaux confortables.
 * Logique métier 100% inchangée.
 */
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import type { PVDocumentPayload } from './types'

// ─────────────────────────────────────────────────────────────
// Assets
// ─────────────────────────────────────────────────────────────
const LOGO = '/Logo_mika_services.png'

// ─────────────────────────────────────────────────────────────
// Charte couleurs MIKA (contrainte 4)
// ─────────────────────────────────────────────────────────────
const C = {
  orange:     '#F5A000',   // accent orange
  navyDk:     '#1B3A6B',   // bleu marine titre
  navyLt:     '#2E5FA3',   // bleu marine clair
  rowAlt:     '#F4F6FA',   // fond alterné
  border:     '#DDDDDD',   // bordures tableaux
  text:       '#333333',   // texte corps
  textSec:    '#555555',   // texte secondaire
  white:      '#FFFFFF',
  danger:     '#D32F2F',
  success:    '#388E3C',
  muted:      '#888888',
  headerText: '#FFFFFF',
}

// ─────────────────────────────────────────────────────────────
// Helpers dates & heures
// ─────────────────────────────────────────────────────────────
const JOURS   = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'] as const
const MOIS_FR = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'] as const

function dateFr(d?: string): string {
  if (!d) return '—'
  const date = new Date(d + 'T12:00:00')
  return `${JOURS[date.getDay()]} ${date.getDate()} ${MOIS_FR[date.getMonth()]} ${date.getFullYear()}`
}

function heureFr(): string {
  return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function fmtTime(timeStr?: string): string {
  if (!timeStr) return '—'
  return timeStr.slice(0, 5).replace(':', 'h')
}

// ─────────────────────────────────────────────────────────────
// StyleSheet (contraintes 4, 5, 6, 7, 8)
// ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({

  // ── Page de garde (contrainte 8) ────────────────────────────
  coverPage: {
    fontFamily: 'Helvetica',
    backgroundColor: C.white,
    paddingHorizontal: 50,
    paddingVertical: 50,
    alignItems: 'center',
  },
  coverTopBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 6,
    backgroundColor: C.orange,
  },
  coverBottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 6,
    backgroundColor: C.navyDk,
  },
  coverLogo: {
    width: 110,
    height: 70,
    objectFit: 'contain',
    marginTop: 30,
    marginBottom: 22,
  },
  coverBrand: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: C.orange,
    letterSpacing: 4,
    marginBottom: 6,
  },
  coverSubtitle: {
    fontSize: 12,
    color: C.navyDk,
    letterSpacing: 1,
    marginBottom: 20,
  },
  coverSep: {
    width: 60,
    height: 3,
    backgroundColor: C.orange,
    marginVertical: 20,
  },
  coverDocLabel: {
    fontSize: 11,
    color: C.navyDk,
    letterSpacing: 3,
    marginBottom: 10,
  },
  coverTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: C.navyDk,
    textAlign: 'center',
    marginBottom: 8,
  },
  coverDate: {
    fontSize: 12,
    color: C.textSec,
    marginBottom: 30,
  },

  // Fiche récap page de garde
  coverCard: {
    width: '100%',
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 30,
    overflow: 'hidden',
  },
  coverCardHeader: {
    backgroundColor: C.navyDk,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  coverCardTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
    letterSpacing: 1,
  },
  coverMetaRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    backgroundColor: C.white,
  },
  coverMetaRowAlt: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    backgroundColor: C.rowAlt,
  },
  coverMetaLabel: {
    width: '45%',
    fontSize: 8,
    color: C.textSec,
  },
  coverMetaVal: {
    flex: 1,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.text,
  },

  // Badge confidentiel
  coverConfBadge: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'center',
  },
  coverConfText: {
    fontSize: 8,
    color: C.textSec,
    letterSpacing: 1,
    textAlign: 'center',
  },
  coverGenDate: {
    fontSize: 8,
    color: C.textSec,
    marginBottom: 20,
  },

  // ── Pages de contenu ─────────────────────────────────────────
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.text,
    backgroundColor: C.white,
    paddingTop: 50,     // laisse place au header fixe (hauteur ~36) + marge
    paddingBottom: 46,  // laisse place au footer fixe (hauteur ~28) + marge
    paddingHorizontal: 35,
  },

  // ── En-tête fixe (contrainte 7) ──────────────────────────────
  hdr: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
  },
  hdrAccent: {
    height: 4,
    backgroundColor: C.orange,
  },
  hdrMain: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 35,
    paddingVertical: 6,
    backgroundColor: C.navyDk,
  },
  hdrLogo: {
    width: 16,
    height: 16,
    marginRight: 7,
    objectFit: 'contain',
  },
  hdrBrand: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
    flex: 1,
  },
  hdrTitle: {
    fontSize: 7,
    color: '#CCDDEE',
    marginRight: 10,
  },
  hdrRef: {
    fontSize: 7,
    color: C.muted,
    marginRight: 10,
  },
  hdrPage: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.orange,
    width: 48,
    textAlign: 'right',
  },

  // ── Pied de page fixe (contrainte 7) ─────────────────────────
  ftr: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
  },
  ftrLine: {
    height: 2,
    backgroundColor: C.orange,
  },
  ftrRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 35,
    paddingVertical: 5,
    backgroundColor: C.white,
  },
  ftrLeft: {
    fontSize: 7,
    color: C.muted,
    flex: 2,
  },
  ftrCenter: {
    fontSize: 7,
    color: C.muted,
    textAlign: 'center',
    flex: 1,
  },
  ftrRight: {
    fontSize: 7,
    color: C.muted,
    textAlign: 'right',
    flex: 1,
  },

  // ── Titres de section ────────────────────────────────────────
  // Titre de projet (contrainte 5)
  projTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: C.navyDk,
    borderLeftWidth: 4,
    borderLeftColor: C.orange,
    paddingLeft: 10,
    marginBottom: 10,
    lineHeight: 1.4,
  },
  // Chef de projet (contrainte 5)
  chefProjet: {
    fontSize: 9,
    color: C.textSec,
    marginBottom: 12,
  },

  // Titre de section (Réalisé, Prévisions, Points bloquants, Besoins)
  // contrainte 5 : marginTop 14, marginBottom 8, fontSize 11, bold
  secTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: C.navyDk,
    borderLeftWidth: 3,
    borderLeftColor: C.orange,
    paddingLeft: 8,
    marginTop: 14,
    marginBottom: 8,
  },

  // ── Tableaux (contrainte 6) ───────────────────────────────────
  tbl: {
    width: '100%',
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 8,
  },
  // En-tête tableau : paddingVertical 9, bg #1B3A6B, texte blanc
  tHead: {
    flexDirection: 'row',
    backgroundColor: C.navyDk,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  tHCell: {
    flex: 1,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
  },
  tHCellC: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
    textAlign: 'center',
  },
  // Lignes : minHeight 22, paddingVertical 7, paddingHorizontal 10
  tRow: {
    flexDirection: 'row',
    minHeight: 22,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: C.white,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
  },
  tRowAlt: {
    flexDirection: 'row',
    minHeight: 22,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: C.rowAlt,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
  },
  tCell: {
    flex: 1,
    fontSize: 8,
    color: C.text,
    lineHeight: 1.4,
  },
  tCellC: {
    fontSize: 8,
    color: C.text,
    textAlign: 'center',
  },
  tCellB: {
    flex: 1,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.text,
    lineHeight: 1.4,
  },
  // Colonne avancement : largeur 80, centré, couleur navyLt (contrainte 6)
  tCellAdv: {
    width: 80,
    fontSize: 8,
    color: C.navyLt,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
  },
  tHCellAdv: {
    width: 80,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
    textAlign: 'center',
  },

  // Tableau KV (besoins, en-tête réunion)
  kvTable: {
    width: '100%',
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 10,
  },
  kvRow: {
    flexDirection: 'row',
    minHeight: 22,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: C.white,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
  },
  kvRowAlt: {
    flexDirection: 'row',
    minHeight: 22,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: C.rowAlt,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
  },
  kvLabel: {
    width: '38%',
    fontSize: 8,
    color: C.textSec,
    lineHeight: 1.4,
  },
  kvVal: {
    flex: 1,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.text,
    lineHeight: 1.4,
  },

  // Texte vide / italique
  emptyText: {
    fontSize: 8,
    color: C.muted,
    fontStyle: 'italic',
    marginBottom: 6,
    marginLeft: 4,
  },

  // Séparateur entre fiches projets (contrainte 5)
  projDivider: {
    height: 1.5,
    backgroundColor: C.border,
    marginVertical: 22,
  },

  // Section générale
  divider: {
    height: 0.5,
    backgroundColor: C.border,
    marginVertical: 14,
  },

  // Taux d'avancement
  globalBadge: {
    backgroundColor: C.orange,
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
    borderRadius: 2,
  },
  globalBadgeText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
  },

  // Pied de document
  docFooter: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    alignItems: 'center',
  },
  docFooterText: {
    fontSize: 7,
    color: C.muted,
    marginBottom: 2,
    textAlign: 'center',
  },

  // Section titre principal (En-tête, Participants)
  mainSecWrap: {
    marginBottom: 10,
  },
  mainSecAccent: {
    height: 3,
    width: 40,
    backgroundColor: C.orange,
    marginBottom: 5,
  },
  mainSecTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: C.navyDk,
  },

  // Sous-titre ordre du jour
  subSecTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: C.navyDk,
    borderLeftWidth: 3,
    borderLeftColor: C.orange,
    paddingLeft: 8,
    marginTop: 10,
    marginBottom: 6,
  },
  para: {
    fontSize: 9,
    color: C.text,
    lineHeight: 1.6,
    marginBottom: 6,
  },

  // Points bloquants — largeurs spécifiques (contrainte 6)
  pbTitre:  { width: 130, fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.text, lineHeight: 1.4 },
  pbDesc:   { width: 180, fontSize: 8, color: C.text, lineHeight: 1.4, paddingLeft: 4 },
  pbPrio:   { width: 80,  fontSize: 8, textAlign: 'center' },
  pbStatut: { width: 70,  fontSize: 8, textAlign: 'center' },

  pbTitreH:  { width: 130, fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.white },
  pbDescH:   { width: 180, fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.white, paddingLeft: 4 },
  pbPrioH:   { width: 80,  fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.white, textAlign: 'center' },
  pbStatutH: { width: 70,  fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.white, textAlign: 'center' },
})

// ─────────────────────────────────────────────────────────────
// Composants internes
// ─────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: string }) {
  return (
    <View style={s.mainSecWrap}>
      <View style={s.mainSecAccent} />
      <Text style={s.mainSecTitle}>{children}</Text>
    </View>
  )
}

function SubSectionTitle({ children }: { children: string }) {
  return <Text style={s.secTitle}>{children}</Text>
}

/** Couleur de priorité (contrainte 6) */
function prioCouleur(p?: string | null): string {
  if (!p) return C.textSec
  return p.toUpperCase().includes('HAUTE') ? C.danger : C.textSec
}

/** Couleur de statut (contrainte 6) */
function statutCouleur(st?: string | null): string {
  if (!st) return C.text
  const u = st.toUpperCase()
  if (u.includes('OUVERT') || u.includes('OPEN')) return C.danger
  if (u.includes('FERM') || u.includes('CLOSE')) return C.success
  return C.text
}

// ─────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────
export function PVDocumentPdf({ payload }: { payload: PVDocumentPayload }) {
  const { reunion, semaineReunion, anneeReunion, projetsData, formatTime } = payload

  const dateExp   = dateFr(reunion.dateReunion)
  const heureExp  = formatTime ? formatTime() : heureFr()
  const ref       = `PV-${reunion.id}-${reunion.dateReunion}`
  const todayFr   = dateFr(new Date().toISOString().slice(0, 10))

  // Semaine suivante (logique inchangée)
  const semaineSuivante = semaineReunion < 53 ? semaineReunion + 1 : 1
  const anneeSuivante   = semaineReunion < 53 ? anneeReunion : anneeReunion + 1

  const coverMeta: [string, string][] = [
    ['Date de la réunion',      dateExp],
    ['Lieu',                    reunion.lieu || '—'],
    ['Heure de début',          fmtTime(reunion.heureDebut)],
    ['Heure de fin',            fmtTime(reunion.heureFin)],
    ['Animateur',               reunion.redacteur ? `${reunion.redacteur.prenom} ${reunion.redacteur.nom}` : '—'],
    ['Semaine concernée',       `Semaine ${semaineReunion} (${anneeReunion})`],
    ['Nombre de participants',  String(reunion.participants.length)],
    ['Nombre de projets',       String(projetsData.length)],
  ]

  return (
    <Document>

      {/* ══════════════════════════════════════════════════════
          PAGE DE COUVERTURE (contrainte 8)
      ══════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.coverPage}>
        <View style={s.coverTopBar} fixed />
        <View style={s.coverBottomBar} fixed />

        {/* Logo */}
        <Image style={s.coverLogo} src={LOGO} />

        {/* Marque */}
        <Text style={s.coverBrand}>MIKA SERVICES</Text>
        <Text style={s.coverSubtitle}>Bureau d&apos;Études Techniques</Text>

        {/* Séparateur orange */}
        <View style={s.coverSep} />

        {/* Type document */}
        <Text style={s.coverDocLabel}>P R O C È S - V E R B A L</Text>
        <Text style={s.coverTitle}>Réunion hebdomadaire</Text>
        <Text style={s.coverDate}>{dateExp}</Text>

        {/* Fiche récap */}
        <View style={s.coverCard}>
          <View style={s.coverCardHeader}>
            <Text style={s.coverCardTitle}>INFORMATIONS DE LA RÉUNION</Text>
          </View>
          {coverMeta.map(([l, v], i) => (
            <View key={i} style={i % 2 === 0 ? s.coverMetaRow : s.coverMetaRowAlt}>
              <Text style={s.coverMetaLabel}>{l}</Text>
              <Text style={s.coverMetaVal}>{v}</Text>
            </View>
          ))}
        </View>

        <Text style={s.coverGenDate}>Document généré le {todayFr} à {heureExp}</Text>

        {/* Badge confidentiel */}
        <View style={s.coverConfBadge}>
          <Text style={s.coverConfText}>D O C U M E N T  C O N F I D E N T I E L</Text>
          <Text style={[s.coverConfText, { marginTop: 3 }]}>U s a g e  i n t e r n e  e t  t r a n s m i s s i o n  o f f i c i e l l e</Text>
        </View>
      </Page>

      {/* ══════════════════════════════════════════════════════
          PAGES DE CONTENU
      ══════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page} wrap>

        {/* ── En-tête fixe ─────────────────────────────────── */}
        <View style={s.hdr} fixed>
          <View style={s.hdrAccent} />
          <View style={s.hdrMain}>
            <Image style={s.hdrLogo} src={LOGO} />
            <Text style={s.hdrBrand}>MIKA SERVICES — Procès-verbal réunion hebdo</Text>
            <Text style={s.hdrRef}>{ref}</Text>
            <Text
              style={s.hdrPage}
              render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
                `${pageNumber} / ${totalPages}`
              }
            />
          </View>
        </View>

        {/* ── Pied de page fixe (contrainte 7) ─────────────── */}
        <View style={s.ftr} fixed>
          <View style={s.ftrLine} />
          <View style={s.ftrRow}>
            <Text style={s.ftrLeft}>MIKA SERVICES — Procès-verbal réunion hebdo</Text>
            <Text style={s.ftrCenter}>{ref}</Text>
            <Text
              style={s.ftrRight}
              render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
                `${pageNumber} / ${totalPages}`
              }
            />
          </View>
        </View>

        {/* ══════════════════════════════════════════════════
            SECTION 1 — EN-TÊTE DE LA RÉUNION
            (Date, lieu, heure, animateur, semaine : page de couverture)
        ══════════════════════════════════════════════════ */}
        <SectionTitle>1. En-tête de la réunion</SectionTitle>

        <View style={s.kvTable}>
          <View style={[s.kvRow, { borderTopWidth: 0 }]}>
            <Text style={s.kvLabel}>Référence document</Text>
            <Text style={s.kvVal}>{ref}</Text>
          </View>
        </View>

        {reunion.ordreDuJour && (
          <>
            <Text style={s.subSecTitle}>Ordre du jour</Text>
            <Text style={s.para}>{reunion.ordreDuJour}</Text>
          </>
        )}

        <View style={s.divider} />

        {/* ══════════════════════════════════════════════════
            SECTION 2 — PARTICIPANTS
        ══════════════════════════════════════════════════ */}
        <SectionTitle>2. Participants</SectionTitle>

        {reunion.participants.length > 0 ? (
          <View style={s.tbl}>
            <View style={s.tHead}>
              <Text style={[s.tHCell, { flex: 2 }]}>Nom</Text>
              <Text style={[s.tHCellC, { width: 70 }]}>Initiales</Text>
              <Text style={[s.tHCell, { flex: 1 }]}>Téléphone</Text>
            </View>
            {reunion.participants.map((p, i) => (
              <View key={p.id} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                <Text style={[s.tCellB, { flex: 2 }]}>{p.prenom} {p.nom}</Text>
                <Text style={[s.tCellC, { width: 70 }]}>{p.initiales || '—'}</Text>
                <Text style={[s.tCell, { flex: 1 }]}>{p.telephone || '—'}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={s.emptyText}>Aucun participant enregistré pour cette réunion.</Text>
        )}

        <View style={s.divider} />

        {/* ══════════════════════════════════════════════════
            SECTIONS PAR PROJET
        ══════════════════════════════════════════════════ */}
        {projetsData.map(({ projet, previsions, pointsBloquants }, index) => {

          // ── Logique métier (inchangée) ─────────────────────
          const tachesRealisees = previsions.filter(
            (p) => p.semaine === semaineReunion && p.annee === anneeReunion
          )
          const tachesPrevues = previsions.filter(
            (p) => p.semaine === semaineSuivante && p.annee === anneeSuivante
          )
          const tachesReportees = previsions.filter((p) => {
            const a  = p.annee  ?? 0
            const sw = p.semaine ?? 0
            return (
              (a < anneeReunion || (a === anneeReunion && sw < semaineReunion)) &&
              (p.avancementPct == null || p.avancementPct < 100)
            )
          })
          const avancementsGlobaux = [...tachesRealisees, ...tachesReportees]
            .map((t) => t.avancementPct)
            .filter((v): v is number => v != null)
          const globalPct = avancementsGlobaux.length > 0
            ? Math.round((avancementsGlobaux.reduce((a, b) => a + b, 0) / avancementsGlobaux.length) * 100) / 100
            : null
          // ──────────────────────────────────────────────────

          const chefProjet = projet.responsableProjet
            ? `${projet.responsableProjet.prenom} ${projet.responsableProjet.nom}`
            : '—'

          const refProjet = projet.numeroMarche ?? String(projet.id)

          return (
            <View key={projet.id}>

              {/* Séparateur entre fiches (contrainte 5) */}
              {index > 0 && <View style={s.projDivider} />}

              {/* ── Titre projet (contrainte 5) ─────────────── */}
              <Text style={s.projTitle}>
                {`${index + 3}. ${projet.nom}`}
                {refProjet ? ` (réf. ${refProjet})` : ''}
              </Text>

              {/* Chef de projet (contrainte 5) */}
              <Text style={s.chefProjet}>Chef de projet : {chefProjet}</Text>

              {/* Taux d'avancement */}
              {globalPct != null && (
                <View style={s.globalBadge}>
                  <Text style={s.globalBadgeText}>Taux d&apos;avancement : {globalPct} %</Text>
                </View>
              )}

              {/* ── Réalisé — Semaine en cours ─────────────── */}
              <SubSectionTitle>{`Réalisé — Semaine ${semaineReunion} (${anneeReunion})`}</SubSectionTitle>

              {tachesRealisees.length > 0 ? (
                <View style={s.tbl}>
                  <View style={s.tHead}>
                    <Text style={s.tHCell}>Tâche / Description</Text>
                    <Text style={s.tHCellAdv}>Avancement</Text>
                  </View>
                  {tachesRealisees.map((p, i) => (
                    <View key={p.id} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                      <Text style={s.tCell}>
                        {p.description ?? p.type?.replace(/_/g, ' ') ?? '—'}
                      </Text>
                      <Text style={s.tCellAdv}>
                        {p.avancementPct != null ? `${p.avancementPct} %` : '—'}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={s.emptyText}>Aucune tâche enregistrée pour la semaine en cours.</Text>
              )}

              {/* ── Prévisions — Semaine suivante ─────────── */}
              <SubSectionTitle>{`Prévisions — Semaine ${semaineSuivante} (${anneeSuivante})`}</SubSectionTitle>

              {tachesReportees.length > 0 && (
                <Text style={[s.emptyText, { color: C.textSec, fontStyle: 'normal', marginBottom: 4 }]}>
                  Tâches non achevées des semaines précédentes reportées.
                </Text>
              )}

              {tachesPrevues.length > 0 || tachesReportees.length > 0 ? (
                <View style={s.tbl}>
                  <View style={s.tHead}>
                    <Text style={s.tHCell}>Tâche / Description</Text>
                    <Text style={s.tHCellAdv}>Avancement</Text>
                  </View>
                  {/* Tâches reportées affichées dans le bloc prévisions */}
                  {tachesReportees.map((p, i) => (
                    <View key={`rep-${p.id}`} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                      <Text style={s.tCell}>
                        {(p.description ?? p.type?.replace(/_/g, ' ') ?? '—')}
                        {p.semaine != null && p.annee != null ? ` • reportée S${p.semaine} (${p.annee})` : ''}
                      </Text>
                      <Text style={s.tCellAdv}>
                        {p.avancementPct != null ? `${p.avancementPct} %` : '—'}
                      </Text>
                    </View>
                  ))}
                  {tachesPrevues.map((p, i) => {
                    const rowIdx = tachesReportees.length + i
                    return (
                      <View key={`prev-${p.id}`} style={rowIdx % 2 === 0 ? s.tRow : s.tRowAlt}>
                        <Text style={s.tCell}>
                          {p.description ?? p.type?.replace(/_/g, ' ') ?? '—'}
                        </Text>
                        <Text style={s.tCellAdv}>
                          {p.avancementPct != null ? `${p.avancementPct} %` : '—'}
                        </Text>
                      </View>
                    )
                  })}
                </View>
              ) : (
                <Text style={s.emptyText}>Aucune tâche planifiée pour la semaine prochaine.</Text>
              )}

              {/* ── Points bloquants (contrainte 6) ──────────── */}
              <SubSectionTitle>{`Points bloquants`}</SubSectionTitle>

              {pointsBloquants.length > 0 ? (
                <View style={s.tbl}>
                  <View style={s.tHead}>
                    <Text style={s.pbTitreH}>Titre</Text>
                    <Text style={s.pbDescH}>Description</Text>
                    <Text style={s.pbPrioH}>Priorité</Text>
                    <Text style={s.pbStatutH}>Statut</Text>
                  </View>
                  {pointsBloquants.map((pb, i) => (
                    <View key={pb.id} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                      <Text style={s.pbTitre}>{pb.titre}</Text>
                      <Text style={s.pbDesc}>{pb.description ?? '—'}</Text>
                      <Text style={[s.pbPrio, {
                        color: prioCouleur(pb.priorite),
                        fontFamily: pb.priorite?.toUpperCase().includes('HAUTE') ? 'Helvetica-Bold' : 'Helvetica',
                      }]}>
                        {pb.priorite ?? '—'}
                      </Text>
                      <Text style={[s.pbStatut, { color: statutCouleur(pb.statut) }]}>
                        {pb.statut ?? '—'}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={s.emptyText}>Aucun point bloquant.</Text>
              )}

              {/* ── Besoins matériels et humains ─────────────── */}
              <SubSectionTitle>Besoins matériels et humains</SubSectionTitle>

              <View style={s.kvTable}>
                <View style={[s.kvRow, { borderTopWidth: 0 }]}>
                  <Text style={s.kvLabel}>Besoins matériels</Text>
                  <Text style={s.kvVal}>{projet.besoinsMateriel || '—'}</Text>
                </View>
                <View style={s.kvRowAlt}>
                  <Text style={s.kvLabel}>Besoins humains</Text>
                  <Text style={s.kvVal}>{projet.besoinsHumain || '—'}</Text>
                </View>
              </View>

            </View>
          )
        })}

        {/* ══════════════════════════════════════════════════
            DIVERS
        ══════════════════════════════════════════════════ */}
        {reunion.divers && (
          <>
            <View style={s.projDivider} />
            <SectionTitle>{`${projetsData.length + 3}. Divers`}</SectionTitle>
            <Text style={s.para}>{reunion.divers}</Text>
          </>
        )}

        {/* ── Pied de document ─────────────────────────────── */}
        <View style={s.docFooter}>
          <Text style={s.docFooterText}>Document généré le {todayFr} à {heureExp}</Text>
          <Text style={s.docFooterText}>
            Procès-verbal — Réunion hebdomadaire — Semaine {semaineReunion} ({anneeReunion}) — {ref}
          </Text>
        </View>

      </Page>
    </Document>
  )
}