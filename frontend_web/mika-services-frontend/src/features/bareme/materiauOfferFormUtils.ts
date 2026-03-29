import type { MateriauOfferFormRow } from './components/MateriauOffresFormSection'
import type { BaremeMateriauOffreRequest } from './types'

export function toNullableNumber(value: string): number | null {
  const v = value.trim()
  if (!v) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export function materiauOffersHaveDuplicateSuppliers(
  rows: Array<{ fournisseurId: number | ''; fournisseurNom: string }>
): boolean {
  const ids = rows.filter((r) => r.fournisseurId !== '').map((r) => Number(r.fournisseurId))
  if (new Set(ids).size !== ids.length) return true
  const noms = rows
    .filter((r) => r.fournisseurId === '' && r.fournisseurNom.trim())
    .map((r) => r.fournisseurNom.trim().toLowerCase())
  return new Set(noms).size !== noms.length
}

export function formatMateriauSuppliersListSummary(
  rows: MateriauOfferFormRow[],
  fournisseurs: Array<{ id: number; nom: string }>
): string {
  const labels = rows.map((row) => {
    if (row.fournisseurId !== '') {
      const f = fournisseurs.find((x) => x.id === row.fournisseurId)
      return f?.nom ?? `#${row.fournisseurId}`
    }
    return row.fournisseurNom.trim() || '—'
  })
  if (labels.length === 0) return ''
  if (labels.length <= 2) return labels.join(', ')
  return `${labels.slice(0, 2).join(', ')}…`
}

/** Récap prix TTC pour la colonne latérale (locale fr-FR, suffixe F). */
export function formatMateriauPriceRangeSummaryFr(rows: Array<{ prixTtc: string }>): string {
  const nums = rows
    .map((r) => toNullableNumber(r.prixTtc))
    .filter((n): n is number => n != null && n > 0)
  if (nums.length === 0) return ''
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  if (min === max) return `${min.toLocaleString('fr-FR')} F`
  return `${min.toLocaleString('fr-FR')} – ${max.toLocaleString('fr-FR')} F`
}

export function materiauFormRowsToApiOffres(rows: MateriauOfferFormRow[]): BaremeMateriauOffreRequest[] {
  return rows.map((row) => ({
    fournisseurId: row.fournisseurId === '' ? null : Number(row.fournisseurId),
    fournisseurNom: row.fournisseurId !== '' ? null : row.fournisseurNom.trim() || null,
    fournisseurContact: row.fournisseurContact.trim() || null,
    prixTtc: toNullableNumber(row.prixTtc),
    datePrix: row.datePrix.trim() || null,
    prixEstime: row.prixEstime,
  }))
}
