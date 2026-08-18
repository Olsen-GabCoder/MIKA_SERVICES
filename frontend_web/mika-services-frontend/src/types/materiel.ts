import type { PageResponse } from './projet'

// ============================================
// Engins
// ============================================
export type TypeEngin = 'PELLETEUSE' | 'BULLDOZER' | 'NIVELEUSE' | 'COMPACTEUR' | 'CAMION_BENNE' | 'CAMION_CITERNE' | 'GRUE' | 'CHARGEUSE' | 'RETROCHARGEUSE' | 'BETONNIERE' | 'FINISSEUR' | 'GROUPE_ELECTROGENE' | 'POMPE' | 'FOREUSE' | 'CONCASSEUR' | 'AUTRE'
export type StatutEngin = 'DISPONIBLE' | 'EN_SERVICE' | 'EN_MAINTENANCE' | 'EN_PANNE' | 'IMMOBILISE' | 'HORS_SERVICE' | 'EN_TRANSIT' | 'REFORME'
export type EtatEngin = 'NEUF' | 'BON' | 'CORRECT' | 'USE' | 'MAUVAIS' | 'IRREPARABLE'
export type ModeAcquisition = 'ACHAT' | 'LOCATION_LONGUE_DUREE' | 'LOCATION_COURTE' | 'CREDIT_BAIL' | 'PRET'
export type TypeCarburant = 'DIESEL' | 'ESSENCE' | 'ELECTRIQUE' | 'HYBRIDE' | 'AUCUN'

export interface EnginSummary {
  id: number
  code: string
  nom: string
  type: TypeEngin
  marque?: string
  immatriculation?: string
  statut: StatutEngin
  etat?: EtatEngin
  estLocation: boolean
  photo?: string
  chantierActuel?: string
}

export interface Engin extends EnginSummary {
  modele?: string
  numeroSerie?: string
  anneeFabrication?: number
  dateAcquisition?: string
  dateMiseEnService?: string
  valeurAcquisition?: number
  heuresCompteur: number
  modeAcquisition?: ModeAcquisition
  proprietaire?: string
  coutLocationJournalier?: number
  carburant?: TypeCarburant
  puissance?: string
  poids?: string
  capacite?: string
  caracteristiques?: string
  qrCodeToken?: string
  latitude?: number
  longitude?: number
  notes?: string
  actif: boolean
  createdAt?: string
  updatedAt?: string
}

export interface EnginCreateRequest {
  code?: string | null
  nom: string
  type: TypeEngin
  marque?: string
  modele?: string
  immatriculation?: string
  numeroSerie?: string
  anneeFabrication?: number
  dateAcquisition?: string
  dateMiseEnService?: string
  valeurAcquisition?: number
  proprietaire?: string
  estLocation?: boolean
  coutLocationJournalier?: number
  etat?: EtatEngin
  modeAcquisition?: ModeAcquisition
  carburant?: TypeCarburant
  puissance?: string
  poids?: string
  capacite?: string
  caracteristiques?: string
  notes?: string
}

export interface EnginUpdateRequest {
  nom?: string
  type?: TypeEngin
  marque?: string
  modele?: string
  immatriculation?: string
  numeroSerie?: string
  anneeFabrication?: number
  heuresCompteur?: number
  statut?: StatutEngin
  proprietaire?: string
  estLocation?: boolean
  coutLocationJournalier?: number
  etat?: EtatEngin
  modeAcquisition?: ModeAcquisition
  dateMiseEnService?: string
  carburant?: TypeCarburant
  puissance?: string
  poids?: string
  capacite?: string
  caracteristiques?: string
  notes?: string
  latitude?: number
  longitude?: number
}

// ============================================
// Affectations Engin <-> Chantier
// ============================================
export type StatutAffectation = 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE' | 'SUSPENDUE'

export interface AffectationEnginResponse {
  id: number
  projetId: number
  projetNom: string
  enginId: number
  enginNom: string
  enginCode: string
  dateDebut: string
  dateFin?: string
  heuresPrevues?: number
  heuresReelles: number
  statut: StatutAffectation
  observations?: string
  createdAt?: string
}

export interface AffectationEnginUpdateRequest {
  dateDebut?: string
  dateFin?: string
  heuresPrevues?: number
  heuresReelles?: number
  statut?: StatutAffectation
  observations?: string
}

// ============================================
// Positions (historique)
// ============================================
export type SourcePosition = 'QR_SCAN' | 'GPS_AUTO' | 'MANUEL' | 'CHANTIER'

