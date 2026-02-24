export const TypeDocument = {
  PLAN: 'PLAN',
  RAPPORT: 'RAPPORT',
  PHOTO: 'PHOTO',
  CONTRAT: 'CONTRAT',
  FACTURE: 'FACTURE',
  PV_REUNION: 'PV_REUNION',
  FICHE_TECHNIQUE: 'FICHE_TECHNIQUE',
  FICHE_MISSION: 'FICHE_MISSION',
  CV: 'CV',
  PERMIS: 'PERMIS',
  ATTESTATION: 'ATTESTATION',
  AUTRE: 'AUTRE',
} as const

export type TypeDocument = (typeof TypeDocument)[keyof typeof TypeDocument]

export interface DocumentFile {
  id: number
  nomOriginal: string
  typeMime: string | null
  tailleOctets: number
  typeDocument: TypeDocument
  description: string | null
  projetId: number | null
  projetNom: string | null
  uploadeParNom: string | null
  downloadUrl: string
  tailleFormatee: string
  createdAt: string
  updatedAt: string
}

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
