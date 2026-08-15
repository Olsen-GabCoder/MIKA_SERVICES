import ExcelJS from 'exceljs'
import type { Tache, ProjetPlanningStats } from '@/types/planning'

// ── Palette premium ──────────────────────────────────────────────────
const C = {
  orange: 'FF6B35',
  orangeLight: 'FFF3ED',
  dark: '1A1A2E',
  white: 'FFFFFF',
  gray50: 'F8FAFC',
  gray100: 'F1F5F9',
  gray200: 'E2E8F0',
  gray300: 'CBD5E1',
  gray500: '64748B',
  gray700: '334155',
  gray900: '0F172A',
  teal: '2C9C7E',
  tealBg: 'ECFDF5',
  blue: '3F6B83',
  blueBg: 'EFF6FF',
  amber: 'C48A2B',
  amberBg: 'FFFBEB',
  red: 'DC2626',
  redBg: 'FEF2F2',
  redLight: 'FECACA',
  green: '16A34A',
  greenBg: 'F0FDF4',
  muted: 'B08078',
}

const STATUT_LABELS: Record<string, string> = {
  A_FAIRE: 'A faire',
  EN_COURS: 'En cours',
  EN_ATTENTE: 'En attente',
  TERMINEE: 'Terminee',
  ANNULEE: 'Annulee',
}

const STATUT_COLORS: Record<string, string> = {
  A_FAIRE: C.gray500,
  EN_COURS: C.blue,
  EN_ATTENTE: C.amber,
  TERMINEE: C.teal,
  ANNULEE: C.muted,
}

const PRIORITE_LABELS: Record<string, string> = {
  BASSE: 'Basse',
  NORMALE: 'Normale',
  HAUTE: 'Haute',
  URGENTE: 'Urgente',
  CRITIQUE: 'Critique',
}

const PRIORITE_COLORS: Record<string, string> = {
  BASSE: C.gray500,
  NORMALE: C.blue,
  HAUTE: C.amber,
  URGENTE: C.orange,
  CRITIQUE: C.red,
}

// ── Helpers ──────────────────────────────────────────────────────────
function fmtDate(d: string | null | undefined): string {
  if (!d) return ''
  const dt = new Date(d)
  return `${dt.getDate().toString().padStart(2, '0')}/${(dt.getMonth() + 1).toString().padStart(2, '0')}/${dt.getFullYear()}`
}

function lateDays(tache: Tache): number {
  if (!tache.dateEcheance) return 0
  if (tache.statut !== 'A_FAIRE' && tache.statut !== 'EN_COURS') return 0
  const diff = Math.floor((Date.now() - new Date(tache.dateEcheance).getTime()) / 86400000)
  return diff > 0 ? diff : 0
}

function weekNumber(d: Date): number {
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  target.setUTCDate(target.getUTCDate() + 4 - (target.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  return Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

function applyHeaderRow(row: ExcelJS.Row, colCount: number) {
  row.height = 30
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    if (colNumber > colCount) return
    cell.font = { name: 'Calibri', bold: true, size: 11, color: { argb: C.white } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.dark } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = {
      bottom: { style: 'thin', color: { argb: C.orange } },
      right: { style: 'hair', color: { argb: C.gray300 } },
    }
  })
}

function applyDataRow(row: ExcelJS.Row, colCount: number, isAlt: boolean) {
  row.height = 22
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    if (colNumber > colCount) return
    cell.font = { name: 'Calibri', size: 10.5 }
    cell.alignment = { vertical: 'middle', wrapText: false }
    if (isAlt) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.gray50 } }
    }
    cell.border = {
      bottom: { style: 'hair', color: { argb: C.gray200 } },
      right: { style: 'hair', color: { argb: C.gray200 } },
    }
  })
}

function addTitleBanner(ws: ExcelJS.Worksheet, title: string, subtitle: string, colSpan: number) {
  // Row 1: title
  ws.mergeCells(1, 1, 1, colSpan)
  const titleCell = ws.getCell(1, 1)
  titleCell.value = title
  titleCell.font = { name: 'Calibri', bold: true, size: 16, color: { argb: C.white } }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.orange } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  ws.getRow(1).height = 40

  // Row 2: subtitle + date
  ws.mergeCells(2, 1, 2, colSpan)
  const subCell = ws.getCell(2, 1)
  const now = new Date()
  subCell.value = `${subtitle}  |  Genere le ${fmtDate(now.toISOString())} a ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}  |  MIKA Services`
  subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: C.gray500 } }
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.orangeLight } }
  subCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  ws.getRow(2).height = 24

  // Row 3: spacer
  ws.getRow(3).height = 6
}

