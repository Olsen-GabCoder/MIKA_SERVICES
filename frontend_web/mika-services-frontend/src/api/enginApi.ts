import apiClient from './axios'
import type {
  Engin, EnginSummary, EnginCreateRequest, MouvementEnginSummary, AffectationEnginResponse, PageResponse,
  EnginStats, CarnetEngin, EnginCarte, AlerteEngin, EcheanceEngin, HeuresMensuelles,
  OperationMaintenance, OperationMaintenanceCreateRequest, OperationMaintenanceUpdateRequest,
  IncidentEngin, IncidentEnginCreateRequest, IncidentEnginUpdateRequest,
  DocumentEngin, DocumentEnginCreateRequest,
  ReleveCompteur, ReleveCompteurCreateRequest,
  ConsommationCarburant, ConsommationCarburantCreateRequest
} from '@/types/materiel'
import { USE_MOCK, USE_MOCK_FALLBACK } from '@/config/mock'
import { getMockEnginsPage, getMockEnginsSearchPage } from '@/mock/data/engins'

export const enginApi = {
  create: async (data: EnginCreateRequest): Promise<Engin> => {
    const response = await apiClient.post<Engin>('/engins', data)
    return response.data
  },
  findAll: async (page = 0, size = 20, statut?: string, type?: string): Promise<PageResponse<EnginSummary>> => {
    if (USE_MOCK) return Promise.resolve(getMockEnginsPage(page, size))
    try {
      const params: Record<string, unknown> = { page, size }
      if (statut) params.statut = statut
      if (type) params.type = type
      const response = await apiClient.get<PageResponse<EnginSummary>>('/engins', { params })
      return response.data
    } catch {
      if (USE_MOCK_FALLBACK) return Promise.resolve(getMockEnginsPage(page, size))
      throw new Error('Erreur chargement engins')
    }
  },
  findById: async (id: number): Promise<Engin> => {
    const response = await apiClient.get<Engin>(`/engins/${id}`)
    return response.data
  },
  search: async (q: string, page = 0, size = 20): Promise<PageResponse<EnginSummary>> => {
    if (USE_MOCK) return Promise.resolve(getMockEnginsSearchPage(q, page, size))
    try {
      const response = await apiClient.get<PageResponse<EnginSummary>>('/engins/search', { params: { q, page, size } })
      return response.data
    } catch {
      if (USE_MOCK_FALLBACK) return Promise.resolve(getMockEnginsSearchPage(q, page, size))
      throw new Error('Erreur recherche engins')
    }
  },
  findDisponibles: async (): Promise<EnginSummary[]> => {
    const response = await apiClient.get<EnginSummary[]>('/engins/disponibles')
    return response.data
  },
  update: async (id: number, data: Partial<Engin>): Promise<Engin> => {
    const response = await apiClient.put<Engin>(`/engins/${id}`, data)
    return response.data
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/engins/${id}`)
  },
  getMouvements: async (id: number): Promise<MouvementEnginSummary[]> => {
    const response = await apiClient.get<MouvementEnginSummary[]>(`/engins/${id}/mouvements`)
    return response.data
  },
  getAffectationsByProjet: async (projetId: number, page = 0, size = 200): Promise<PageResponse<AffectationEnginResponse>> => {
    const response = await apiClient.get<PageResponse<AffectationEnginResponse>>(`/engins/affectations/projet/${projetId}`, { params: { page, size } })
    return response.data
  },
  getAffectationsByEngin: async (enginId: number): Promise<AffectationEnginResponse[]> => {
    const response = await apiClient.get<AffectationEnginResponse[]>(`/engins/${enginId}/affectations`)
    return response.data
  },

  // Planning (toutes affectations actives/planifiées)
  getPlanningAffectations: async (): Promise<AffectationEnginResponse[]> => {
    const response = await apiClient.get<AffectationEnginResponse[]>('/engins/affectations/planning')
    return response.data
  },

  // Carte (positions)
  getPositions: async (): Promise<EnginCarte[]> => {
    const response = await apiClient.get<EnginCarte[]>('/engins/carte')
    return response.data
  },

  // Stats
  getStats: async (): Promise<EnginStats> => {
    const response = await apiClient.get<EnginStats>('/engins/stats')
    return response.data
  },

  // Alertes actives
  getAlertes: async (): Promise<AlerteEngin[]> => {
    const response = await apiClient.get<AlerteEngin[]>('/engins/alertes')
    return response.data
  },

  // Echeances a venir
  getEcheances: async (jours = 7): Promise<EcheanceEngin[]> => {
    const response = await apiClient.get<EcheanceEngin[]>('/engins/echeances', { params: { jours } })
    return response.data
  },

  // QR Code
  getQrCode: async (enginId: number): Promise<void> => {
    const response = await apiClient.get(`/engins/${enginId}/qrcode`, {
      params: { size: 400, baseUrl: window.location.origin },
      responseType: 'blob',
    })
    const url = URL.createObjectURL(new Blob([response.data], { type: 'image/png' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `qr_engin_${enginId}.png`
    a.click()
    URL.revokeObjectURL(url)
  },

  // Export CSV
  exportCsv: async (): Promise<void> => {
    const response = await apiClient.get('/engins/export', { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'engins_export.csv'
    a.click()
    URL.revokeObjectURL(url)
  },

  // Heures mensuelles (graphique barres)
  getHeuresMensuelles: async (enginId: number): Promise<HeuresMensuelles> => {
    const response = await apiClient.get<HeuresMensuelles>(`/engins/${enginId}/heures-mensuelles`)
    return response.data
  },

  // Carnet de bord
  getCarnet: async (enginId: number): Promise<CarnetEngin> => {
    const response = await apiClient.get<CarnetEngin>(`/engins/${enginId}/carnet`)
    return response.data
  },

  // Maintenances
  getMaintenances: async (enginId: number, page = 0, size = 20): Promise<PageResponse<OperationMaintenance>> => {
    const response = await apiClient.get<PageResponse<OperationMaintenance>>(`/engins/${enginId}/maintenances`, { params: { page, size } })
    return response.data
  },
  createMaintenance: async (enginId: number, data: OperationMaintenanceCreateRequest): Promise<OperationMaintenance> => {
    const response = await apiClient.post<OperationMaintenance>(`/engins/${enginId}/maintenances`, data)
    return response.data
  },
  updateMaintenance: async (enginId: number, maintenanceId: number, data: OperationMaintenanceUpdateRequest): Promise<OperationMaintenance> => {
    const response = await apiClient.put<OperationMaintenance>(`/engins/${enginId}/maintenances/${maintenanceId}`, data)
    return response.data
  },
  deleteMaintenance: async (enginId: number, maintenanceId: number): Promise<void> => {
    await apiClient.delete(`/engins/${enginId}/maintenances/${maintenanceId}`)
  },

  // Incidents
  getIncidents: async (enginId: number, page = 0, size = 20): Promise<PageResponse<IncidentEngin>> => {
    const response = await apiClient.get<PageResponse<IncidentEngin>>(`/engins/${enginId}/incidents`, { params: { page, size } })
    return response.data
  },
  createIncident: async (enginId: number, data: IncidentEnginCreateRequest): Promise<IncidentEngin> => {
    const response = await apiClient.post<IncidentEngin>(`/engins/${enginId}/incidents`, data)
    return response.data
  },
  updateIncident: async (enginId: number, incidentId: number, data: IncidentEnginUpdateRequest): Promise<IncidentEngin> => {
    const response = await apiClient.put<IncidentEngin>(`/engins/${enginId}/incidents/${incidentId}`, data)
    return response.data
  },
  deleteIncident: async (enginId: number, incidentId: number): Promise<void> => {
    await apiClient.delete(`/engins/${enginId}/incidents/${incidentId}`)
  },

  // Documents
  getDocuments: async (enginId: number, page = 0, size = 20): Promise<PageResponse<DocumentEngin>> => {
    const response = await apiClient.get<PageResponse<DocumentEngin>>(`/engins/${enginId}/documents`, { params: { page, size } })
    return response.data
  },
  createDocument: async (enginId: number, data: DocumentEnginCreateRequest): Promise<DocumentEngin> => {
    const response = await apiClient.post<DocumentEngin>(`/engins/${enginId}/documents`, data)
    return response.data
  },
  deleteDocument: async (enginId: number, documentId: number): Promise<void> => {
    await apiClient.delete(`/engins/${enginId}/documents/${documentId}`)
  },

  // Releves compteur
  getReleves: async (enginId: number, page = 0, size = 20): Promise<PageResponse<ReleveCompteur>> => {
    const response = await apiClient.get<PageResponse<ReleveCompteur>>(`/engins/${enginId}/releves-compteur`, { params: { page, size } })
    return response.data
  },
  createReleve: async (enginId: number, data: ReleveCompteurCreateRequest): Promise<ReleveCompteur> => {
    const response = await apiClient.post<ReleveCompteur>(`/engins/${enginId}/releves-compteur`, data)
    return response.data
  },

  // Photo
  uploadPhoto: async (enginId: number, file: File): Promise<Engin> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post<Engin>(`/engins/${enginId}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
  getPhotoBlob: async (enginId: number): Promise<Blob | null> => {
    try {
      const response = await apiClient.get<Blob>(`/engins/${enginId}/photo`, { responseType: 'blob' })
      if (response.status === 204 || !response.data) return null
      return response.data
    } catch {
      return null
    }
  },

  // Consommation carburant
  getConsommations: async (enginId: number, page = 0, size = 20): Promise<PageResponse<ConsommationCarburant>> => {
    const response = await apiClient.get<PageResponse<ConsommationCarburant>>(`/engins/${enginId}/consommations`, { params: { page, size } })
    return response.data
  },
  createConsommation: async (enginId: number, data: ConsommationCarburantCreateRequest): Promise<ConsommationCarburant> => {
    const response = await apiClient.post<ConsommationCarburant>(`/engins/${enginId}/consommations`, data)
    return response.data
  },
}
