import apiClient from './axios'
import type {
  Engin, EnginSummary, EnginCreateRequest, EnginUpdateRequest,
  MouvementEnginSummary, AffectationEnginResponse, AffectationEnginUpdateRequest, PageResponse,
  EnginStats, CarnetEngin, EnginCarte, AlerteEngin, EcheanceEngin, HeuresMensuelles, CoutEngin,
  InspectionEngin, InspectionEnginCreateRequest,
  PositionEngin, PositionEnginCreateRequest,
  OperationMaintenance, OperationMaintenanceCreateRequest, OperationMaintenanceUpdateRequest,
  IncidentEngin, IncidentEnginCreateRequest, IncidentEnginUpdateRequest,
  DocumentEngin, DocumentEnginCreateRequest, DocumentEnginUpdateRequest,
  ReleveCompteur, ReleveCompteurCreateRequest,
  ConsommationCarburant, ConsommationCarburantCreateRequest,
  PlanMaintenance, PlanMaintenanceCreateRequest, PlanMaintenanceUpdateRequest
} from '@/types/materiel'
import { USE_MOCK, USE_MOCK_FALLBACK } from '@/config/mock'
import { getMockEnginsPage, getMockEnginsSearchPage } from '@/mock/data/engins'

/** Récapitulatif de l'affectation en masse des engins (outil admin). */
export interface SeedAffectationsResult {
  totalEnginsActifs: number
  dejaLocalises: number
  nouvellesAffectations: number
  repartition: Record<string, number>
}