function colorCell(cell: ExcelJS.Cell, fg: string, bg: string, bold = true) {
  cell.font = { ...cell.font, bold, color: { argb: fg } }
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
  cell.alignment = { ...cell.alignment, horizontal: 'center' }
}

// ── SHEET 1: Synthese Projets ────────────────────────────────────────
function buildSyntheseSheet(wb: ExcelJS.Workbook, projetStats: ProjetPlanningStats[]) {
  const ws = wb.addWorksheet('Synthese Projets', {
    properties: { tabColor: { argb: C.orange } },
    views: [{ state: 'frozen', ySplit: 4, xSplit: 0 }],
  })

  const cols = ['Projet', 'Ville', 'Total', 'A faire', 'En cours', 'En attente', 'Terminees', 'Annulees', 'En retard', 'Avancement %']
  addTitleBanner(ws, 'SYNTHESE PROJETS', `${projetStats.length} projets accessibles`, cols.length)

  // Header row (row 4)
  const headerRow = ws.getRow(4)
  cols.forEach((c, i) => { headerRow.getCell(i + 1).value = c })
  applyHeaderRow(headerRow, cols.length)

  // Data
  const sorted = [...projetStats].sort((a, b) => b.enRetard - a.enRetard || b.total - a.total)
  sorted.forEach((p, ri) => {
    const row = ws.getRow(5 + ri)
    row.getCell(1).value = p.projetNom
    row.getCell(2).value = p.ville || ''
    row.getCell(3).value = p.total
    row.getCell(4).value = p.aFaire
    row.getCell(5).value = p.enCours
    row.getCell(6).value = p.enAttente
    row.getCell(7).value = p.terminees
    row.getCell(8).value = p.annulees
    row.getCell(9).value = p.enRetard
    row.getCell(10).value = p.avancement / 100

    applyDataRow(row, cols.length, ri % 2 === 1)

    // Style cells
    row.getCell(1).font = { ...row.getCell(1).font, bold: true }
    row.getCell(1).alignment = { ...row.getCell(1).alignment, horizontal: 'left' }
    row.getCell(2).alignment = { horizontal: 'left' }

    for (let c = 3; c <= 8; c++) {
      row.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' }
      row.getCell(c).numFmt = '#,##0'
    }

    // En retard: red
    const retardCell = row.getCell(9)
    retardCell.numFmt = '#,##0'
    if (p.enRetard > 0) {
      colorCell(retardCell, C.red, C.redBg)
    } else {
      colorCell(retardCell, C.green, C.greenBg)
    }

    // Avancement: percentage with data bar effect
    const avCell = row.getCell(10)
    avCell.numFmt = '0%'
    avCell.alignment = { horizontal: 'center', vertical: 'middle' }
    if (p.avancement >= 80) {
      avCell.font = { ...avCell.font, bold: true, color: { argb: C.teal } }
    } else if (p.avancement < 30) {
      avCell.font = { ...avCell.font, bold: true, color: { argb: C.red } }
    }
  })

  // Column widths
  ws.getColumn(1).width = 36
  ws.getColumn(2).width = 18
  for (let c = 3; c <= 9; c++) ws.getColumn(c).width = 13
  ws.getColumn(10).width = 15

  // Auto-filter
  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4 + sorted.length, column: cols.length } }

  // Conditional formatting on avancement (color scale: red → yellow → green)
  ws.addConditionalFormatting({
    ref: `J5:J${4 + sorted.length}`,
    rules: [{
      type: 'colorScale',
      priority: 1,
      cfvo: [
        { type: 'num', value: 0 },
        { type: 'num', value: 0.5 },
        { type: 'num', value: 1 },
      ],
      color: [
        { argb: 'FFFECACA' },
        { argb: 'FFFFFBEB' },
        { argb: 'FFBBF7D0' },
      ],
    }],
  })

  // Totals row
  if (sorted.length > 0) {
    const totalRow = ws.getRow(5 + sorted.length)
    totalRow.getCell(1).value = 'TOTAL'
    totalRow.getCell(1).font = { name: 'Calibri', bold: true, size: 11 }
    for (let c = 3; c <= 9; c++) {
      const colLetter = String.fromCharCode(64 + c)
      totalRow.getCell(c).value = { formula: `SUM(${colLetter}5:${colLetter}${4 + sorted.length})` } as ExcelJS.CellFormulaValue
      totalRow.getCell(c).font = { name: 'Calibri', bold: true, size: 11 }
      totalRow.getCell(c).numFmt = '#,##0'
      totalRow.getCell(c).alignment = { horizontal: 'center' }
    }
    totalRow.getCell(10).value = { formula: `AVERAGE(J5:J${4 + sorted.length})` } as ExcelJS.CellFormulaValue
    totalRow.getCell(10).numFmt = '0%'
    totalRow.getCell(10).font = { name: 'Calibri', bold: true, size: 11 }
    totalRow.getCell(10).alignment = { horizontal: 'center' }

    totalRow.height = 26
    totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber > cols.length) return
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.gray100 } }
      cell.border = {
        top: { style: 'medium', color: { argb: C.dark } },
        bottom: { style: 'medium', color: { argb: C.dark } },
      }
    })
  }
}

