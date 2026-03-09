/**
 * Document PDF Premium — MIKA Services
 * Template professionnel de haut niveau : page de garde, en-têtes/pieds de page
 * dynamiques, KPI visuels, tableaux alternés, historique complet, alertes.
 */
import { Document, Page, View, Text, Image } from '@react-pdf/renderer'
import { StyleSheet } from '@react-pdf/renderer'
import type { ProjetDocumentPayload } from './types'
import { getAvancementEtudesWithLabels } from './types'
import { getTypeProjetDisplay, getProjetTypes } from '@/types/projet'

const LOGO = '/Logo_mika_services.png'

const C = {
  primary: '#2E5266',
  primaryLt: '#3D6A82',
  primaryBg: '#EDF2F7',
  accent: '#FF6B35',
  accentBg: '#FFF7F3',
  success: '#059669',
  successBg: '#ECFDF5',
  warning: '#D97706',
  warningBg: '#FFFBEB',
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
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

const PH = 42
const HEADER_H = 38
const FOOTER_H = 28

const s = StyleSheet.create({
  /* ── Cover ─────────────────────────────────── */
  coverPage: { fontFamily: 'Helvetica', backgroundColor: C.white },
  coverBar: { height: 6, backgroundColor: C.accent },
  coverBody: { flex: 1, paddingHorizontal: 60, paddingTop: 50, alignItems: 'center', justifyContent: 'center' },
  coverLogo: { width: 82, height: 82, marginBottom: 14, objectFit: 'contain' },
  coverBrand: { fontSize: 26, fontWeight: 'bold', color: C.accent, letterSpacing: 3, marginBottom: 3 },
  coverSub: { fontSize: 10, color: C.primary, letterSpacing: 1, marginBottom: 28 },
  coverSep: { width: 80, height: 2, backgroundColor: C.accent, marginBottom: 28 },
  coverDocType: { fontSize: 11, fontWeight: 'bold', color: C.primary, letterSpacing: 2, marginBottom: 18 },
  coverTitle: { fontSize: 18, fontWeight: 'bold', color: C.primary, textAlign: 'center', marginBottom: 8, maxWidth: 420 },
  coverRef: { fontSize: 10, color: C.textSec, marginBottom: 24 },
  coverMetaWrap: { width: '78%', marginBottom: 24, borderWidth: 0.5, borderColor: C.border, borderRadius: 3, overflow: 'hidden' },
  coverMetaRow: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 12, borderBottomWidth: 0.5, borderBottomColor: C.borderLt },
  coverMetaRowAlt: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 12, borderBottomWidth: 0.5, borderBottomColor: C.borderLt, backgroundColor: C.bgAlt },
  coverMetaLabel: { width: '40%', fontSize: 8, color: C.muted },
  coverMetaVal: { flex: 1, fontSize: 8, fontWeight: 'bold', color: C.text },
  coverDate: { fontSize: 9, color: C.textSec, marginBottom: 28 },
  coverConfBox: { borderWidth: 1, borderColor: C.border, borderRadius: 3, paddingVertical: 8, paddingHorizontal: 22 },
  coverConfText: { fontSize: 7, color: C.muted, textAlign: 'center', letterSpacing: 1 },
  coverBottom: { height: 4, backgroundColor: C.primary },

  /* ── Content page ──────────────────────────── */
  page: {
    paddingTop: HEADER_H + 14,
    paddingBottom: FOOTER_H + 10,
    paddingHorizontal: PH,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.text,
  },

  /* ── Fixed header ──────────────────────────── */
  hdr: { position: 'absolute', top: 0, left: 0, right: 0, height: HEADER_H },
  hdrBar: { height: 3, backgroundColor: C.accent },
  hdrRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: PH, paddingTop: 7, paddingBottom: 5, borderBottomWidth: 0.5, borderBottomColor: C.border },
  hdrLogo: { width: 16, height: 16, marginRight: 6, objectFit: 'contain' },
  hdrBrand: { fontSize: 8, fontWeight: 'bold', color: C.primary, flex: 1 },
  hdrRef: { fontSize: 7, color: C.muted },
  hdrPage: { fontSize: 7, color: C.muted, marginLeft: 10, textAlign: 'right', width: 50 },

  /* ── Fixed footer ──────────────────────────── */
  ftr: { position: 'absolute', bottom: 0, left: 0, right: 0, height: FOOTER_H },
  ftrLine: { height: 0.5, backgroundColor: C.border, marginHorizontal: PH },
  ftrRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: PH, paddingTop: 5 },
  ftrText: { fontSize: 7, color: C.muted },
  ftrBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: C.primary },

  /* ── Section titles ────────────────────────── */
  secTitle: { fontSize: 12, fontWeight: 'bold', color: C.primary, paddingLeft: 10, paddingBottom: 4, borderLeftWidth: 3, borderLeftColor: C.accent, marginTop: 18, marginBottom: 8 },
  subTitle: { fontSize: 10, fontWeight: 'bold', color: C.text, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: C.primaryLt, marginTop: 10, marginBottom: 6 },

  /* ── Key-value rows ────────────────────────── */
  kvRow: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: C.borderLt },
  kvRowAlt: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: C.borderLt, backgroundColor: C.bgAlt },
  kvLabel: { width: '36%', fontSize: 8, color: C.textSec },
  kvVal: { flex: 1, fontSize: 8, fontWeight: 'bold', color: C.text },

  /* ── Data tables ───────────────────────────── */
  tbl: { width: '100%', marginBottom: 10 },
  tHead: { flexDirection: 'row', backgroundColor: C.primary, paddingVertical: 6, paddingHorizontal: 6 },
  tHCell: { flex: 1, fontSize: 8, fontWeight: 'bold', color: C.white },
  tHCellR: { flex: 1, fontSize: 8, fontWeight: 'bold', color: C.white, textAlign: 'right' },
  tRow: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 6, borderBottomWidth: 0.5, borderBottomColor: C.borderLt },
  tRowAlt: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 6, borderBottomWidth: 0.5, borderBottomColor: C.borderLt, backgroundColor: C.bgAlt },
  tCell: { flex: 1, fontSize: 8, color: C.text },
  tCellR: { flex: 1, fontSize: 8, color: C.text, textAlign: 'right' },
  tCellB: { flex: 1, fontSize: 8, fontWeight: 'bold', color: C.text },

  /* ── Suivi mensuel cols ────────────────────── */
  colMois: { width: 60, fontSize: 8 },
  colNum: { width: 52, fontSize: 8, textAlign: 'right' },
  colNumH: { width: 52, fontSize: 8, textAlign: 'right', fontWeight: 'bold', color: C.white },

  /* ── KPI cards ─────────────────────────────── */
  kpiRow: { flexDirection: 'row', marginBottom: 14 },
  kpiCard: { flex: 1, marginRight: 6, borderTopWidth: 3, borderRadius: 2, padding: 8, backgroundColor: C.bg },
  kpiCardLast: { flex: 1, borderTopWidth: 3, borderRadius: 2, padding: 8, backgroundColor: C.bg },
  kpiVal: { fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  kpiLbl: { fontSize: 7, color: C.muted },

  /* ── History ───────────────────────────────── */
  histBlock: { marginBottom: 8, borderLeftWidth: 2, borderLeftColor: C.primary, paddingLeft: 8, paddingVertical: 4, backgroundColor: C.bg },
  histTitle: { fontSize: 9, fontWeight: 'bold', color: C.primary, marginBottom: 3 },
  histRow: { flexDirection: 'row', paddingVertical: 2 },
  histTask: { flex: 1, fontSize: 7.5, color: C.text },
  histPct: { width: 38, fontSize: 7.5, color: C.textSec, textAlign: 'right' },

  /* ── Alerts ────────────────────────────────── */
  alertCard: { flexDirection: 'row', padding: 8, marginBottom: 6, borderRadius: 2, borderLeftWidth: 3 },
  alertBody: { flex: 1 },
  alertTitle: { fontSize: 9, fontWeight: 'bold', marginBottom: 1 },
  alertDesc: { fontSize: 8 },

  /* ── Generic ───────────────────────────────── */
  para: { fontSize: 9, color: C.text, lineHeight: 1.5, marginBottom: 6 },
  paraSm: { fontSize: 8, color: C.textSec, lineHeight: 1.4, marginBottom: 4 },
  paraMuted: { fontSize: 8, color: C.muted, lineHeight: 1.4, marginBottom: 4 },
  divider: { height: 0.5, backgroundColor: C.border, marginVertical: 12 },
  spacer: { height: 14 },
})

