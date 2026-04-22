export const TypeEvenement = {
  NC: 'NC',
  RC: 'RC',
  PPI: 'PPI',
} as const
export type TypeEvenement = (typeof TypeEvenement)[keyof typeof TypeEvenement]

export const CategorieEvenement = {
  QUALITE: 'QUALITE',
  SECURITE: 'SECURITE',
  ENVIRONNEMENT: 'ENVIRONNEMENT',
} as const
export type CategorieEvenement = (typeof CategorieEvenement)[keyof typeof CategorieEvenement]

export const OrigineEvenement = {
  TRAVAUX: 'TRAVAUX',
  RECEPTION_PRODUITS: 'RECEPTION_PRODUITS',
  ETUDE: 'ETUDE',
} as const
export type OrigineEvenement = (typeof OrigineEvenement)[keyof typeof OrigineEvenement]

export const StatutEvenement = {
  BROUILLON: 'BROUILLON',
  DETECTEE: 'DETECTEE',
  EN_TRAITEMENT: 'EN_TRAITEMENT',
  EN_VERIFICATION: 'EN_VERIFICATION',
  LEVEE: 'LEVEE',
  ANALYSEE: 'ANALYSEE',
  CLOTUREE: 'CLOTUREE',
} as const
export type StatutEvenement = (typeof StatutEvenement)[keyof typeof StatutEvenement]

export const NumeroSection = {
  SECTION_1: 'SECTION_1',
  SECTION_2: 'SECTION_2',
  SECTION_4: 'SECTION_4',
  SECTION_5: 'SECTION_5',
  SECTION_6: 'SECTION_6',
  SECTION_7: 'SECTION_7',
} as const
export type NumeroSection = (typeof NumeroSection)[keyof typeof NumeroSection]

export const ChoixTraitement = {
  CORRECTION: 'CORRECTION',
  DEROGATION: 'DEROGATION',
} as const
export type ChoixTraitement = (typeof ChoixTraitement)[keyof typeof ChoixTraitement]

export const RoleCollegial = {
  DT: 'DT',
  RQ: 'RQ',
  CT: 'CT',
  CC: 'CC',
} as const
export type RoleCollegial = (typeof RoleCollegial)[keyof typeof RoleCollegial]

export interface EvenementQualiteListResponse {
  id: number
  reference: string
  typeEvenement: TypeEvenement
  categories: CategorieEvenement[]
  origine: OrigineEvenement
  statut: StatutEvenement
  ouvrageConcerne: string | null
  projetId: number
  projetNom: string
  createurNom: string | null
  createdAt: string | null
}

export interface EvenementQualiteResponse extends EvenementQualiteListResponse {
  controleExigeCctp: boolean
  description: string | null
  fournisseurNom: string | null
  numeroBc: string | null
  numeroBl: string | null
  dateLivraison: string | null
  createurId: number | null
  sections: SectionResponse[]
  updatedAt: string | null
}

export interface SectionResponse {
  id: number
  numeroSection: NumeroSection
  contenu: string | null
  signataireDesigneId: number | null
  signataireDesigneNom: string | null
  signataireEffectifId: number | null
  signataireEffectifNom: string | null
  dateSignature: string | null
  signee: boolean
  choixTraitement: ChoixTraitement | null
  necessiteCapa: boolean | null
  signatairesCollegiaux: SignataireCollegialResponse[]
  actionsTraitement: ActionTraitementResponse[]
  piecesJointes: PieceJointeResponse[]
}

export interface SignataireCollegialResponse {
  id: number
  roleAttendu: RoleCollegial
  signataireDesigneId: number | null
  signataireDesigneNom: string | null
  signataireEffectifId: number | null
  signataireEffectifNom: string | null
  dateSignature: string | null
  signee: boolean
}

export interface ActionTraitementResponse {
  id: number
  descriptionAction: string
  responsable: string | null
  delaiPrevu: string | null
}

export interface PieceJointeResponse {
  id: number
  urlFichier: string
  legende: string | null
  ordreAffichage: number
}

export interface EvenementQualiteCreateRequest {
  projetId: number
  typeEvenement: TypeEvenement
  categories: CategorieEvenement[]
  origine: OrigineEvenement
  description: string
  ouvrageConcerne?: string
  controleExigeCctp?: boolean
  fournisseurNom?: string
  numeroBc?: string
  numeroBl?: string
  dateLivraison?: string
  signataires?: Record<string, number>
  signatairesSection6?: Record<string, number>
  createurId?: number
}

export interface EvenementQualiteUpdateRequest {
  ouvrageConcerne?: string
  description?: string
  fournisseurNom?: string
  numeroBc?: string
  numeroBl?: string
  dateLivraison?: string
  controleExigeCctp?: boolean
}
