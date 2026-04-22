export const NiveauRisque = { FAIBLE: 'FAIBLE', MOYEN: 'MOYEN', ELEVE: 'ELEVE', CRITIQUE: 'CRITIQUE' } as const
export type NiveauRisque = (typeof NiveauRisque)[keyof typeof NiveauRisque]

export const CategorieRisque = {
  CHUTE_HAUTEUR: 'CHUTE_HAUTEUR', CHUTE_PLAIN_PIED: 'CHUTE_PLAIN_PIED', EFFONDREMENT: 'EFFONDREMENT',
  ELECTRIQUE: 'ELECTRIQUE', MECANIQUE: 'MECANIQUE', CHIMIQUE: 'CHIMIQUE', THERMIQUE: 'THERMIQUE',
  BRUIT: 'BRUIT', MANUTENTION: 'MANUTENTION', CIRCULATION: 'CIRCULATION', ENSEVELISSEMENT: 'ENSEVELISSEMENT',
  INCENDIE_EXPLOSION: 'INCENDIE_EXPLOSION', BIOLOGIQUE: 'BIOLOGIQUE', PSYCHOSOCIAL: 'PSYCHOSOCIAL',
  ENVIRONNEMENTAL: 'ENVIRONNEMENTAL', AUTRE: 'AUTRE',
} as const
export type CategorieRisque = (typeof CategorieRisque)[keyof typeof CategorieRisque]

export interface RisqueResponse {
  id: number; reference: string; titre: string; description: string | null
  categorie: CategorieRisque | null; uniteTravail: string | null; dangerIdentifie: string | null
  probabiliteBrute: number; graviteBrute: number; niveauBrut: NiveauRisque
  mesuresElimination: string | null; mesuresSubstitution: string | null
  mesuresIngenierie: string | null; mesuresAdministratives: string | null; mesuresEpi: string | null
  probabiliteResiduelle: number | null; graviteResiduelle: number | null; niveauResiduel: NiveauRisque | null
  projetId: number; projetNom: string; sousProjetId: number | null; sousProjetNom: string | null
  zoneConcernee: string | null; actif: boolean
  createdAt: string | null; updatedAt: string | null
}

export interface RisqueCreateRequest {
  projetId: number; titre: string; description?: string; categorie?: CategorieRisque
  uniteTravail?: string; dangerIdentifie?: string
  probabiliteBrute?: number; graviteBrute?: number
  mesuresElimination?: string; mesuresSubstitution?: string; mesuresIngenierie?: string
  mesuresAdministratives?: string; mesuresEpi?: string
  probabiliteResiduelle?: number; graviteResiduelle?: number
  sousProjetId?: number; zoneConcernee?: string
}

export interface RisqueUpdateRequest {
  titre?: string; description?: string; categorie?: CategorieRisque
  uniteTravail?: string; dangerIdentifie?: string
  probabiliteBrute?: number; graviteBrute?: number
  mesuresElimination?: string; mesuresSubstitution?: string; mesuresIngenierie?: string
  mesuresAdministratives?: string; mesuresEpi?: string
  probabiliteResiduelle?: number; graviteResiduelle?: number
  zoneConcernee?: string; actif?: boolean
}

export interface RisqueSummaryResponse {
  totalRisques: number; risquesActifs: number; critiquesOuEleves: number; parNiveauBrut: Record<string, number>
}

export interface PaginatedResponse<T> { content: T[]; totalElements: number; totalPages: number; number: number; size: number }
