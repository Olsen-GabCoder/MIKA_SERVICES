import apiClient from './axios'

export interface Role {
  id: number
  code: string
  nom: string
  description?: string
  niveau: string
  actif: boolean
  permissions: Permission[]
}

export interface Permission {
  id: number
  code: string
  nom: string
  module: string
  type: string
  description?: string
  actif: boolean
}

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export const roleApi = {
  getAll: async (page: number = 0, size: number = 20): Promise<PaginatedResponse<Role>> => {
    const response = await apiClient.get<PaginatedResponse<Role>>('/roles', {
      params: { page, size },
    })
    return response.data
  },

  getActive: async (): Promise<Role[]> => {
    const response = await apiClient.get<Role[]>('/roles/active')
    return response.data
  },

  getById: async (id: number): Promise<Role> => {
    const response = await apiClient.get<Role>(`/roles/${id}`)
    return response.data
  },

  getByCode: async (code: string): Promise<Role> => {
    const response = await apiClient.get<Role>(`/roles/code/${code}`)
    return response.data
  },

  addPermission: async (roleId: number, permissionId: number): Promise<Role> => {
    const response = await apiClient.post<Role>(`/roles/${roleId}/permissions/${permissionId}`)
    return response.data
  },

  removePermission: async (roleId: number, permissionId: number): Promise<Role> => {
    const response = await apiClient.delete<Role>(`/roles/${roleId}/permissions/${permissionId}`)
    return response.data
  },
}
