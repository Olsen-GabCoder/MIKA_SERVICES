import { useQuery } from '@tanstack/react-query'
import { baremeApi } from '@/api/baremeApi'
import { useIsOnline } from '@/hooks/useConnectivity'
import type { BaremeVersion } from '@/features/bareme/types'

export function useBaremeInfo(): {
  data: BaremeVersion | null
  loading: boolean
  error: Error | null
} {
  const isOnline = useIsOnline()

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'bareme-info'] as const,
    queryFn: () => baremeApi.getDerniereMiseAJour(),
    staleTime: Infinity,
    enabled: isOnline,
  })

  return {
    data: data ?? null,
    loading: isLoading,
    error: (error as Error) ?? null,
  }
}
