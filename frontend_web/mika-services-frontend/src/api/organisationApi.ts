import apiClient from './axios'
import type { Departement, Specialite } from '@/types'

export const departementApi = {
  getActive: async (): Promise<Departement[]> => {
    const response = await apiClient.get<Departement[]>('/departements/active')
    return response.data
  },

  setResponsable: async (departementId: number, userId: number): Promise<Departement> => {
    const response = await apiClient.put<Departement>(`/departements/${departementId}/responsable/${userId}`)
    return response.data
  },
}

export const specialiteApi = {
  getActive: async (): Promise<Specialite[]> => {
    const response = await apiClient.get<Specialite[]>('/specialites/active')
    return response.data
  },
}

export type FamilleRoleProjet =
  | 'DIRECTION_PROJET'
  | 'ENCADREMENT_TRAVAUX'
  | 'ENCADREMENT_CHANTIER'
  | 'ETUDES_TECHNIQUE'
  | 'GROS_OEUVRE_TP'
  | 'SECOND_OEUVRE'
  | 'MATERIEL_ENGINS'
  | 'LOGISTIQUE_APPRO'
  | 'QSHE'
  | 'ADMINISTRATIF_SUPPORT'

export interface RoleProjet {
  id: number
  code: string
  nom: string
  famille: FamilleRoleProjet
  cumulable: boolean
  description?: string
  actif: boolean
}

export interface RoleProjetRequest {
  nom: string
  famille: FamilleRoleProjet
  cumulable: boolean
  description?: string
}

/** Référentiel des rôles occupés par les utilisateurs sur les projets (trié par famille puis nom). */
export const roleProjetApi = {
  getActive: async (): Promise<RoleProjet[]> => {
    const response = await apiClient.get<RoleProjet[]>('/roles-projet/active')
    return response.data
  },
  getAll: async (): Promise<RoleProjet[]> => {
    const response = await apiClient.get<RoleProjet[]>('/roles-projet')
    return response.data
  },
  create: async (data: RoleProjetRequest): Promise<RoleProjet> => {
    const response = await apiClient.post<RoleProjet>('/roles-projet', data)
    return response.data
  },
  update: async (id: number, data: RoleProjetRequest): Promise<RoleProjet> => {
    const response = await apiClient.put<RoleProjet>(`/roles-projet/${id}`, data)
    return response.data
  },
  toggleActif: async (id: number): Promise<RoleProjet> => {
    const response = await apiClient.put<RoleProjet>(`/roles-projet/${id}/toggle-actif`)
    return response.data
  },
}
