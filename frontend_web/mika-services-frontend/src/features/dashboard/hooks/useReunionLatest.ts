import { useQuery } from '@tanstack/react-query'
import { reunionHebdoApi } from '@/api/reunionHebdoApi'
import { useIsOnline } from '@/hooks/useConnectivity'
import type { ReunionHebdoSummary } from '@/types/reunionHebdo'

const STALE = 15 * 60 * 1000

export function useReunionLatest(): {
  data: ReunionHebdoSummary | null
  loading: boolean
  error: Error | null
} {
  const isOnline = useIsOnline()

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'reunion-latest'] as const,
    queryFn: async () => {
      const page = await reunionHebdoApi.findAll(0, 1)
      return page.content[0] ?? null
    },
    staleTime: STALE,
    refetchInterval: STALE,
    enabled: isOnline,
  })

  return {
    data: data ?? null,
    loading: isLoading,
    error: (error as Error) ?? null,
  }
}
