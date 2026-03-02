import apiClient from './axios'
import { API_ENDPOINTS } from '@/constants/api'
import type {
  Projet, ProjetSummary, ProjetCreateRequest, ProjetUpdateRequest,
  Client, ClientCreateRequest, ClientUpdateRequest,
  SousProjet, SousProjetCreateRequest,
  PointBloquant, PointBloquantCreateRequest, PointBloquantUpdateRequest,
  AvancementEtudeProjet, Prevision, CAPrevisionnelRealise,
  ProjetHistoriqueResponse,
  PageResponse, StatutProjet, TypeProjet
} from '@/types/projet'

export interface ProjetListFilters {
  statut?: StatutProjet
  type?: TypeProjet
  clientId?: number
  responsableId?: number
}

/** Clé de tri côté API (propriété JPA : nom, type, montantHT, etc.) */
export type ProjetSortKey = 'nom' | 'type' | 'client.nom' | 'montantHT' | 'avancementGlobal' | 'statut' | 'responsableProjet.nom'
export type SortDirection = 'asc' | 'desc'
import { USE_MOCK, USE_MOCK_FALLBACK } from '@/config/mock'
import { getMockProjetsPage, getMockProjetById } from '@/mock/data/projets'
import { getMockClientsPage } from '@/mock/data/clients'

