import api from './axios'
import { API_ENDPOINTS } from '@/constants/api'
import type {
  EvenementQualiteListResponse,
  EvenementQualiteResponse,
  EvenementQualiteCreateRequest,
  EvenementQualiteUpdateRequest,
  TypeEvenement,
  StatutEvenement,
  SectionResponse,
  RoleCollegial,
  ChoixTraitement,
} from '@/types/qualiteEvenement'

interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
}

export const qualiteEvenementApi = {
  create: (req: EvenementQualiteCreateRequest) =>
    api.post<EvenementQualiteResponse>(API_ENDPOINTS.QUALITE_EVENEMENTS.BASE, req).then(r => r.data),

  getAll: (page = 0, size = 20, projetId?: number, type?: TypeEvenement, statut?: StatutEvenement) => {
    const params: Record<string, string | number> = { page, size, sort: 'createdAt,desc' }
    if (projetId) params.projetId = projetId
    if (type) params.type = type
    if (statut) params.statut = statut
    return api.get<PageResponse<EvenementQualiteListResponse>>(
      API_ENDPOINTS.QUALITE_EVENEMENTS.BASE, { params }
    ).then(r => r.data)
  },

  getByProjet: (projetId: number, page = 0, size = 20, type?: TypeEvenement, statut?: StatutEvenement) => {
    const params: Record<string, string | number> = { page, size, sort: 'createdAt,desc' }
    if (type) params.type = type
    if (statut) params.statut = statut
    return api.get<PageResponse<EvenementQualiteListResponse>>(
      API_ENDPOINTS.QUALITE_EVENEMENTS.BY_PROJET(projetId), { params }
    ).then(r => r.data)
  },

  getById: (id: number) =>
    api.get<EvenementQualiteResponse>(API_ENDPOINTS.QUALITE_EVENEMENTS.BY_ID(id)).then(r => r.data),

  update: (id: number, req: EvenementQualiteUpdateRequest) =>
    api.put<EvenementQualiteResponse>(API_ENDPOINTS.QUALITE_EVENEMENTS.BY_ID(id), req).then(r => r.data),

  delete: (id: number) =>
    api.delete(API_ENDPOINTS.QUALITE_EVENEMENTS.BY_ID(id)),

  updateSectionContenu: (evenementId: number, numSection: number, req: {
    contenu?: string; choixTraitement?: ChoixTraitement; necessiteCapa?: boolean;
    actions?: { descriptionAction: string; responsable?: string; delaiPrevu?: string }[]
  }) =>
    api.put<SectionResponse>(
      `${API_ENDPOINTS.QUALITE_EVENEMENTS.BY_ID(evenementId)}/sections/${numSection}/contenu`, req
    ).then(r => r.data),

  signerSection: (evenementId: number, numSection: number, userId: number) =>
    api.post<EvenementQualiteResponse>(
      `${API_ENDPOINTS.QUALITE_EVENEMENTS.BY_ID(evenementId)}/sections/${numSection}/signer`,
      { userId }
    ).then(r => r.data),

  signerCollegiale: (evenementId: number, userId: number, roleCollegial: RoleCollegial) =>
    api.post<EvenementQualiteResponse>(
      `${API_ENDPOINTS.QUALITE_EVENEMENTS.BY_ID(evenementId)}/sections/6/signer-collegiale`,
      { userId, roleCollegial }
    ).then(r => r.data),

  getStats: (projetId?: number) => {
    if (projetId) {
      return api.get<Record<string, number>>(API_ENDPOINTS.QUALITE_EVENEMENTS.STATS(projetId)).then(r => r.data)
    }
    return api.get<Record<string, number>>(`${API_ENDPOINTS.QUALITE_EVENEMENTS.BASE}/stats`).then(r => r.data)
  },
}
