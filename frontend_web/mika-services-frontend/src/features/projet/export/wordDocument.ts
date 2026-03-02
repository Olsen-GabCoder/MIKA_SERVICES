/**
 * Génération du document Word (.docx) Premium — MIKA Services
 * Template professionnel de haut niveau : page de garde, en-têtes/pieds de page
 * avec numérotation, logo, KPI, tableaux alternés, historique complet, alertes.
 */
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  convertInchesToTwip,
  ShadingType,
  ImageRun,
  Header,
  Footer,
  PageNumber,
  PageBreak,
  Tab,
} from 'docx'
import type { ProjetDocumentPayload } from './types'
import { getAvancementEtudesWithLabels } from './types'
import { getTypeProjetDisplay, getProjetTypes } from '@/types/projet'

const P = '2E5266'
const A = 'FF6B35'
const TXT = '1A1A2E'
const TXT2 = '4A5568'
const MUTED = '94A3B8'
const BG = 'F8FAFC'
const BG_ALT = 'F1F5F9'
const BORDER = 'E2E8F0'
const SUCCESS = '059669'
const DANGER = 'DC2626'
const LOGO_URL = '/Logo_mika_services.png'

const SZ = { title: 52, h1: 28, h2: 24, body: 20, small: 18, tiny: 16, micro: 14 } as const
const SP = { section: { before: 320, after: 200 }, sub: { before: 200, after: 120 }, para: { after: 100 }, big: { after: 240 } } as const

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'] as const
const MOIS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'] as const
function dateFr() { const d = new Date(); return `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS_FR[d.getMonth()]} ${d.getFullYear()}` }
function heureFr() { return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }

const BORD = {
  top: { style: BorderStyle.SINGLE, size: 2, color: BORDER },
  bottom: { style: BorderStyle.SINGLE, size: 2, color: BORDER },
  left: { style: BorderStyle.SINGLE, size: 2, color: BORDER },
  right: { style: BorderStyle.SINGLE, size: 2, color: BORDER },
}

function cHdr(text: string, width?: number): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: SZ.body, color: 'FFFFFF' })], alignment: AlignmentType.LEFT })],
    shading: { fill: P, type: ShadingType.SOLID },
    ...(width ? { width: { size: width, type: WidthType.PERCENTAGE } } : {}),
  })
}
function cHdrR(text: string, width?: number): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: SZ.body, color: 'FFFFFF' })], alignment: AlignmentType.RIGHT })],
    shading: { fill: P, type: ShadingType.SOLID },
    ...(width ? { width: { size: width, type: WidthType.PERCENTAGE } } : {}),
  })
}
function cLbl(text: string): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, size: SZ.body, color: TXT2 })] })],
    width: { size: 35, type: WidthType.PERCENTAGE },
    shading: { fill: BG, type: ShadingType.CLEAR },
    borders: BORD,
  })
}
function cVal(text: string, bold = true): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold, size: SZ.body, color: TXT })] })],
    borders: BORD,
  })
}
function cBody(text: string, width?: number): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, size: SZ.body, color: TXT })] })],
    borders: BORD,
    ...(width ? { width: { size: width, type: WidthType.PERCENTAGE } } : {}),
  })
}
function cBodyR(text: string, width?: number): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, size: SZ.body, color: TXT })], alignment: AlignmentType.RIGHT })],
    borders: BORD,
    ...(width ? { width: { size: width, type: WidthType.PERCENTAGE } } : {}),
  })
}
function cBodyBold(text: string, width?: number): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: SZ.body, color: TXT })] })],
    borders: BORD,
    ...(width ? { width: { size: width, type: WidthType.PERCENTAGE } } : {}),
  })
}
function cBodyColor(text: string, color: string, width?: number): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: SZ.body, color })], alignment: AlignmentType.RIGHT })],
    borders: BORD,
    ...(width ? { width: { size: width, type: WidthType.PERCENTAGE } } : {}),
  })
}

function shadedRow(cells: TableCell[], alt: boolean): TableRow {
  if (alt) cells.forEach((c) => { (c as unknown as { shading: unknown }).shading = { fill: BG_ALT, type: ShadingType.CLEAR } })
  return new TableRow({ children: cells })
}

