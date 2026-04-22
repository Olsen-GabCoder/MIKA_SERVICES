export const TypeCertification = {
  CACES_R482: 'CACES_R482', CACES_R486: 'CACES_R486', CACES_R487: 'CACES_R487',
  CACES_R489: 'CACES_R489', CACES_R490: 'CACES_R490', HABILITATION_ELECTRIQUE: 'HABILITATION_ELECTRIQUE',
  TRAVAIL_HAUTEUR: 'TRAVAIL_HAUTEUR', SST: 'SST', FIMO_FCO: 'FIMO_FCO', ADR: 'ADR',
  RISQUES_CHIMIQUES: 'RISQUES_CHIMIQUES', ATEX: 'ATEX', SECOURISME: 'SECOURISME',
  INCENDIE: 'INCENDIE', ECHAFAUDAGE: 'ECHAFAUDAGE', AUTRE: 'AUTRE',
} as const
export type TypeCertification = (typeof TypeCertification)[keyof typeof TypeCertification]

export const StatutCertification = { VALIDE: 'VALIDE', EXPIRE_BIENTOT: 'EXPIRE_BIENTOT', EXPIREE: 'EXPIREE', NON_OBTENUE: 'NON_OBTENUE' } as const
export type StatutCertification = (typeof StatutCertification)[keyof typeof StatutCertification]

export interface CertificationResponse {
  id: number; userId: number; userNom: string
  typeCertification: TypeCertification; libelle: string
  categorieNiveau: string | null; organismeFormation: string | null
  numeroCertificat: string | null; dateObtention: string | null
  dateExpiration: string | null; dureeValiditeMois: number | null
  documentUrl: string | null; observations: string | null
  statut: StatutCertification; joursAvantExpiration: number | null
  createdAt: string | null; updatedAt: string | null
}

export interface CertificationCreateRequest {
  userId: number; typeCertification: TypeCertification; libelle: string
  categorieNiveau?: string; organismeFormation?: string; numeroCertificat?: string
  dateObtention?: string; dateExpiration?: string; dureeValiditeMois?: number
  documentUrl?: string; observations?: string
}

export interface CertificationUpdateRequest {
  typeCertification?: TypeCertification; libelle?: string
  categorieNiveau?: string; organismeFormation?: string; numeroCertificat?: string
  dateObtention?: string; dateExpiration?: string; dureeValiditeMois?: number
  documentUrl?: string; observations?: string
}

export interface CertificationSummaryResponse { totalCertifications: number; valides: number; expirentBientot: number; expirees: number }

export interface PaginatedResponse<T> { content: T[]; totalElements: number; totalPages: number; number: number; size: number }