export interface PositionEngin {
  id: number
  enginId: number
  latitude: number
  longitude: number
  source: SourcePosition
  precisionMetres?: number
  chantierNom?: string
  confirmePar?: string
  horodatage: string
}

export interface PositionEnginCreateRequest {
  latitude: number
  longitude: number
  source?: SourcePosition
  precisionMetres?: number
  chantierNom?: string
  confirmePar?: string
}

// ============================================
// Inspections quotidiennes
// ============================================
export type EtatGeneralInspection = 'BON' | 'CORRECT' | 'MAUVAIS'

export interface ChecklistItem {
  code: string
  label: string
  ok: boolean
  commentaire?: string
}

export interface InspectionEngin {
  id: number
  enginId: number
  dateInspection: string
  inspectePar?: string
  compteurHeures?: number
  checklist: ChecklistItem[]
  etatGeneral: EtatGeneralInspection
  anomaliesDetectees: boolean
  commentaire?: string
  signature?: string
  incidentCreeId?: number
  createdAt?: string
}

export interface InspectionEnginCreateRequest {
  dateInspection: string
  inspectePar?: string
  compteurHeures?: number
  checklist: ChecklistItem[]
  etatGeneral: EtatGeneralInspection
  commentaire?: string
  signature?: string
}

// ============================================
// Coûts / TCO
// ============================================
export interface LigneCout {
  type: string // MAINTENANCE, CARBURANT, LOCATION, ACQUISITION
  description: string
  date?: string
  montant: number
}

export interface CoutEngin {
  enginId: number
  totalMaintenance: number
  totalCarburant: number
  totalLocation: number
  valeurAcquisition?: number
  tco: number
  lignes: LigneCout[]
}

// ============================================
// Matériaux
// ============================================
export type TypeMateriau = 'CIMENT' | 'SABLE' | 'GRAVIER' | 'FER_A_BETON' | 'ENROBE' | 'BORDURE' | 'BUSE' | 'BOIS' | 'PEINTURE' | 'CARRELAGE' | 'TUYAU_PVC' | 'AGREGAT' | 'BITUME' | 'GEOTEXTILE' | 'AUTRE'
export type Unite = 'TONNE' | 'M3' | 'M2' | 'SAC' | 'UNITE'

export interface MateriauSummary {
  id: number
  code: string
  nom: string
  type: TypeMateriau
  unite: Unite
  stockActuel: number
  stockMinimum: number
  stockBas: boolean
  fournisseur?: string
}

export interface Materiau extends MateriauSummary {
  description?: string
  prixUnitaire?: number
  actif: boolean
  createdAt?: string
  updatedAt?: string
}

export interface MateriauCreateRequest {
  code: string
  nom: string
  type: TypeMateriau
  unite: Unite
  description?: string
  prixUnitaire?: number
  stockActuel?: number
  stockMinimum?: number
  fournisseur?: string
}

// ============================================
// Mouvements Engins
// ============================================
export type StatutMouvementEngin = 'EN_ATTENTE_DEPART' | 'EN_TRANSIT' | 'RECU' | 'ANNULE'
export type TypeMouvementEnginEvenement = 'DEPART_CONFIRME' | 'RECEPTION_CONFIRMEE' | 'ANNULATION' | 'COMMENTAIRE'

export interface MouvementEnginSummary {
  id: number
  enginId: number
  enginCode: string
  enginNom: string
  projetOrigineId?: number
  projetOrigineNom?: string
  projetDestinationId: number
  projetDestinationNom: string
  initiateurUserId: number
  initiateurNom: string
  statut: StatutMouvementEngin
  dateDemande: string
  dateDepartConfirmee?: string
  dateReceptionConfirmee?: string
  commentaire?: string
  createdAt: string
  updatedAt: string
}

export interface MouvementEnginCreateRequest {
  enginId: number
  projetOrigineId?: number
  projetDestinationId: number
  commentaire?: string
}

export interface MouvementEnginActionRequest {
  commentaire?: string
}

// ============================================
// Demandes de Matériel (DMA)
// ============================================
export type StatutDemandeMateriel =
  | 'SOUMISE'
  | 'EN_VALIDATION_CHANTIER'
  | 'EN_VALIDATION_PROJET'
  | 'PRISE_EN_CHARGE'
  | 'EN_ATTENTE_COMPLEMENT'
  | 'EN_COMMANDE'
  | 'LIVRE'
  | 'REJETEE'
  | 'CLOTUREE'

