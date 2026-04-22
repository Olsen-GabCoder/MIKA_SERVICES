import api from './axios'
import { API_ENDPOINTS } from '@/constants/api'
import type {
  LeveeTopoResponse,
  LeveeTopoCreateRequest,
  LeveeTopoUpdateRequest,
} from '@/types/qualiteLeveeTopo'

interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
}

export const qualiteLeveeTopoApi = {
  create: (req: LeveeTopoCreateRequest) =>
    api.post<LeveeTopoResponse>(API_ENDPOINTS.QUALITE_LEVEES_TOPO.BASE, req).then(r => r.data),

  getAll: (page = 0, size = 20, projetId?: number) => {
    const params: Record<string, string | number> = { page, size, sort: 'moisReference,desc' }
    if (projetId) params.projetId = projetId
    return api.get<PageResponse<LeveeTopoResponse>>(
      API_ENDPOINTS.QUALITE_LEVEES_TOPO.BASE, { params }
    ).then(r => r.data)
  },

  getByProjet: (projetId: number, page = 0, size = 20) => {
    const params: Record<string, string | number> = { page, size, sort: 'moisReference,desc' }
    return api.get<PageResponse<LeveeTopoResponse>>(
      API_ENDPOINTS.QUALITE_LEVEES_TOPO.BY_PROJET(projetId), { params }
    ).then(r => r.data)
  },

  getByProjetAndMois: (projetId: number, mois: string) =>
    api.get<LeveeTopoResponse | null>(
      API_ENDPOINTS.QUALITE_LEVEES_TOPO.BY_PROJET_MOIS(projetId, mois)
    ).then(r => r.data),

  getById: (id: number) =>
    api.get<LeveeTopoResponse>(API_ENDPOINTS.QUALITE_LEVEES_TOPO.BY_ID(id)).then(r => r.data),

  update: (id: number, req: LeveeTopoUpdateRequest) =>
    api.put<LeveeTopoResponse>(API_ENDPOINTS.QUALITE_LEVEES_TOPO.BY_ID(id), req).then(r => r.data),

  delete: (id: number) =>
    api.delete(API_ENDPOINTS.QUALITE_LEVEES_TOPO.BY_ID(id)),
}
