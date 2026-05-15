import { useQuery } from '@tanstack/react-query'
import { salleReunionApi } from '@/api/salleReunionApi'
import type { SalleParticipant } from '@/types/salleReunion'

export function useSalleParticipants(enabled: boolean) {
  const { data, isLoading } = useQuery({
    queryKey: ['salle-reunion', 'participants-online'] as const,
    queryFn: salleReunionApi.getOnlineParticipants,
    enabled,
    staleTime: 3_000,
    refetchInterval: 5_000,
  })

  return {
    participants: (data ?? []) as SalleParticipant[],
    loading: isLoading,
  }
}