// ── SHEET 2: Taches en retard ────────────────────────────────────────
function buildRetardSheet(wb: ExcelJS.Workbook, tachesEnRetard: Tache[]) {
  const ws = wb.addWorksheet('Taches en retard', {
    properties: { tabColor: { argb: C.red } },
    views: [{ state: 'frozen', ySplit: 4, xSplit: 0 }],
  })

  const cols = ['Projet', 'Tache', 'Assigne', 'Priorite', 'Statut', 'Date echeance', 'Jours de retard', 'Avancement %']
  addTitleBanner(ws, 'TACHES EN RETARD', `${tachesEnRetard.length} tache${tachesEnRetard.length > 1 ? 's' : ''} en retard — tous projets`, cols.length)

  const headerRow = ws.getRow(4)
  cols.forEach((c, i) => { headerRow.getCell(i + 1).value = c })
  applyHeaderRow(headerRow, cols.length)

  const sorted = [...tachesEnRetard].sort((a, b) => lateDays(b) - lateDays(a))
  sorted.forEach((tache, ri) => {
    const row = ws.getRow(5 + ri)
    const ld = lateDays(tache)
    row.getCell(1).value = tache.projetNom
    row.getCell(2).value = tache.titre
    row.getCell(3).value = tache.assigneA ? `${tache.assigneA.prenom} ${tache.assigneA.nom}` : 'Non assigne'
    row.getCell(4).value = PRIORITE_LABELS[tache.priorite] || tache.priorite
    row.getCell(5).value = STATUT_LABELS[tache.statut] || tache.statut
    row.getCell(6).value = fmtDate(tache.dateEcheance)
    row.getCell(7).value = ld
    row.getCell(8).value = tache.pourcentageAvancement / 100

    applyDataRow(row, cols.length, ri % 2 === 1)

    row.getCell(1).font = { ...row.getCell(1).font, bold: true }
    row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' }

    // Priorite color
    const pColor = PRIORITE_COLORS[tache.priorite]
    if (pColor) colorCell(row.getCell(4), pColor, C.white, true)

    // Statut color
    const sColor = STATUT_COLORS[tache.statut]
    if (sColor) colorCell(row.getCell(5), sColor, C.white, true)

    // Jours retard: gradient red
    const retardCell = row.getCell(7)
    retardCell.alignment = { horizontal: 'center', vertical: 'middle' }
    if (ld >= 14) {
      colorCell(retardCell, C.white, C.red, true)
    } else if (ld >= 7) {
      colorCell(retardCell, C.red, C.redLight, true)
    } else {
      colorCell(retardCell, C.red, C.redBg, true)
    }
    retardCell.value = `J+${ld}`

    row.getCell(8).numFmt = '0%'
    row.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' }
  })

  ws.getColumn(1).width = 30
  ws.getColumn(2).width = 40
  ws.getColumn(3).width = 22
  ws.getColumn(4).width = 14
  ws.getColumn(5).width = 14
  ws.getColumn(6).width = 16
  ws.getColumn(7).width = 16
  ws.getColumn(8).width = 14

  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4 + sorted.length, column: cols.length } }
}

