// ============================================
// Types Projet - MIKA SERVICES
// ============================================

// Enums
export type TypeProjet = 'VOIRIE' | 'ROUTE' | 'CHAUSSEE' | 'PONT' | 'OUVRAGE_ART' | 'BATIMENT' | 'ASSAINISSEMENT' | 'TERRASSEMENT' | 'MIXTE' | 'GENIE_CIVIL' | 'REHABILITATION' | 'AMENAGEMENT' | 'AUTRE'
export type StatutProjet = 'EN_ATTENTE' | 'PLANIFIE' | 'EN_COURS' | 'SUSPENDU' | 'TERMINE' | 'ABANDONNE' | 'RECEPTION_PROVISOIRE' | 'RECEPTION_DEFINITIVE'
export type TypeClient = 'ETAT_GABON' | 'MINISTERE' | 'COLLECTIVITE' | 'ENTREPRISE_PUBLIQUE' | 'ENTREPRISE_PRIVEE' | 'PARTICULIER'
export type SourceFinancement = 'ETAT_GABONAIS' | 'BGFIBANK' | 'BAD' | 'BM' | 'AFD' | 'PARTENARIAT_PUBLIC_PRIVE' | 'FONDS_PROPRES' | 'MIXTE'
export type TypePartenaire = 'SOUS_TRAITANT' | 'CO_TRAITANT' | 'FOURNISSEUR_STRATEGIQUE' | 'BUREAU_CONTROLE' | 'PARTENAIRE_TECHNIQUE'
export type TypeTravaux = 'TERRASSEMENT' | 'VOIRIE' | 'ASSAINISSEMENT' | 'GENIE_CIVIL' | 'BATIMENT' | 'PONT' | 'OUVRAGE_ART' | 'AMENAGEMENT' | 'REHABILITATION'
export type StatutSousProjet = 'PLANIFIE' | 'EN_COURS' | 'TERMINE' | 'SUSPENDU'
export type Priorite = 'BASSE' | 'NORMALE' | 'HAUTE' | 'CRITIQUE' | 'URGENTE'
export type StatutPointBloquant = 'OUVERT' | 'EN_COURS' | 'RESOLU' | 'FERME' | 'ESCALADE'
export type TypePrevision = 'HEBDOMADAIRE' | 'MENSUELLE' | 'TRIMESTRIELLE' | 'PRODUCTION' | 'APPROVISIONNEMENT' | 'RESSOURCES_HUMAINES' | 'MATERIEL'
export type PhaseEtude = 'APS' | 'APD' | 'EXE' | 'GEOTECHNIQUE' | 'HYDRAULIQUE' | 'EIES' | 'PAES'
/** État de validation par l'administration (liste déroulante dans l'avancement des études) */
export type EtatValidationEtude = 'NON_DEPOSE' | 'EN_ATTENTE' | 'EN_COURS' | 'VALIDE' | 'REFUSE'
export type ModeSuiviMensuel = 'AUTO' | 'MANUEL'

/** Libellés des types de projet (affichage liste, détail, export) */
export const TYPE_PROJET_LABELS: Record<string, string> = {
  VOIRIE: 'Voirie',
  ROUTE: 'Route',
  CHAUSSEE: 'Chaussée',
  PONT: 'Pont',
  OUVRAGE_ART: "Ouvrage d'art",
  BATIMENT: 'Bâtiment',
  ASSAINISSEMENT: 'Assainissement',
  TERRASSEMENT: 'Terrassement',
  MIXTE: 'Mixte',
  GENIE_CIVIL: 'Génie Civil',
  REHABILITATION: 'Réhabilitation',
  AMENAGEMENT: 'Aménagement',
  AUTRE: 'Autre',
}

/** Retourne le libellé à afficher pour un type (ou le type personnalisé si AUTRE) */
function getSingleTypeLabel(type: TypeProjet, typePersonnalise?: string | null): string {
  if (type === 'AUTRE' && typePersonnalise?.trim()) return typePersonnalise.trim()
  return TYPE_PROJET_LABELS[type] ?? type.replace(/_/g, ' ')
}

/** Retourne le libellé à afficher pour le(s) type(s) de projet (sélection multiple). Accepte types (tableau) ou type (simple) pour compatibilité API. */
export function getTypeProjetDisplay(typesOrType: TypeProjet[] | TypeProjet, typePersonnalise?: string | null): string {
  const types = Array.isArray(typesOrType) ? typesOrType : typesOrType ? [typesOrType] : []
  if (types.length === 0) return '—'
  const labels = types.map((t) => getSingleTypeLabel(t, typePersonnalise))
  return labels.join(', ')
}

