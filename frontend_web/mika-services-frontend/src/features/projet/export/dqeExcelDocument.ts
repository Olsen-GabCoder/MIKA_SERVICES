/**
 * Export DQE au format Excel (.xlsx) — MIKA Services
 * Design premium avec ExcelJS : couleurs charte graphique, bordures,
 * polices, formats numériques, fusions, lignes alternées.
 */
import type { DqeExportPayload } from './dqeExport'

// ── Palette charte graphique ─────────────────────────────────────────
const CLR = {
  primary:    'FF2E5266',
  primaryLt:  'FF4A7491',
  primaryBg:  'FFEDF2F7',
  accent:     'FFFF6B35',
  accentBg:   'FFFFF7F3',
  white:      'FFFFFFFF',
  text:       'FF1A1A2E',
  textSec:    'FF4A5568',
  muted:      'FF94A3B8',
  border:     'FFE2E8F0',
  bgAlt:      'FFF8FAFC',
  bgRow:      'FFFAFBFC',
  success:    'FF059669',
  successLt:  'FFD1FAE5',
  chapBg:     'FFD6E4ED',
  stBg:       'FFE8EEF3',
}

// ── Bordure fine standard ────────────────────────────────────────────
const THIN_BORDER = {
  top: { style: 'thin' as const, color: { argb: CLR.border } },
  bottom: { style: 'thin' as const, color: { argb: CLR.border } },
  left: { style: 'thin' as const, color: { argb: CLR.border } },
  right: { style: 'thin' as const, color: { argb: CLR.border } },
}
const NO_BORDER = {
  top: { style: 'thin' as const, color: { argb: CLR.white } },
  bottom: { style: 'thin' as const, color: { argb: CLR.white } },
  left: { style: 'thin' as const, color: { argb: CLR.white } },
  right: { style: 'thin' as const, color: { argb: CLR.white } },
}

// ── Format numérique montant (séparateur de milliers, sans décimales) ─
const FMT_MONTANT = '#,##0'
const FMT_QTE = '#,##0.00'
const FMT_PCT = '0.00"%"'

