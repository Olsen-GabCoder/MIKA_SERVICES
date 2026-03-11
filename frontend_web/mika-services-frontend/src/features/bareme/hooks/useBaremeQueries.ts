import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { baremeApi } from '@/api/baremeApi'
import type { BaremeArticlesParams } from '@/features/bareme/types'

const BAREME_KEYS = {
  all: ['bareme'] as const,
  coefficients: () => [...BAREME_KEYS.all, 'coefficients'] as const,
  corpsEtat: () => [...BAREME_KEYS.all, 'corps-etat'] as const,
  articles: (params: BaremeArticlesParams, page: number, size: number) =>
    [...BAREME_KEYS.all, 'articles', params, page, size] as const,
  articlesCompare: (params: BaremeArticlesParams, page: number, size: number) =>
    [...BAREME_KEYS.all, 'articles-compare', params, page, size] as const,
  article: (id: number) => [...BAREME_KEYS.all, 'article', id] as const,
  derniereMiseAJour: () => [...BAREME_KEYS.all, 'derniere-mise-a-jour'] as const,
}

export function useCoefficientsEloignement() {
  return useQuery({
    queryKey: BAREME_KEYS.coefficients(),
    queryFn: () => baremeApi.getCoefficientsEloignement(),
  })
}

export function useCorpsEtat() {
  return useQuery({
    queryKey: BAREME_KEYS.corpsEtat(),
    queryFn: () => baremeApi.getCorpsEtat(),
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

export { BAREME_KEYS }
