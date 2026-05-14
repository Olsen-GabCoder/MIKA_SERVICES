import { useQuery } from '@tanstack/react-query'
import { salleReunionApi } from '@/api/salleReunionApi'
import type { JaaSToken } from '@/types/salleReunion'

export function useJaaSToken(enabled: boolean) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['salle-reunion', 'jaas-token'] as const,
    queryFn: salleReunionApi.getJaaSToken,
    enabled,
    staleTime: 300_000,
  })

  return {
    data: (data as JaaSToken) ?? null,
    loading: isLoading,
    error: error as Error | null,
  }
}
