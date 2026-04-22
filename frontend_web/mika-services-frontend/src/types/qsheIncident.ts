// --- Enums ---

export const TypeIncident = {
  ACCIDENT_TRAVAIL: 'ACCIDENT_TRAVAIL',
  PRESQU_ACCIDENT: 'PRESQU_ACCIDENT',
  INCIDENT_ENVIRONNEMENTAL: 'INCIDENT_ENVIRONNEMENTAL',
  PREMIER_SECOURS: 'PREMIER_SECOURS',
  DOMMAGE_MATERIEL: 'DOMMAGE_MATERIEL',
  MALADIE_PROFESSIONNELLE: 'MALADIE_PROFESSIONNELLE',
} as const
export type TypeIncident = (typeof TypeIncident)[keyof typeof TypeIncident]

export const GraviteIncident = {
  MINEURE: 'MINEURE',
  LEGERE: 'LEGERE',
  GRAVE: 'GRAVE',
  MORTELLE: 'MORTELLE',
} as const
export type GraviteIncident = (typeof GraviteIncident)[keyof typeof GraviteIncident]

export const StatutIncident = {
  BROUILLON: 'BROUILLON',
  DECLARE: 'DECLARE',
  EN_INVESTIGATION: 'EN_INVESTIGATION',
  INVESTIGATION_TERMINEE: 'INVESTIGATION_TERMINEE',
  CLOTURE: 'CLOTURE',
} as const
export type StatutIncident = (typeof StatutIncident)[keyof typeof StatutIncident]

export const LocalisationCorporelle = {
  TETE: 'TETE', VISAGE: 'VISAGE', YEUX: 'YEUX', COU: 'COU',
  EPAULE_DROITE: 'EPAULE_DROITE', EPAULE_GAUCHE: 'EPAULE_GAUCHE',
  BRAS_DROIT: 'BRAS_DROIT', BRAS_GAUCHE: 'BRAS_GAUCHE',
  MAIN_DROITE: 'MAIN_DROITE', MAIN_GAUCHE: 'MAIN_GAUCHE', DOIGT: 'DOIGT',
  THORAX: 'THORAX', ABDOMEN: 'ABDOMEN', DOS_COLONNE: 'DOS_COLONNE', BASSIN: 'BASSIN',
  CUISSE_DROITE: 'CUISSE_DROITE', CUISSE_GAUCHE: 'CUISSE_GAUCHE',
  GENOU_DROIT: 'GENOU_DROIT', GENOU_GAUCHE: 'GENOU_GAUCHE',
  JAMBE_DROITE: 'JAMBE_DROITE', JAMBE_GAUCHE: 'JAMBE_GAUCHE',
  PIED_DROIT: 'PIED_DROIT', PIED_GAUCHE: 'PIED_GAUCHE',
  ORGANES_INTERNES: 'ORGANES_INTERNES', MULTIPLE: 'MULTIPLE', NON_PRECISE: 'NON_PRECISE',
} as const
export type LocalisationCorporelle = (typeof LocalisationCorporelle)[keyof typeof LocalisationCorporelle]

// --- Interfaces ---

export interface VictimeResponse {
  id: number
  userId: number | null
  nom: string
  prenom: string
  poste: string | null
  entreprise: string | null
  anciennete: string | null
  typeContrat: string | null
  natureLesion: string | null
  localisationCorporelle: LocalisationCorporelle | null
  descriptionBlessure: string | null
  arretTravail: boolean
  nbJoursArret: number
  hospitalisation: boolean
  declarationCnss: boolean
  dateDeclarationCnss: string | null
}

export interface TemoinResponse {
  id: number
  nom: string
  prenom: string | null
  telephone: string | null
  email: string | null
  entreprise: string | null
  temoignage: string | null
}

export interface IncidentResponse {
  id: number
  reference: string
  titre: string
  description: string | null
  typeIncident: TypeIncident
  gravite: GraviteIncident
  statut: StatutIncident
  dateIncident: string
  heureIncident: string | null
  lieu: string | null
  zoneChantier: string | null
  latitude: number | null
  longitude: number | null
  projetId: number
  projetNom: string
  sousProjetId: number | null
  sousProjetNom: string | null
  declareParId: number | null
  declareParNom: string | null
  descriptionCirconstances: string | null
  activiteEnCours: string | null
  equipementImplique: string | null
  epiPortes: string | null
  causeImmediate: string | null
  causeRacine: string | null
  mesuresConservatoires: string | null
  dateEcheanceCnss: string | null
  declarationCnssEffectuee: boolean
  dateDeclarationCnss: string | null
  declarationCnssEnRetard: boolean
  dateEcheanceInspectionTravail: string | null
  declarationInspectionEffectuee: boolean
  dateDeclarationInspection: string | null
  declarationInspectionEnRetard: boolean
  nbVictimes: number
  nbTemoins: number
  nbPiecesJointes: number
  victimes: VictimeResponse[]
  temoins: TemoinResponse[]
  createdAt: string | null
  updatedAt: string | null
}

export interface IncidentSummaryResponse {
  totalIncidents: number
  incidentsGraves: number
  totalJoursArret: number
  declarationsCnssEnRetard: number
  incidentsParType: Record<string, number>
  incidentsParGravite: Record<string, number>
}

// --- Requests ---

export interface VictimeCreateRequest {
  nom: string
  prenom: string
  userId?: number
  poste?: string
  entreprise?: string
  anciennete?: string
  typeContrat?: string
  natureLesion?: string
  localisationCorporelle?: LocalisationCorporelle
  descriptionBlessure?: string
  arretTravail?: boolean
  nbJoursArret?: number
  hospitalisation?: boolean
}

export interface TemoinCreateRequest {
  nom: string
  prenom?: string
  telephone?: string
  email?: string
  entreprise?: string
  temoignage?: string
}

export interface IncidentCreateRequest {
  projetId: number
  titre: string
  description?: string
  typeIncident: TypeIncident
  gravite: GraviteIncident
  dateIncident: string
  heureIncident?: string
  lieu?: string
  zoneChantier?: string
  latitude?: number
  longitude?: number
  sousProjetId?: number
  declareParId?: number
  descriptionCirconstances?: string
  activiteEnCours?: string
  equipementImplique?: string
  epiPortes?: string
  causeImmediate?: string
  causeRacine?: string
  mesuresConservatoires?: string
  victimes?: VictimeCreateRequest[]
  temoins?: TemoinCreateRequest[]
}

export interface IncidentUpdateRequest {
  titre?: string
  description?: string
  typeIncident?: TypeIncident
  gravite?: GraviteIncident
  statut?: StatutIncident
  dateIncident?: string
  heureIncident?: string
  lieu?: string
  zoneChantier?: string
  latitude?: number
  longitude?: number
  sousProjetId?: number
  descriptionCirconstances?: string
  activiteEnCours?: string
  equipementImplique?: string
  epiPortes?: string
  causeImmediate?: string
  causeRacine?: string
  mesuresConservatoires?: string
  declarationCnssEffectuee?: boolean
  dateDeclarationCnss?: string
  declarationInspectionEffectuee?: boolean
  dateDeclarationInspection?: string
}

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
