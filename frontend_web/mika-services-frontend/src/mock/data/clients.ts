import type { Client, PageResponse } from '@/types/projet'

/** Clients prédéfinis alignés avec le DataInitializer backend */
export const mockClients: Client[] = [
  { id: 1, code: 'CLI-ETAT-001', nom: 'État Gabon', type: 'ETAT_GABON', actif: true },
  { id: 2, code: 'CLI-MIN-001', nom: "Ministère des Travaux Publics", type: 'MINISTERE', actif: true },
  { id: 3, code: 'CLI-MIN-002', nom: "Ministère de l'Éducation", type: 'MINISTERE', actif: true },
  { id: 4, code: 'CLI-COL-001', nom: 'Ville de Libreville', type: 'COLLECTIVITE', actif: true },
  { id: 5, code: 'CLI-COL-002', nom: "Commune d'Owendo", type: 'COLLECTIVITE', actif: true },
  { id: 6, code: 'CLI-EP-001', nom: 'Maurel & Prom', type: 'ENTREPRISE_PRIVEE', actif: true },
  { id: 7, code: 'CLI-EP-002', nom: 'GABOIL', type: 'ENTREPRISE_PRIVEE', actif: true },
  { id: 8, code: 'CLI-EP-003', nom: 'ATRICOM', type: 'ENTREPRISE_PRIVEE', actif: true },
  { id: 9, code: 'CLI-EP-004', nom: 'AVANTIS', type: 'ENTREPRISE_PRIVEE', actif: true },
  { id: 10, code: 'CLI-EP-005', nom: 'BGFI Bank', type: 'ENTREPRISE_PRIVEE', actif: true },
]

function pageResponse<T>(content: T[], page = 0, size = 500): PageResponse<T> {
  const totalElements = content.length
  const totalPages = Math.max(1, Math.ceil(totalElements / size))
  const start = page * size
  const pagedContent = content.slice(start, start + size)
  return { content: pagedContent, totalElements, totalPages, size, number: page, first: page === 0, last: page >= totalPages - 1 }
}

export function getMockClientsPage(page = 0, size = 500): PageResponse<Client> {
  return pageResponse(mockClients, page, size)
}
