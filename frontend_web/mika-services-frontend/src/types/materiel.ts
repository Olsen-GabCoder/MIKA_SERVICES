import type { PageResponse } from './projet'

// ============================================
// Engins
// ============================================
export type TypeEngin = 'PELLETEUSE' | 'BULLDOZER' | 'NIVELEUSE' | 'COMPACTEUR' | 'CAMION_BENNE' | 'CAMION_CITERNE' | 'GRUE' | 'CHARGEUSE' | 'RETROCHARGEUSE' | 'BETONNIERE' | 'FINISSEUR' | 'GROUPE_ELECTROGENE' | 'POMPE' | 'FOREUSE' | 'CONCASSEUR' | 'AUTRE'
export type StatutEngin = 'DISPONIBLE' | 'EN_SERVICE' | 'EN_MAINTENANCE' | 'EN_PANNE' | 'HORS_SERVICE' | 'EN_TRANSIT'

export interface EnginSummary {
  id: number
  code: string
  nom: string
  type: TypeEngin
  marque?: string
  immatriculation?: string
  statut: StatutEngin
  estLocation: boolean
}

export interface Engin extends EnginSummary {
  modele?: string
  numeroSerie?: string
  anneeFabrication?: number
  dateAcquisition?: string
  valeurAcquisition?: number
  heuresCompteur: number
  proprietaire?: string
  coutLocationJournalier?: number
  actif: boolean
  createdAt?: string
  updatedAt?: string
}

export interface EnginCreateRequest {
  code: string
  nom: string
  type: TypeEngin
  marque?: string
  modele?: string
  immatriculation?: string
  numeroSerie?: string
  anneeFabrication?: number
  dateAcquisition?: string
  valeurAcquisition?: number
  proprietaire?: string
  estLocation?: boolean
  coutLocationJournalier?: number
}

// ============================================
// Affectations Engin ↔ Chantier
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

/** Correspond au MouvementEnginResponse du backend (list + détail). */
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

export { type PageResponse }
