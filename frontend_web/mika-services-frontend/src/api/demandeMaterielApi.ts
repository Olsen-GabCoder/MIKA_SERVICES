import apiClient from './axios'
import type {
  DemandeMateriel,
  DemandeMaterielHistorique,
  DemandeMaterielCreateRequest,
  DemandeMaterielLignePayload,
  StatutDemandeMateriel,
  PageResponse,
} from '@/types/materiel'

export const demandeMaterielApi = {
  findAll: async (params: {
    page?: number
    size?: number
    statut?: StatutDemandeMateriel
    projetId?: number
  } = {}): Promise<PageResponse<DemandeMateriel>> => {
    const { page = 0, size = 20, ...filters } = params
    const query: Record<string, unknown> = { page, size }
    if (filters.statut) query.statut = filters.statut
    if (filters.projetId) query.projetId = filters.projetId
    const response = await apiClient.get<PageResponse<DemandeMateriel>>('/dma', { params: query })
    return response.data
  },

  findById: async (id: number): Promise<DemandeMateriel> => {
    const response = await apiClient.get<DemandeMateriel>(`/dma/${id}`)
    return response.data
  },

  findHistorique: async (id: number): Promise<DemandeMaterielHistorique[]> => {
    const response = await apiClient.get<DemandeMaterielHistorique[]>(`/dma/${id}/historique`)
    return response.data
  },

  create: async (data: DemandeMaterielCreateRequest): Promise<DemandeMateriel> => {
    const response = await apiClient.post<DemandeMateriel>('/dma', data)
    return response.data
  },

  addLigne: async (id: number, ligne: DemandeMaterielLignePayload): Promise<DemandeMateriel> => {
    const response = await apiClient.post<DemandeMateriel>(`/dma/${id}/lignes`, ligne)
    return response.data
  },

  validerChantier: async (id: number, approuve: boolean, commentaire?: string): Promise<DemandeMateriel> => {
    const response = await apiClient.patch<DemandeMateriel>(`/dma/${id}/valider-chantier`, { approuve, commentaire })
    return response.data
  },

  validerProjet: async (id: number, approuve: boolean, commentaire?: string): Promise<DemandeMateriel> => {
    const response = await apiClient.patch<DemandeMateriel>(`/dma/${id}/valider-projet`, { approuve, commentaire })
    return response.data
  },

  prendreEnCharge: async (id: number, commentaire?: string): Promise<DemandeMateriel> => {
    const response = await apiClient.patch<DemandeMateriel>(`/dma/${id}/prendre-en-charge`, { commentaire })
    return response.data
  },

  demanderComplement: async (id: number, commentaire?: string): Promise<DemandeMateriel> => {
    const response = await apiClient.patch<DemandeMateriel>(`/dma/${id}/demander-complement`, { commentaire })
    return response.data
  },

  completer: async (id: number, commentaire?: string): Promise<DemandeMateriel> => {
    const response = await apiClient.patch<DemandeMateriel>(`/dma/${id}/completer`, { commentaire })
    return response.data
  },

  commander: async (id: number, commandeId?: number): Promise<DemandeMateriel> => {
    const response = await apiClient.patch<DemandeMateriel>(`/dma/${id}/commander`, { commandeId })
    return response.data
  },

  livrer: async (id: number, commentaire?: string): Promise<DemandeMateriel> => {
    const response = await apiClient.patch<DemandeMateriel>(`/dma/${id}/livrer`, { commentaire })
    return response.data
  },

  cloturer: async (id: number, commentaire?: string): Promise<DemandeMateriel> => {
    const response = await apiClient.patch<DemandeMateriel>(`/dma/${id}/cloturer`, { commentaire })
    return response.data
  },

  rejeter: async (id: number, commentaire: string): Promise<DemandeMateriel> => {
    const response = await apiClient.patch<DemandeMateriel>(`/dma/${id}/rejeter`, { commentaire })
    return response.data
  },
}
