export enum TypeEvenement {
  NC = 'NC',
  RC = 'RC',
  PPI = 'PPI',
}

export enum CategorieEvenement {
  QUALITE = 'QUALITE',
  SECURITE = 'SECURITE',
  ENVIRONNEMENT = 'ENVIRONNEMENT',
}

export enum OrigineEvenement {
  TRAVAUX = 'TRAVAUX',
  RECEPTION_PRODUITS = 'RECEPTION_PRODUITS',
  ETUDE = 'ETUDE',
}

export enum StatutEvenement {
  BROUILLON = 'BROUILLON',
  DETECTEE = 'DETECTEE',
  EN_TRAITEMENT = 'EN_TRAITEMENT',
  EN_VERIFICATION = 'EN_VERIFICATION',
  LEVEE = 'LEVEE',
  ANALYSEE = 'ANALYSEE',
  CLOTUREE = 'CLOTUREE',
}

export enum NumeroSection {
  SECTION_1 = 'SECTION_1',
  SECTION_2 = 'SECTION_2',
  SECTION_4 = 'SECTION_4',
  SECTION_5 = 'SECTION_5',
  SECTION_6 = 'SECTION_6',
  SECTION_7 = 'SECTION_7',
}

export enum ChoixTraitement {
  CORRECTION = 'CORRECTION',
  DEROGATION = 'DEROGATION',
}

export enum RoleCollegial {
  DT = 'DT',
  RQ = 'RQ',
  CT = 'CT',
  CC = 'CC',
}

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
