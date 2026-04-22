import api from './axios'
import { API_ENDPOINTS } from '@/constants/api'
import type {
  EssaiLaboBetonResponse,
  EssaiLaboBetonCreateRequest,
  EssaiLaboBetonUpdateRequest,
} from '@/types/qualiteEssaiLabo'

interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
}

export const qualiteEssaiLaboApi = {
  create: (req: EssaiLaboBetonCreateRequest) =>
    api.post<EssaiLaboBetonResponse>(API_ENDPOINTS.QUALITE_ESSAIS_LABO.BASE, req).then(r => r.data),

  getAll: (params?: { projetId?: number; page?: number; size?: number; sort?: string }) => {
    const p: Record<string, string | number> = { page: params?.page ?? 0, size: params?.size ?? 20, sort: params?.sort ?? 'moisReference,desc' }
    if (params?.projetId) p.projetId = params.projetId
    return api.get<PageResponse<EssaiLaboBetonResponse>>(
      API_ENDPOINTS.QUALITE_ESSAIS_LABO.BASE, { params: p }
    ).then(r => r.data)
  },

  getByProjet: (projetId: number, page = 0, size = 20) => {
    const params: Record<string, string | number> = { page, size, sort: 'moisReference,desc' }
    return api.get<PageResponse<EssaiLaboBetonResponse>>(
      API_ENDPOINTS.QUALITE_ESSAIS_LABO.BY_PROJET(projetId), { params }
    ).then(r => r.data)
  },

  getByProjetAndMois: (projetId: number, mois: string) =>
    api.get<EssaiLaboBetonResponse | null>(
      API_ENDPOINTS.QUALITE_ESSAIS_LABO.BY_PROJET_MOIS(projetId, mois)
    ).then(r => r.data),

  getById: (id: number) =>
    api.get<EssaiLaboBetonResponse>(API_ENDPOINTS.QUALITE_ESSAIS_LABO.BY_ID(id)).then(r => r.data),

  update: (id: number, req: EssaiLaboBetonUpdateRequest) =>
    api.put<EssaiLaboBetonResponse>(API_ENDPOINTS.QUALITE_ESSAIS_LABO.BY_ID(id), req).then(r => r.data),

  delete: (id: number) =>
    api.delete(API_ENDPOINTS.QUALITE_ESSAIS_LABO.BY_ID(id)),
}
