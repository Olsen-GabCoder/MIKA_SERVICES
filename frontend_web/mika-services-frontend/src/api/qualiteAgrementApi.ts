import api from './axios'
import { API_ENDPOINTS } from '@/constants/api'
import type {
  AgrementMarcheResponse,
  AgrementMarcheCreateRequest,
  AgrementMarcheUpdateRequest,
  AgrementSummaryResponse,
  StatutAgrement,
} from '@/types/qualiteAgrement'

interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
}

export const qualiteAgrementApi = {
  create: (req: AgrementMarcheCreateRequest) =>
    api.post<AgrementMarcheResponse>(API_ENDPOINTS.QUALITE_AGREMENTS.BASE, req).then(r => r.data),

  getAll: (params?: { projetId?: number; statut?: StatutAgrement; page?: number; size?: number; sort?: string }) => {
    const p: Record<string, string | number> = { page: params?.page ?? 0, size: params?.size ?? 20, sort: params?.sort ?? 'dateSoumission,desc' }
    if (params?.projetId) p.projetId = params.projetId
    if (params?.statut) p.statut = params.statut
    return api.get<PageResponse<AgrementMarcheResponse>>(
      API_ENDPOINTS.QUALITE_AGREMENTS.BASE, { params: p }
    ).then(r => r.data)
  },

  getByProjet: (projetId: number, page = 0, size = 20, statut?: StatutAgrement) => {
    const params: Record<string, string | number> = { page, size, sort: 'dateSoumission,desc' }
    if (statut) params.statut = statut
    return api.get<PageResponse<AgrementMarcheResponse>>(
      API_ENDPOINTS.QUALITE_AGREMENTS.BY_PROJET(projetId), { params }
    ).then(r => r.data)
  },

  getById: (id: number) =>
    api.get<AgrementMarcheResponse>(API_ENDPOINTS.QUALITE_AGREMENTS.BY_ID(id)).then(r => r.data),

  update: (id: number, req: AgrementMarcheUpdateRequest) =>
    api.put<AgrementMarcheResponse>(API_ENDPOINTS.QUALITE_AGREMENTS.BY_ID(id), req).then(r => r.data),

  delete: (id: number) =>
    api.delete(API_ENDPOINTS.QUALITE_AGREMENTS.BY_ID(id)),

  getSummary: (projetId: number, mois: string) =>
    api.get<AgrementSummaryResponse>(
      API_ENDPOINTS.QUALITE_AGREMENTS.SUMMARY(projetId), { params: { mois } }
    ).then(r => r.data),
}