export type PrioriteDemandeMateriel = 'NORMALE' | 'URGENTE'

export interface DemandeMaterielLigne {
  id: number
  designation: string
  materiauId?: number
  materiauCode?: string
  quantite: number
  unite: string
  prixUnitaireEst?: number
  fournisseurSuggere?: string
}

export interface DemandeMaterielHistorique {
  id: number
  deStatut?: StatutDemandeMateriel
  versStatut: StatutDemandeMateriel
  userId: number
  userNom: string
  dateTransition: string
  commentaire?: string
}

export interface DemandeMateriel {
  id: number
  reference: string
  projetId: number
  projetNom: string
  createurUserId: number
  createurNom: string
  statut: StatutDemandeMateriel
  priorite: PrioriteDemandeMateriel
  dateSouhaitee?: string
  commentaire?: string
  montantEstime?: number
  commandeId?: number
  commandeReference?: string
  lignes: DemandeMaterielLigne[]
  createdAt: string
  updatedAt: string
}

export interface DemandeMaterielLignePayload {
  designation: string
  materiauId?: number
  quantite: number
  unite: string
  prixUnitaireEst?: number
  fournisseurSuggere?: string
}

export interface DemandeMaterielCreateRequest {
  projetId: number
  priorite: PrioriteDemandeMateriel
  dateSouhaitee?: string
  commentaire?: string
  lignes: DemandeMaterielLignePayload[]
}

// ============================================
// Maintenance
// ============================================
export type TypeOperationMaintenance = 'VIDANGE' | 'GRAISSAGE' | 'REVISION' | 'REPARATION' | 'CONTROLE_TECHNIQUE' | 'CHANGEMENT_PIECES' | 'ENTRETIEN_PREVENTIF' | 'AUTRE'
export type StatutMaintenance = 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE'

export interface OperationMaintenance {
  id: number
  enginId: number
  enginCode: string
  enginNom?: string
  typeOperation: TypeOperationMaintenance
  statut: StatutMaintenance
  description?: string
  echeanceDate?: string
  echeanceHeures?: number
  coutEstime?: number
  coutReel?: number
  executePar?: string
  dateRealisation?: string
  incidentSourceId?: number
  planMaintenanceId?: number
  createdAt?: string
  updatedAt?: string
}

export interface OperationMaintenanceCreateRequest {
  typeOperation: TypeOperationMaintenance
  description?: string
  echeanceDate?: string
  echeanceHeures?: number
  coutEstime?: number
  executePar?: string
}

export interface OperationMaintenanceUpdateRequest {
  typeOperation?: TypeOperationMaintenance
  statut?: StatutMaintenance
  description?: string
  echeanceDate?: string
  echeanceHeures?: number
  coutEstime?: number
  coutReel?: number
  executePar?: string
  dateRealisation?: string
}

// ============================================
// Plans de maintenance récurrents
// ============================================
export interface PlanMaintenance {
  id: number
  enginId: number
  enginCode: string
  titre: string
  description?: string
  typeOperation: TypeOperationMaintenance
  intervalleJours?: number
  intervalleHeures?: number
  intervalleKm?: number
  seuilAlerte: number
  actif: boolean
  derniereExecution?: string
  dernierCompteur?: number
  prochaineEcheance?: string
  prochainCompteur?: number
  echeanceDateDepassee: boolean
  echeanceCompteurDepassee: boolean
  createdAt?: string
  updatedAt?: string
}

export interface PlanMaintenanceCreateRequest {
  titre: string
  description?: string
  typeOperation: TypeOperationMaintenance
  intervalleJours?: number
  intervalleHeures?: number
  intervalleKm?: number
  seuilAlerte?: number
}

export interface PlanMaintenanceUpdateRequest {
  titre?: string
  description?: string
  typeOperation?: TypeOperationMaintenance
  intervalleJours?: number
  intervalleHeures?: number
  intervalleKm?: number
  seuilAlerte?: number
  actif?: boolean
}

// ============================================
// Incidents
// ============================================
export type TypeIncidentEngin = 'PANNE' | 'ACCIDENT' | 'VOL' | 'VANDALISME' | 'USURE_PREMATUREE' | 'DEFAUT_TECHNIQUE' | 'AUTRE'
export type GraviteIncident = 'MINEURE' | 'MOYENNE' | 'MAJEURE' | 'CRITIQUE'