function secHeading(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: '  ', size: SZ.h1 }),
      new TextRun({ text, bold: true, size: SZ.h1, color: P }),
    ],
    spacing: SP.section,
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: A, space: 8 } },
  })
}
function subHeading(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: '  ', size: SZ.h2 }),
      new TextRun({ text, bold: true, size: SZ.h2, color: TXT }),
    ],
    spacing: SP.sub,
    border: { left: { style: BorderStyle.SINGLE, size: 8, color: P, space: 6 } },
  })
}
function para(text: string, bold = false): Paragraph {
  return new Paragraph({ children: [new TextRun({ text, bold, size: SZ.body, color: TXT })], spacing: SP.para })
}
function paraMuted(text: string): Paragraph {
  return new Paragraph({ children: [new TextRun({ text, size: SZ.small, color: MUTED, italics: true })], spacing: SP.para })
}
function spacer(after = 200): Paragraph {
  return new Paragraph({ text: '', spacing: { after } })
}

function kvTable(rows: [string, string][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: BORD,
    rows: rows.map(([l, v], i) => shadedRow([cLbl(l), cVal(v)], i % 2 === 1)),
  })
}

export async function buildProjetWord(payload: ProjetDocumentPayload): Promise<Blob> {
  const { projet, rapport, lignesCA, pointsBloquants, previsions, budgetPrevu, depensesTotales, semaineCalendaire, anneeCalendaire, delaiMois, formatMontant, formatDate, formatTime } = payload
  const etudes = getAvancementEtudesWithLabels(projet.avancementEtudes)
  const dateExp = dateFr()
  const heureExp = formatTime ? formatTime() : heureFr()
  const ref = projet.numeroMarche ?? String(projet.id)

  let logoBuffer: ArrayBuffer | null = null
  try { const res = await fetch(LOGO_URL); if (res.ok) logoBuffer = await res.arrayBuffer() } catch { /* optional */ }

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

  /* ═══════════════════════════════════════════
     COVER PAGE
     ═══════════════════════════════════════════ */
  const coverChildren: (Paragraph | Table)[] = []

  coverChildren.push(spacer(600))

  if (logoBuffer && logoBuffer.byteLength > 0) {
    coverChildren.push(new Paragraph({
      children: [new ImageRun({ type: 'png', data: logoBuffer, transformation: { width: 80, height: 80 } })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }))
  }

  coverChildren.push(
    new Paragraph({ children: [new TextRun({ text: 'MIKA SERVICES', bold: true, size: SZ.title, color: A })], alignment: AlignmentType.CENTER, spacing: { after: 80 } }),
    new Paragraph({ children: [new TextRun({ text: 'Bureau d\'Études Techniques', size: SZ.h2, color: P })], alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
    new Paragraph({
      children: [new TextRun({ text: '━━━━━━━━━━━━━━━━━━━━', size: SZ.h2, color: A })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({ children: [new TextRun({ text: 'RAPPORT DE SUIVI DE PROJET', bold: true, size: SZ.h1, color: P })], alignment: AlignmentType.CENTER, spacing: { after: 300 } }),
    new Paragraph({ children: [new TextRun({ text: projet.nom, bold: true, size: 36, color: P })], alignment: AlignmentType.CENTER, spacing: { after: 120 } }),
    new Paragraph({ children: [new TextRun({ text: `Réf. ${ref}`, size: SZ.h2, color: TXT2 })], alignment: AlignmentType.CENTER, spacing: { after: 500 } }),
  )

  const coverMetaRows: [string, string][] = [
    ['Statut', projet.statut.replace(/_/g, ' ')],
    ['Type de projet', getTypeProjetDisplay(getProjetTypes(projet), projet.typePersonnalise)],
    ['Chef de projet', projet.responsableProjet ? `${projet.responsableProjet.prenom} ${projet.responsableProjet.nom}` : '—'],
    ['Client', projet.client?.nom ?? '—'],
    ['Période', `${formatDate(projet.dateDebut)} — ${formatDate(projet.dateFin)}`],
    ['Semaine en cours', `Semaine ${semaineCalendaire} (${anneeCalendaire})`],
    ['Avancement global', `${projet.avancementGlobal} %`],
  ]
  coverChildren.push(kvTable(coverMetaRows))
  coverChildren.push(
    spacer(400),
    new Paragraph({ children: [new TextRun({ text: `Exporté le ${dateExp} à ${heureExp}`, size: SZ.body, color: TXT2 })], alignment: AlignmentType.CENTER, spacing: { after: 300 } }),
    new Paragraph({ children: [new TextRun({ text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', size: SZ.small, color: BORDER })], alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
    new Paragraph({ children: [new TextRun({ text: 'DOCUMENT CONFIDENTIEL', bold: true, size: SZ.small, color: MUTED })], alignment: AlignmentType.CENTER, spacing: { after: 40 } }),
    new Paragraph({ children: [new TextRun({ text: 'Usage interne et transmission officielle uniquement', size: SZ.tiny, color: MUTED })], alignment: AlignmentType.CENTER }),
  )

  /* ═══════════════════════════════════════════
     CONTENT
     ═══════════════════════════════════════════ */
  const content: (Paragraph | Table)[] = []

  /* ── Section 1: Informations contractuelles ── */
  content.push(secHeading(`${secNums.contract}. Informations contractuelles`))
  content.push(kvTable([
    ['Numéro de marché', ref],
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
  ]))

  /* ── Section 2: Tableau de bord ── */
  content.push(secHeading(`${secNums.dashboard}. Tableau de bord synthétique`))

  const kpiData: [string, string][] = [
    ['Avancement global', `${projet.avancementGlobal} %`],
    ['Avancement physique', `${projet.avancementPhysiquePct ?? projet.avancementGlobal} %`],
    ['Budget consommé', `${rapport?.budget?.tauxConsommation ?? 0} %`],
    ['Budget prévu / Dépenses', `${formatMontant(budgetPrevu)} / ${formatMontant(depensesTotales)}`],
    ['Conformité qualité', `${rapport?.qualite?.tauxConformite ?? 0} %`],
    ['Non-conformités ouvertes', String(rapport?.qualite?.ncOuvertes ?? 0)],
    ['Incidents sécurité', String(rapport?.securite?.incidentsTotal ?? 0)],
    ['Risques critiques', String(rapport?.securite?.risquesCritiques ?? 0)],
    ['Planning — tâches terminées / en cours / en retard', `${rapport?.planning?.tachesTerminees ?? 0} / ${rapport?.planning?.tachesEnCours ?? 0} / ${rapport?.planning?.tachesEnRetard ?? 0}`],
    ['Taux d\'avancement planning', `${rapport?.planning?.tauxAvancement ?? 0} %`],
  ]
  content.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: BORD,
    rows: [
      new TableRow({ children: [cHdr('Indicateur'), cHdrR('Valeur')] }),
      ...kpiData.map(([l, v], i) => shadedRow([cLbl(l), cVal(v)], i % 2 === 1)),
    ],
  }))

  /* ── Section 3: Suivi mensuel ── */
  content.push(secHeading(`${secNums.suivi}. Suivi mensuel du chiffre d'affaires`))
  if (lignesCA.length > 0) {
    const totP = lignesCA.reduce((acc, l) => acc + l.caPrevisionnel, 0)
    const totR = lignesCA.reduce((acc, l) => acc + l.caRealise, 0)
    const totE = lignesCA.reduce((acc, l) => acc + l.ecart, 0)
    const lastA = [...lignesCA].reverse().find((l) => l.avancementCumule != null)?.avancementCumule

    content.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: BORD,
      rows: [
        new TableRow({ children: [cHdr('Mois', 18), cHdrR('CA prév.', 20), cHdrR('CA réalisé', 20), cHdrR('Écart', 20), cHdrR('Avanc. %', 22)] }),
        ...lignesCA.map((l, i) => shadedRow([
          cBodyBold(l.label, 18),
          cBodyR(l.caPrevisionnel === 0 ? '—' : formatMontant(l.caPrevisionnel), 20),
          cBodyR(l.caRealise === 0 ? '—' : formatMontant(l.caRealise), 20),
          cBodyColor(l.ecart === 0 ? '—' : formatMontant(l.ecart), l.ecart > 0 ? SUCCESS : l.ecart < 0 ? DANGER : TXT, 20),
          cBodyR(l.avancementCumule == null || l.avancementCumule === 0 ? '—' : `${l.avancementCumule} %`, 22),
        ], i % 2 === 1)),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'TOTAL', bold: true, size: SZ.body, color: P })], alignment: AlignmentType.LEFT })], shading: { fill: 'EDF2F7', type: ShadingType.CLEAR }, borders: BORD, width: { size: 18, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatMontant(totP), bold: true, size: SZ.body, color: TXT })], alignment: AlignmentType.RIGHT })], shading: { fill: 'EDF2F7', type: ShadingType.CLEAR }, borders: BORD, width: { size: 20, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatMontant(totR), bold: true, size: SZ.body, color: TXT })], alignment: AlignmentType.RIGHT })], shading: { fill: 'EDF2F7', type: ShadingType.CLEAR }, borders: BORD, width: { size: 20, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatMontant(totE), bold: true, size: SZ.body, color: totE >= 0 ? SUCCESS : DANGER })], alignment: AlignmentType.RIGHT })], shading: { fill: 'EDF2F7', type: ShadingType.CLEAR }, borders: BORD, width: { size: 20, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: lastA != null ? `${lastA} %` : '—', bold: true, size: SZ.body, color: TXT })], alignment: AlignmentType.RIGHT })], shading: { fill: 'EDF2F7', type: ShadingType.CLEAR }, borders: BORD, width: { size: 22, type: WidthType.PERCENTAGE } }),
          ],
        }),
      ],
    }))
    content.push(new Paragraph({
      children: [
        new TextRun({ text: 'Synthèse : ', bold: true, size: SZ.body }),
        new TextRun({ text: `budget prévu ${formatMontant(budgetPrevu)} — dépenses ${formatMontant(depensesTotales)} — écart ${formatMontant(rapport?.budget?.ecart ?? depensesTotales - budgetPrevu)}.`, size: SZ.body, color: TXT }),
        ],
        spacing: { before: 120, after: 200 },
    }))
  } else {
    content.push(paraMuted('Aucune donnée de suivi mensuel disponible.'))
  }

  /* ── Section 4: Études ── */
  content.push(secHeading(`${secNums.etudes}. État d'avancement des études`))
  content.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
    borders: BORD,
      rows: [
      new TableRow({ children: [cHdr('Phase'), cHdrR('Avanc. %'), cHdr('Dépôt'), cHdr('Validation')] }),
      ...etudes.map((e, i) => shadedRow([
        cBodyBold(e.phase),
        cBodyR(e.avancementPct != null ? `${e.avancementPct} %` : '—'),
        cBody(e.dateDepot),
        cBody(e.etatValidation),
      ], i % 2 === 1)),
    ],
  }))

  /* ── Section 5: Travaux ── */
  content.push(secHeading(`${secNums.travaux}. Avancement des travaux — Semaine ${semaineCalendaire} (${anneeCalendaire})`))

  if (globalPct != null) {
    content.push(new Paragraph({
      children: [new TextRun({ text: `Avancement global semaine : ${globalPct} %`, bold: true, size: SZ.h2, color: A })],
      spacing: { after: 200 },
    }))
  }

  content.push(subHeading(`${secNums.travaux}.1 Réalisé — Semaine ${semaineCalendaire} (${anneeCalendaire})`))
  if (tachesRealiseSemaine.length > 0) {
    content.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: BORD,
      rows: [
        new TableRow({ children: [cHdr('Tâche / Description', 75), cHdrR('Avancement', 25)] }),
        ...tachesRealiseSemaine.map((p, i) => shadedRow([
          cBody(p.description ?? p.type.replace(/_/g, ' '), 75),
          cBodyR(p.avancementPct != null ? `${p.avancementPct} %` : '—', 25),
        ], i % 2 === 1)),
      ],
    }))
  } else {
    content.push(paraMuted('Aucune tâche enregistrée pour la semaine en cours.'))
  }

  content.push(subHeading(`${secNums.travaux}.2 Prévisions — Semaine ${semaineSuivante} (${anneeSuivante})`))
  if (tachesReportees.length > 0) {
    content.push(paraMuted('Les tâches non achevées des semaines précédentes sont reportées automatiquement.'))
  }
  if (tachesPrevuesSuivante.length > 0) {
    content.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: BORD,
      rows: [
        new TableRow({ children: [cHdr('Tâche / Description', 75), cHdrR('Avancement', 25)] }),
        ...tachesPrevuesSuivante.map((p, i) => {
          const isRep = tachesReportees.some((r) => r.id === p.id)
          const desc = (p.description ?? p.type.replace(/_/g, ' ')) + (isRep && p.semaine != null && p.annee != null ? ` ← reportée S${p.semaine} (${p.annee})` : '')
          const row = shadedRow([cBody(desc, 75), cBodyR(p.avancementPct != null ? `${p.avancementPct} %` : '—', 25)], i % 2 === 1)
          if (isRep) {
            ;(row as unknown as { children: Array<{ shading?: unknown }> }).children.forEach((c: { shading?: unknown }) => { c.shading = { fill: 'FFFBEB', type: ShadingType.CLEAR } })
          }
          return row
        }),
      ],
    }))
  } else {
    content.push(paraMuted('Aucune tâche planifiée pour la semaine prochaine.'))
  }

  content.push(subHeading(`${secNums.travaux}.3 Points bloquants`))
  if (pointsBloquants.length > 0) {
    content.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: BORD,
      rows: [
        new TableRow({ children: [cHdr('Titre', 25), cHdr('Description', 40), cHdr('Priorité', 18), cHdr('Statut', 17)] }),
        ...pointsBloquants.map((pb, i) => shadedRow([
          cBodyBold(pb.titre, 25),
          cBody(pb.description ?? '—', 40),
          cBody(pb.priorite, 18),
          cBody(pb.statut, 17),
        ], i % 2 === 1)),
      ],
    }))
  } else {
    content.push(paraMuted('Aucun point bloquant identifié.'))
  }

  content.push(subHeading(`${secNums.travaux}.4 Besoins matériels et humains`))
  content.push(kvTable([
    ['Besoins matériels', projet.besoinsMateriel || '—'],
    ['Besoins humains', projet.besoinsHumain || '—'],
  ]))

  /* ── Section 6: Historique (si applicable) ── */
  if (hasHistory) {
    content.push(secHeading(`${secNums.history}. Historique des semaines passées`))
    content.push(paraMuted(`Récapitulatif chronologique des tâches enregistrées antérieurement à la semaine ${semaineCalendaire}.`))
    for (const { annee, semaine } of pastWeekKeys) {
      const taches = previsions.filter((p) => (p.annee ?? 0) === annee && (p.semaine ?? 0) === semaine)
      if (taches.length === 0) continue
      content.push(new Paragraph({
        children: [new TextRun({ text: `  Semaine ${semaine} (${annee})`, bold: true, size: SZ.h2, color: P })],
        spacing: { before: 160, after: 80 },
        border: { left: { style: BorderStyle.SINGLE, size: 8, color: P, space: 6 } },
      }))
      content.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: BORD,
        rows: [
          new TableRow({ children: [cHdr('Tâche / Description', 75), cHdrR('Avancement', 25)] }),
          ...taches.map((p, i) => shadedRow([
            cBody(p.description ?? p.type.replace(/_/g, ' '), 75),
            cBodyR(p.avancementPct != null ? `${p.avancementPct} %` : '—', 25),
          ], i % 2 === 1)),
        ],
      }))
    }
  }

  /* ── Section: Description ── */
  content.push(secHeading(`${secNums.desc}. Description, observations et propositions`))
  content.push(subHeading('Description du projet'))
  content.push(para(projet.description || '—'))
  content.push(subHeading('Observations'))
  content.push(para(projet.observations || '—'))
  content.push(subHeading('Propositions d\'amélioration'))
  content.push(para(projet.propositionsAmelioration || '—'))

  /* ── Section: Acteurs ── */
  content.push(secHeading(`${secNums.actors}. Acteurs et localisation`))
  content.push(subHeading('Client'))
  if (projet.client) {
    content.push(kvTable([
      ['Raison sociale', projet.client.nom],
      ['Type', projet.client.type.replace(/_/g, ' ')],
      ...(projet.client.contactPrincipal ? [['Contact principal', projet.client.contactPrincipal] as [string, string]] : []),
      ...(projet.client.telephoneContact ? [['Téléphone', projet.client.telephoneContact] as [string, string]] : []),
      ...(projet.client.email ? [['E-mail', projet.client.email] as [string, string]] : []),
      ...(projet.client.adresse ? [['Adresse', projet.client.adresse] as [string, string]] : []),
    ]))
  } else {
    content.push(paraMuted('—'))
  }
  content.push(subHeading('Chef de projet'))
  if (projet.responsableProjet) {
    content.push(kvTable([
      ['Nom', `${projet.responsableProjet.prenom} ${projet.responsableProjet.nom}`],
      ['E-mail', projet.responsableProjet.email],
    ]))
  } else {
    content.push(paraMuted('—'))
  }
  content.push(subHeading('Localisation'))
  content.push(para([projet.province, projet.ville, projet.quartier].filter(Boolean).join(' · ') || '—'))

  /* ── Section: Alertes (si applicable) ── */
  if (hasAlertes) {
    content.push(secHeading(`${secNums.alerts}. Alertes et vigilance`))
    const alertRows: [string, string][] = []
    if (pointsBloquants.length > 0) alertRows.push(['Points bloquants', `${pointsBloquants.length} point(s) à traiter en priorité`])
    if (rapport && rapport.planning.tachesEnRetard > 0) alertRows.push(['Tâches en retard', `${rapport.planning.tachesEnRetard} tâche(s) dépassant l'échéance`])
    if (rapport && rapport.securite.risquesCritiques > 0) alertRows.push(['Risques critiques', `${rapport.securite.risquesCritiques} risque(s) critique(s) identifié(s)`])
    content.push(kvTable(alertRows))
  }

  /* ── Synthèse ── */
  content.push(secHeading('Synthèse du projet'))
  content.push(kvTable([
    ['Projet', projet.nom],
    ['Référence', ref],
    ['Sous-projets', String(projet.nombreSousProjets)],
    ['Points bloquants ouverts', String(projet.nombrePointsBloquantsOuverts)],
    ['Délai consommé', projet.delaiConsommePct != null ? `${projet.delaiConsommePct} %` : '—'],
    ['Avancement global', `${projet.avancementGlobal} %`],
    ['Source de financement', projet.sourceFinancement?.replace(/_/g, ' ') ?? '—'],
    ['Partenaire principal', projet.partenairePrincipal ?? '—'],
    ...(projet.createdAt ? [['Date de création', formatDate(projet.createdAt)] as [string, string]] : []),
    ...(projet.updatedAt ? [['Dernière mise à jour', formatDate(projet.updatedAt)] as [string, string]] : []),
  ]))

  /* ── Closing ── */
  content.push(
    spacer(400),
    new Paragraph({ children: [new TextRun({ text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', size: SZ.small, color: BORDER })], alignment: AlignmentType.CENTER, spacing: { after: 120 } }),
    new Paragraph({ children: [new TextRun({ text: `Document généré le ${dateExp} à ${heureExp} — Semaine ${semaineCalendaire} (${anneeCalendaire})`, size: SZ.small, color: MUTED })], alignment: AlignmentType.CENTER, spacing: { after: 40 } }),
    new Paragraph({ children: [new TextRun({ text: 'Document confidentiel – MIKA Services – Usage interne et transmission officielle', size: SZ.small, color: MUTED })], alignment: AlignmentType.CENTER, spacing: { after: 40 } }),
    new Paragraph({ children: [new TextRun({ text: `Référence : ${ref} — ${projet.nom}`, italics: true, size: SZ.tiny, color: MUTED })], alignment: AlignmentType.CENTER }),
  )

  /* ═══════════════════════════════════════════
     BUILD DOCUMENT
     ═══════════════════════════════════════════ */
  const headerChildren: (TextRun | ImageRun | Tab)[] = []
  if (logoBuffer && logoBuffer.byteLength > 0) {
    headerChildren.push(new ImageRun({ type: 'png', data: logoBuffer, transformation: { width: 16, height: 16 } }))
    headerChildren.push(new TextRun({ text: '  ', size: SZ.small }))
  }
  headerChildren.push(
    new TextRun({ text: 'MIKA SERVICES', bold: true, size: SZ.small, color: P }),
    new TextRun({ text: `  —  Réf. ${ref}`, size: SZ.tiny, color: MUTED }),
    new Tab(),
    new TextRun({ text: 'Page ', size: SZ.tiny, color: MUTED }),
    new TextRun({ children: [PageNumber.CURRENT], size: SZ.tiny, color: MUTED }),
    new TextRun({ text: ' / ', size: SZ.tiny, color: MUTED }),
    new TextRun({ children: [PageNumber.TOTAL_PAGES], size: SZ.tiny, color: MUTED }),
  )

  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: convertInchesToTwip(1.2), right: convertInchesToTwip(0.85), bottom: convertInchesToTwip(1), left: convertInchesToTwip(0.85) } },
          titlePage: true,
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: headerChildren,
                border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER, space: 4 } },
                tabStops: [{ type: 'right' as const, position: convertInchesToTwip(6.8) }],
              }),
            ],
          }),
          first: new Header({ children: [] }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: `Document confidentiel – MIKA Services – ${projet.nom}`, size: SZ.tiny, color: MUTED }),
                  new Tab(),
                  new TextRun({ text: `${dateExp}`, size: SZ.tiny, color: MUTED }),
                ],
                border: { top: { style: BorderStyle.SINGLE, size: 2, color: BORDER, space: 4 } },
                tabStops: [{ type: 'right' as const, position: convertInchesToTwip(6.8) }],
              }),
            ],
          }),
          first: new Footer({
            children: [
              new Paragraph({
                children: [new TextRun({ text: `MIKA Services — ${dateExp}`, size: SZ.tiny, color: MUTED })],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: [
          ...coverChildren,
          new Paragraph({ children: [new PageBreak()] }),
          ...content,
        ],
      },
    ],
  })

  return Packer.toBlob(doc)
}