export async function buildDqeExcel(payload: DqeExportPayload): Promise<Blob> {
  const ExcelJS = await import('exceljs')
  const { projet, chapitres, formatMontant } = payload

  const totalMontant = chapitres.reduce((s, c) => s + c.montantTotal, 0)
  const totalExecute = chapitres.reduce((s, c) => s + c.montantExecute, 0)
  const totalLignes = chapitres.reduce((s, c) => s + c.lignes.length, 0)
  const avGlobal = totalMontant > 0 ? Math.round((totalExecute / totalMontant) * 10000) / 100 : 0

  const wb = new ExcelJS.Workbook()
  wb.creator = 'MIKA Services'
  wb.created = new Date()

  const ws = wb.addWorksheet('DQE', {
    properties: { defaultColWidth: 14 },
    pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    headerFooter: {
      oddFooter: '&L&8Document confidentiel — MIKA Services&R&8Page &P / &N',
    },
  })

  // ── Largeurs de colonnes ──────────────────────────────────────────
  ws.columns = [
    { key: 'num',    width: 14 },
    { key: 'desig',  width: 58 },
    { key: 'unite',  width: 10 },
    { key: 'qte',    width: 14 },
    { key: 'pu',     width: 18 },
    { key: 'montant', width: 22 },
    { key: 'avanc',  width: 14 },
  ]

  let row = 1

  // ═══════════════════════════════════════════════════════════════════
  // EN-TÊTE DOCUMENT — Bande accent + titre
  // ═══════════════════════════════════════════════════════════════════

  // Barre accent orange (ligne 1)
  const accentRow = ws.getRow(row)
  ws.mergeCells(row, 1, row, 7)
  const accentCell = ws.getCell(row, 1)
  accentCell.value = ''
  accentCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CLR.accent } }
  accentRow.height = 5
  row++

  // Titre (ligne 2)
  ws.mergeCells(row, 1, row, 7)
  const titleCell = ws.getCell(row, 1)
  titleCell.value = 'DEVIS QUANTITATIF ET ESTIMATIF'
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: CLR.primary } }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  titleCell.border = NO_BORDER
  ws.getRow(row).height = 30
  row++

  // Sous-titre MIKA Services (ligne 3)
  ws.mergeCells(row, 1, row, 7)
  const brandCell = ws.getCell(row, 1)
  brandCell.value = 'MIKA SERVICES — Bureau d\'Études Techniques'
  brandCell.font = { name: 'Calibri', size: 9, color: { argb: CLR.muted }, italic: true }
  brandCell.alignment = { horizontal: 'center', vertical: 'middle' }
  brandCell.border = NO_BORDER
  ws.getRow(row).height = 16
  row++

  // Ligne vide
  ws.getRow(row).height = 6
  row++

  // ═══════════════════════════════════════════════════════════════════
  // MÉTADONNÉES PROJET — Tableau 2 colonnes × 2 blocs
  // ═══════════════════════════════════════════════════════════════════

  const metaLeft: [string, string][] = [
    ['Projet', projet.nom],
    ['Code projet', projet.codeProjet ?? '—'],
    ['N° de marché', projet.numeroMarche ?? '—'],
    ['Montant total HT', formatMontant(totalMontant)],
    ['Montant exécuté', formatMontant(totalExecute)],
  ]
  const metaRight: [string, string][] = [
    ['Date d\'export', new Date().toLocaleDateString('fr-FR')],
    ['Responsable', projet.responsableProjet ? `${projet.responsableProjet.prenom} ${projet.responsableProjet.nom}` : '—'],
    ['Structure', `${chapitres.length} chapitres / ${totalLignes} lignes`],
    ['Avancement global', `${avGlobal}%`],
    ['Reste à exécuter', formatMontant(totalMontant - totalExecute)],
  ]

  for (let i = 0; i < metaLeft.length; i++) {
    const r = ws.getRow(row)
    const isAlt = i % 2 === 1
    const bg = isAlt ? CLR.bgAlt : CLR.white

    // Bloc gauche (col 1-2)
    const labelL = ws.getCell(row, 1)
    labelL.value = metaLeft[i][0]
    labelL.font = { name: 'Calibri', size: 9, color: { argb: CLR.muted }, bold: true }
    labelL.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
    labelL.border = { left: { style: 'thin', color: { argb: CLR.primary } }, bottom: { style: 'hair', color: { argb: CLR.border } }, top: { style: 'hair', color: { argb: CLR.border } }, right: { style: 'hair', color: { argb: CLR.border } } }

    ws.mergeCells(row, 2, row, 3)
    const valL = ws.getCell(row, 2)
    valL.value = metaLeft[i][1]
    valL.font = { name: 'Calibri', size: 9, bold: true, color: { argb: CLR.text } }
    valL.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
    valL.border = { bottom: { style: 'hair', color: { argb: CLR.border } }, top: { style: 'hair', color: { argb: CLR.border } }, left: { style: 'hair', color: { argb: CLR.border } }, right: { style: 'hair', color: { argb: CLR.border } } }

    // Espace (col 4)
    const space = ws.getCell(row, 4)
    space.border = NO_BORDER

    // Bloc droit (col 5-6)
    const labelR = ws.getCell(row, 5)
    labelR.value = metaRight[i][0]
    labelR.font = { name: 'Calibri', size: 9, color: { argb: CLR.muted }, bold: true }
    labelR.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
    labelR.border = { left: { style: 'thin', color: { argb: CLR.primary } }, bottom: { style: 'hair', color: { argb: CLR.border } }, top: { style: 'hair', color: { argb: CLR.border } }, right: { style: 'hair', color: { argb: CLR.border } } }

    ws.mergeCells(row, 6, row, 7)
    const valR = ws.getCell(row, 6)
    valR.value = metaRight[i][1]
    valR.font = { name: 'Calibri', size: 9, bold: true, color: { argb: CLR.text } }
    valR.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
    valR.border = { bottom: { style: 'hair', color: { argb: CLR.border } }, top: { style: 'hair', color: { argb: CLR.border } }, left: { style: 'hair', color: { argb: CLR.border } }, right: { style: 'thin', color: { argb: CLR.primary } } }

    r.height = 18
    row++
  }

  // Ligne vide
  ws.getRow(row).height = 10
  row++

  // ═══════════════════════════════════════════════════════════════════
  // EN-TÊTE COLONNES — Fond secondary, texte blanc
  // ═══════════════════════════════════════════════════════════════════

  const headers = ['N° Prix', 'Désignation', 'Unité', 'Quantité', 'Prix Unitaire', 'Montant HT', 'Avanc. %']
  const headerAligns: ('left' | 'center' | 'right')[] = ['left', 'left', 'center', 'right', 'right', 'right', 'center']

  const hdrRow = ws.getRow(row)
  headers.forEach((h, i) => {
    const cell = ws.getCell(row, i + 1)
    cell.value = h
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: CLR.white } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CLR.primary } }
    cell.alignment = { horizontal: headerAligns[i], vertical: 'middle' }
    cell.border = {
      top: { style: 'medium', color: { argb: CLR.primary } },
      bottom: { style: 'medium', color: { argb: CLR.primary } },
      left: { style: 'thin', color: { argb: CLR.primaryLt } },
      right: { style: 'thin', color: { argb: CLR.primaryLt } },
    }
  })
  hdrRow.height = 24
  row++

  // ═══════════════════════════════════════════════════════════════════
  // CORPS DU TABLEAU — Chapitres, lignes, sous-totaux
  // ═══════════════════════════════════════════════════════════════════

  for (const chap of chapitres) {
    // ── Bandeau chapitre ────────────────────────────────────────────
    ws.mergeCells(row, 1, row, 7)
    const chapCell = ws.getCell(row, 1)
    chapCell.value = `   CHAPITRE ${chap.numero} — ${chap.designation.toUpperCase()}`
    chapCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: CLR.primary } }
    chapCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CLR.chapBg } }
    chapCell.alignment = { vertical: 'middle' }
    chapCell.border = {
      top: { style: 'medium', color: { argb: CLR.primaryLt } },
      bottom: { style: 'thin', color: { argb: CLR.primaryLt } },
      left: { style: 'medium', color: { argb: CLR.accent } },
      right: { style: 'thin', color: { argb: CLR.chapBg } },
    }
    ws.getRow(row).height = 22
    row++

    // ── Lignes / postes ─────────────────────────────────────────────
    chap.lignes.forEach((ligne, idx) => {
      const isAlt = idx % 2 === 1
      const bg = isAlt ? CLR.bgAlt : CLR.white
      const r = ws.getRow(row)

      const vals: (string | number | null)[] = [
        ligne.numeroPoste ?? '',
        ligne.designation,
        ligne.unite ?? '',
        ligne.quantite ?? null,
        ligne.prixUnitaire ?? null,
        ligne.montantTotal ?? null,
        ligne.avancementPct,
      ]

      vals.forEach((v, i) => {
        const cell = ws.getCell(row, i + 1)
        cell.value = v ?? ''
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
        cell.border = THIN_BORDER
        cell.alignment = { horizontal: headerAligns[i], vertical: 'middle' }

        // Styles spécifiques par colonne
        if (i === 0) {
          // N° Poste — monospace bold
          cell.font = { name: 'Consolas', size: 9, bold: true, color: { argb: CLR.primaryLt } }
        } else if (i === 1) {
          // Désignation
          cell.font = { name: 'Calibri', size: 9, color: { argb: CLR.text } }
        } else if (i === 3 && typeof v === 'number') {
          // Quantité
          cell.numFmt = FMT_QTE
          cell.font = { name: 'Calibri', size: 9, color: { argb: CLR.text } }
        } else if (i === 4 && typeof v === 'number') {
          // Prix unitaire
          cell.numFmt = FMT_MONTANT
          cell.font = { name: 'Calibri', size: 9, color: { argb: CLR.textSec } }
        } else if (i === 5 && typeof v === 'number') {
          // Montant HT
          cell.numFmt = FMT_MONTANT
          cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: CLR.text } }
        } else if (i === 6 && typeof v === 'number') {
          // Avancement
          cell.numFmt = '0.00"%"'
          cell.font = { name: 'Calibri', size: 9, color: { argb: v >= 100 ? CLR.success : CLR.textSec } }
        } else {
          cell.font = { name: 'Calibri', size: 9, color: { argb: CLR.textSec } }
        }
      })

      r.height = 18
      row++
    })

    // ── Sous-total chapitre ─────────────────────────────────────────
    const stR = ws.getRow(row)

    // Col A vide
    const stA = ws.getCell(row, 1)
    stA.value = ''
    stA.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CLR.stBg } }
    stA.border = { top: { style: 'medium', color: { argb: CLR.border } }, bottom: { style: 'medium', color: { argb: CLR.border } }, left: THIN_BORDER.left, right: THIN_BORDER.right }

    // Col B-E : label
    ws.mergeCells(row, 2, row, 5)
    const stLabel = ws.getCell(row, 2)
    stLabel.value = `Sous-total — Chapitre ${chap.numero}`
    stLabel.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: CLR.primary } }
    stLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CLR.stBg } }
    stLabel.alignment = { horizontal: 'right', vertical: 'middle' }
    stLabel.border = { top: { style: 'medium', color: { argb: CLR.border } }, bottom: { style: 'medium', color: { argb: CLR.border } }, left: THIN_BORDER.left, right: THIN_BORDER.right }

    // Col F : montant
    const stMontant = ws.getCell(row, 6)
    stMontant.value = chap.montantTotal
    stMontant.numFmt = FMT_MONTANT
    stMontant.font = { name: 'Calibri', size: 10, bold: true, color: { argb: CLR.text } }
    stMontant.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CLR.stBg } }
    stMontant.alignment = { horizontal: 'right', vertical: 'middle' }
    stMontant.border = { top: { style: 'medium', color: { argb: CLR.border } }, bottom: { style: 'medium', color: { argb: CLR.border } }, left: THIN_BORDER.left, right: THIN_BORDER.right }

    // Col G : avancement
    const stAvanc = ws.getCell(row, 7)
    stAvanc.value = chap.avancementPct
    stAvanc.numFmt = FMT_PCT
    stAvanc.font = { name: 'Calibri', size: 9, bold: true, color: { argb: CLR.primary } }
    stAvanc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CLR.stBg } }
    stAvanc.alignment = { horizontal: 'center', vertical: 'middle' }
    stAvanc.border = { top: { style: 'medium', color: { argb: CLR.border } }, bottom: { style: 'medium', color: { argb: CLR.border } }, left: THIN_BORDER.left, right: THIN_BORDER.right }

    stR.height = 20
    row++
  }

  // ═══════════════════════════════════════════════════════════════════
  // TOTAL GÉNÉRAL — Fond primary, texte blanc, gras
  // ═══════════════════════════════════════════════════════════════════

  const totalBorder = {
    top: { style: 'medium' as const, color: { argb: CLR.accent } },
    bottom: { style: 'thin' as const, color: { argb: CLR.primaryLt } },
    left: { style: 'thin' as const, color: { argb: CLR.primaryLt } },
    right: { style: 'thin' as const, color: { argb: CLR.primaryLt } },
  }

  // Total row
  const totalRows: { label: string; montant: number; avanc: number | string; bg: string; fontColor: string; montantColor: string; height: number; fontSize: number }[] = [
    { label: 'TOTAL GÉNÉRAL HT', montant: totalMontant, avanc: avGlobal, bg: CLR.primary, fontColor: CLR.white, montantColor: CLR.white, height: 26, fontSize: 11 },
    { label: 'Montant exécuté', montant: totalExecute, avanc: '', bg: CLR.primaryLt, fontColor: CLR.white, montantColor: 'FF6EE7B7', height: 22, fontSize: 10 },
    { label: 'Reste à exécuter', montant: totalMontant - totalExecute, avanc: '', bg: 'FF3D6A82', fontColor: 'CCFFFFFF', montantColor: 'CCFFFFFF', height: 20, fontSize: 9 },
  ]

  for (const tr of totalRows) {
    // Col A vide
    const cellA = ws.getCell(row, 1)
    cellA.value = ''
    cellA.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: tr.bg } }
    cellA.border = totalBorder

    // Col B-E : label
    ws.mergeCells(row, 2, row, 5)
    const cellLabel = ws.getCell(row, 2)
    cellLabel.value = tr.label
    cellLabel.font = { name: 'Calibri', size: tr.fontSize, bold: true, color: { argb: tr.fontColor } }
    cellLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: tr.bg } }
    cellLabel.alignment = { horizontal: 'right', vertical: 'middle' }
    cellLabel.border = totalBorder

    // Col F : montant
    const cellMontant = ws.getCell(row, 6)
    cellMontant.value = tr.montant
    cellMontant.numFmt = FMT_MONTANT
    cellMontant.font = { name: 'Calibri', size: tr.fontSize, bold: true, color: { argb: tr.montantColor } }
    cellMontant.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: tr.bg } }
    cellMontant.alignment = { horizontal: 'right', vertical: 'middle' }
    cellMontant.border = totalBorder

    // Col G : avancement (seulement pour le total)
    const cellAvanc = ws.getCell(row, 7)
    cellAvanc.value = typeof tr.avanc === 'number' ? tr.avanc : ''
    if (typeof tr.avanc === 'number') cellAvanc.numFmt = FMT_PCT
    cellAvanc.font = { name: 'Calibri', size: 9, bold: true, color: { argb: tr.fontColor } }
    cellAvanc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: tr.bg } }
    cellAvanc.alignment = { horizontal: 'center', vertical: 'middle' }
    cellAvanc.border = totalBorder

    ws.getRow(row).height = tr.height
    row++
  }

  // ── Ligne de fermeture ────────────────────────────────────────────
  row++
  ws.mergeCells(row, 1, row, 7)
  const closeCell = ws.getCell(row, 1)
  closeCell.value = `Document généré le ${new Date().toLocaleDateString('fr-FR')} — MIKA Services — Document confidentiel`
  closeCell.font = { name: 'Calibri', size: 8, italic: true, color: { argb: CLR.muted } }
  closeCell.alignment = { horizontal: 'center' }

  // ── Figer les volets (en-tête colonnes) ───────────────────────────
  ws.views = [{ state: 'frozen', ySplit: row - totalRows.length - chapitres.reduce((s, c) => s + c.lignes.length + 2, 0) - 1, xSplit: 0 }]

  // ── Génération du fichier ─────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer()
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
