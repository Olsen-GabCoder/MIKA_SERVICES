import { useQueries } from '@tanstack/react-query'
import { qualiteAgrementApi } from '@/api/qualiteAgrementApi'
import { qualiteEvenementApi } from '@/api/qualiteEvenementApi'
import { useIsOnline } from '@/hooks/useConnectivity'

const STALE = 15 * 60 * 1000

export interface QualiteStatsData {
  agrementsByStatut: Record<string, number>
  evenementsByStatut: Record<string, number>
}

export function useQualiteStats(): {
  data: QualiteStatsData
  loading: boolean
  error: Error | null
} {
  const isOnline = useIsOnline()

  const queries = useQueries({
    queries: [
      {
        queryKey: ['dashboard', 'qualite-agrements-stats'] as const,
        queryFn: () => qualiteAgrementApi.getStats(),
        staleTime: STALE,
        refetchInterval: STALE,
        enabled: isOnline,
      },
      {
        queryKey: ['dashboard', 'qualite-evenements-stats'] as const,
        queryFn: () => qualiteEvenementApi.getStats(),
        staleTime: STALE,
        refetchInterval: STALE,
        enabled: isOnline,
      },
    ],
  })

  return {
    data: {
      agrementsByStatut: (queries[0].data as Record<string, number>) ?? {},
      evenementsByStatut: (queries[1].data as Record<string, number>) ?? {},
    },
    loading: queries.some(q => q.isLoading),
    error: (queries.find(q => q.error)?.error as Error) ?? null,
  }
}
