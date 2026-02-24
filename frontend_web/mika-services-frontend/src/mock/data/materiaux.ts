import type { MateriauSummary } from '@/types/materiel'
import type { PageResponse } from '@/types/projet'

const mockMateriaux: MateriauSummary[] = [
  { id: 1, code: 'MAT-001', nom: 'Ciment CPJ 42.5', type: 'CIMENT', unite: 'TONNE', stockActuel: 45, stockMinimum: 20, stockBas: false, fournisseur: 'BTP Gabon' },
  { id: 2, code: 'MAT-002', nom: 'Sable 0/5', type: 'SABLE', unite: 'M3', stockActuel: 120, stockMinimum: 50, stockBas: false, fournisseur: 'BTP Gabon' },
  { id: 3, code: 'MAT-003', nom: 'Gravier 5/15', type: 'GRAVIER', unite: 'M3', stockActuel: 8, stockMinimum: 15, stockBas: true, fournisseur: 'BTP Gabon' },
  { id: 4, code: 'MAT-004', nom: 'Fer a beton HA8', type: 'FER_A_BETON', unite: 'TONNE', stockActuel: 12, stockMinimum: 10, stockBas: false, fournisseur: 'Tuyaux et Canalisations' },
  { id: 5, code: 'MAT-005', nom: 'Buse 800 mm', type: 'BUSE', unite: 'UNITE', stockActuel: 3, stockMinimum: 20, stockBas: true, fournisseur: 'Tuyaux et Canalisations' },
]

function pageResponse<T>(content: T[], page = 0, size = 20): PageResponse<T> {
  const totalElements = content.length
  const totalPages = Math.max(1, Math.ceil(totalElements / size))
  const start = page * size
  const pagedContent = content.slice(start, start + size)
  return { content: pagedContent, totalElements, totalPages, size, number: page, first: page === 0, last: page >= totalPages - 1 }
}

export function getMockMateriauxPage(page = 0, size = 20): PageResponse<MateriauSummary> {
  return pageResponse(mockMateriaux, page, size)
}
