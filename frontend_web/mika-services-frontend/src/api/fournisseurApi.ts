import api from './axios'
import type { Fournisseur, Commande, FournisseurCreateRequest, CommandeCreateRequest, PaginatedResponse } from '../types/fournisseur'
import { USE_MOCK, USE_MOCK_FALLBACK } from '@/config/mock'
import { getMockFournisseursPage, getMockCommandesPage } from '@/mock/data/fournisseur'

const BASE = '/fournisseurs'

export const fournisseurApi = {
  getAll: async (page = 0, size = 20): Promise<PaginatedResponse<Fournisseur>> => {
    if (USE_MOCK) return Promise.resolve(getMockFournisseursPage(page, size))
    try {
      const r = await api.get(BASE, { params: { page, size } })
      return r.data
    } catch {
      if (USE_MOCK_FALLBACK) return Promise.resolve(getMockFournisseursPage(page, size))
      throw new Error('Erreur chargement fournisseurs')
    }
  },
  search: async (q: string, page = 0): Promise<PaginatedResponse<Fournisseur>> => {
    const r = await api.get(`${BASE}/search`, { params: { q, page } }); return r.data
  },
  getById: async (id: number): Promise<Fournisseur> => {
    const r = await api.get(`${BASE}/${id}`); return r.data
  },
  create: async (data: FournisseurCreateRequest): Promise<Fournisseur> => {
    const r = await api.post(BASE, data); return r.data
  },
  update: async (id: number, data: Partial<Fournisseur>): Promise<Fournisseur> => {
    const r = await api.put(`${BASE}/${id}`, data); return r.data
  },
  delete: async (id: number): Promise<void> => { await api.delete(`${BASE}/${id}`) },

  // Commandes
  getAllCommandes: async (page = 0, size = 20): Promise<PaginatedResponse<Commande>> => {
    if (USE_MOCK) return Promise.resolve(getMockCommandesPage(page, size))
    try {
      const r = await api.get(`${BASE}/commandes`, { params: { page, size } })
      return r.data
    } catch {
      if (USE_MOCK_FALLBACK) return Promise.resolve(getMockCommandesPage(page, size))
      throw new Error('Erreur chargement commandes')
    }
  },
  getCommandesByFournisseur: async (fournisseurId: number, page = 0): Promise<PaginatedResponse<Commande>> => {
    const r = await api.get(`${BASE}/${fournisseurId}/commandes`, { params: { page } }); return r.data
  },
  createCommande: async (data: CommandeCreateRequest): Promise<Commande> => {
    const r = await api.post(`${BASE}/commandes`, data); return r.data
  },
  updateCommande: async (id: number, data: Partial<Commande>): Promise<Commande> => {
    const r = await api.put(`${BASE}/commandes/${id}`, data); return r.data
  },
  deleteCommande: async (id: number): Promise<void> => { await api.delete(`${BASE}/commandes/${id}`) },
}