// ── SHEET 3: Detail Taches ───────────────────────────────────────────
function buildDetailSheet(wb: ExcelJS.Workbook, allTaches: Tache[]) {
  const ws = wb.addWorksheet('Detail Taches', {
    properties: { tabColor: { argb: C.blue } },
    views: [{ state: 'frozen', ySplit: 4, xSplit: 0 }],
  })

  const cols = ['Projet', 'Tache', 'Statut', 'Priorite', 'Assigne', 'Date debut', 'Date fin', 'Echeance', 'Avancement %', 'Semaine', 'Annee', 'Type prevision', 'Jalon', 'En retard']
  addTitleBanner(ws, 'DETAIL TACHES', `${allTaches.length} tache${allTaches.length > 1 ? 's' : ''} — tous projets`, cols.length)

  const headerRow = ws.getRow(4)
  cols.forEach((c, i) => { headerRow.getCell(i + 1).value = c })
  applyHeaderRow(headerRow, cols.length)

  const sorted = [...allTaches].sort((a, b) => a.projetNom.localeCompare(b.projetNom, 'fr') || (a.ordreAffichage ?? 999) - (b.ordreAffichage ?? 999))

  let prevProjet = ''
  sorted.forEach((tache, ri) => {
    const row = ws.getRow(5 + ri)
    const isNewProjet = tache.projetNom !== prevProjet
    prevProjet = tache.projetNom
    const ld = lateDays(tache)

    row.getCell(1).value = tache.projetNom
    row.getCell(2).value = tache.titre
    row.getCell(3).value = STATUT_LABELS[tache.statut] || tache.statut
    row.getCell(4).value = PRIORITE_LABELS[tache.priorite] || tache.priorite
    row.getCell(5).value = tache.assigneA ? `${tache.assigneA.prenom} ${tache.assigneA.nom}` : ''
    row.getCell(6).value = fmtDate(tache.dateDebut)
    row.getCell(7).value = fmtDate(tache.dateFin)
    row.getCell(8).value = fmtDate(tache.dateEcheance)
    row.getCell(9).value = tache.pourcentageAvancement / 100
    row.getCell(10).value = tache.semaine ? `S${tache.semaine}` : ''
    row.getCell(11).value = tache.annee || ''
    row.getCell(12).value = tache.typePrevision || ''
    row.getCell(13).value = tache.estJalon ? 'Oui' : ''
    row.getCell(14).value = ld > 0 ? `J+${ld}` : ''

    applyDataRow(row, cols.length, ri % 2 === 1)

    // Bold project name on change
    if (isNewProjet) {
      row.getCell(1).font = { ...row.getCell(1).font, bold: true, size: 11 }
    }

    // Statut color
    const sColor = STATUT_COLORS[tache.statut]
    if (sColor) colorCell(row.getCell(3), sColor, C.white, true)

    // Priorite color
    const pColor = PRIORITE_COLORS[tache.priorite]
    if (pColor) colorCell(row.getCell(4), pColor, C.white, true)

    // Avancement
    row.getCell(9).numFmt = '0%'
    row.getCell(9).alignment = { horizontal: 'center', vertical: 'middle' }

    // Retard
    if (ld > 0) {
      colorCell(row.getCell(14), C.red, C.redBg, true)
    }

    // Jalon
    if (tache.estJalon) {
      colorCell(row.getCell(13), C.teal, C.tealBg, true)
    }

    // Dates center
    for (let c = 6; c <= 8; c++) {
      row.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' }
    }
    for (let c = 10; c <= 13; c++) {
      row.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' }
    }
  })

  ws.getColumn(1).width = 30
  ws.getColumn(2).width = 40
  ws.getColumn(3).width = 13
  ws.getColumn(4).width = 13
  ws.getColumn(5).width = 22
  ws.getColumn(6).width = 14
  ws.getColumn(7).width = 14
  ws.getColumn(8).width = 14
  ws.getColumn(9).width = 14
  ws.getColumn(10).width = 10
  ws.getColumn(11).width = 8
  ws.getColumn(12).width = 18
  ws.getColumn(13).width = 8
  ws.getColumn(14).width = 12

  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4 + sorted.length, column: cols.length } }
}

