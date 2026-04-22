import api from './axios'
import { API_ENDPOINTS } from '@/constants/api'
import type {
  DocumentQualiteListResponse,
  DocumentQualiteResponse,
  DocumentQualiteUpdateRequest,
} from '@/types/qualiteDocument'

interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
}

export const qualiteDocumentApi = {
  create: (params: { titre: string; description?: string; file?: File }) => {
    const formData = new FormData()
    formData.append('titre', params.titre)
    if (params.description) formData.append('description', params.description)
    if (params.file) formData.append('file', params.file)
    return api.post<DocumentQualiteResponse>(API_ENDPOINTS.QUALITE_DOCUMENTS.BASE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },

  getAll: (page = 0, size = 20, actifsOnly?: boolean) => {
    const params: Record<string, string | number | boolean> = { page, size, sort: 'codeDocument,asc' }
    if (actifsOnly) params.actifsOnly = true
    return api.get<PageResponse<DocumentQualiteListResponse>>(
      API_ENDPOINTS.QUALITE_DOCUMENTS.BASE, { params }
    ).then(r => r.data)
  },

  getById: (id: number) =>
    api.get<DocumentQualiteResponse>(API_ENDPOINTS.QUALITE_DOCUMENTS.BY_ID(id)).then(r => r.data),

  update: (id: number, req: DocumentQualiteUpdateRequest) =>
    api.put<DocumentQualiteResponse>(API_ENDPOINTS.QUALITE_DOCUMENTS.BY_ID(id), req).then(r => r.data),

  ajouterVersion: (id: number, params: { file: File; commentaire?: string; auteurId?: number }) => {
    const formData = new FormData()
    formData.append('file', params.file)
    if (params.commentaire) formData.append('commentaire', params.commentaire)
    if (params.auteurId) formData.append('auteurId', params.auteurId.toString())
    return api.post<DocumentQualiteResponse>(API_ENDPOINTS.QUALITE_DOCUMENTS.VERSIONS(id), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },

  download: (id: number, versionId?: number) => {
    const params = versionId ? { versionId } : undefined
    return api.get(API_ENDPOINTS.QUALITE_DOCUMENTS.DOWNLOAD(id), { responseType: 'blob', params }).then(r => r.data as Blob)
  },

  delete: (id: number) =>
    api.delete(API_ENDPOINTS.QUALITE_DOCUMENTS.BY_ID(id)),
}
