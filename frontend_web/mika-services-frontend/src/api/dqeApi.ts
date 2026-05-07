import apiClient from './axios'
import { API_ENDPOINTS } from '@/constants/api'
import type {
  DqeChapitre,
  DqeChapitreCreateRequest,
  DqeChapitreUpdateRequest,
  DqeLigne,
  DqeLigneCreateRequest,
  DqeLigneUpdateRequest,
  DqeSummary,
  DqeAnalyseResponse,
} from '@/types/dqe'

// ============================================
// DQE API
// ============================================
export const dqeApi = {
  // ── Chapitres ───────────────────────────────────────────────────────

  /** Récupérer tous les chapitres DQE d'un projet (avec lignes incluses) */
  findByProjet: async (projetId: number): Promise<DqeChapitre[]> => {
    const response = await apiClient.get<DqeChapitre[]>(API_ENDPOINTS.DQE.BY_PROJET(projetId))
    return response.data
  },

  /** Résumé DQE d'un projet (totaux et avancement global) */
  getSummary: async (projetId: number): Promise<DqeSummary> => {
    const response = await apiClient.get<DqeSummary>(API_ENDPOINTS.DQE.SUMMARY(projetId))
    return response.data
  },

  /** Créer un chapitre DQE */
  createChapitre: async (data: DqeChapitreCreateRequest): Promise<DqeChapitre> => {
    const response = await apiClient.post<DqeChapitre>(API_ENDPOINTS.DQE.CHAPITRES, data)
    return response.data
  },

  /** Obtenir un chapitre par ID */
  findChapitreById: async (id: number): Promise<DqeChapitre> => {
    const response = await apiClient.get<DqeChapitre>(API_ENDPOINTS.DQE.CHAPITRE_BY_ID(id))
    return response.data
  },

  /** Modifier un chapitre DQE */
  updateChapitre: async (id: number, data: DqeChapitreUpdateRequest): Promise<DqeChapitre> => {
    const response = await apiClient.put<DqeChapitre>(API_ENDPOINTS.DQE.CHAPITRE_BY_ID(id), data)
    return response.data
  },

  /** Supprimer un chapitre DQE (et ses lignes) */
  deleteChapitre: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.DQE.CHAPITRE_BY_ID(id))
  },

  // ── Lignes ──────────────────────────────────────────────────────────

  /** Lister les lignes d'un chapitre */
  findLignesByChapitre: async (chapitreId: number): Promise<DqeLigne[]> => {
    const response = await apiClient.get<DqeLigne[]>(API_ENDPOINTS.DQE.LIGNES_BY_CHAPITRE(chapitreId))
    return response.data
  },

  /** Créer une ligne DQE */
  createLigne: async (data: DqeLigneCreateRequest): Promise<DqeLigne> => {
    const response = await apiClient.post<DqeLigne>(API_ENDPOINTS.DQE.LIGNES, data)
    return response.data
  },

  /** Obtenir une ligne par ID */
  findLigneById: async (id: number): Promise<DqeLigne> => {
    const response = await apiClient.get<DqeLigne>(API_ENDPOINTS.DQE.LIGNE_BY_ID(id))
    return response.data
  },

  /** Modifier une ligne DQE */
  updateLigne: async (id: number, data: DqeLigneUpdateRequest): Promise<DqeLigne> => {
    const response = await apiClient.put<DqeLigne>(API_ENDPOINTS.DQE.LIGNE_BY_ID(id), data)
    return response.data
  },

  /** Supprimer une ligne DQE */
  deleteLigne: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.DQE.LIGNE_BY_ID(id))
  },

  // ── Réordonnement ────────────────────────────────────────────────────

  /** Réordonner les chapitres DQE d'un projet */
  reorderChapitres: async (items: { id: number; ordre: number }[]): Promise<void> => {
    await apiClient.put(API_ENDPOINTS.DQE.REORDER_CHAPITRES, items)
  },

  /** Réordonner les lignes DQE d'un chapitre */
  reorderLignes: async (items: { id: number; ordre: number }[]): Promise<void> => {
    await apiClient.put(API_ENDPOINTS.DQE.REORDER_LIGNES, items)
  },

  // ── Import IA ──────────────────────────────────────────────────────

  /** Analyser un fichier DQE via IA et extraire chapitres/lignes */
  analyserDqe: async (projetId: number, file?: File, texte?: string): Promise<DqeAnalyseResponse> => {
    const formData = new FormData()
    if (file) formData.append('file', file)
    if (texte) formData.append('texte', texte)
    const response = await apiClient.post<DqeAnalyseResponse>(
      `/projets/${projetId}/analyse-dqe`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 90000 }
    )
    return response.data
  },
}