// ============================================
// Projets API
// ============================================
export const projetApi = {
  create: async (data: ProjetCreateRequest): Promise<Projet> => {
    const response = await apiClient.post<Projet>(API_ENDPOINTS.PROJETS.BASE, data)
    return response.data
  },

  findAll: async (
    page = 0,
    size = 20,
    filters?: ProjetListFilters,
    sort?: { sortBy: ProjetSortKey; sortDir: SortDirection }
  ): Promise<PageResponse<ProjetSummary>> => {
    if (USE_MOCK) return Promise.resolve(getMockProjetsPage(page, size))
    try {
      const params: Record<string, string | number | undefined> = { page, size }
      if (filters?.statut) params.statut = filters.statut
      if (filters?.type) params.type = filters.type
      if (filters?.clientId != null) params.clientId = filters.clientId
      if (filters?.responsableId != null) params.responsableId = filters.responsableId
      if (sort?.sortBy) params.sort = `${sort.sortBy},${sort.sortDir}`
      const response = await apiClient.get<PageResponse<ProjetSummary>>(API_ENDPOINTS.PROJETS.BASE, { params })
      return response.data
    } catch {
      if (USE_MOCK_FALLBACK) return Promise.resolve(getMockProjetsPage(page, size))
      throw new Error('Erreur chargement projets')
    }
  },

  findById: async (id: number): Promise<Projet> => {
    if (USE_MOCK) {
      const mock = getMockProjetById(id)
      if (mock) return Promise.resolve(mock)
      throw new Error('Projet non trouvé')
    }
    try {
      const response = await apiClient.get<Projet>(API_ENDPOINTS.PROJETS.BY_ID(id))
      return response.data
    } catch {
      if (USE_MOCK_FALLBACK) {
        const mock = getMockProjetById(id)
        if (mock) return Promise.resolve(mock)
      }
      throw new Error('Projet non trouvé')
    }
  },

  search: async (
    q: string,
    page = 0,
    size = 20,
    filters?: ProjetListFilters,
    sort?: { sortBy: ProjetSortKey; sortDir: SortDirection }
  ): Promise<PageResponse<ProjetSummary>> => {
    const params: Record<string, string | number | undefined> = { q, page, size }
    if (filters?.statut) params.statut = filters.statut
    if (filters?.type) params.type = filters.type
    if (filters?.clientId != null) params.clientId = filters.clientId
    if (filters?.responsableId != null) params.responsableId = filters.responsableId
    if (sort?.sortBy) params.sort = `${sort.sortBy},${sort.sortDir}`
    const response = await apiClient.get<PageResponse<ProjetSummary>>(API_ENDPOINTS.PROJETS.SEARCH, { params })
    return response.data
  },

  findByStatut: async (statut: string): Promise<ProjetSummary[]> => {
    const response = await apiClient.get<ProjetSummary[]>(API_ENDPOINTS.PROJETS.BY_STATUT(statut))
    return response.data
  },

  findByResponsable: async (userId: number): Promise<ProjetSummary[]> => {
    const response = await apiClient.get<ProjetSummary[]>(API_ENDPOINTS.PROJETS.BY_RESPONSABLE(userId))
    return response.data
  },

  countByStatut: async (statut: string): Promise<number> => {
    const response = await apiClient.get<{ count: number }>(API_ENDPOINTS.PROJETS.COUNT_BY_STATUT(statut))
    return response.data.count
  },

  update: async (id: number, data: ProjetUpdateRequest): Promise<Projet> => {
    const response = await apiClient.put<Projet>(API_ENDPOINTS.PROJETS.BY_ID(id), data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.PROJETS.BY_ID(id))
  },

  getAvancementEtudes: async (id: number): Promise<AvancementEtudeProjet[]> => {
    if (USE_MOCK) return Promise.resolve([])
    try {
      const response = await apiClient.get<AvancementEtudeProjet[]>(API_ENDPOINTS.PROJETS.AVANCEMENT_ETUDES(id))
      return response.data
    } catch {
      if (USE_MOCK_FALLBACK) return Promise.resolve([])
      throw new Error('Erreur chargement avancement des études')
    }
  },

  saveAvancementEtudes: async (id: number, data: { phase: string; avancementPct?: number; dateDepot?: string; etatValidation?: string }[]): Promise<AvancementEtudeProjet[]> => {
    const response = await apiClient.put<AvancementEtudeProjet[]>(API_ENDPOINTS.PROJETS.AVANCEMENT_ETUDES(id), data)
    return response.data
  },

  getSuiviMensuel: async (id: number): Promise<CAPrevisionnelRealise[]> => {
    try {
      const response = await apiClient.get<CAPrevisionnelRealise[]>(API_ENDPOINTS.PROJETS.SUIVI_MENSUEL(id))
      return response.data
    } catch {
      return []
    }
  },

  saveSuiviMensuel: async (id: number, data: { mois: number; annee: number; caPrevisionnel?: number; caRealise?: number }[]): Promise<CAPrevisionnelRealise[]> => {
    const response = await apiClient.put<CAPrevisionnelRealise[]>(API_ENDPOINTS.PROJETS.SUIVI_MENSUEL(id), data)
    return response.data
  },

  replaceSuiviMensuel: async (id: number, data: { mois: number; annee: number; caPrevisionnel?: number; caRealise?: number }[]): Promise<CAPrevisionnelRealise[]> => {
    const response = await apiClient.put<CAPrevisionnelRealise[]>(API_ENDPOINTS.PROJETS.SUIVI_MENSUEL_REPLACE(id), data)
    return response.data
  },

  getPrevisions: async (id: number): Promise<Prevision[]> => {
    if (USE_MOCK) return Promise.resolve([])
    try {
      const response = await apiClient.get<Prevision[]>(API_ENDPOINTS.PROJETS.PREVISIONS(id))
      return response.data
    } catch {
      if (USE_MOCK_FALLBACK) return Promise.resolve([])
      throw new Error('Erreur chargement prévisions')
    }
  },

  getHistorique: async (id: number, maxSemaines = 52): Promise<ProjetHistoriqueResponse> => {
    if (USE_MOCK) return Promise.resolve({ projetId: id, projetNom: '', periodes: [] })
    const response = await apiClient.get<ProjetHistoriqueResponse>(API_ENDPOINTS.PROJETS.HISTORIQUE(id), {
      params: { maxSemaines },
    })
    return response.data
  },

  createPrevision: async (projetId: number, data: { semaine?: number; annee: number; description?: string; type: string; dateDebut?: string; dateFin?: string; avancementPct?: number }): Promise<Prevision> => {
    const response = await apiClient.post<Prevision>(API_ENDPOINTS.PROJETS.PREVISIONS(projetId), data)
    return response.data
  },

  updatePrevision: async (projetId: number, previsionId: number, data: { semaine?: number; annee?: number; description?: string; type?: string; dateDebut?: string; dateFin?: string; avancementPct?: number }): Promise<Prevision> => {
    const response = await apiClient.put<Prevision>(API_ENDPOINTS.PROJETS.PREVISION_BY_ID(projetId, previsionId), data)
    return response.data
  },

  deletePrevision: async (projetId: number, previsionId: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.PROJETS.PREVISION_BY_ID(projetId, previsionId))
  },
}

