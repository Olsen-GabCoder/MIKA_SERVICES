import api from './axios'
import { API_ENDPOINTS } from '@/constants/api'
import type {
  DemandeReceptionResponse,
  DemandeReceptionCreateRequest,
  DemandeReceptionUpdateRequest,
  ReceptionSummaryResponse,
} from '@/types/qualiteReception'
import type { NatureReception, SousTypeReception } from '@/types/qualiteReception'

interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
}

export const qualiteReceptionApi = {
  create: (req: DemandeReceptionCreateRequest) =>
    api.post<DemandeReceptionResponse>(API_ENDPOINTS.QUALITE_RECEPTIONS.BASE, req).then(r => r.data),

  getAll: (params?: { projetId?: number; nature?: NatureReception; sousType?: SousTypeReception; page?: number; size?: number; sort?: string }) => {
    const query: Record<string, string | number> = { page: params?.page ?? 0, size: params?.size ?? 20, sort: params?.sort ?? 'dateDemande,desc' }
    if (params?.projetId) query.projetId = params.projetId
    if (params?.nature) query.nature = params.nature
    if (params?.sousType) query.sousType = params.sousType
    return api.get<PageResponse<DemandeReceptionResponse>>(
      API_ENDPOINTS.QUALITE_RECEPTIONS.BASE, { params: query }
    ).then(r => r.data)
  },

  getByProjet: (projetId: number, page = 0, size = 20, nature?: NatureReception, sousType?: SousTypeReception) => {
    const params: Record<string, string | number> = { page, size, sort: 'dateDemande,desc' }
    if (nature) params.nature = nature
    if (sousType) params.sousType = sousType
    return api.get<PageResponse<DemandeReceptionResponse>>(
      API_ENDPOINTS.QUALITE_RECEPTIONS.BY_PROJET(projetId), { params }
    ).then(r => r.data)
  },

  getById: (id: number) =>
    api.get<DemandeReceptionResponse>(API_ENDPOINTS.QUALITE_RECEPTIONS.BY_ID(id)).then(r => r.data),

  update: (id: number, req: DemandeReceptionUpdateRequest) =>
    api.put<DemandeReceptionResponse>(API_ENDPOINTS.QUALITE_RECEPTIONS.BY_ID(id), req).then(r => r.data),

  delete: (id: number) =>
    api.delete(API_ENDPOINTS.QUALITE_RECEPTIONS.BY_ID(id)),

  getSummary: (projetId: number, mois: string) =>
    api.get<ReceptionSummaryResponse[]>(
      API_ENDPOINTS.QUALITE_RECEPTIONS.SUMMARY(projetId), { params: { mois } }
    ).then(r => r.data),
}