/** Normalise le champ type(s) d’un projet (API peut renvoyer type ou types). */
export function getProjetTypes(projet: { types?: TypeProjet[]; type?: TypeProjet }): TypeProjet[] {
  if (projet.types && projet.types.length > 0) return projet.types
  if (projet.type) return [projet.type]
  return []
}

// Interfaces
export interface AvancementEtudeProjet {
  id: number
  projetId: number
  phase: PhaseEtude
  avancementPct?: number
  dateDepot?: string
  etatValidation?: string
}

export interface ProjetUserSummary {
  id: number
  nom: string
  prenom: string
  email: string
}

export interface Client {
  id: number
  code: string
  nom: string
  type: TypeClient
  ministere?: string
  telephone?: string
  email?: string
  adresse?: string
  contactPrincipal?: string
  telephoneContact?: string
  actif: boolean
  createdAt?: string
}

export interface Partenaire {
  id: number
  code: string
  nom: string
  type: TypePartenaire
  pays?: string
  telephone?: string
  email?: string
  adresse?: string
  contactPrincipal?: string
  actif: boolean
  createdAt?: string
}

export interface Projet {
  id: number
  numeroMarche?: string
  nom: string
  description?: string
  /** Types de projet (sélection multiple). Conservé pour compatibilité API : si l’API ne renvoie que type, le front utilise types = [type]. */
  types?: TypeProjet[]
  type?: TypeProjet
  typePersonnalise?: string
  statut: StatutProjet
  client?: Client
  sourceFinancement?: SourceFinancement
  imputationBudgetaire?: string
  province?: string
  ville?: string
  quartier?: string
  montantHT?: number
  montantTTC?: number
  montantInitial?: number
  montantRevise?: number
  delaiMois?: number
  modeSuiviMensuel?: ModeSuiviMensuel
  dateDebut?: string
  dateFin?: string
  dateDebutReel?: string
  dateFinReelle?: string
  avancementGlobal: number
  avancementPhysiquePct?: number
  avancementFinancierPct?: number
  delaiConsommePct?: number
  besoinsMateriel?: string
  besoinsHumain?: string
  observations?: string
  propositionsAmelioration?: string
  responsableProjet?: ProjetUserSummary
  partenairePrincipal?: string
  actif: boolean
  nombreSousProjets: number
  nombrePointsBloquantsOuverts: number
  avancementEtudes?: AvancementEtudeProjet[]
  createdAt?: string
  updatedAt?: string
}

export interface ProjetSummary {
  id: number
  nom: string
  types?: TypeProjet[]
  type?: TypeProjet
  typePersonnalise?: string
  statut: StatutProjet
  clientNom?: string
  montantHT?: number
  avancementGlobal: number
  dateDebut?: string
  dateFin?: string
  responsableNom?: string
  /** Aligné API : pour masquer édition / désactivation si non autorisé */
  responsableProjetId?: number
}

export interface SousProjet {
  id: number
  projetId: number
  projetNom: string
  code: string
  nom: string
  description?: string
  typeTravaux: TypeTravaux
  statut: StatutSousProjet
  montantHT?: number
  montantTTC?: number
  delaiMois?: number
  dateDebut?: string
  dateFin?: string
  avancementPhysique: number
  responsable?: ProjetUserSummary
  createdAt?: string
  updatedAt?: string
}

export interface PointBloquant {
  id: number
  projetId: number
  projetNom: string
  titre: string
  description?: string
  priorite: Priorite
  statut: StatutPointBloquant
  detectePar?: ProjetUserSummary
  assigneA?: ProjetUserSummary
  dateDetection: string
  dateResolution?: string
  actionCorrective?: string
  createdAt?: string
  updatedAt?: string
}

export interface CAPrevisionnelRealise {
  id: number
  projetId: number
  mois: number
  annee: number
  caPrevisionnel: number
  caRealise: number
  ecart: number
  avancementCumule: number
}

export interface Prevision {
  id: number
  projetId: number
  projetNom: string
  semaine?: number
  annee: number
  description?: string
  type: TypePrevision
  dateDebut?: string
  dateFin?: string
  avancementPct?: number | null
  createdAt?: string
}

