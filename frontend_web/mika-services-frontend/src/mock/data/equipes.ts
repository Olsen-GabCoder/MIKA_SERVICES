import type { Equipe, PageResponse } from '@/types/chantier'

const chefSummary = { id: 1, nom: 'Mbenda', prenom: 'Jean', email: 'jean@mika.ga' }

export const mockEquipes: Equipe[] = [
  { id: 1, code: 'EQ-001', nom: 'Équipe Terrassement Nord', type: 'TERRASSEMENT', chefEquipe: chefSummary, effectif: 12, actif: true, createdAt: '2024-01-10T10:00:00', updatedAt: '2024-03-01T10:00:00' },
  { id: 2, code: 'EQ-002', nom: 'Équipe Voirie A', type: 'VOIRIE', chefEquipe: { id: 2, nom: 'Okoué', prenom: 'Marie', email: 'marie@mika.ga' }, effectif: 8, actif: true, createdAt: '2024-01-15T10:00:00', updatedAt: '2024-02-20T10:00:00' },
  { id: 3, code: 'EQ-003', nom: 'Équipe Assainissement', type: 'ASSAINISSEMENT', chefEquipe: undefined, effectif: 6, actif: true, createdAt: '2024-02-01T10:00:00', updatedAt: '2024-02-01T10:00:00' },
]

function pageResponse<T>(content: T[], page = 0, size = 20): PageResponse<T> {
  const totalElements = content.length
  const totalPages = Math.max(1, Math.ceil(totalElements / size))
  const start = page * size
  const pagedContent = content.slice(start, start + size)
  return { content: pagedContent, totalElements, totalPages, size, number: page, first: page === 0, last: page >= totalPages - 1 }
}

export function getMockEquipesPage(page = 0, size = 20): PageResponse<Equipe> {
  return pageResponse(mockEquipes, page, size)
}