// ── SHEET 4: Gantt (semaines) ────────────────────────────────────────
function buildGanttSheet(wb: ExcelJS.Workbook, allTaches: Tache[]) {
  const ws = wb.addWorksheet('Gantt', {
    properties: { tabColor: { argb: C.teal } },
    views: [{ state: 'frozen', ySplit: 5, xSplit: 3 }],
  })

  const dated = allTaches.filter((t) => t.dateDebut && (t.dateFin || t.dateEcheance))
  if (dated.length === 0) {
    ws.getCell(1, 1).value = 'Aucune tache avec des dates pour generer le Gantt'
    ws.getCell(1, 1).font = { name: 'Calibri', italic: true, color: { argb: C.gray500 } }
    return
  }

  const sorted = [...dated].sort((a, b) => (a.dateDebut || '').localeCompare(b.dateDebut || ''))

  // Determine week range
  const allDates = sorted.flatMap((t) => [t.dateDebut, t.dateFin, t.dateEcheance].filter(Boolean) as string[]).map((d) => new Date(d))
  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())))
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())))

  // Generate weeks from minDate to maxDate
  const weeksArr: { weekNum: number; year: number; start: Date }[] = []
  const cursor = new Date(minDate)
  // Align to Monday
  cursor.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7))
  while (cursor <= maxDate) {
    const wn = weekNumber(cursor)
    weeksArr.push({ weekNum: wn, year: cursor.getFullYear(), start: new Date(cursor) })
    cursor.setDate(cursor.getDate() + 7)
  }
  // Add one more week for padding
  const wnLast = weekNumber(cursor)
  weeksArr.push({ weekNum: wnLast, year: cursor.getFullYear(), start: new Date(cursor) })

  const fixedCols = 3 // Projet, Tache, Assigne
  const totalCols = fixedCols + weeksArr.length

  addTitleBanner(ws, 'DIAGRAMME GANTT', `${sorted.length} taches planifiees — vue par semaine`, totalCols)

  // Row 4: month groupings
  const row4 = ws.getRow(4)
  row4.height = 22
  for (let c = 1; c <= fixedCols; c++) {
    row4.getCell(c).value = ''
    row4.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.gray100 } }
  }

  // Group weeks by month
  let monthStart = fixedCols + 1
  let currentMonth = ''
  for (let wi = 0; wi < weeksArr.length; wi++) {
    const w = weeksArr[wi]
    const mKey = `${w.start.getFullYear()}-${w.start.getMonth()}`
    if (mKey !== currentMonth) {
      if (currentMonth !== '' && wi > 0) {
        // Merge previous month cells
        const end = fixedCols + wi
        if (end > monthStart) {
          ws.mergeCells(4, monthStart, 4, end)
        }
        const months = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec']
        const prevW = weeksArr[wi - 1]
        const cell = ws.getCell(4, monthStart)
        cell.value = `${months[prevW.start.getMonth()]} ${prevW.start.getFullYear()}`
        cell.font = { name: 'Calibri', bold: true, size: 10, color: { argb: C.gray700 } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.gray100 } }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.border = { bottom: { style: 'thin', color: { argb: C.gray300 } } }
        monthStart = fixedCols + wi + 1
      }
      currentMonth = mKey
      if (wi === 0) monthStart = fixedCols + 1
    }
  }
  // Last month
  if (weeksArr.length > 0) {
    const end = fixedCols + weeksArr.length
    if (end >= monthStart) {
      if (end > monthStart) ws.mergeCells(4, monthStart, 4, end)
      const months = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec']
      const lastW = weeksArr[weeksArr.length - 1]
      const cell = ws.getCell(4, monthStart)
      cell.value = `${months[lastW.start.getMonth()]} ${lastW.start.getFullYear()}`
      cell.font = { name: 'Calibri', bold: true, size: 10, color: { argb: C.gray700 } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.gray100 } }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = { bottom: { style: 'thin', color: { argb: C.gray300 } } }
    }
  }

  // Row 5: headers
  const headerRow = ws.getRow(5)
  headerRow.getCell(1).value = 'Projet'
  headerRow.getCell(2).value = 'Tache'
  headerRow.getCell(3).value = 'Assigne'
  weeksArr.forEach((w, i) => {
    headerRow.getCell(fixedCols + i + 1).value = `S${w.weekNum}`
  })
  applyHeaderRow(headerRow, totalCols)

  // Highlight current week column
  const nowWn = weekNumber(new Date())
  const nowYear = new Date().getFullYear()
  const todayColIdx = weeksArr.findIndex((w) => w.weekNum === nowWn && w.year === nowYear)

  // Data rows
  sorted.forEach((tache, ri) => {
    const row = ws.getRow(6 + ri)
    row.height = 20
    row.getCell(1).value = tache.projetNom
    row.getCell(1).font = { name: 'Calibri', size: 9.5, bold: true }
    row.getCell(1).alignment = { vertical: 'middle' }
    row.getCell(2).value = tache.titre
    row.getCell(2).font = { name: 'Calibri', size: 9.5 }
    row.getCell(2).alignment = { vertical: 'middle' }
    row.getCell(3).value = tache.assigneA ? `${tache.assigneA.prenom?.[0] || ''}. ${tache.assigneA.nom}` : ''
    row.getCell(3).font = { name: 'Calibri', size: 9 }
    row.getCell(3).alignment = { vertical: 'middle' }

    // Borders on fixed cols
    for (let c = 1; c <= fixedCols; c++) {
      row.getCell(c).border = {
        bottom: { style: 'hair', color: { argb: C.gray200 } },
        right: c === fixedCols ? { style: 'thin', color: { argb: C.gray300 } } : { style: 'hair', color: { argb: C.gray200 } },
      }
      if (ri % 2 === 1) {
        row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.gray50 } }
      }
    }

    // Determine task start/end weeks
    const tStart = new Date(tache.dateDebut!)
    const tEnd = new Date(tache.dateFin || tache.dateEcheance || tache.dateDebut!)
    const barColor = STATUT_COLORS[tache.statut] || C.gray500
    const isLate = lateDays(tache) > 0

    weeksArr.forEach((w, wi) => {
      const colNum = fixedCols + wi + 1
      const cell = row.getCell(colNum)
      const weekEnd = new Date(w.start)
      weekEnd.setDate(weekEnd.getDate() + 6)

      // Does this week overlap with the task?
      const overlaps = tStart <= weekEnd && tEnd >= w.start

      if (overlaps) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: barColor } }
        // Show percentage in the first overlapping cell
        const isFirst = wi === 0 || !(tStart <= new Date(weeksArr[wi - 1].start.getTime() + 6 * 86400000) && tEnd >= weeksArr[wi - 1].start)
        if (isFirst) {
          cell.value = `${tache.pourcentageAvancement}%`
          cell.font = { name: 'Calibri', size: 8, bold: true, color: { argb: C.white } }
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        }
        if (isLate) {
          cell.border = {
            top: { style: 'thin', color: { argb: C.red } },
            bottom: { style: 'thin', color: { argb: C.red } },
          }
        }
      } else {
        cell.border = { bottom: { style: 'hair', color: { argb: C.gray200 } } }
        if (ri % 2 === 1) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.gray50 } }
        }
      }

      // Current week highlight
      if (todayColIdx === wi && !overlaps) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.orangeLight } }
      }
    })
  })

  // Column widths
  ws.getColumn(1).width = 24
  ws.getColumn(2).width = 32
  ws.getColumn(3).width = 16
  for (let c = 1; c <= weeksArr.length; c++) {
    ws.getColumn(fixedCols + c).width = 6
  }
}

