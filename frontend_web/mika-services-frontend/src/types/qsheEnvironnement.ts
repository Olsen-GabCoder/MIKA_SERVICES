export const TypeMesureEnvironnementale = {
  BRUIT: 'BRUIT', POUSSIERE: 'POUSSIERE', QUALITE_EAU: 'QUALITE_EAU', QUALITE_AIR: 'QUALITE_AIR',
  EMISSION_GAZ: 'EMISSION_GAZ', BIODIVERSITE: 'BIODIVERSITE', EROSION: 'EROSION', AUTRE: 'AUTRE',
} as const
export type TypeMesureEnvironnementale = (typeof TypeMesureEnvironnementale)[keyof typeof TypeMesureEnvironnementale]

export const TypeDechet = { INERTE: 'INERTE', NON_DANGEREUX: 'NON_DANGEREUX', DANGEREUX: 'DANGEREUX' } as const
export type TypeDechet = (typeof TypeDechet)[keyof typeof TypeDechet]

export interface SuiviEnvResponse {
  id: number; projetId: number; projetNom: string; typeMesure: TypeMesureEnvironnementale
  parametre: string; valeur: number | null; unite: string | null; limiteReglementaire: number | null
  dateMesure: string; localisation: string | null; observations: string | null
  conforme: boolean | null; depassement: boolean; createdAt: string | null; updatedAt: string | null
}

export interface DechetResponse {
  id: number; projetId: number; projetNom: string; typeDechet: TypeDechet; designation: string
  quantite: number | null; unite: string | null; filiereElimination: string | null
  transporteur: string | null; destination: string | null; numeroBsd: string | null
  dateEnlevement: string | null; observations: string | null; createdAt: string | null; updatedAt: string | null
}

export interface ProduitChimiqueResponse {
  id: number; code: string; nomCommercial: string; nomChimique: string | null
  fournisseur: string | null; pictogrammesGhs: string | null; mentionsDanger: string | null
  epiRequis: string | null; conditionsStockage: string | null; premiersSecours: string | null
  mesuresIncendie: string | null; fdsUrl: string | null; dateFds: string | null
  localisationStockage: string | null; quantiteStock: string | null; actif: boolean; fdsObsolete: boolean
  createdAt: string | null; updatedAt: string | null
}

export interface SuiviEnvCreateRequest { projetId: number; typeMesure: TypeMesureEnvironnementale; parametre: string; valeur?: number; unite?: string; limiteReglementaire?: number; dateMesure: string; localisation?: string; observations?: string; conforme?: boolean }
export interface DechetCreateRequest { projetId: number; typeDechet: TypeDechet; designation: string; quantite?: number; unite?: string; filiereElimination?: string; transporteur?: string; destination?: string; numeroBsd?: string; dateEnlevement?: string; observations?: string }
export interface ProduitChimiqueCreateRequest { code: string; nomCommercial: string; nomChimique?: string; fournisseur?: string; pictogrammesGhs?: string; mentionsDanger?: string; epiRequis?: string; conditionsStockage?: string; premiersSecours?: string; fdsUrl?: string; dateFds?: string; localisationStockage?: string; quantiteStock?: string }
export interface EnvironnementSummaryResponse { totalMesures: number; totalDechets: number; depassements: number }
export interface PaginatedResponse<T> { content: T[]; totalElements: number; totalPages: number; number: number; size: number }