export const enginApi = {
  create: async (data: EnginCreateRequest): Promise<Engin> => {
    const response = await apiClient.post<Engin>('/engins', data)
    return response.data
  },
  findAll: async (page = 0, size = 20, statut?: string, type?: string, projetId?: number, sort?: string): Promise<PageResponse<EnginSummary>> => {
    if (USE_MOCK) return Promise.resolve(getMockEnginsPage(page, size))
    try {
      const params: Record<string, unknown> = { page, size }
      if (statut) params.statut = statut
      if (type) params.type = type
      if (projetId) params.projetId = projetId
      if (sort) params.sort = sort
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
  update: async (id: number, data: EnginUpdateRequest): Promise<Engin> => {
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
  createPosition: async (enginId: number, data: PositionEnginCreateRequest): Promise<PositionEngin> => {
    const response = await apiClient.post<PositionEngin>(`/engins/${enginId}/positions`, data)
    return response.data
  },
  getPositionsHistorique: async (enginId: number, page = 0, size = 20): Promise<PageResponse<PositionEngin>> => {
    const response = await apiClient.get<PageResponse<PositionEngin>>(`/engins/${enginId}/positions`, { params: { page, size } })
    return response.data
  },
  createInspection: async (enginId: number, data: InspectionEnginCreateRequest): Promise<InspectionEngin> => {
    const response = await apiClient.post<InspectionEngin>(`/engins/${enginId}/inspections`, data)
    return response.data
  },
  getInspections: async (enginId: number, page = 0, size = 20): Promise<PageResponse<InspectionEngin>> => {
    const response = await apiClient.get<PageResponse<InspectionEngin>>(`/engins/${enginId}/inspections`, { params: { page, size } })
    return response.data
  },
  getCouts: async (enginId: number): Promise<CoutEngin> => {
    const response = await apiClient.get<CoutEngin>(`/engins/${enginId}/couts`)
    return response.data
  },
  getAffectationsByEngin: async (enginId: number): Promise<AffectationEnginResponse[]> => {
    const response = await apiClient.get<AffectationEnginResponse[]>(`/engins/${enginId}/affectations`)
    return response.data
  },
  updateAffectation: async (affectationId: number, data: AffectationEnginUpdateRequest): Promise<AffectationEnginResponse> => {
    const response = await apiClient.put<AffectationEnginResponse>(`/engins/affectations/${affectationId}`, data)
    return response.data
  },
  terminerAffectation: async (affectationId: number): Promise<AffectationEnginResponse> => {
    const response = await apiClient.patch<AffectationEnginResponse>(`/engins/affectations/${affectationId}/terminer`)
    return response.data
  },
  deleteAffectation: async (affectationId: number): Promise<void> => {
    await apiClient.delete(`/engins/affectations/${affectationId}`)
  },

  // Outil admin : affecte en masse les engins non localisés à un chantier actif (SUPER_ADMIN)
  seedAffectations: async (): Promise<SeedAffectationsResult> => {
    const response = await apiClient.post<SeedAffectationsResult>('/engins/seed-affectations')
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

  // Échéances à venir
  getEcheances: async (jours = 7): Promise<EcheanceEngin[]> => {
    const response = await apiClient.get<EcheanceEngin[]>('/engins/echeances', { params: { jours } })
    return response.data
  },

  // Maintenances globales (tout le parc)
  getAllMaintenances: async (page = 0, size = 50, statut?: string, type?: string, enginId?: number): Promise<PageResponse<OperationMaintenance>> => {
    const params: Record<string, unknown> = { page, size, sort: 'echeanceDate,asc' }
    if (statut) params.statut = statut
    if (type) params.type = type
    if (enginId) params.enginId = enginId
    const response = await apiClient.get<PageResponse<OperationMaintenance>>('/engins/maintenances', { params })
    return response.data
  },
  getMaintenancesCalendrier: async (debut: string, fin: string): Promise<OperationMaintenance[]> => {
    const response = await apiClient.get<OperationMaintenance[]>('/engins/maintenances/calendrier', { params: { debut, fin } })
    return response.data
  },

  // QR Code
  getQrCodeBlob: async (enginId: number, size = 400): Promise<Blob> => {
    const response = await apiClient.get(`/engins/${enginId}/qrcode`, {
      params: { size, baseUrl: window.location.origin },
      responseType: 'blob',
    })
    return new Blob([response.data], { type: 'image/png' })
  },
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

  // Plans de maintenance récurrents
  getPlansMaintenance: async (enginId: number): Promise<PlanMaintenance[]> => {
    const response = await apiClient.get<PlanMaintenance[]>(`/engins/${enginId}/plans-maintenance`)
    return response.data
  },
  createPlanMaintenance: async (enginId: number, data: PlanMaintenanceCreateRequest): Promise<PlanMaintenance> => {
    const response = await apiClient.post<PlanMaintenance>(`/engins/${enginId}/plans-maintenance`, data)
    return response.data
  },
  updatePlanMaintenance: async (enginId: number, planId: number, data: PlanMaintenanceUpdateRequest): Promise<PlanMaintenance> => {
    const response = await apiClient.put<PlanMaintenance>(`/engins/${enginId}/plans-maintenance/${planId}`, data)
    return response.data
  },
  deletePlanMaintenance: async (enginId: number, planId: number): Promise<void> => {
    await apiClient.delete(`/engins/${enginId}/plans-maintenance/${planId}`)
  },
  executerPlanMaintenance: async (enginId: number, planId: number): Promise<OperationMaintenance> => {
    const response = await apiClient.post<OperationMaintenance>(`/engins/${enginId}/plans-maintenance/${planId}/executer`)
    return response.data
  },
  getPlansMaintenanceEnAlerte: async (): Promise<PlanMaintenance[]> => {
    const response = await apiClient.get<PlanMaintenance[]>('/engins/plans-maintenance/alertes')
    return response.data
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
  creerMaintenanceCorrective: async (enginId: number, incidentId: number): Promise<OperationMaintenance> => {
    const response = await apiClient.post<OperationMaintenance>(`/engins/${enginId}/incidents/${incidentId}/maintenance-corrective`)
    return response.data
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
  updateDocument: async (enginId: number, documentId: number, data: DocumentEnginUpdateRequest): Promise<DocumentEngin> => {
    const response = await apiClient.put<DocumentEngin>(`/engins/${enginId}/documents/${documentId}`, data)
    return response.data
  },
  deleteDocument: async (enginId: number, documentId: number): Promise<void> => {
    await apiClient.delete(`/engins/${enginId}/documents/${documentId}`)
  },

  // Relevés compteur
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
