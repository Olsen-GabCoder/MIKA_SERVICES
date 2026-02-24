export const StatutCommande = {
  BROUILLON: 'BROUILLON',
  ENVOYEE: 'ENVOYEE',
  CONFIRMEE: 'CONFIRMEE',
  EN_LIVRAISON: 'EN_LIVRAISON',
  LIVREE: 'LIVREE',
  ANNULEE: 'ANNULEE',
} as const

export type StatutCommande = (typeof StatutCommande)[keyof typeof StatutCommande]

export interface Fournisseur {
  id: number
  code: string
  nom: string
  adresse: string | null
  telephone: string | null
  email: string | null
  contactNom: string | null
  specialite: string | null
  noteEvaluation: number | null
  actif: boolean
  nbCommandes: number
  createdAt: string
  updatedAt: string
}

export interface Commande {
  id: number
  reference: string
  fournisseurId: number
  fournisseurNom: string
  projetId: number | null
  projetNom: string | null
  designation: string
  montantTotal: number | null
  statut: StatutCommande
  dateCommande: string | null
  dateLivraisonPrevue: string | null
  dateLivraisonEffective: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface FournisseurCreateRequest {
  nom: string
  adresse?: string
  telephone?: string
  email?: string
  contactNom?: string
  specialite?: string
}

export interface CommandeCreateRequest {
  fournisseurId: number
  projetId?: number
  designation: string
  montantTotal?: number
  dateCommande?: string
  dateLivraisonPrevue?: string
  notes?: string
}

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