// ── SHEET 5: Repartition Statuts ─────────────────────────────────────
function buildRepartitionSheet(wb: ExcelJS.Workbook, projetStats: ProjetPlanningStats[]) {
  const ws = wb.addWorksheet('Repartition Statuts', {
    properties: { tabColor: { argb: C.amber } },
  })

  const statuts = ['A faire', 'En cours', 'En attente', 'Terminees', 'Annulees']
  const statusKeys: (keyof ProjetPlanningStats)[] = ['aFaire', 'enCours', 'enAttente', 'terminees', 'annulees']
  const statusColors = [C.gray500, C.blue, C.amber, C.teal, C.muted]
  const colCount = 2 + statuts.length // Projet + Total + statuts

  addTitleBanner(ws, 'REPARTITION PAR STATUT', 'Distribution des taches par statut et par projet', colCount)

  // Header
  const headerRow = ws.getRow(4)
  headerRow.getCell(1).value = 'Projet'
  headerRow.getCell(2).value = 'Total'
  statuts.forEach((s, i) => { headerRow.getCell(3 + i).value = s })
  applyHeaderRow(headerRow, colCount)

  // Color-code header cells for each statut
  statuts.forEach((_, i) => {
    const cell = headerRow.getCell(3 + i)
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusColors[i] } }
    cell.font = { name: 'Calibri', bold: true, size: 10.5, color: { argb: C.white } }
  })

  const sorted = [...projetStats].sort((a, b) => b.total - a.total)
  sorted.forEach((p, ri) => {
    const row = ws.getRow(5 + ri)
    row.getCell(1).value = p.projetNom
    row.getCell(2).value = p.total
    statusKeys.forEach((key, i) => {
      row.getCell(3 + i).value = p[key] as number
    })

    applyDataRow(row, colCount, ri % 2 === 1)
    row.getCell(1).font = { ...row.getCell(1).font, bold: true }
    row.getCell(2).font = { ...row.getCell(2).font, bold: true }
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }

    // Color code non-zero cells
    statusKeys.forEach((key, i) => {
      const val = p[key] as number
      const cell = row.getCell(3 + i)
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      if (val > 0) {
        cell.font = { ...cell.font, bold: true, color: { argb: statusColors[i] } }
      }
    })
  })

  // Global summary below
  const gapRow = 5 + sorted.length + 1
  ws.getRow(gapRow).height = 10

  const summaryStartRow = gapRow + 1
  ws.mergeCells(summaryStartRow, 1, summaryStartRow, colCount)
  const summaryTitle = ws.getCell(summaryStartRow, 1)
  summaryTitle.value = 'SYNTHESE GLOBALE'
  summaryTitle.font = { name: 'Calibri', bold: true, size: 12, color: { argb: C.white } }
  summaryTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.dark } }
  summaryTitle.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(summaryStartRow).height = 28

  const totals = {
    total: projetStats.reduce((s, p) => s + p.total, 0),
    aFaire: projetStats.reduce((s, p) => s + p.aFaire, 0),
    enCours: projetStats.reduce((s, p) => s + p.enCours, 0),
    enAttente: projetStats.reduce((s, p) => s + p.enAttente, 0),
    terminees: projetStats.reduce((s, p) => s + p.terminees, 0),
    annulees: projetStats.reduce((s, p) => s + p.annulees, 0),
  }

  // Summary grid: Statut | Nombre | %
  const summaryHeaders = ['Statut', 'Nombre', 'Pourcentage']
  const shRow = ws.getRow(summaryStartRow + 1)
  summaryHeaders.forEach((h, i) => {
    shRow.getCell(1 + i).value = h
    shRow.getCell(1 + i).font = { name: 'Calibri', bold: true, size: 10.5, color: { argb: C.white } }
    shRow.getCell(1 + i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.gray700 } }
    shRow.getCell(1 + i).alignment = { horizontal: 'center', vertical: 'middle' }
  })
  shRow.height = 24

  const totalKeys = ['aFaire', 'enCours', 'enAttente', 'terminees', 'annulees'] as const
  totalKeys.forEach((key, i) => {
    const row = ws.getRow(summaryStartRow + 2 + i)
    const val = totals[key]
    row.getCell(1).value = statuts[i]
    row.getCell(1).font = { name: 'Calibri', bold: true, size: 10.5, color: { argb: statusColors[i] } }
    row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
    row.getCell(2).value = val
    row.getCell(2).font = { name: 'Calibri', bold: true, size: 11 }
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(3).value = totals.total > 0 ? val / totals.total : 0
    row.getCell(3).numFmt = '0.0%'
    row.getCell(3).font = { name: 'Calibri', size: 10.5 }
    row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' }

    // Color bar visual
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.gray50 } }
    for (let c = 1; c <= 3; c++) {
      row.getCell(c).border = { bottom: { style: 'hair', color: { argb: C.gray200 } } }
    }
    row.height = 22
  })

  ws.getColumn(1).width = 30
  ws.getColumn(2).width = 12
  for (let c = 3; c <= colCount; c++) ws.getColumn(c).width = 14

  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4 + sorted.length, column: colCount } }
}

