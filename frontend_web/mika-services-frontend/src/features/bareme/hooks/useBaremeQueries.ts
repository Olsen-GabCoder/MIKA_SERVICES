import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { baremeApi } from '@/api/baremeApi'
import type { BaremeArticleCreateRequest, BaremeArticlesParams } from '@/features/bareme/types'

const BAREME_KEYS = {
  all: ['bareme'] as const,
  corpsEtat: () => [...BAREME_KEYS.all, 'corps-etat'] as const,
  facets: (params: BaremeArticlesParams) => [...BAREME_KEYS.all, 'facets', params] as const,
  articles: (params: BaremeArticlesParams, page: number, size: number) =>
    [...BAREME_KEYS.all, 'articles', params, page, size] as const,
  articlesCompare: (params: BaremeArticlesParams, page: number, size: number) =>
    [...BAREME_KEYS.all, 'articles-compare', params, page, size] as const,
  article: (id: number) => [...BAREME_KEYS.all, 'article', id] as const,
  derniereMiseAJour: () => [...BAREME_KEYS.all, 'derniere-mise-a-jour'] as const,
}

export function useCorpsEtat() {
  return useQuery({
    queryKey: BAREME_KEYS.corpsEtat(),
    queryFn: () => baremeApi.getCorpsEtat(),
  })
}

/** Listes de filtres (catégories, familles, etc.) sur toute la base — pas seulement la page courante. */
export function useBaremeFilterFacets(params: BaremeArticlesParams = {}) {
  return useQuery({
    queryKey: BAREME_KEYS.facets(params),
    queryFn: () => baremeApi.getFilterFacets(params),
  })
}

export function useBaremeArticles(
  params: BaremeArticlesParams = {},
  page = 0,
  size = 20
) {
  return useQuery({
    queryKey: BAREME_KEYS.articles(params, page, size),
    queryFn: () => baremeApi.getArticles(params, page, size),
    placeholderData: keepPreviousData,
  })
}

export function useBaremeArticlesCompare(
  params: BaremeArticlesParams = {},
  page = 0,
  size = 20
) {
  return useQuery({
    queryKey: BAREME_KEYS.articlesCompare(params, page, size),
    queryFn: () => baremeApi.getArticlesCompare(params, page, size),
    placeholderData: keepPreviousData,
  })
}

export function useBaremeArticle(id: number | null) {
  return useQuery({
    queryKey: BAREME_KEYS.article(id ?? 0),
    queryFn: () => baremeApi.getArticleById(id!),
    enabled: id != null && id > 0,
  })
}

export function useDerniereMiseAJour() {
  return useQuery({
    queryKey: BAREME_KEYS.derniereMiseAJour(),
    queryFn: () => baremeApi.getDerniereMiseAJour(),
  })
}

export function useBaremeImport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => baremeApi.importExcel(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BAREME_KEYS.all })
    },
  })
}

export function useCreateBaremeArticle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: BaremeArticleCreateRequest) => baremeApi.createArticle(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BAREME_KEYS.all })
    },
  })
}

export function useUpdateBaremeArticle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: BaremeArticleCreateRequest }) =>
      baremeApi.updateArticle(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BAREME_KEYS.all })
    },
  })
}

export function useDeleteBaremeArticle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => baremeApi.deleteArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BAREME_KEYS.all })
    },
  })
}

export { BAREME_KEYS }
