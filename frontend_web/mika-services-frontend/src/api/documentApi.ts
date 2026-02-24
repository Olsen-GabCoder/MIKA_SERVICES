import api from './axios'
import { API_ENDPOINTS } from '../constants/api'
import type { DocumentFile, PaginatedResponse } from '../types/document'
import { TypeDocument } from '../types/document'

export const documentApi = {
  upload: async (
    file: File,
    typeDocument: TypeDocument,
    description?: string,
    projetId?: number,
    userId?: number
  ): Promise<DocumentFile> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('typeDocument', typeDocument)
    if (description) formData.append('description', description)
    if (projetId) formData.append('projetId', projetId.toString())
    if (userId) formData.append('userId', userId.toString())

    const response = await api.post(API_ENDPOINTS.DOCUMENTS.BASE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  getAll: async (page = 0, size = 20): Promise<PaginatedResponse<DocumentFile>> => {
    const response = await api.get(API_ENDPOINTS.DOCUMENTS.BASE, { params: { page, size } })
    return response.data
  },

  getByProjet: async (projetId: number, page = 0, size = 20): Promise<PaginatedResponse<DocumentFile>> => {
    const response = await api.get(API_ENDPOINTS.DOCUMENTS.BY_PROJET(projetId), { params: { page, size } })
    return response.data
  },

  getById: async (id: number): Promise<DocumentFile> => {
    const response = await api.get(API_ENDPOINTS.DOCUMENTS.BY_ID(id))
    return response.data
  },

  getMyCv: async (): Promise<DocumentFile[]> => {
    const response = await api.get<DocumentFile[]>(API_ENDPOINTS.DOCUMENTS.ME_CV)
    return response.data
  },

  download: async (id: number): Promise<Blob> => {
    const response = await api.get(API_ENDPOINTS.DOCUMENTS.DOWNLOAD(id), { responseType: 'blob' })
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(API_ENDPOINTS.DOCUMENTS.BY_ID(id))
  },
}
