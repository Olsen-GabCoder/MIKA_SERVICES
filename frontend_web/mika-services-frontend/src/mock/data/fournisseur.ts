import type { Fournisseur, Commande, PaginatedResponse } from '@/types/fournisseur'
import { StatutCommande } from '@/types/fournisseur'

export const mockFournisseurs: Fournisseur[] = [
  { id: 1, code: 'FOU-001', nom: 'BTP Gabon', adresse: 'Libreville, Zone industrielle', telephone: '+241 01 76 00 00', email: 'contact@btpgabon.ga', contactNom: 'M. Ondo', specialite: 'Béton, agrégats', noteEvaluation: 4.5, actif: true, nbCommandes: 12, createdAt: '2023-01-10T10:00:00', updatedAt: '2024-03-01T10:00:00' },
  { id: 2, code: 'FOU-002', nom: 'Enrobés du Gabon', adresse: 'Owendo', telephone: '+241 01 77 00 00', email: 'info@enrobes.ga', contactNom: 'Mme Mba', specialite: 'Enrobés', noteEvaluation: 4.2, actif: true, nbCommandes: 8, createdAt: '2023-03-15T10:00:00', updatedAt: '2024-02-20T10:00:00' },
  { id: 3, code: 'FOU-003', nom: 'Tuyaux et Canalisations', adresse: 'Port-Gentil', telephone: null, email: 'tuyaux@example.ga', contactNom: null, specialite: 'Buses, canalisations', noteEvaluation: 4.0, actif: true, nbCommandes: 5, createdAt: '2024-01-01T10:00:00', updatedAt: '2024-01-01T10:00:00' },
]

export const mockCommandes: Commande[] = [
  { id: 1, reference: 'CMD-2024-001', fournisseurId: 1, fournisseurNom: 'BTP Gabon', projetId: 1, projetNom: 'Réhabilitation RN1', designation: 'Livraison béton C25', montantTotal: 5_200_000, statut: StatutCommande.LIVREE, dateCommande: '2024-02-01', dateLivraisonPrevue: '2024-02-05', dateLivraisonEffective: '2024-02-04', notes: null, createdAt: '2024-02-01T10:00:00', updatedAt: '2024-02-04T14:00:00' },
  { id: 2, reference: 'CMD-2024-002', fournisseurId: 2, fournisseurNom: 'Enrobés du Gabon', projetId: 1, projetNom: 'Réhabilitation RN1', designation: 'Enrobé 0/10', montantTotal: 12_000_000, statut: StatutCommande.EN_LIVRAISON, dateCommande: '2024-03-10', dateLivraisonPrevue: '2024-03-20', dateLivraisonEffective: null, notes: null, createdAt: '2024-03-10T10:00:00', updatedAt: '2024-03-10T10:00:00' },
  { id: 3, reference: 'CMD-2024-003', fournisseurId: 3, fournisseurNom: 'Tuyaux et Canalisations', projetId: 2, projetNom: 'Assainissement Akébé', designation: 'Buses 800 mm', montantTotal: 8_500_000, statut: StatutCommande.CONFIRMEE, dateCommande: '2024-03-15', dateLivraisonPrevue: '2024-04-01', dateLivraisonEffective: null, notes: null, createdAt: '2024-03-15T10:00:00', updatedAt: '2024-03-15T10:00:00' },
]

function paginated<T>(content: T[], page = 0, size = 20): PaginatedResponse<T> {
  const totalElements = content.length
  const totalPages = Math.max(1, Math.ceil(totalElements / size))
  const start = page * size
  return { content: content.slice(start, start + size), totalElements, totalPages, number: page, size }
}

export function getMockFournisseursPage(page = 0, size = 20): PaginatedResponse<Fournisseur> {
  return paginated(mockFournisseurs, page, size)
}

export function getMockCommandesPage(page = 0, size = 20): PaginatedResponse<Commande> {
  return paginated(mockCommandes, page, size)
}