export interface IncidentEngin {
  id: number
  enginId: number
  enginCode: string
  typeIncident: TypeIncidentEngin
  gravite: GraviteIncident
  dateIncident: string
  description?: string
  lieu?: string
  signalePar?: string
  resolu: boolean
  dateResolution?: string
  actionsCorrectives?: string
  createdAt?: string
  updatedAt?: string
}

export interface IncidentEnginCreateRequest {
  typeIncident: TypeIncidentEngin
  gravite: GraviteIncident
  dateIncident: string
  description?: string
  lieu?: string
  signalePar?: string
}

export interface IncidentEnginUpdateRequest {
  typeIncident?: TypeIncidentEngin
  gravite?: GraviteIncident
  description?: string
  lieu?: string
  signalePar?: string
  resolu?: boolean
  dateResolution?: string
  actionsCorrectives?: string
}

// ============================================
// Documents
// ============================================
export type TypeDocumentEngin = 'CARTE_GRISE' | 'ASSURANCE' | 'CONTROLE_TECHNIQUE' | 'CERTIFICAT_CONFORMITE' | 'BON_LIVRAISON' | 'FACTURE' | 'PHOTO' | 'RAPPORT' | 'AUTRE'

export interface DocumentEngin {
  id: number
  enginId: number
  enginCode: string
  typeDocument: TypeDocumentEngin
  nom: string
  urlFichier?: string
  dateExpiration?: string
  commentaire?: string
  createdAt?: string
  updatedAt?: string
}

export interface DocumentEnginCreateRequest {
  typeDocument: TypeDocumentEngin
  nom: string
  urlFichier?: string
  dateExpiration?: string
  commentaire?: string
}

export interface DocumentEnginUpdateRequest {
  typeDocument?: TypeDocumentEngin
  nom?: string
  urlFichier?: string
  dateExpiration?: string
  commentaire?: string
}

// ============================================
// Relevés compteur
// ============================================
export interface ReleveCompteur {
  id: number
  enginId: number
  dateReleve: string
  valeurHeures: number
  relevePar?: string
  commentaire?: string
  createdAt?: string
}

export interface ReleveCompteurCreateRequest {
  dateReleve: string
  valeurHeures: number
  relevePar?: string
  commentaire?: string
}

// ============================================
// Consommation carburant
// ============================================
export interface ConsommationCarburant {
  id: number
  enginId: number
  datePlein: string
  quantiteLitres: number
  coutTotal?: number
  heuresCompteurAuPlein?: number
  pleinPar?: string
  commentaire?: string
  createdAt?: string
}

export interface ConsommationCarburantCreateRequest {
  datePlein: string
  quantiteLitres: number
  coutTotal?: number
  heuresCompteurAuPlein?: number
  pleinPar?: string
  commentaire?: string
}

// ============================================
// Stats dashboard
// ============================================
export interface EnginStats {
  totalEngins: number
  enService: number
  disponibles: number
  enPanne: number
  enMaintenance: number
  tauxDisponibilite: number
  parType: Record<string, number>
  parStatut: Record<string, number>
  alertesMaintenance: number
  incidentsNonResolus: number
}

// ============================================
// Carnet de bord (timeline)
// ============================================
export interface CarnetEnginEntry {
  type: string
  date: string
  titre: string
  detail?: string
  couleur: string
}

export interface CarnetEngin {
  enginId: number
  enginCode: string
  entries: CarnetEnginEntry[]
}

// ============================================
// Carte (positions engins)
// ============================================
export interface EnginCarte {
  id: number
  code: string
  nom: string
  type: TypeEngin
  statut: StatutEngin
  marque?: string
  chantierNom?: string
  latitude: number
  longitude: number
  /** Horodatage de la dernière position GPS réelle (absent si position déduite du chantier) */
  horodatage?: string
  /** GPS_AUTO, QR_SCAN, MANUEL ou CHANTIER */
  sourcePosition?: string
}

// ============================================
// Heures mensuelles (graphique barres)
// ============================================
export interface HeuresMensuelles {
  enginId: number
  mois: HeuresMois[]
}

export interface HeuresMois {
  mois: string
  label: string
  heures: number
}

// ============================================
// Échéances
// ============================================
export interface EcheanceEngin {
  date: string
  titre: string
  detail?: string
  couleur: string
  enginId?: number
  enginCode?: string
  sourceType: string
  sourceId?: number
}

// ============================================
// Alertes actives du parc
// ============================================
export interface AlerteEngin {
  niveau: string
  titre: string
  detail: string
  enginId?: number
  enginCode?: string
  couleur: string
  pulse: boolean
  sourceType: string
  sourceId?: number
}

export { type PageResponse }
