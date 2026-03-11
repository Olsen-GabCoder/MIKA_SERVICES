import api from './axios'
import type {
  CoefficientEloignement,
  CorpsEtatBareme,
  BaremeArticleList,
  BaremeArticleDetail,
  BaremeArticleCompare,
  BaremeVersion,
  BaremeArticlesPage,
  BaremeArticlesComparePage,
  BaremeArticlesParams,
  TypeLigneBareme,
} from '@/features/bareme/types'

const BASE = '/bareme'

export const baremeApi = {
  getCoefficientsEloignement: async (): Promise<CoefficientEloignement[]> => {
    const r = await api.get(`${BASE}/coefficients-eloignement`)
    return r.data
  },

  getCorpsEtat: async (): Promise<CorpsEtatBareme[]> => {
    const r = await api.get(`${BASE}/corps-etat`)
    return r.data
  },

  getArticles: async (
    params: BaremeArticlesParams = {},
    page = 0,
    size = 20
  ): Promise<BaremeArticlesPage> => {
    const { page: p, size: s, ...rest } = params
    const pageNum = p ?? page
    const sizeNum = s ?? size
    const r = await api.get<BaremeArticlesPage>(`${BASE}/articles`, {
      params: { page: pageNum, size: sizeNum, ...rest },
    })
    return r.data
  },

  getArticlesCompare: async (
    params: BaremeArticlesParams = {},
    page = 0,
    size = 20
  ): Promise<BaremeArticlesComparePage> => {
    const { page: p, size: s, ...rest } = params
    const pageNum = p ?? page
    const sizeNum = s ?? size
    const r = await api.get<BaremeArticlesComparePage>(`${BASE}/articles/compare`, {
      params: { page: pageNum, size: sizeNum, ...rest },
    })
    return r.data
  },

  getArticleById: async (id: number): Promise<BaremeArticleDetail> => {
    const r = await api.get<BaremeArticleDetail>(`${BASE}/articles/${id}`)
    return r.data
  },

  getDerniereMiseAJour: async (): Promise<BaremeVersion> => {
    const r = await api.get<BaremeVersion>(`${BASE}/derniere-mise-a-jour`)
    return r.data
  },

  importExcel: async (file: File): Promise<BaremeImportResult> => {
    const formData = new FormData()
    formData.append('file', file)
    const r = await api.post(`${BASE}/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return r.data
  },
}

export interface BaremeImportResult {
  coefficientsCount: number
  corpsEtatCount: number
  fournisseursCount: number
  lignesCount: number
  errors: string[]
}

export type { TypeLigneBareme }