// ── SHEET 6: Indicateurs ─────────────────────────────────────────────
function buildIndicateursSheet(wb: ExcelJS.Workbook, projetStats: ProjetPlanningStats[], tachesEnRetard: Tache[]) {
  const ws = wb.addWorksheet('Indicateurs', {
    properties: { tabColor: { argb: C.teal } },
  })

  const colCount = 4
  addTitleBanner(ws, 'INDICATEURS CLES', 'Tableau de bord du suivi planning', colCount)

  const totals = {
    projets: projetStats.length,
    taches: projetStats.reduce((s, p) => s + p.total, 0),
    terminees: projetStats.reduce((s, p) => s + p.terminees, 0),
    enCours: projetStats.reduce((s, p) => s + p.enCours, 0),
    enRetard: tachesEnRetard.length,
    avancementMoyen: projetStats.length > 0 ? Math.round(projetStats.reduce((s, p) => s + p.avancement, 0) / projetStats.length) : 0,
  }

  const tauxTerminaison = totals.taches > 0 ? Math.round((totals.terminees / totals.taches) * 100) : 0
  const tauxRetard = totals.taches > 0 ? Math.round((totals.enRetard / totals.taches) * 100) : 0

  const kpis: { label: string; value: string; detail: string; color: string }[] = [
    { label: 'Nombre de projets suivis', value: `${totals.projets}`, detail: 'Projets avec acces planning', color: C.blue },
    { label: 'Total taches planifiees', value: `${totals.taches}`, detail: 'Toutes les taches, tous statuts', color: C.dark },
    { label: 'Taches terminees', value: `${totals.terminees}`, detail: `${tauxTerminaison}% du total`, color: C.teal },
    { label: 'Taches en cours', value: `${totals.enCours}`, detail: 'Travaux en cours actuellement', color: C.blue },
    { label: 'Taches en retard', value: `${totals.enRetard}`, detail: `${tauxRetard}% du total — echeance depassee`, color: C.red },
    { label: 'Avancement moyen', value: `${totals.avancementMoyen}%`, detail: 'Moyenne ponderee tous projets', color: totals.avancementMoyen >= 60 ? C.teal : C.amber },
  ]

  kpis.forEach((kpi, i) => {
    const row = ws.getRow(5 + i)
    row.height = 32

    // Colored indicator
    const indCell = row.getCell(1)
    indCell.value = ''
    indCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: kpi.color } }
    ws.getColumn(1).width = 3

    const labelCell = row.getCell(2)
    labelCell.value = kpi.label
    labelCell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: C.gray900 } }
    labelCell.alignment = { vertical: 'middle', indent: 1 }
    labelCell.border = { bottom: { style: 'hair', color: { argb: C.gray200 } } }

    const valCell = row.getCell(3)
    valCell.value = kpi.value
    valCell.font = { name: 'Calibri', size: 18, bold: true, color: { argb: kpi.color } }
    valCell.alignment = { horizontal: 'center', vertical: 'middle' }
    valCell.border = { bottom: { style: 'hair', color: { argb: C.gray200 } } }

    const detailCell = row.getCell(4)
    detailCell.value = kpi.detail
    detailCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: C.gray500 } }
    detailCell.alignment = { vertical: 'middle' }
    detailCell.border = { bottom: { style: 'hair', color: { argb: C.gray200 } } }
  })

  ws.getColumn(2).width = 32
  ws.getColumn(3).width = 18
  ws.getColumn(4).width = 36

  // Top retard projects
  const retardProjets = projetStats.filter((p) => p.enRetard > 0).sort((a, b) => b.enRetard - a.enRetard)
  if (retardProjets.length > 0) {
    const startRow = 5 + kpis.length + 2
    ws.mergeCells(startRow, 1, startRow, 4)
    const titleCell = ws.getCell(startRow, 1)
    titleCell.value = 'PROJETS AVEC TACHES EN RETARD'
    titleCell.font = { name: 'Calibri', bold: true, size: 12, color: { argb: C.white } }
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.red } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getRow(startRow).height = 28

    const subHeaderRow = ws.getRow(startRow + 1)
    subHeaderRow.getCell(2).value = 'Projet'
    subHeaderRow.getCell(3).value = 'En retard'
    subHeaderRow.getCell(4).value = 'Avancement'
    subHeaderRow.height = 22
    for (let c = 2; c <= 4; c++) {
      subHeaderRow.getCell(c).font = { name: 'Calibri', bold: true, size: 10, color: { argb: C.gray700 } }
      subHeaderRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.gray100 } }
      subHeaderRow.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' }
    }

    retardProjets.forEach((p, i) => {
      const row = ws.getRow(startRow + 2 + i)
      row.getCell(2).value = p.projetNom
      row.getCell(2).font = { name: 'Calibri', size: 10.5, bold: true }
      row.getCell(3).value = p.enRetard
      colorCell(row.getCell(3), C.red, C.redBg, true)
      row.getCell(4).value = p.avancement / 100
      row.getCell(4).numFmt = '0%'
      row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' }
      row.height = 20
    })
  }
}

// ── MAIN EXPORT FUNCTION ─────────────────────────────────────────────
export async function exportPlanningExcel(
  projetStats: ProjetPlanningStats[],
  tachesEnRetard: Tache[],
  allTaches: Tache[],
): Promise<void> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'MIKA Services'
  wb.created = new Date()
  wb.modified = new Date()

  buildIndicateursSheet(wb, projetStats, tachesEnRetard)
  buildSyntheseSheet(wb, projetStats)
  buildRetardSheet(wb, tachesEnRetard)
  buildDetailSheet(wb, allTaches)
  buildGanttSheet(wb, allTaches)
  buildRepartitionSheet(wb, projetStats)

  // Print setup for all sheets
  wb.eachSheet((ws) => {
    ws.pageSetup = {
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      paperSize: 9, // A4
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 },
    }
    ws.headerFooter = {
      oddFooter: '&L&8MIKA Services — Suivi Planning&C&8Page &P / &N&R&8&D',
    }
  })

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const now = new Date()
  const dateTag = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`
  a.href = url
  a.download = `MIKA_Planning_Suivi_${dateTag}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