/** Résumé du point projet dans un PV hebdo (pour l’historique). */
export interface PvResumeResponse {
  reunionId: number
  dateReunion: string
  resumeTravauxPrevisions?: string
  pointsBloquantsResume?: string
  besoinsMateriel?: string
  besoinsHumain?: string
  propositionsAmelioration?: string
  avancementPhysiquePct?: number
  avancementFinancierPct?: number
  delaiConsommePct?: number
}

/** Une période (semaine) dans l’historique du projet. */
export interface PeriodeHistoriqueResponse {
  semaine: number
  annee: number
  dateReunion?: string
  previsions: Prevision[]
  pointsBloquants: PointBloquant[]
  pvResume?: PvResumeResponse | null
}

/** Réponse agrégée de l’historique d’un projet. */
export interface ProjetHistoriqueResponse {
  projetId: number
  projetNom: string
  periodes: PeriodeHistoriqueResponse[]
}

export interface RevisionBudget {
  id: number
  projetId: number
  ancienMontant: number
  nouveauMontant: number
  motif?: string
  dateRevision: string
  validePar?: ProjetUserSummary
  createdAt?: string
}

// Request types
export interface ProjetCreateRequest {
  numeroMarche?: string
  nom: string
  description?: string
  /** Types de projet (sélection multiple). Au moins un type requis. */
  types: TypeProjet[]
  typePersonnalise?: string
  statut?: StatutProjet
  clientId?: number
  sourceFinancement?: SourceFinancement
  imputationBudgetaire?: string
  province?: string
  ville?: string
  quartier?: string
  montantHT?: number
  montantTTC?: number
  montantInitial?: number
  montantRevise?: number
  delaiMois?: number
  modeSuiviMensuel?: ModeSuiviMensuel
  dateDebut?: string
  dateFin?: string
  dateDebutReel?: string
  dateFinReelle?: string
  avancementGlobal?: number
  avancementPhysiquePct?: number
  avancementFinancierPct?: number
  delaiConsommePct?: number
  besoinsMateriel?: string
  besoinsHumain?: string
  observations?: string
  responsableProjetId?: number
  partenairePrincipal?: string
  propositionsAmelioration?: string
  partenaireIds?: number[]
}

export interface ProjetUpdateRequest {
  numeroMarche?: string
  nom?: string
  description?: string
  types?: TypeProjet[]
  typePersonnalise?: string
  statut?: StatutProjet
  clientId?: number
  sourceFinancement?: SourceFinancement
  imputationBudgetaire?: string
  province?: string
  ville?: string
  quartier?: string
  montantHT?: number
  montantTTC?: number
  montantInitial?: number
  montantRevise?: number
  delaiMois?: number
  modeSuiviMensuel?: ModeSuiviMensuel
  dateDebut?: string
  dateFin?: string
  dateDebutReel?: string
  dateFinReelle?: string
  avancementGlobal?: number
  avancementPhysiquePct?: number
  avancementFinancierPct?: number
  delaiConsommePct?: number
  besoinsMateriel?: string
  besoinsHumain?: string
  observations?: string
  propositionsAmelioration?: string
  responsableProjetId?: number
  partenairePrincipal?: string
  partenaireIds?: number[]
}

export interface ClientCreateRequest {
  code: string
  nom: string
  type: TypeClient
  ministere?: string
  telephone?: string
  email?: string
  adresse?: string
  contactPrincipal?: string
  telephoneContact?: string
}

export interface ClientUpdateRequest {
  nom?: string
  type?: TypeClient
  ministere?: string
  telephone?: string
  email?: string
  adresse?: string
  contactPrincipal?: string
  telephoneContact?: string
}

export interface SousProjetCreateRequest {
  projetId: number
  code: string
  nom: string
  description?: string
  typeTravaux: TypeTravaux
  statut?: StatutSousProjet
  montantHT?: number
  montantTTC?: number
  delaiMois?: number
  dateDebut?: string
  dateFin?: string
  responsableId?: number
}

export interface PointBloquantCreateRequest {
  projetId: number
  titre: string
  description?: string
  priorite?: Priorite
  detecteParId?: number
  assigneAId?: number
  dateDetection?: string
}

export interface PointBloquantUpdateRequest {
  titre?: string
  description?: string
  priorite?: Priorite
  statut?: StatutPointBloquant
  assigneAId?: number
  dateResolution?: string
  actionCorrective?: string
}

// Page response
export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}
