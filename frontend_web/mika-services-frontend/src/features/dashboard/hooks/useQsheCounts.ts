import { useQueries } from '@tanstack/react-query'
import { qsheCertificationApi } from '@/api/qsheCertificationApi'
import { qsheEpiApi } from '@/api/qsheEpiApi'
import { qsheActionApi } from '@/api/qsheActionApi'
import { useIsOnline } from '@/hooks/useConnectivity'

const STALE_15 = 15 * 60 * 1000
const STALE_5 = 5 * 60 * 1000

export interface QsheCounts {
  certifications: { expirant: number; expirees: number }
  epi: { expires: number; stockBas: number }
  actions: { enRetard: number }
}

export function useQsheCounts(): {
  counts: QsheCounts
  loading: boolean
  error: Error | null
} {
  const isOnline = useIsOnline()

  const queries = useQueries({
    queries: [
      { queryKey: ['dashboard', 'qshe', 'certif-expirant'] as const, queryFn: () => qsheCertificationApi.getExpirant(60), staleTime: STALE_15, refetchInterval: STALE_15, enabled: isOnline },
      { queryKey: ['dashboard', 'qshe', 'certif-expirees'] as const, queryFn: () => qsheCertificationApi.getExpirees(), staleTime: STALE_15, refetchInterval: STALE_15, enabled: isOnline },
      { queryKey: ['dashboard', 'qshe', 'epi-expires'] as const, queryFn: () => qsheEpiApi.getExpires(), staleTime: STALE_15, refetchInterval: STALE_15, enabled: isOnline },
      { queryKey: ['dashboard', 'qshe', 'epi-stock-bas'] as const, queryFn: () => qsheEpiApi.getStockBas(), staleTime: STALE_15, refetchInterval: STALE_15, enabled: isOnline },
      { queryKey: ['dashboard', 'qshe', 'actions-en-retard'] as const, queryFn: () => qsheActionApi.getEnRetard(), staleTime: STALE_5, refetchInterval: STALE_5, enabled: isOnline },
    ],
  })

  return {
    counts: {
      certifications: {
        expirant: (queries[0].data as unknown[] | undefined)?.length ?? 0,
        expirees: (queries[1].data as unknown[] | undefined)?.length ?? 0,
      },
      epi: {
        expires: (queries[2].data as unknown[] | undefined)?.length ?? 0,
        stockBas: (queries[3].data as unknown[] | undefined)?.length ?? 0,
      },
      actions: {
        enRetard: (queries[4].data as unknown[] | undefined)?.length ?? 0,
      },
    },
    loading: queries.some(q => q.isLoading),
    error: (queries.find(q => q.error)?.error as Error) ?? null,
  }
}
