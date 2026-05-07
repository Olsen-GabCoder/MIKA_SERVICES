// ============================================
// Types DQE - MIKA SERVICES
// ============================================

export interface DqeLigne {
  id: number
  chapitreId: number
  numeroPoste?: string
  designation: string
  unite?: string
  quantite?: number
  prixUnitaire?: number
  montantTotal?: number
  avancementPct: number
  montantExecute: number
  ordre: number
  createdAt?: string
  updatedAt?: string
}

export interface DqeChapitre {
  id: number
  projetId: number
  numero: string
  designation: string
  ordre: number
  montantTotal: number
  montantExecute: number
  avancementPct: number
  nombreLignes: number
  lignes: DqeLigne[]
  createdAt?: string
  updatedAt?: string
}

export interface DqeSummary {
  projetId: number
  nombreChapitres: number
  nombreLignes: number
  montantTotalDqe: number
  montantExecuteTotal: number
  avancementGlobalPct: number
}

// Request types
export interface DqeChapitreCreateRequest {
  projetId: number
  numero: string
  designation: string
  ordre?: number
}

export interface DqeChapitreUpdateRequest {
  numero?: string
  designation?: string
  ordre?: number
}

export interface DqeLigneCreateRequest {
  chapitreId: number
  numeroPoste?: string
  designation: string
  unite?: string
  quantite?: number
  prixUnitaire?: number
  montantTotal?: number
  avancementPct?: number
  ordre?: number
}

export interface DqeLigneUpdateRequest {
  numeroPoste?: string
  designation?: string
  unite?: string
  quantite?: number
  prixUnitaire?: number
  montantTotal?: number
  avancementPct?: number
  ordre?: number
}

// ── Types pour l'analyse IA de DQE ──────────────────────────────────

export interface DqeAnalyseResponse {
  chapitres: DqeChapitreExtrait[]
  avertissements: string[]
  champsExtraits: number
}

export interface DqeChapitreExtrait {
  numero: string
  designation: string
  lignes: DqeLigneExtraite[]
}

export interface DqeLigneExtraite {
  numeroPoste?: string
  designation: string
  unite?: string
  quantite?: number
  prixUnitaire?: number
  montantTotal?: number
}
