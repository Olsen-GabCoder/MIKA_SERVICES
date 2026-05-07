/**
 * Export DQE au format Excel (.xlsx) — MIKA Services
 * Classeur structuré : en-tête projet, tableau DQE complet, sous-totaux, total général.
 */
import type * as XLSXType from 'xlsx'
import type { DqeExportPayload } from './dqeExport'

type XLSX = typeof XLSXType

function fmtPct(n: number): string {
  return n % 1 === 0 ? `${n}%` : `${Math.round(n * 100) / 100}%`
}

export async function buildDqeExcel(payload: DqeExportPayload): Promise<Blob> {
  const XLSX: XLSX = await import('xlsx')
  const { projet, chapitres, formatMontant } = payload

  const totalMontant = chapitres.reduce((s, c) => s + c.montantTotal, 0)
  const totalExecute = chapitres.reduce((s, c) => s + c.montantExecute, 0)
  const totalLignes = chapitres.reduce((s, c) => s + c.lignes.length, 0)
  const avancementGlobal = totalMontant > 0 ? Math.round((totalExecute / totalMontant) * 10000) / 100 : 0

  const rows: (string | number | null)[][] = []

  // ── En-tête document ──────────────────────────────────────────────
  rows.push(['DEVIS QUANTITATIF ET ESTIMATIF — MIKA SERVICES'])
  rows.push([])
  rows.push(['Projet', projet.nom, '', '', 'Date d\'export', new Date().toLocaleDateString('fr-FR')])
  rows.push(['Code projet', projet.codeProjet ?? '—', '', '', 'Responsable', projet.responsableProjet ? `${projet.responsableProjet.prenom} ${projet.responsableProjet.nom}` : '—'])
  rows.push(['N° de marché', projet.numeroMarche ?? '—', '', '', 'Structure', `${chapitres.length} chapitres / ${totalLignes} lignes`])
  rows.push(['Montant total HT', formatMontant(totalMontant), '', '', 'Avancement global', fmtPct(avancementGlobal)])
  rows.push(['Montant exécuté', formatMontant(totalExecute), '', '', 'Reste à exécuter', formatMontant(totalMontant - totalExecute)])
  rows.push([])

  // ── En-tête colonnes ──────────────────────────────────────────────
  const headerRowIdx = rows.length
  rows.push(['N° Prix', 'Désignation', 'Unité', 'Quantité', 'Prix Unitaire (HT)', 'Montant HT', 'Avancement %'])

  // ── Contenu par chapitre ──────────────────────────────────────────
  for (const chap of chapitres) {
    // Ligne chapitre (fusionnée visuellement)
    rows.push([`CHAPITRE ${chap.numero}`, chap.designation, '', '', '', '', ''])

    for (const ligne of chap.lignes) {
      rows.push([
        ligne.numeroPoste ?? '',
        ligne.designation,
        ligne.unite ?? '',
        ligne.quantite ?? null,
        ligne.prixUnitaire ?? null,
        ligne.montantTotal ?? null,
        ligne.avancementPct,
      ])
    }

    // Sous-total
    rows.push(['', `SOUS-TOTAL — Chapitre ${chap.numero}`, '', '', '', chap.montantTotal, chap.avancementPct != null ? chap.avancementPct : ''])
  }

  // ── Totaux ────────────────────────────────────────────────────────
  rows.push([])
  const totalRowIdx = rows.length
  rows.push(['', 'TOTAL GÉNÉRAL HT', '', '', '', totalMontant, avancementGlobal])
  rows.push(['', 'MONTANT EXÉCUTÉ', '', '', '', totalExecute, ''])
  rows.push(['', 'RESTE À EXÉCUTER', '', '', '', totalMontant - totalExecute, ''])

  // ── Construction feuille ──────────────────────────────────────────
  const ws = XLSX.utils.aoa_to_sheet(rows)

  // Largeurs de colonnes
  ws['!cols'] = [
    { wch: 14 },  // N° Prix
    { wch: 55 },  // Désignation
    { wch: 10 },  // Unité
    { wch: 14 },  // Quantité
    { wch: 18 },  // Prix Unitaire
    { wch: 22 },  // Montant HT
    { wch: 14 },  // Avancement
  ]

  // Fusions : titre + lignes chapitre
  const merges: XLSXType.Range[] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Titre
  ]

  // Fusionner les lignes chapitre (col A+B)
  let rowIdx = headerRowIdx + 1
  for (const chap of chapitres) {
    // Chapitre header: merge col A (numero) avec col B (designation) visuellement
    merges.push({ s: { r: rowIdx, c: 1 }, e: { r: rowIdx, c: 6 } })
    rowIdx += 1 + chap.lignes.length + 1 // lignes + sous-total
  }

  // Total rows merges
  for (let i = 0; i < 3; i++) {
    merges.push({ s: { r: totalRowIdx + i, c: 1 }, e: { r: totalRowIdx + i, c: 4 } })
  }

  ws['!merges'] = merges

  // ── Classeur ──────────────────────────────────────────────────────
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'DQE')

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
