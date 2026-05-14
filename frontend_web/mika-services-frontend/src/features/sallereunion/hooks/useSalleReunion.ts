import { useQuery } from '@tanstack/react-query'
import { salleReunionApi } from '@/api/salleReunionApi'
import { useIsOnline } from '@/hooks/useConnectivity'
import type { SalleReunion } from '@/types/salleReunion'

export function useSalleReunion() {
  const isOnline = useIsOnline()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['salle-reunion'] as const,
    queryFn: salleReunionApi.getSalle,
    staleTime: 5_000,
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
    enabled: isOnline,
  })

  return {
    data: (data as SalleReunion) ?? null,
    loading: isLoading,
    error: error as Error | null,
    refetch,
  }
}