export function ProjetDocumentPdf({ payload }: { payload: ProjetDocumentPayload }) {
  const { projet, rapport, lignesCA, pointsBloquants, previsions, budgetPrevu, depensesTotales, semaineCalendaire, anneeCalendaire, delaiMois, formatMontant, formatDate, formatTime } = payload

  const etudes = getAvancementEtudesWithLabels(projet.avancementEtudes)
  const dateExp = dateFr()
  const heureExp = formatTime ? formatTime() : heureFr()
  const ref = projet.numeroMarche ?? String(projet.id)

  const tachesRealiseSemaine = previsions.filter((p) => p.semaine === semaineCalendaire && p.annee === anneeCalendaire)
  const semaineSuivante = semaineCalendaire < 53 ? semaineCalendaire + 1 : 1
  const anneeSuivante = semaineCalendaire < 53 ? anneeCalendaire : anneeCalendaire + 1
  const tachesPrevuesExplicites = previsions.filter((p) => p.semaine === semaineSuivante && p.annee === anneeSuivante)
  const tachesReportees = previsions.filter((p) => {
    const a = p.annee ?? 0; const sw = p.semaine ?? 0
    return (a < anneeCalendaire || (a === anneeCalendaire && sw < semaineCalendaire)) && (p.avancementPct == null || p.avancementPct < 100)
  })
  const tachesPrevuesSuivante = [...tachesPrevuesExplicites, ...tachesReportees]
  const avancementsRealise = tachesRealiseSemaine.map((t) => t.avancementPct).filter((v): v is number => v != null)
  const globalPct = avancementsRealise.length > 0 ? Math.round((avancementsRealise.reduce((a, b) => a + b, 0) / avancementsRealise.length) * 100) / 100 : null

  const pastWeekKeys = Array.from(
    new Set(previsions.filter((p) => { const a = p.annee ?? 0; const sw = p.semaine ?? 0; return a < anneeCalendaire || (a === anneeCalendaire && sw < semaineCalendaire) }).map((p) => `${p.annee ?? 0}-${p.semaine ?? 0}`))
  ).map((k) => { const [a, sw] = k.split('-').map(Number); return { annee: a, semaine: sw } }).sort((x, y) => x.annee !== y.annee ? x.annee - y.annee : x.semaine - y.semaine)

  const hasHistory = pastWeekKeys.length > 0
  const hasAlertes = pointsBloquants.length > 0 || (rapport && (rapport.planning.tachesEnRetard > 0 || rapport.securite.risquesCritiques > 0))

  const secNums = (() => { let n = 0; return { contract: ++n, dashboard: ++n, suivi: ++n, etudes: ++n, travaux: ++n, history: hasHistory ? ++n : 0, desc: ++n, actors: ++n, alerts: hasAlertes ? ++n : 0 } })()

  const kpis: { label: string; value: string; sub: string; color: string }[] = [
    { label: 'Taux d\'avancement', value: `${projet.avancementGlobal} %`, sub: `Physique : ${projet.avancementPhysiquePct ?? projet.avancementGlobal} %`, color: C.accent },
    { label: 'Budget consommé', value: `${rapport?.budget?.tauxConsommation ?? 0} %`, sub: `${formatMontant(depensesTotales)} / ${formatMontant(budgetPrevu)}`, color: C.primary },
    { label: 'Conformité qualité', value: `${rapport?.qualite?.tauxConformite ?? 0} %`, sub: `NC ouvertes : ${rapport?.qualite?.ncOuvertes ?? 0}`, color: C.success },
    { label: 'Incidents sécurité', value: String(rapport?.securite?.incidentsTotal ?? 0), sub: `Risques critiques : ${rapport?.securite?.risquesCritiques ?? 0}`, color: rapport && rapport.securite.incidentsTotal > 0 ? C.danger : C.success },
    { label: 'Planning', value: `${rapport?.planning?.tauxAvancement ?? 0} %`, sub: `${rapport?.planning?.tachesTerminees ?? 0}/${rapport?.planning?.tachesTotal ?? 0} terminées`, color: C.primaryLt },
  ]

  const coverMeta: [string, string][] = [
    ['Statut', projet.statut.replace(/_/g, ' ')],
    ['Type de projet', getTypeProjetDisplay(getProjetTypes(projet), projet.typePersonnalise)],
    ['Chef de projet', projet.responsableProjet ? `${projet.responsableProjet.prenom} ${projet.responsableProjet.nom}` : '—'],
    ['Client', projet.client?.nom ?? '—'],
    ['Période', `${formatDate(projet.dateDebut)} — ${formatDate(projet.dateFin)}`],
    ['Semaine en cours', `Semaine ${semaineCalendaire} (${anneeCalendaire})`],
    ['Taux d\'avancement', `${projet.avancementGlobal} %`],
  ]

  const contractRows: [string, string][] = [
    ['Numéro de marché', projet.numeroMarche ?? '—'],
    ['Statut du projet', projet.statut.replace(/_/g, ' ')],
    ['Type de projet', getTypeProjetDisplay(getProjetTypes(projet), projet.typePersonnalise)],
    ['Montant marché (HT)', formatMontant(projet.montantHT)],
    ['Montant TTC', formatMontant(projet.montantTTC)],
    ['Travaux supplémentaires', formatMontant(projet.montantInitial)],
    ['Avenant', formatMontant(projet.montantRevise)],
    ['Délai contractuel', delaiMois != null ? `${delaiMois} mois` : '—'],
    ['Date début prévue', formatDate(projet.dateDebut)],
    ['Date fin prévue', formatDate(projet.dateFin)],
    ['Date début réelle', formatDate(projet.dateDebutReel)],
    ['Date fin réelle', formatDate(projet.dateFinReelle)],
    ['Imputation budgétaire', projet.imputationBudgetaire ?? '—'],
    ['Source de financement', projet.sourceFinancement?.replace(/_/g, ' ') ?? '—'],
  ]

  const indicatorRows: [string, string][] = [
    ['Avancement physique', `${projet.avancementPhysiquePct ?? projet.avancementGlobal} %`],
    ['Avancement financier', `${rapport?.budget?.tauxConsommation ?? 0} %`],
    ['Budget prévu', formatMontant(budgetPrevu)],
    ['Dépenses réalisées', formatMontant(depensesTotales)],
    ['Conformité qualité', `${rapport?.qualite?.tauxConformite ?? 0} %`],
    ['Non-conformités ouvertes', String(rapport?.qualite?.ncOuvertes ?? 0)],
    ['Incidents sécurité', String(rapport?.securite?.incidentsTotal ?? 0)],
    ['Risques critiques', String(rapport?.securite?.risquesCritiques ?? 0)],
    ['Tâches terminées / en cours / en retard', `${rapport?.planning?.tachesTerminees ?? 0} / ${rapport?.planning?.tachesEnCours ?? 0} / ${rapport?.planning?.tachesEnRetard ?? 0}`],
    ['Taux d\'avancement planning', `${rapport?.planning?.tauxAvancement ?? 0} %`],
  ]

  const totPrev = lignesCA.reduce((acc, l) => acc + l.caPrevisionnel, 0)
  const totReal = lignesCA.reduce((acc, l) => acc + l.caRealise, 0)
  const totEcart = lignesCA.reduce((acc, l) => acc + l.ecart, 0)
  const lastPct = [...lignesCA].reverse().find((l) => l.avancementCumule != null)?.avancementCumule

  return (
    <Document>
      {/* ═══════════════════════════════════════════════════════════
          COVER PAGE
         ═══════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.coverPage}>
        <View style={s.coverBar} />
        <View style={s.coverBody}>
          <Image style={s.coverLogo} src={LOGO} />
          <Text style={s.coverBrand}>MIKA SERVICES</Text>
          <Text style={s.coverSub}>Bureau d&apos;Études Techniques</Text>
          <View style={s.coverSep} />
          <Text style={s.coverDocType}>RAPPORT DE SUIVI DE PROJET</Text>
          <Text style={s.coverTitle}>{projet.nom}</Text>
          <Text style={s.coverRef}>Réf. {ref}</Text>

          <View style={s.coverMetaWrap}>
            {coverMeta.map(([l, v], i) => (
              <View key={i} style={i % 2 === 1 ? s.coverMetaRowAlt : s.coverMetaRow}>
                <Text style={s.coverMetaLabel}>{l}</Text>
                <Text style={s.coverMetaVal}>{v}</Text>
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

      {/* ═══════════════════════════════════════════════════════════
          CONTENT PAGES (auto-wrap)
         ═══════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page} wrap>
        {/* ── Fixed Header ────────────────────── */}
        <View style={s.hdr} fixed>
          <View style={s.hdrBar} />
          <View style={s.hdrRow}>
            <Image style={s.hdrLogo} src={LOGO} />
            <Text style={s.hdrBrand}>MIKA SERVICES — Rapport de projet</Text>
            <Text style={s.hdrRef}>Réf. {ref}</Text>
            <Text style={s.hdrPage} render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `${pageNumber} / ${totalPages}`} />
          </View>
        </View>

        {/* ── Fixed Footer ────────────────────── */}
        <View style={s.ftr} fixed>
          <View style={s.ftrLine} />
          <View style={s.ftrRow}>
            <Text style={s.ftrText}>Document confidentiel – MIKA Services – {projet.nom}</Text>
            <Text style={s.ftrText}>{dateExp} – S{semaineCalendaire} ({anneeCalendaire})</Text>
          </View>
          <View style={s.ftrBar} />
        </View>

        {/* ══════════════════════════════════════════════════════
            SECTION 1 — Informations contractuelles
           ══════════════════════════════════════════════════════ */}
        <Text style={s.secTitle} minPresenceAhead={30}>{secNums.contract}. Informations contractuelles</Text>
        <View style={s.tbl}>
          {contractRows.map(([l, v], i) => (
            <View key={i} style={i % 2 === 1 ? s.kvRowAlt : s.kvRow}>
              <Text style={s.kvLabel}>{l}</Text>
              <Text style={s.kvVal}>{v}</Text>
            </View>
          ))}
        </View>

        {/* ══════════════════════════════════════════════════════
            SECTION 2 — Tableau de bord synthétique
           ══════════════════════════════════════════════════════ */}
        <Text style={s.secTitle} minPresenceAhead={60}>{secNums.dashboard}. Tableau de bord synthétique</Text>
        <View style={s.kpiRow} wrap={false}>
          {kpis.map((k, i) => (
            <View key={i} style={[i < kpis.length - 1 ? s.kpiCard : s.kpiCardLast, { borderTopColor: k.color }]}>
              <Text style={[s.kpiVal, { color: k.color }]}>{k.value}</Text>
              <Text style={s.kpiLbl}>{k.label}</Text>
              <Text style={{ fontSize: 6, color: C.muted, marginTop: 1 }}>{k.sub}</Text>
            </View>
          ))}
        </View>

        <View style={s.tbl}>
          <View style={s.tHead}>
            <Text style={s.tHCell}>Indicateur</Text>
            <Text style={s.tHCellR}>Valeur</Text>
          </View>
          {indicatorRows.map(([l, v], i) => (
            <View key={i} style={i % 2 === 1 ? s.tRowAlt : s.tRow}>
              <Text style={s.tCell}>{l}</Text>
              <Text style={s.tCellR}>{v}</Text>
            </View>
          ))}
        </View>

        {/* ══════════════════════════════════════════════════════
            SECTION 3 — Suivi mensuel
           ══════════════════════════════════════════════════════ */}
        <Text style={s.secTitle} minPresenceAhead={40}>{secNums.suivi}. Suivi mensuel du chiffre d&apos;affaires</Text>
        {lignesCA.length > 0 ? (
          <>
            <View style={s.tbl}>
              <View style={s.tHead}>
                <Text style={[s.colMois, { color: C.white, fontWeight: 'bold' }]}>Mois</Text>
                <Text style={s.colNumH}>CA prév.</Text>
                <Text style={s.colNumH}>CA réalisé</Text>
                <Text style={s.colNumH}>Écart</Text>
                <Text style={s.colNumH}>Avanc. %</Text>
              </View>
              {lignesCA.map((l, i) => (
                <View key={l.label} style={i % 2 === 1 ? s.tRowAlt : s.tRow}>
                  <Text style={[s.colMois, { fontWeight: 'bold' }]}>{l.label}</Text>
                  <Text style={s.colNum}>{l.caPrevisionnel === 0 ? '—' : formatMontant(l.caPrevisionnel)}</Text>
                  <Text style={s.colNum}>{l.caRealise === 0 ? '—' : formatMontant(l.caRealise)}</Text>
                  <Text style={[s.colNum, { color: l.ecart > 0 ? C.success : l.ecart < 0 ? C.danger : C.text }]}>{l.ecart === 0 ? '—' : formatMontant(l.ecart)}</Text>
                  <Text style={s.colNum}>{l.avancementCumule == null || l.avancementCumule === 0 ? '—' : `${l.avancementCumule} %`}</Text>
                </View>
              ))}
              {/* Total row */}
              <View style={[s.tRow, { backgroundColor: C.primaryBg, borderTopWidth: 1, borderTopColor: C.primary }]}>
                <Text style={[s.colMois, { fontWeight: 'bold', color: C.primary }]}>TOTAL</Text>
                <Text style={[s.colNum, { fontWeight: 'bold' }]}>{formatMontant(totPrev)}</Text>
                <Text style={[s.colNum, { fontWeight: 'bold' }]}>{formatMontant(totReal)}</Text>
                <Text style={[s.colNum, { fontWeight: 'bold', color: totEcart >= 0 ? C.success : C.danger }]}>{formatMontant(totEcart)}</Text>
                <Text style={[s.colNum, { fontWeight: 'bold' }]}>{lastPct != null ? `${lastPct} %` : '—'}</Text>
              </View>
            </View>
            <Text style={s.paraSm}>
              Synthèse : budget prévu {formatMontant(budgetPrevu)} — dépenses {formatMontant(depensesTotales)} — écart {formatMontant(rapport?.budget?.ecart ?? depensesTotales - budgetPrevu)}.
            </Text>
          </>
        ) : (
          <Text style={s.paraMuted}>Aucune donnée de suivi mensuel disponible.</Text>
        )}

        {/* ══════════════════════════════════════════════════════
            SECTION 4 — Avancement des études
           ══════════════════════════════════════════════════════ */}
        <Text style={s.secTitle} minPresenceAhead={40}>{secNums.etudes}. État d&apos;avancement des études</Text>
        <View style={s.tbl}>
          <View style={s.tHead}>
            <Text style={s.tHCell}>Phase</Text>
            <Text style={[s.tHCellR, { width: 60 }]}>Avanc. %</Text>
            <Text style={s.tHCell}>Dépôt</Text>
            <Text style={s.tHCell}>Validation</Text>
          </View>
          {etudes.map((e, i) => (
            <View key={i} style={i % 2 === 1 ? s.tRowAlt : s.tRow}>
              <Text style={s.tCellB}>{e.phase}</Text>
              <Text style={[s.tCellR, { width: 60 }]}>{e.avancementPct != null ? `${e.avancementPct} %` : '—'}</Text>
              <Text style={s.tCell}>{e.dateDepot}</Text>
              <Text style={s.tCell}>{e.etatValidation}</Text>
            </View>
          ))}
        </View>

        {/* ══════════════════════════════════════════════════════
            SECTION 5 — Avancement des travaux
           ══════════════════════════════════════════════════════ */}
        <Text style={s.secTitle} minPresenceAhead={40}>{secNums.travaux}. Avancement des travaux — Semaine {semaineCalendaire} ({anneeCalendaire})</Text>
        {globalPct != null && (
          <View wrap={false} style={{ flexDirection: 'row', marginBottom: 10 }}>
            <View style={{ backgroundColor: C.accent, borderRadius: 2, paddingVertical: 3, paddingHorizontal: 10 }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: C.white }}>Taux d&apos;avancement : {globalPct} %</Text>
            </View>
          </View>
        )}

        {/* 5.1 Réalisé */}
        <Text style={s.subTitle} minPresenceAhead={20}>{secNums.travaux}.1 Réalisé — Semaine {semaineCalendaire} ({anneeCalendaire})</Text>
        {tachesRealiseSemaine.length > 0 ? (
          <View style={s.tbl}>
            <View style={s.tHead}>
              <Text style={[s.tHCell, { flex: 2 }]}>Tâche / Description</Text>
              <Text style={[s.tHCellR, { width: 65 }]}>Avancement</Text>
            </View>
            {tachesRealiseSemaine.map((p, i) => (
              <View key={p.id} style={i % 2 === 1 ? s.tRowAlt : s.tRow}>
                <Text style={[s.tCell, { flex: 2 }]}>{p.description ?? p.type.replace(/_/g, ' ')}</Text>
                <Text style={[s.tCellR, { width: 65 }]}>{p.avancementPct != null ? `${p.avancementPct} %` : '—'}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={s.paraMuted}>Aucune tâche enregistrée pour la semaine en cours.</Text>
        )}

        {/* 5.2 Prévisions */}
        <Text style={s.subTitle} minPresenceAhead={20}>{secNums.travaux}.2 Prévisions — Semaine {semaineSuivante} ({anneeSuivante})</Text>
        {tachesReportees.length > 0 && (
          <Text style={s.paraMuted}>Les tâches non achevées des semaines précédentes sont reportées automatiquement.</Text>
        )}
        {tachesPrevuesSuivante.length > 0 ? (
          <View style={s.tbl}>
            <View style={s.tHead}>
              <Text style={[s.tHCell, { flex: 2 }]}>Tâche / Description</Text>
              <Text style={[s.tHCellR, { width: 65 }]}>Avancement</Text>
            </View>
            {tachesPrevuesSuivante.map((p, i) => {
              const isRep = tachesReportees.some((r) => r.id === p.id)
              return (
                <View key={p.id} style={[i % 2 === 1 ? s.tRowAlt : s.tRow, isRep ? { backgroundColor: C.warningBg } : {}]}>
                  <Text style={[s.tCell, { flex: 2 }]}>
                    {p.description ?? p.type.replace(/_/g, ' ')}
                    {isRep && p.semaine != null && p.annee != null ? ` ← reportée S${p.semaine} (${p.annee})` : ''}
                  </Text>
                  <Text style={[s.tCellR, { width: 65 }]}>{p.avancementPct != null ? `${p.avancementPct} %` : '—'}</Text>
                </View>
              )
            })}
          </View>
        ) : (
          <Text style={s.paraMuted}>Aucune tâche planifiée pour la semaine prochaine.</Text>
        )}

        {/* 5.3 Points bloquants */}
        <Text style={s.subTitle} minPresenceAhead={20}>{secNums.travaux}.3 Points bloquants</Text>
        {pointsBloquants.length > 0 ? (
          <View style={s.tbl}>
            <View style={s.tHead}>
              <Text style={[s.tHCell, { width: '25%' }]}>Titre</Text>
              <Text style={[s.tHCell, { flex: 1 }]}>Description</Text>
              <Text style={[s.tHCell, { width: 55 }]}>Priorité</Text>
              <Text style={[s.tHCell, { width: 50 }]}>Statut</Text>
            </View>
            {pointsBloquants.map((pb, i) => (
              <View key={pb.id} style={i % 2 === 1 ? s.tRowAlt : s.tRow}>
                <Text style={[s.tCellB, { width: '25%' }]}>{pb.titre}</Text>
                <Text style={[s.tCell, { flex: 1 }]}>{pb.description ?? '—'}</Text>
                <Text style={[s.tCell, { width: 55 }]}>{pb.priorite}</Text>
                <Text style={[s.tCell, { width: 50 }]}>{pb.statut}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={s.paraMuted}>Aucun point bloquant identifié.</Text>
        )}

        {/* 5.4 Besoins */}
        <Text style={s.subTitle}>{secNums.travaux}.4 Besoins matériels et humains</Text>
        <View style={s.tbl}>
          <View style={s.kvRow}><Text style={s.kvLabel}>Besoins matériels</Text><Text style={s.kvVal}>{projet.besoinsMateriel || '—'}</Text></View>
          <View style={s.kvRowAlt}><Text style={s.kvLabel}>Besoins humains</Text><Text style={s.kvVal}>{projet.besoinsHumain || '—'}</Text></View>
        </View>

        {/* ══════════════════════════════════════════════════════
            SECTION 6 — Historique (si applicable)
           ══════════════════════════════════════════════════════ */}
        {hasHistory && (
          <>
            <Text style={s.secTitle} minPresenceAhead={30}>{secNums.history}. Historique des semaines passées</Text>
            <Text style={s.paraMuted}>Récapitulatif chronologique de l&apos;ensemble des tâches enregistrées antérieurement à la semaine {semaineCalendaire}.</Text>
            {pastWeekKeys.map(({ annee, semaine }) => {
              const taches = previsions.filter((p) => (p.annee ?? 0) === annee && (p.semaine ?? 0) === semaine)
              if (taches.length === 0) return null
              return (
                <View key={`${annee}-${semaine}`} style={s.histBlock} wrap={false}>
                  <Text style={s.histTitle}>Semaine {semaine} ({annee})</Text>
                  {taches.map((p) => (
                    <View key={p.id} style={s.histRow}>
                      <Text style={s.histTask}>{p.description ?? p.type.replace(/_/g, ' ')}</Text>
                      <Text style={s.histPct}>{p.avancementPct != null ? `${p.avancementPct} %` : '—'}</Text>
                    </View>
                  ))}
                </View>
              )
            })}
          </>
        )}

        {/* ══════════════════════════════════════════════════════
            SECTION — Description, observations, propositions
           ══════════════════════════════════════════════════════ */}
        <Text style={s.secTitle} minPresenceAhead={30}>{secNums.desc}. Description, observations et propositions</Text>
        <Text style={s.subTitle}>Description du projet</Text>
        <Text style={s.para}>{projet.description || '—'}</Text>
        <Text style={s.subTitle}>Observations</Text>
        <Text style={s.para}>{projet.observations || '—'}</Text>
        <Text style={s.subTitle}>Propositions d&apos;amélioration</Text>
        <Text style={s.para}>{projet.propositionsAmelioration || '—'}</Text>

        {/* ══════════════════════════════════════════════════════
            SECTION — Acteurs et localisation
           ══════════════════════════════════════════════════════ */}
        <Text style={s.secTitle} minPresenceAhead={30}>{secNums.actors}. Acteurs et localisation</Text>

        <Text style={s.subTitle}>Client</Text>
        {projet.client ? (
          <View style={s.tbl}>
            {([
              ['Raison sociale', projet.client.nom],
              ['Type', projet.client.type.replace(/_/g, ' ')],
              ...(projet.client.contactPrincipal ? [['Contact principal', projet.client.contactPrincipal]] : []),
              ...(projet.client.telephoneContact ? [['Téléphone', projet.client.telephoneContact]] : []),
              ...(projet.client.email ? [['E-mail', projet.client.email]] : []),
              ...(projet.client.adresse ? [['Adresse', projet.client.adresse]] : []),
            ] as [string, string][]).map(([l, v], i) => (
              <View key={i} style={i % 2 === 1 ? s.kvRowAlt : s.kvRow}>
                <Text style={s.kvLabel}>{l}</Text>
                <Text style={s.kvVal}>{v}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={s.paraMuted}>—</Text>
        )}

        <Text style={s.subTitle}>Chef de projet</Text>
        {projet.responsableProjet ? (
          <View style={s.tbl}>
            <View style={s.kvRow}><Text style={s.kvLabel}>Nom</Text><Text style={s.kvVal}>{projet.responsableProjet.prenom} {projet.responsableProjet.nom}</Text></View>
            <View style={s.kvRowAlt}><Text style={s.kvLabel}>E-mail</Text><Text style={s.kvVal}>{projet.responsableProjet.email}</Text></View>
          </View>
        ) : (
          <Text style={s.paraMuted}>—</Text>
        )}

        <Text style={s.subTitle}>Localisation</Text>
        <Text style={s.para}>{[projet.province, projet.ville, projet.quartier].filter(Boolean).join(' · ') || '—'}</Text>

        {/* ══════════════════════════════════════════════════════
            SECTION — Alertes et vigilance (si applicable)
           ══════════════════════════════════════════════════════ */}
        {hasAlertes && (
          <>
            <Text style={s.secTitle} minPresenceAhead={30}>{secNums.alerts}. Alertes et vigilance</Text>
            {pointsBloquants.length > 0 && (
              <View style={[s.alertCard, { backgroundColor: C.warningBg, borderLeftColor: C.warning }]} wrap={false}>
                <View style={s.alertBody}>
                  <Text style={[s.alertTitle, { color: C.warning }]}>Points bloquants</Text>
                  <Text style={[s.alertDesc, { color: C.textSec }]}>{pointsBloquants.length} point(s) bloquant(s) à traiter en priorité</Text>
                </View>
              </View>
            )}
            {rapport && rapport.planning.tachesEnRetard > 0 && (
              <View style={[s.alertCard, { backgroundColor: C.dangerBg, borderLeftColor: C.danger }]} wrap={false}>
                <View style={s.alertBody}>
                  <Text style={[s.alertTitle, { color: C.danger }]}>Tâches en retard</Text>
                  <Text style={[s.alertDesc, { color: C.textSec }]}>{rapport.planning.tachesEnRetard} tâche(s) dépassant l&apos;échéance prévue</Text>
                </View>
              </View>
            )}
            {rapport && rapport.securite.risquesCritiques > 0 && (
              <View style={[s.alertCard, { backgroundColor: C.dangerBg, borderLeftColor: C.danger }]} wrap={false}>
                <View style={s.alertBody}>
                  <Text style={[s.alertTitle, { color: C.danger }]}>Risques critiques</Text>
                  <Text style={[s.alertDesc, { color: C.textSec }]}>{rapport.securite.risquesCritiques} risque(s) critique(s) identifié(s)</Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* ── Closing ── */}
        <View style={{ marginTop: 16, alignItems: 'center' }}>
          <Text style={{ fontSize: 8, color: C.muted, marginBottom: 2 }}>Document généré le {dateExp} à {heureExp} — Semaine {semaineCalendaire} ({anneeCalendaire})</Text>
          <Text style={{ fontSize: 8, color: C.muted, marginBottom: 2 }}>Document confidentiel – MIKA Services – Usage interne et transmission officielle</Text>
          <Text style={{ fontSize: 7, color: C.muted, fontStyle: 'italic' }}>Référence : {ref} — {projet.nom}</Text>
        </View>
      </Page>
    </Document>
  )
}
