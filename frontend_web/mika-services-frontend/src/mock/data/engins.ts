import type { EnginSummary } from '@/types/materiel'
import type { PageResponse } from '@/types/projet'

const mockEngins: EnginSummary[] = [
  { id: 1, code: 'ENG-001', nom: 'Pelleteuse CAT 320', type: 'PELLETEUSE', marque: 'Caterpillar', immatriculation: 'LB-1234-A', statut: 'EN_SERVICE', estLocation: false },
  { id: 2, code: 'ENG-002', nom: 'Bulldozer D6', type: 'BULLDOZER', marque: 'Caterpillar', immatriculation: 'LB-1235-A', statut: 'DISPONIBLE', estLocation: false },
  { id: 3, code: 'ENG-003', nom: 'Compacteur tandem', type: 'COMPACTEUR', marque: 'Hamm', immatriculation: undefined, statut: 'EN_MAINTENANCE', estLocation: true },
  { id: 4, code: 'ENG-004', nom: 'Camion benne 20t', type: 'CAMION_BENNE', marque: 'Volvo', immatriculation: 'OW-5678-B', statut: 'EN_SERVICE', estLocation: false },
  { id: 5, code: 'ENG-005', nom: 'Grue mobile 35t', type: 'GRUE', marque: 'Liebherr', immatriculation: undefined, statut: 'DISPONIBLE', estLocation: true },
]

function pageResponse<T>(content: T[], page = 0, size = 20): PageResponse<T> {
  const totalElements = content.length
  const totalPages = Math.max(1, Math.ceil(totalElements / size))
  const start = page * size
  const pagedContent = content.slice(start, start + size)
  return { content: pagedContent, totalElements, totalPages, size, number: page, first: page === 0, last: page >= totalPages - 1 }
}

export function getMockEnginsPage(page = 0, size = 20): PageResponse<EnginSummary> {
  return pageResponse(mockEngins, page, size)
}
