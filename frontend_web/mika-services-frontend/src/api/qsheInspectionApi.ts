import apiClient from './axios'
import { API_ENDPOINTS } from '@/constants/api'
import type {
  InspectionResponse, InspectionCreateRequest, InspectionUpdateRequest,
  ChecklistTemplateResponse, PaginatedResponse,
} from '@/types/qsheInspection'

const E = API_ENDPOINTS.QSHE_INSPECTIONS

export const qsheInspectionApi = {
  create: async (req: InspectionCreateRequest): Promise<InspectionResponse> => {
    const { data } = await apiClient.post<InspectionResponse>(E.BASE, req)
    return data
  },
  getByProjet: async (projetId: number, page = 0, size = 20): Promise<PaginatedResponse<InspectionResponse>> => {
    const { data } = await apiClient.get<PaginatedResponse<InspectionResponse>>(E.BY_PROJET(projetId), {
      params: { page, size, sort: 'datePlanifiee,desc' },
    })
    return data
  },
  getById: async (id: number): Promise<InspectionResponse> => {
    const { data } = await apiClient.get<InspectionResponse>(E.BY_ID(id))
    return data
  },
  update: async (id: number, req: InspectionUpdateRequest): Promise<InspectionResponse> => {
    const { data } = await apiClient.put<InspectionResponse>(E.BY_ID(id), req)
    return data
  },
  delete: async (id: number): Promise<void> => { await apiClient.delete(E.BY_ID(id)) },
  getTemplates: async (): Promise<ChecklistTemplateResponse[]> => {
    const { data } = await apiClient.get<ChecklistTemplateResponse[]>(E.TEMPLATES)
    return data
  },
  getTemplate: async (id: number): Promise<ChecklistTemplateResponse> => {
    const { data } = await apiClient.get<ChecklistTemplateResponse>(E.TEMPLATE_BY_ID(id))
    return data
  },
}
