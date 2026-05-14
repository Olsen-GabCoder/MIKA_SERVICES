import { useQuery } from '@tanstack/react-query'
import { salleReunionApi } from '@/api/salleReunionApi'
import type { JitsiConfig } from '@/types/salleReunion'

export function useJitsiConfig(enabled: boolean) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['salle-reunion', 'jitsi-config'] as const,
    queryFn: salleReunionApi.getJitsiConfig,
    enabled,
    staleTime: 30_000,
  })

  return {
    data: (data as JitsiConfig) ?? null,
    loading: isLoading,
    error: error as Error | null,
  }
}
