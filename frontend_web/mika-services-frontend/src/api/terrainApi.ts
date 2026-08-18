import apiClient from './axios'
import type {
  InspectionEngin, InspectionEnginCreateRequest,
  PositionEngin, PositionEnginCreateRequest,
  IncidentEngin, IncidentEnginCreateRequest,
  ReleveCompteur, ReleveCompteurCreateRequest,
  ConsommationCarburant, ConsommationCarburantCreateRequest,
} from '@/types/materiel'

/** Vue engin pour l'application mobile terrain (aligné TerrainEnginResponse backend). */
export interface TerrainEngin {
  id: number
  code: string
  nom: string
  type: string
  statut: string
  marque?: string | null
  modele?: string | null
  heuresCompteur: number
  chantierNom?: string | null
  inspectionFaiteAujourdhui: boolean
  dernierPlein?: string | null
}

export const terrainApi = {
  mesEngins: async (): Promise<TerrainEngin[]> => {
    const response = await apiClient.get<TerrainEngin[]>('/terrain/mes-engins')
    return response.data
  },
  scan: async (q: string): Promise<TerrainEngin> => {
    const response = await apiClient.get<TerrainEngin>('/terrain/engins/scan', { params: { q } })
    return response.data
  },
  confirmerPosition: async (enginId: number, data: PositionEnginCreateRequest): Promise<PositionEngin> => {
    const response = await apiClient.post<PositionEngin>(`/terrain/engins/${enginId}/position`, data)
    return response.data
  },
  creerReleve: async (enginId: number, data: ReleveCompteurCreateRequest): Promise<ReleveCompteur> => {
    const response = await apiClient.post<ReleveCompteur>(`/terrain/engins/${enginId}/releve`, data)
    return response.data
  },
  creerRavitaillement: async (enginId: number, data: ConsommationCarburantCreateRequest): Promise<ConsommationCarburant> => {
    const response = await apiClient.post<ConsommationCarburant>(`/terrain/engins/${enginId}/ravitaillement`, data)
    return response.data
  },
  signalerIncident: async (enginId: number, data: IncidentEnginCreateRequest): Promise<IncidentEngin> => {
    const response = await apiClient.post<IncidentEngin>(`/terrain/engins/${enginId}/incident`, data)
    return response.data
  },
  creerInspection: async (enginId: number, data: InspectionEnginCreateRequest): Promise<InspectionEngin> => {
    const response = await apiClient.post<InspectionEngin>(`/terrain/engins/${enginId}/inspection`, data)
    return response.data
  },
}
