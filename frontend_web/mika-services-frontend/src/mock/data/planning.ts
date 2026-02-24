import type { Tache, PaginatedResponse } from '@/types/planning'
import { StatutTache, Priorite } from '@/types/planning'

const userSummary = { id: 1, nom: 'Mbenda', prenom: 'Jean', email: 'jean.mbenda@mika.ga' }

export const mockTaches: Tache[] = [
  { id: 1, projetId: 1, projetNom: 'Réhabilitation RN1',  titre: 'Décapage chaussée', description: 'Décapage sur 2 km', statut: StatutTache.TERMINEE, priorite: Priorite.HAUTE, assigneA: userSummary, dateDebut: '2024-02-01', dateFin: '2024-02-15', dateEcheance: '2024-02-15', pourcentageAvancement: 100, enRetard: false, tacheParentId: null, createdAt: '2024-01-20T10:00:00', updatedAt: '2024-02-15T16:00:00' },
  { id: 2, projetId: 1, projetNom: 'Réhabilitation RN1',  titre: 'Pose enrobé', description: 'Couche de liaison', statut: StatutTache.EN_COURS, priorite: Priorite.URGENTE, assigneA: userSummary, dateDebut: '2024-03-01', dateFin: null, dateEcheance: '2024-04-30', pourcentageAvancement: 40, enRetard: false, tacheParentId: null, createdAt: '2024-02-20T10:00:00', updatedAt: '2024-03-10T09:00:00' },
  { id: 3, projetId: 1, projetNom: 'Réhabilitation RN1',  titre: 'Signalisation temporaire', description: null, statut: StatutTache.A_FAIRE, priorite: Priorite.NORMALE, assigneA: null, dateDebut: null, dateFin: null, dateEcheance: '2024-05-15', pourcentageAvancement: 0, enRetard: true, tacheParentId: null, createdAt: '2024-01-15T10:00:00', updatedAt: '2024-01-15T10:00:00' },
  { id: 4, projetId: 2, projetNom: 'Assainissement Akébé',  titre: 'Contrôle conformité regards', description: 'Vérification des regards', statut: StatutTache.TERMINEE, priorite: Priorite.NORMALE, assigneA: { id: 2, nom: 'Okoué', prenom: 'Marie', email: 'marie.okoue@mika.ga' }, dateDebut: '2024-02-10', dateFin: '2024-02-25', dateEcheance: '2024-02-28', pourcentageAvancement: 100, enRetard: false, tacheParentId: null, createdAt: '2024-02-01T10:00:00', updatedAt: '2024-02-25T14:00:00' },
]

export const mockTachesEnRetard: Tache[] = mockTaches.filter((t) => t.enRetard)

function paginated<T>(content: T[], page = 0, size = 20): PaginatedResponse<T> {
  const totalElements = content.length
  const totalPages = Math.max(1, Math.ceil(totalElements / size))
  const start = page * size
  return { content: content.slice(start, start + size), totalElements, totalPages, number: page, size }
}

export function getMockTachesByProjet(projetId: number, page = 0, size = 20): PaginatedResponse<Tache> {
  const filtered = mockTaches.filter((t) => t.projetId === projetId)
  return paginated(filtered.length ? filtered : mockTaches.slice(0, 2), page, size)
}

export function getMockTachesEnRetard(): Tache[] {
  return mockTachesEnRetard
}