// ============================================
// Clients API
// ============================================
export const clientApi = {
  create: async (data: ClientCreateRequest): Promise<Client> => {
    if (USE_MOCK) {
      const mock: Client = {
        id: Date.now(),
        code: data.code,
        nom: data.nom,
        type: data.type,
        actif: true,
      }
      return mock
    }
    const response = await apiClient.post<Client>(API_ENDPOINTS.CLIENTS.BASE, data)
    return response.data
  },

  findAll: async (page = 0, size = 500): Promise<PageResponse<Client>> => {
    if (USE_MOCK) return getMockClientsPage(page, size)
    try {
      const response = await apiClient.get<PageResponse<Client>>(API_ENDPOINTS.CLIENTS.BASE, {
        params: { page, size, _t: Date.now() },
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      })
      return response.data
    } catch {
      if (USE_MOCK_FALLBACK) return getMockClientsPage(page, size)
      throw new Error('Erreur chargement des clients')
    }
  },

  findById: async (id: number): Promise<Client> => {
    const response = await apiClient.get<Client>(API_ENDPOINTS.CLIENTS.BY_ID(id))
    return response.data
  },

  search: async (nom: string, page = 0, size = 20): Promise<PageResponse<Client>> => {
    const response = await apiClient.get<PageResponse<Client>>(API_ENDPOINTS.CLIENTS.SEARCH, {
      params: { nom, page, size }
    })
    return response.data
  },

  update: async (id: number, data: ClientUpdateRequest): Promise<Client> => {
    const response = await apiClient.put<Client>(API_ENDPOINTS.CLIENTS.BY_ID(id), data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.CLIENTS.BY_ID(id))
  },
}

// ============================================
// Sous-Projets API
// ============================================
export const sousProjetApi = {
  create: async (data: SousProjetCreateRequest): Promise<SousProjet> => {
    const response = await apiClient.post<SousProjet>(API_ENDPOINTS.SOUS_PROJETS.BASE, data)
    return response.data
  },

  findByProjet: async (projetId: number, page = 0, size = 20): Promise<PageResponse<SousProjet>> => {
    const response = await apiClient.get<PageResponse<SousProjet>>(API_ENDPOINTS.SOUS_PROJETS.BY_PROJET(projetId), {
      params: { page, size }
    })
    return response.data
  },

  findById: async (id: number): Promise<SousProjet> => {
    const response = await apiClient.get<SousProjet>(API_ENDPOINTS.SOUS_PROJETS.BY_ID(id))
    return response.data
  },

  update: async (id: number, data: Partial<SousProjet>): Promise<SousProjet> => {
    const response = await apiClient.put<SousProjet>(API_ENDPOINTS.SOUS_PROJETS.BY_ID(id), data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.SOUS_PROJETS.BY_ID(id))
  },
}

// ============================================
// Points Bloquants API
// ============================================
export const pointBloquantApi = {
  create: async (data: PointBloquantCreateRequest): Promise<PointBloquant> => {
    const response = await apiClient.post<PointBloquant>(API_ENDPOINTS.POINTS_BLOQUANTS.BASE, data)
    return response.data
  },

  findByProjet: async (projetId: number, page = 0, size = 20): Promise<PageResponse<PointBloquant>> => {
    const response = await apiClient.get<PageResponse<PointBloquant>>(API_ENDPOINTS.POINTS_BLOQUANTS.BY_PROJET(projetId), {
      params: { page, size }
    })
    return response.data
  },

  findById: async (id: number): Promise<PointBloquant> => {
    const response = await apiClient.get<PointBloquant>(API_ENDPOINTS.POINTS_BLOQUANTS.BY_ID(id))
    return response.data
  },

  findByStatut: async (statut: string): Promise<PointBloquant[]> => {
    const response = await apiClient.get<PointBloquant[]>(API_ENDPOINTS.POINTS_BLOQUANTS.BY_STATUT(statut))
    return response.data
  },

  update: async (id: number, data: PointBloquantUpdateRequest): Promise<PointBloquant> => {
    const response = await apiClient.put<PointBloquant>(API_ENDPOINTS.POINTS_BLOQUANTS.BY_ID(id), data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.POINTS_BLOQUANTS.BY_ID(id))
  },
}
